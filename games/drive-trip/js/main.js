/**
 * 부릉부릉 드라이브 — 2단계 본편
 * 흐름: 도장 지도(목적지 카드) → 차고 시동 → 여행(구간·이벤트·날씨) → 도착 → 도장 쾅 → 소프트 엔딩
 * phase: 'map' | 'key' | 'drive' | 'redApproach' | 'stopped' | 'crossing' | 'arrive' | 'stamp' | 'ending'
 * 정지 이벤트(StopEvent: 신호등·기차 건널목)는 같은 4단계(접근 → 매직 브레이크 → 정지 판정 → 지나감)를 쓴다.
 */
import * as THREE from '../vendor/three.module.min.js';
import { CONFIG, LINES, DESTINATIONS, WEATHERS, THEMES, DEG } from './config.js';
import { buildRoad, roadPoint, roadYaw, advance } from './road.js';
import { rng } from './geo.js';
import { planTrip, themeAt } from './trip.js';
import { World } from './world.js';
import { Tractor, AnimalCrew, Oncoming, Birds, Train, Jumpers, Gulls, Particles } from './actors.js';
import { bonnetGeometry } from './models.js';
import { Precip, Windshield } from './fx.js';
import { DriveAudio } from './audio.js';
import { Controls } from './controls.js';
import { UI } from './ui.js';

const C = CONFIG.car;
const ST = CONFIG.steer;
const MG = CONFIG.magic;
const FL = CONFIG.follow;
const TRC = CONFIG.tractor;
const CAM = CONFIG.camera;
const LANES = CONFIG.road.lanes;
const KK = window.KidsKit;
const LOBBY = '../../index.html';
const store = KK.store('drive-trip');

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
let baseFovV = 60;
let pitchDeg = CAM.pitchDeg;
let timeScale = 1;

/* ---------- 렌더러 · 장면 ---------- */

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
let pixelRatio = Math.min(window.devicePixelRatio || 1, CONFIG.perf.pixelRatioMax);
renderer.setPixelRatio(pixelRatio);

buildRoad(rng(1), [[0, 0]], 2000);
const world = new World();
const scene = world.scene;

const camera = new THREE.PerspectiveCamera(60, 1, CAM.near, CAM.far);
const rig = new THREE.Group();
const head = new THREE.Group();
head.rotation.order = 'YXZ';
head.position.set(C.eyeOffsetX, C.eyeHeight, 0);
rig.add(head);
head.add(camera);
const bonnet = new THREE.Mesh(bonnetGeometry(), new THREE.MeshLambertMaterial({ vertexColors: true }));
rig.add(bonnet);
rig.add(world.headlight);
rig.add(world.headlight.target);
scene.add(rig);

const audio = new DriveAudio();
const ui = new UI();
const particles = new Particles(scene);
const tractorPool = [new Tractor(scene, audio), new Tractor(scene, audio)];
const crew = new AnimalCrew(scene, audio);
const oncoming = new Oncoming(scene);
const birds = new Birds(scene);
const gulls = new Gulls(scene);
const train = new Train(scene, audio);
const jumpers = new Jumpers(scene, particles, audio);
const precip = new Precip(scene);
const glass = new Windshield(document.getElementById('glass'));

const controls = new Controls({
  steerZone: document.getElementById('steerZone'),
  wheel: document.getElementById('wheel'),
  pedalZone: document.getElementById('pedalZone'),
  horn: document.getElementById('horn'),
});

/* ---------- 상태 ---------- */

const G = { phase: 'map', trip: null, time: 0, s: 0, v: 0, d: LANES[1] };
let debugPedal = false;
let renderOn = false;

function visits() {
  const v = store.get('visits', {});
  return v && typeof v === 'object' ? v : {};
}

function resetState(trip) {
  Object.assign(G, {
    phase: 'key',
    trip,
    dest: trip.dest,
    s: 0,
    v: 0,
    d: LANES[1],
    latV: 0,
    pedal: false,
    prevPedal: false,
    stopIdx: 0,
    stops: trip.stops.map((st) => ({ ...st, announced: false })),
    tractors: trip.tractors.map((p, i) => ({ plan: p, obj: tractorPool[i], spawned: false, prompted: false, followT: 0, rePulsed: false })),
    mbIntervened: false,
    mbActive: false,
    idleT: 0,
    stateT: 0,
    started: false,
    firstPedal: false,
    greenAt: -1,
    trainPassed: false,
    bellT: 0,
    arriveSaid: false,
    steerVis: 0,
    steerVel: 0,
    birdUntil: 0,
    jumpT: 2,
    honkJumpAt: 0,
    time: 0,
    rpm: 0,
    fovV: baseFovV,
    hornPulseUntil: 0,
    audioT: 0,
    driveT: 0,
    weatherSaid: false,
    tunnelSaid: false,
    washSaid: false,
    washInside: false,
    blink: null,
    blinkUntil: 0,
    blinkTick: 0,
    wiper: false,
    lights: false,
    hintWiper: false,
    hintLights: false,
    lastWipe: -1,
    lookYaw: 0,
  });
  for (const t of tractorPool) t.reset();
  crew.hide();
  birds.hideAll();
  jumpers.hideAll();
  train.reset();
  particles.clear();
  gulls.setCenter(null);
  oncoming.reset(0);
  world.headlight.intensity = 0;
  onStopIdx();
  debugPedal = false;
  controls.releaseAll();
  controls.enabled = false;
}

function setPhase(p) {
  G.phase = p;
  G.stateT = 0;
}

function onStopIdx() {
  const L = G.stops[G.stopIdx];
  if (L && L.type === 'light' && L.state === 'red') crew.placeWaiting(L.s, THEMES[themeAt(G.trip, L.s)].side === 'walk');
}

/* ---------- 도장 지도 → 여행 시작 ---------- */

function showMapScreen() {
  G.phase = 'map';
  renderOn = false;
  ui.resetHints();
  ui.showMap(visits(), 'map');
  if (!store.get('metTori', false)) {
    ui.say(LINES.firstMeet, 3600, true);
    store.set('metTori', true);
    setTimeout(() => {
      if (G.phase === 'map') ui.say(LINES.pick, 5000);
    }, 3800);
  } else {
    ui.say(LINES.pick, 5000);
  }
}

function pickDestination(dest) {
  if (G.phase !== 'map' || G.picking) return;
  G.picking = true;
  audio.init();
  audio.setMuted(KK.sound.isMuted());
  KK.sound.play('pop');
  KK.haptic('light');
  ui.pickCard(dest);
  ui.say(LINES.go[dest], 0, true);
  setTimeout(() => {
    beginTrip(dest, {});
    G.picking = false;
  }, 1500);
}

for (const card of document.querySelectorAll('.dest-card')) {
  card.addEventListener('click', () => pickDestination(card.dataset.dest));
}

function endTripSideEffects() {
  audio.engineOn(false);
  audio.stopRadio();
  audio.loop('rain', false);
  audio.loop('wash', false);
  audio.setEcho(false);
  precip.set(null);
  glass.clearAll();
}

function beginTrip(dest, opts) {
  endTripSideEffects();
  const trip = planTrip(dest, opts);
  buildRoad(rng(trip.seed + 1), trip.straight, trip.length + 200);
  world.setTrip(trip);
  resetState(trip);
  precip.set(trip.weather);
  glass.setRain(trip.weather === 'rain');
  if (trip.weather === 'rain') audio.loop('rain', true);
  renderOn = true;
  ui.resetHints();
  ui.hideMap();
  ui.showKey();
  ui.say(LINES.key, 0);
  setPhase('key');
}

function startEngine() {
  if (G.phase !== 'key' || G.started) return;
  G.started = true;
  audio.init();
  audio.setMuted(KK.sound.isMuted());
  audio.start();
  KK.haptic('medium');
  ui.turnKey();
  ui.hideBubble();
  setTimeout(() => {
    if (G.phase !== 'key') return;
    ui.hideKey();
    setPhase('drive');
    controls.enabled = true;
  }, 850);
  setTimeout(() => {
    if (!G.firstPedal && G.phase === 'drive') {
      ui.say(LINES.start, 0);
      ui.setPedalSparkle(true);
      ui.setFinger(true);
    }
  }, 1500);
}

document.getElementById('keyBtn').addEventListener('click', startEngine);

controls.onInput = (kind) => {
  if (kind === 'pedal' && !G.firstPedal) {
    G.firstPedal = true;
    ui.setFinger(false);
    if (ui.bubbleText === LINES.start) ui.hideBubble();
  }
  if (kind === 'pedal') ui.setPedalSparkle(false);
  G.idleT = 0;
};

/* ---------- 대시보드 버튼 ---------- */

function setBlink(side) {
  if (G.blink === side) {
    G.blink = null;
  } else {
    G.blink = side;
    G.blinkUntil = G.time + CONFIG.blinker.duration;
    G.blinkTick = 0;
  }
  ui.setButton('blinkL', G.blink === 'L');
  ui.setButton('blinkR', G.blink === 'R');
}

function pressButton(name) {
  if (!controls.enabled) return false;
  KK.haptic('soft');
  audio.click();
  if (name === 'blinkL') setBlink('L');
  else if (name === 'blinkR') setBlink('R');
  else if (name === 'wiper') {
    G.wiper = !G.wiper;
    glass.setAuto(G.wiper);
    ui.setButton('wiper', G.wiper);
    if (G.wiper) {
      G.hintWiper = false;
      ui.setHint('wiper', false);
    }
  } else if (name === 'lights') {
    G.lights = !G.lights;
    world.headlight.intensity = G.lights ? 70 : 0;
    ui.setButton('lights', G.lights);
    if (G.lights) {
      G.hintLights = false;
      ui.setHint('lights', false);
    }
  } else if (name === 'radio') {
    ui.setButton('radio', audio.toggleRadio());
  }
  return true;
}

[
  ['btnBlinkL', 'blinkL'],
  ['btnBlinkR', 'blinkR'],
  ['btnWiper', 'wiper'],
  ['btnLights', 'lights'],
  ['btnRadio', 'radio'],
].forEach(([id, name]) => {
  document.getElementById(id).addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    pressButton(name);
  });
});

/* ---------- 경적 ---------- */

controls.onHorn = () => {
  audio.horn();
  KK.haptic('light');
  ui.hornFlash();
  const tr = tractorAhead(TRC.honkDist, true);
  if (tr) {
    tr.obj.startYield(true);
    ui.setHornPulse(false);
    return;
  }
  if (inSeaView(60) && G.time - G.honkJumpAt > CONFIG.seaView.honkJumpCooldown) {
    G.honkJumpAt = G.time;
    dolphinJump();
    return;
  }
  if (tractorAhead(CONFIG.horn.emptyAhead, false)) return;
  if (G.time < G.birdUntil) return;
  const theme = themeAt(G.trip, G.s + 25);
  if (theme === 'coast' || theme === 'bridge') {
    const side = theme === 'coast' ? 1 : Math.random() < 0.5 ? -1 : 1;
    const s = G.s + 22 + Math.random() * 10;
    roadPoint(s, side > 0 ? 17 + Math.random() * 6 : -13 - Math.random() * 6, theme === 'coast' ? CONFIG.world.waterY : CONFIG.world.riverY, _v);
    fwdDir(s, _v2);
    if (jumpers.jump('fish', _v, _v2)) G.birdUntil = G.time + 2.5;
    return;
  }
  const perches = world.perchesBetween(G.s + CONFIG.horn.birdMin, G.s + CONFIG.horn.birdMax);
  if (!perches.length) return;
  perches.sort((a, b) => Math.abs(a.s - G.s - 24) + Math.abs(a.d) * 0.6 - (Math.abs(b.s - G.s - 24) + Math.abs(b.d) * 0.6));
  birds.launch(perches[Math.floor(Math.random() * Math.min(2, perches.length))]);
  audio.flap();
  G.birdUntil = G.time + CONFIG.horn.birdCooldown;
};

function fwdDir(s, out) {
  const y = roadYaw(s);
  return out.set(-Math.sin(y), 0, -Math.cos(y));
}

function tractorAhead(range, drivingOnly) {
  for (const t of G.tractors) {
    const o = t.obj;
    if (!o.active) continue;
    if (drivingOnly && o.state !== 'driving') continue;
    if (!drivingOnly && o.state === 'parked') continue;
    const gap = o.s - FL.tractorHalfLen - (G.s + C.nose);
    if (gap > -2 && gap <= range) return t;
  }
  return null;
}

function inSeaView(lead) {
  const u = G.trip && G.trip.unique;
  return u && u.type === 'seaView' && G.s > u.s0 - lead && G.s < u.s1;
}

function dolphinJump() {
  const s = G.s + 30 + Math.random() * 14;
  roadPoint(s, 20 + Math.random() * 14, CONFIG.world.waterY, _v);
  fwdDir(s, _v2);
  const turn = (Math.random() - 0.5) * 1.2;
  _v2.applyAxisAngle(THREE.Object3D.DEFAULT_UP, turn);
  return jumpers.jump('dolphin', _v, _v2);
}

/* ---------- 물리 ---------- */

function stopTarget() {
  if (G.phase === 'arrive' || G.phase === 'ending' || G.phase === 'stamp') return G.trip.arrivalS;
  const L = G.stops[G.stopIdx];
  if (L && L.state === 'red') return L.s - MG.gap - C.nose;
  return Infinity;
}

function washLimit() {
  const u = G.trip.unique;
  if (u.type !== 'wash') return Infinity;
  const W = CONFIG.wash;
  const front = G.s + C.nose;
  if (front < u.s0 - W.slowFrom - 40 || G.s > u.s1 + 2) return Infinity;
  return W.slowSpeed + Math.sqrt(2 * W.decel * Math.max(0, u.s0 - W.slowFrom * 0.15 - front));
}

function stepCar(dt) {
  const pedal = controls.enabled && (controls.pedal || debugPedal) && G.phase !== 'ending' && G.phase !== 'stamp';
  G.pedal = pedal;
  if (G.prevPedal && !pedal) G.mbIntervened = false;
  G.prevPedal = pedal;
  if (G.phase === 'stopped' || G.phase === 'crossing') {
    G.v = 0;
    return;
  }
  let v = G.v;
  if (pedal) v += C.accel * (1 - (C.accelTaper * v) / C.vmax) * dt;
  else v -= C.coast * clamp(v / C.coastEaseV, C.coastMinFactor, 1) * dt;
  v = clamp(v, 0, C.vmax);

  let limit = Math.min(C.vmax, washLimit());
  let maxS = Infinity;
  const target = stopTarget();
  G.mbActive = false;
  if (target < Infinity) {
    const x = target - G.s;
    const a = (C.vmax * C.vmax) / (2 * (MG.startDist - MG.gap));
    let lim = Math.min(Math.sqrt(2 * a * Math.max(0, x)), MG.tailK * Math.max(0, x));
    if (x < 0.03) lim = 0;
    if (v > lim + 0.02) G.mbActive = true;
    limit = Math.min(limit, lim);
    maxS = target;
  }
  for (const t of G.tractors) {
    const o = t.obj;
    if (!o.active || Math.abs(o.d - G.d) >= FL.sameLane) continue;
    const gap = o.s - FL.tractorHalfLen - (G.s + C.nose);
    if (gap < -1) continue;
    limit = Math.min(limit, o.v + Math.sqrt(2 * FL.accel * Math.max(0, gap - FL.minGap)));
    maxS = Math.min(maxS, o.s - FL.tractorHalfLen - C.nose - (FL.minGap - 1.5));
  }
  if (v > limit) v = Math.max(limit, v - 8 * dt);
  if (G.mbActive && G.phase === 'redApproach') G.mbIntervened = true;

  const next = G.s + advance(G.s, v, dt);
  if (next > maxS) {
    G.s = Math.max(G.s, maxS);
    v = Math.min(v, Math.max(0, limit));
  } else {
    G.s = next;
  }
  if (target < Infinity && target - G.s < 0.03 && v < 0.2) {
    G.s = Math.min(G.s, target);
    v = 0;
  }
  if (v < 0.01 && !pedal) v = 0;
  G.v = v;
}

function nearestLane(d) {
  return Math.abs(d - LANES[0]) < Math.abs(d - LANES[1]) ? LANES[0] : LANES[1];
}

function stepLateral(dt) {
  const sf = clamp(G.v / ST.latFullSpeed, 0, 1);
  let desired;
  if (controls.steering && controls.enabled) {
    desired = controls.steer * ST.latMax;
    if (Math.abs(controls.steer) > ST.blinkOnSteer && G.v > 1) {
      const side = controls.steer < 0 ? 'L' : 'R';
      if (G.blink !== side) setBlink(side);
      else G.blinkUntil = G.time + CONFIG.blinker.duration;
    }
  } else {
    desired = clamp((nearestLane(G.d) - G.d) * ST.magnetGain, -ST.latMax, ST.latMax);
  }
  desired *= sf;
  G.latV += (desired - G.latV) * Math.min(1, dt * ST.latSmooth);
  G.d += G.latV * dt;
  let lo = ST.dMin;
  let hi = ST.dMax;
  for (const t of G.tractors) {
    const o = t.obj;
    if (!o.active || Math.abs(o.s - G.s) > 6) continue;
    if (o.d > G.d) hi = Math.min(hi, o.d - FL.sameLane);
    else lo = Math.max(lo, o.d + FL.sameLane);
  }
  if (G.d < lo || G.d > hi) {
    G.d = clamp(G.d, lo, Math.max(lo, hi));
    G.latV = 0;
  }
}

/* ---------- 이벤트 진행 ---------- */

function distToLine(L) {
  return L.s - (G.s + C.nose);
}

function update(dt) {
  G.time += dt;
  G.stateT += dt;
  const driving = G.phase !== 'map' && G.phase !== 'key';
  if (driving) {
    stepCar(dt);
    stepLateral(dt);
  }
  if (G.phase === 'map' || !G.trip) return;
  if (G.started && controls.enabled) G.driveT += dt;
  const L = G.stops[G.stopIdx];
  const Li = G.stopIdx;

  switch (G.phase) {
    case 'drive': {
      if (L) {
        const dl = distToLine(L);
        if (L.state === 'red' && dl <= MG.approachDist) {
          setPhase('redApproach');
          G.mbIntervened = false;
          ui.setPedalDim(true);
          world.setStopPulse(Li, true);
          if (L.type === 'train') {
            ui.say(LINES.train);
            world.setCrossing(Li, true, 1);
          } else {
            ui.say(LINES.red);
          }
        } else if (L.state === 'green') {
          if (!L.announced && dl <= MG.approachDist && L.type === 'light') {
            L.announced = true;
            ui.say(LINES.green, undefined, true);
          }
          if (dl < -2) {
            G.stopIdx++;
            onStopIdx();
          }
        }
      } else if (G.trip.arrivalS - G.s <= MG.approachDist) {
        setPhase('arrive');
      }
      break;
    }
    case 'redApproach': {
      const dl = distToLine(L);
      if (G.v === 0 && dl <= MG.judgeDist) {
        const self = !G.pedal && !G.mbIntervened;
        setPhase('stopped');
        ui.setPedalDim(false);
        ui.setPedalSparkle(false);
        world.setStopPulse(Li, false);
        if (self) {
          ui.say(LINES.selfStop, undefined, true);
          KK.sound.play('chime');
          KK.haptic('success');
          roadPoint(L.s, G.d - 0.5, 1.0, _v);
          _v.project(camera);
          ui.burstStars(((_v.x + 1) / 2) * window.innerWidth, ((1 - _v.y) / 2) * window.innerHeight);
        } else {
          ui.say(LINES.magicStop, undefined, true);
          KK.sound.play('pop');
          KK.haptic('soft');
        }
      } else if (G.v === 0 && !G.pedal) {
        ui.setPedalSparkle(true);
        ui.setPedalDim(false);
      } else if (G.pedal) {
        ui.setPedalSparkle(false);
      }
      break;
    }
    case 'stopped':
      if (G.stateT >= CONFIG.crossing.startDelay) {
        setPhase('crossing');
        G.trainPassed = false;
        if (L.type === 'train') {
          train.start(L.s + CONFIG.train.trackOffset);
        } else {
          crew.startCrossing();
          ui.say(LINES.crossing, undefined, true);
        }
      }
      break;
    case 'crossing':
      if (L.type === 'train' && train.update(dt)) {
        G.trainPassed = true;
        ui.say(LINES.trainBye, undefined, true);
        world.setCrossing(Li, false, 0);
        G.greenAt = G.time + CONFIG.train.barrierTime + 0.2;
      }
      if (G.greenAt > 0 && G.time >= G.greenAt) {
        G.greenAt = -1;
        L.state = 'green';
        L.announced = true;
        world.setStopState(Li, 'green');
        if (L.type === 'light') ui.say(LINES.green, undefined, true);
        ui.setPedalSparkle(true);
        KK.sound.play('sparkle');
        G.stopIdx++;
        onStopIdx();
        setPhase('drive');
      }
      break;
    case 'arrive':
      if (G.v === 0 && G.trip.arrivalS - G.s < 0.05 && !G.arriveSaid) {
        G.arriveSaid = true;
        ui.say(LINES.arrived[G.dest], 0, true);
        KK.sound.play('chime');
        KK.haptic('success');
        controls.enabled = false;
        setTimeout(stampPhase, 1900);
      }
      break;
    default:
      break;
  }

  if (G.phase !== 'crossing' || L.type !== 'train') train.update(dt);
  if (crew.update(dt) && G.phase === 'crossing') G.greenAt = G.time + CONFIG.crossing.greenDelay;

  updateCrossingBell(dt);
  updateTractors(dt);
  const blockers = G.stops.filter((l) => l.state === 'red').map((l) => l.s);
  oncoming.update(dt, G.time, G.s, blockers, driving && G.phase !== 'ending' && G.phase !== 'stamp');
  birds.update(dt);
  gulls.update(dt);
  jumpers.update(dt);
  particles.update(dt);
  updateUnique(dt);
  updateDashboard(dt);
  updateIdleHint(dt);
}

function updateCrossingBell(dt) {
  const p = world.stopProps[G.stopIdx];
  if (!p || p.kind !== 'train' || !p.alarm) return;
  G.bellT -= dt;
  if (G.bellT <= 0) {
    G.bellT = CONFIG.train.bellEvery;
    audio.bell();
  }
}

function zoneStarts() {
  const u = G.trip.unique;
  const out = [G.trip.arrivalS - 10];
  if (u.type === 'tunnel' || u.type === 'wash') out.push(u.s0);
  return out;
}

function updateTractors(dt) {
  const zones = zoneStarts();
  for (const t of G.tractors) {
    const o = t.obj;
    if (!t.spawned && G.started && G.s >= t.plan.trigger) {
      t.spawned = true;
      o.spawn(G.s + C.nose + TRC.spawnAhead, nearestLane(G.d), t.plan.cargo);
    }
    if (!o.active) continue;
    let stopS = Infinity;
    for (const l of G.stops) if (l.state === 'red' && l.s > o.s) stopS = Math.min(stopS, l.s - MG.gap);
    if (Math.abs(G.d - o.d) < FL.sameLane && G.s > o.s) stopS = Math.min(stopS, G.s - 2.6 - 4);
    o.update(dt, G.s, stopS, (thanks) => {
      if (thanks) ui.say(LINES.yielded, undefined, true);
    });
    if (o.state === 'driving') {
      if (zones.some((z) => o.s + 2 + TRC.zoneMargin > z && o.s < z)) o.startYield(false);
      const same = Math.abs(G.d - o.d) < FL.sameLane;
      const gap = o.s - FL.tractorHalfLen - (G.s + C.nose);
      if (same && gap > 0 && gap <= TRC.promptDist && !t.prompted) {
        t.prompted = true;
        ui.say(LINES.slowCar);
        G.hornPulseUntil = G.time + 4;
      }
      if (same && gap > 0 && gap < 15) t.followT += dt;
      if (t.followT >= TRC.rePulseAfter && !t.rePulsed) {
        t.rePulsed = true;
        G.hornPulseUntil = G.time + 4;
      }
      if (t.followT >= TRC.autoYieldAfter) o.startYield(false);
      if (G.s > o.s) G.hornPulseUntil = 0;
    }
  }
  const anyDriving = G.tractors.some((t) => t.obj.state === 'driving');
  ui.setHornPulse(anyDriving && G.time < G.hornPulseUntil);
}

/** 목적지 고유 이벤트 + 날씨 유도 */
function updateUnique(dt) {
  const u = G.trip.unique;
  // 터널
  const tk = world.tunnelK;
  audio.setEcho(tk > 0.3);
  if (u.type === 'tunnel') {
    if (!G.tunnelSaid && G.s + CONFIG.tunnel.promptAhead > u.s0 && G.s < u.s1) {
      G.tunnelSaid = true;
      ui.say(LINES.tunnel, undefined, true);
      if (!G.lights) {
        G.hintLights = true;
        ui.setHint('lights', true);
      }
    }
    if (G.hintLights && G.s > u.s1 + 10 && G.trip.weather !== 'sunset') {
      G.hintLights = false;
      ui.setHint('lights', false);
    }
  }
  // 세차장
  if (u.type === 'wash') {
    const front = G.s + C.nose;
    if (!G.washSaid && front > u.s0 - CONFIG.wash.slowFrom) {
      G.washSaid = true;
      ui.say(LINES.wash, undefined, true);
    }
    const inside = front > u.s0 + 1 && G.s < u.s1 - 1;
    if (inside) {
      if (!G.washInside) {
        G.washInside = true;
        audio.loop('wash', true);
        if (!G.wiper) {
          G.hintWiper = true;
          ui.setHint('wiper', true);
        }
      }
      glass.addFoam(dt * 9 > Math.random() ? 1 : 0);
      if (Math.random() < dt * 30) {
        fwdDir(G.s, _v2);
        roadPoint(G.s + 3 + Math.random() * 3, G.d + (Math.random() - 0.5) * 3, 1 + Math.random() * 2, _v);
        particles.emit(_v, 2, { spread: 1.2, vel: _v2.set(0, 0.5, 0), jitter: 0.8, color: [0xffffff, 0xffd6e2, 0xd6eeff], life: 1.6, gravity: 0.8 });
        roadPoint(G.s + 4, G.d + (Math.random() < 0.5 ? -1.5 : 1.5), 2.6, _v);
        particles.emit(_v, 2, { spread: 0.3, vel: _v2.set(0, -3, 0), jitter: 1.5, color: 0xbfe6ff, life: 0.5, gravity: 6 });
      }
    } else if (G.washInside && G.s >= u.s1 - 1) {
      G.washInside = false;
      audio.loop('wash', false);
      if (!G.wiper) glass.slideFoam();
      G.hintWiper = G.trip.weather === 'rain' && !G.wiper && G.weatherSaid;
      ui.setHint('wiper', G.hintWiper);
    }
  }
  // 해안 전망: 돌고래
  if (inSeaView(70)) {
    G.jumpT -= dt;
    if (G.jumpT <= 0) {
      const [a, b] = CONFIG.seaView.jumpEvery;
      G.jumpT = a + Math.random() * (b - a);
      dolphinJump();
    }
  }
  // 갈매기: 해안 구간·바닷가 도착지
  const th = themeAt(G.trip, G.s + 40);
  if (th === 'coast' && G.phase !== 'map') {
    roadPoint(G.s + 55, 40, 11, _v);
    if (!gulls.center) gulls.setCenter(_v.clone());
    else gulls.center.lerp(_v, Math.min(1, dt * 0.8));
  } else if (gulls.center) {
    gulls.setCenter(null);
  }
  // 날씨 유도 (시작 10초 후 1회)
  const w = WEATHERS[G.trip.weather];
  if (w.line && !G.weatherSaid && G.driveT > CONFIG.hints.weatherLineAfter && G.phase === 'drive') {
    G.weatherSaid = true;
    ui.say(LINES[w.line]);
    if (w.hint === 'wiper' && !G.wiper) {
      G.hintWiper = true;
      ui.setHint('wiper', true);
    }
    if (w.hint === 'lights' && !G.lights) {
      G.hintLights = true;
      ui.setHint('lights', true);
    }
  }
}

function updateDashboard(dt) {
  if (G.blink) {
    G.blinkTick -= dt;
    if (G.blinkTick <= 0) {
      G.blinkTick = 0.33;
      G.blinkPhase = !G.blinkPhase;
      audio.tick(G.blinkPhase);
    }
    if (G.time > G.blinkUntil) setBlink(G.blink);
  }
  if (glass.wipeT >= 0 && G.lastWipe < 0) audio.wiper();
  G.lastWipe = glass.wipeT;
}

function updateIdleHint(dt) {
  const canIdle = (G.phase === 'drive' || G.phase === 'arrive') && G.started && G.firstPedal && !G.arriveSaid;
  if (canIdle && G.v < 0.05 && !G.pedal && !controls.steering) {
    G.idleT += dt;
    if (G.idleT > CONFIG.hints.idleDelay) ui.setPedalSparkle(true);
  } else {
    G.idleT = 0;
  }
  if (G.pedal) ui.setPedalSparkle(false);
}

/* ---------- 도착 → 도장 → 엔딩 ---------- */

function stampPhase() {
  if (G.phase !== 'arrive') return;
  setPhase('stamp');
  const dest = G.dest;
  const before = visits();
  const next = { ...before, [dest]: (before[dest] || 0) + 1 };
  store.set('visits', next);
  ui.resetHints();
  ui.showMap(before, 'stamp');
  renderOn = false;
  setTimeout(() => {
    ui.stampCard(dest, next[dest]);
    ui.say(LINES.stamp, 0, true);
    KK.sound.play('chime');
    KK.haptic('success');
  }, 450);
  setTimeout(showEnding, 2400);
}

function showEnding() {
  if (G.phase !== 'stamp') return;
  setPhase('ending');
  endTripSideEffects();
  ui.say(LINES.arrive, 0, true);
  KK.softEnding({
    title: LINES.endingTitle,
    emoji: DESTINATIONS[G.dest].emoji,
    onAgain: showMapScreen,
    onRest: () => {
      window.location.href = LOBBY;
    },
  });
}

/* ---------- 카메라 · 시각 ---------- */

function baseVFov() {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const h = CAM.hFovDeg * DEG;
  const v = (2 * Math.atan(Math.tan(h / 2) / aspect)) / DEG;
  return clamp(v, CAM.vFovMinDeg, CAM.vFovMaxDeg);
}

/** 보닛 앞선이 화면 아래 bonnetEdgeFrac 높이에 오도록 앞뒤 위치를 맞춘다 (높이는 고정) */
function placeBonnet(vfov) {
  const yb = 0.42;
  const sy = 0.42;
  const sz = 1.5;
  const target = (vfov / 2 - pitchDeg - CAM.bonnetEdgeFrac * vfov) * DEG;
  const edge = (zc) => {
    let best = Infinity;
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40) * (Math.PI / 2);
      const z = zc - sz * Math.cos(t);
      if (z >= -0.05) continue;
      const dep = Math.atan2(C.eyeHeight - (yb + sy * Math.sin(t)), -z);
      if (dep < best) best = dep;
    }
    return best;
  };
  let far = -3;
  let near = 1.2;
  for (let i = 0; i < 24; i++) {
    const mid = (far + near) / 2;
    if (edge(mid) > target) near = mid;
    else far = mid;
  }
  bonnet.position.set(0, yb, (far + near) / 2);
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  const aspect = w / Math.max(1, h);
  camera.aspect = aspect;
  pitchDeg = CAM.pitchDeg + (CAM.pitchPortraitDeg - CAM.pitchDeg) * clamp((1 - aspect) / 0.5, 0, 1);
  camera.rotation.x = pitchDeg * DEG;
  baseFovV = baseVFov();
  G.fovV = baseFovV;
  camera.fov = baseFovV;
  camera.updateProjectionMatrix();
  placeBonnet(baseFovV);
  glass.resize();
}

function updateVisual(dt) {
  // 임계감쇠 스프링 해석해 — dt가 커도 발산하지 않음
  const target = controls.steering ? controls.steer * ST.maxVisualDeg : 0;
  const w = controls.steering ? 30 : 4.2 / ST.springTime;
  const ex = Math.exp(-w * dt);
  const dx = G.steerVis - target;
  const tmp = (G.steerVel + w * dx) * dt;
  G.steerVis = target + (dx + tmp) * ex;
  G.steerVel = (G.steerVel - w * tmp) * ex;
  ui.setWheel(G.steerVis);
  ui.setPedalPressed(G.pedal);
  ui.setSpeed(G.v / C.vmax);

  const k = clamp(G.steerVis / ST.maxVisualDeg, -1, 1);
  const vr = G.v / C.vmax;
  roadPoint(G.s, G.d, 0, rig.position);
  rig.rotation.y = roadYaw(G.s) - Math.atan2(G.latV, Math.max(G.v, 2));
  // 신호 앞에 멈추면 건너는 친구들 쪽으로 살짝 고개를 돌려 화면 안에 둔다
  let lookT = 0;
  const L = G.stops && G.stops[G.stopIdx];
  const near = L && L.type === 'light' && (G.phase === 'stopped' || G.phase === 'crossing' || (G.phase === 'redApproach' && distToLine(L) < 25));
  if (near && crew.focus(_v2)) {
    const yaw = rig.rotation.y;
    const rx = _v2.x - rig.position.x;
    const rz = _v2.z - rig.position.z;
    const fwd = -Math.sin(yaw) * rx - Math.cos(yaw) * rz;
    const right = Math.cos(yaw) * rx - Math.sin(yaw) * rz;
    const ang = Math.atan2(right, Math.max(0.5, fwd));
    const half = Math.atan(Math.tan((camera.fov * DEG) / 2) * camera.aspect);
    const need = Math.abs(ang) - (half - CONFIG.crossing.lookMarginDeg * DEG);
    if (need > 0) lookT = -Math.sign(ang) * Math.min(need, CONFIG.crossing.lookMaxDeg * DEG);
  }
  G.lookYaw += (lookT - G.lookYaw) * Math.min(1, dt * 2.6);
  head.rotation.y = -k * CAM.yawDeg * DEG + G.lookYaw;
  head.rotation.z = -k * CAM.rollDeg * DEG;
  const t = G.time;
  const idle = G.started && G.phase !== 'ending' ? 0.0007 * Math.sin(t * 41) : 0;
  head.position.y = C.eyeHeight + vr * CAM.shake * (Math.sin(t * 13.1) + 0.6 * Math.sin(t * 7.7)) + idle;
  head.rotation.x = vr * 0.0018 * Math.sin(t * 9.3);

  G.fovV += (baseFovV + vr * CAM.speedFovDeg - G.fovV) * Math.min(1, dt * 3);
  if (Math.abs(camera.fov - G.fovV) > 0.01) {
    camera.fov = G.fovV;
    camera.updateProjectionMatrix();
  }

  const rpmT = Math.max(vr, G.pedal ? C.revIdle : 0);
  G.rpm += (rpmT - G.rpm) * Math.min(1, dt * 4);
  G.audioT += dt;
  if (G.audioT > 0.05) {
    G.audioT = 0;
    audio.setEngine(G.rpm, G.pedal ? 1 : 0);
  }
  audio.updateRadio();
}

/* ---------- 루프 · 성능 ---------- */

let raf = 0;
let last = 0;
const perf = { t: 0, frames: 0, fps: 60, lowered: false, maxCalls: 0 };

function measure(dtRaw) {
  perf.t += dtRaw;
  perf.frames++;
  if (perf.t >= CONFIG.perf.slowWindow) {
    const avgMs = (perf.t / perf.frames) * 1000;
    perf.fps = perf.frames / perf.t;
    if (!perf.lowered && avgMs > CONFIG.perf.slowFrameMs && pixelRatio > 1) {
      perf.lowered = true;
      pixelRatio = 1;
      renderer.setPixelRatio(1);
      onResize();
    }
    perf.t = 0;
    perf.frames = 0;
  }
}

function frame(now) {
  raf = requestAnimationFrame(frame);
  const dtRaw = last ? (now - last) / 1000 : 1 / 60;
  last = now;
  measure(dtRaw);
  const dt = Math.min(dtRaw, CONFIG.sim.maxFrameDt) * timeScale;
  let acc = dt;
  while (acc > 1e-6) {
    const h = Math.min(CONFIG.sim.step, acc);
    update(h);
    acc -= h;
  }
  if (!G.trip) return;
  updateVisual(dt);
  world.pump(G.s, CONFIG.world.buildBudgetMs);
  rig.updateMatrixWorld();
  camera.getWorldPosition(_v);
  world.update(dt, _v, G.s);
  precip.update(dt, _v, 1 - world.tunnelK * 0.9);
  glass.update(dt, G.v);
  if (renderOn) {
    renderer.render(scene, camera);
    perf.maxCalls = Math.max(perf.maxCalls, renderer.info.render.calls);
  }
}

function startLoop() {
  if (raf) return;
  last = 0;
  raf = requestAnimationFrame(frame);
}

function stopLoop() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopLoop();
    audio.suspend();
    ui.stopSpeech();
    controls.releaseAll();
  } else {
    audio.resume();
    startLoop();
  }
});

/* ---------- 사운드 버튼 · 전역 제스처 방지 ---------- */

document.getElementById('soundBtn').addEventListener('click', () => {
  const m = KK.sound.toggleMute();
  audio.setMuted(m);
  ui.setSoundIcon(m);
  if (m) ui.stopSpeech();
});
ui.setSoundIcon(KK.sound.isMuted());
KK.restButton({ position: 'tr' });

document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  },
  { passive: false }
);
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);

/* ---------- 디버그 훅 (읽기 전용 상태 + 테스트 조작) ---------- */

function teleport(s) {
  if (!G.trip || G.phase === 'key' || G.phase === 'map' || G.phase === 'ending' || G.phase === 'stamp') return;
  G.s = Math.max(0, Number(s) || 0);
  G.v = 0;
  G.latV = 0;
  G.d = LANES[1];
  let idx = G.stops.findIndex((l) => l.s - C.nose > G.s + 0.5);
  if (idx < 0) idx = G.stops.length;
  for (let i = 0; i < idx; i++) {
    G.stops[i].state = 'green';
    G.stops[i].announced = true;
    world.setStopState(i, 'green');
    world.setStopPulse(i, false);
  }
  G.stopIdx = idx;
  for (const t of G.tractors) {
    if (G.s >= t.plan.trigger) {
      t.spawned = true;
      t.obj.hide();
    }
  }
  crew.hide();
  train.reset();
  onStopIdx();
  ui.setPedalDim(false);
  setPhase(idx >= G.stops.length && G.trip.arrivalS - G.s <= MG.approachDist ? 'arrive' : 'drive');
  world.reset(G.s);
}

function startTripDebug(dest, opts = {}) {
  if (!DESTINATIONS[dest]) return false;
  const ending = document.querySelector('.kk-soft-ending');
  if (ending) ending.remove();
  beginTrip(dest, opts);
  if (opts.autoStart) startEngine();
  return true;
}

window.__drive = Object.freeze({
  get state() {
    const T = G.tractors || [];
    const cur = T.find((t) => t.obj.active) || T.filter((t) => t.spawned).pop() || T[0];
    const mem = renderer.info.memory;
    return {
      phase: G.phase,
      destination: G.dest || null,
      weather: G.trip ? G.trip.weather : null,
      segment: G.trip ? themeAt(G.trip, G.s) : null,
      s: G.s,
      speed: G.v,
      d: G.d,
      pedal: !!G.pedal,
      lightIndex: G.stopIdx,
      lights: (G.stops || []).map((l) => l.state),
      events: G.trip
        ? [
            ...G.stops.map((l) => ({ type: l.type, s: l.s, state: l.state })),
            ...T.map((t) => ({ type: 'tractor', s: t.plan.s, state: t.obj.state, cargo: t.plan.cargo })),
            ...(G.trip.unique.type === 'train' ? [] : [{ type: G.trip.unique.type, s: G.trip.unique.s0, state: 'on' }]),
            { type: 'arrival', s: G.trip.arrivalS, state: G.arriveSaid ? 'done' : 'ahead' },
          ]
        : [],
      tractor: cur ? { index: T.indexOf(cur), state: cur.obj.state, s: cur.obj.s, d: cur.obj.d, v: cur.obj.v } : null,
      crew: crew.state,
      train: { active: train.active, u: train.u },
      tunnel: world.tunnelK,
      buttons: { blink: G.blink || null, wiper: !!G.wiper, lights: !!G.lights, radio: audio.radio.on },
      foam: glass.foamCount,
      bubble: ui.bubbleText,
      visits: visits(),
      fps: Math.round(perf.fps),
      pixelRatio,
      drawCalls: renderer.info.render.calls,
      maxDrawCalls: perf.maxCalls,
      memory: { geometries: mem.geometries, textures: mem.textures },
    };
  },
  debug: Object.freeze({
    startTrip: startTripDebug,
    teleport,
    setPedal(on) {
      debugPedal = !!on;
      if (debugPedal && controls.onInput) controls.onInput('pedal');
    },
    honk() {
      return controls.honk();
    },
    press: pressButton,
    timeScale(k) {
      timeScale = clamp(Number(k) || 1, 0.25, 6);
    },
  }),
});

/* ---------- 시작 ---------- */

onResize();
showMapScreen();
startLoop();
