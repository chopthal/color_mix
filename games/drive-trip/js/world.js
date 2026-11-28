/**
 * 월드: 하늘·날씨·조명·원경 + 청크 스케줄러(프레임 분할) + 여행별 소품(신호등·건널목·터널·세차장·도착지·차고).
 * 여행 소품은 tripGroup 하나에 모아 두고 다음 여행 전에 통째로 dispose 한다.
 */
import * as THREE from '../vendor/three.module.min.js';
import { CONFIG, PALETTE, WEATHERS } from './config.js';
import { roadPoint, roadYaw } from './road.js';
import { GeoBuilder, ribbon, rng, glowTexture, blobTexture, mergeSimple } from './geo.js';
import { U, worldMat, treeMat, waterMat, actorMat, lampMaterial } from './materials.js';
import { ChunkBuilder, frameAt } from './chunks.js';
import {
  treeGeometry,
  addSignalFrame,
  hillsGeometry,
  cloudGeometry,
  archGeometry,
  balloonGeometry,
  boatGeometry,
  giraffeParts,
  puppyParts,
  ferrisParts,
} from './models.js';
import {
  addGarage,
  addPortal,
  addCarWash,
  brushGeometryInto,
  addCrossingPost,
  barrierArmInto,
  addParasol,
  addZooGate,
  addZooWall,
  addCarousel,
  addHanok,
  addJangdok,
  addStoneWall,
} from './props.js';

const W = CONFIG.world;
const TREE_KINDS = ['pine', 'round', 'blossom', 'persimmon'];
const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _col = new THREE.Color();
const _col2 = new THREE.Color();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const UP = new THREE.Vector3(0, 1, 0);
const AX_Z = new THREE.Vector3(0, 0, 1);

const LAMP_ON = { red: 0xff5d5d, yellow: 0xffd04d, green: 0x4fd88c };
const LAMP_OFF = { red: 0x6d4a55, yellow: 0x6b6248, green: 0x3f5d56 };

function place(obj, s, d, y, yaw) {
  frameAt(s, d, y, yaw, _m);
  _m.decompose(obj.position, obj.quaternion, obj.scale);
}

export class World {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xeaf5f1, W.fogNear, W.fogFar);
    this.scene.background = new THREE.Color(0xeaf5f1);
    this.time = 0;
    this.tunnelK = 0;
    this.weather = WEATHERS.clear;

    this.initLights();
    this.initSky();
    this.initFar();
    this.initTrees();

    this.slots = [];
    for (let i = 0; i < W.chunksAlive; i++) this.slots.push({ index: -1, mesh: null, water: null, trees: [] });
    this.job = null;
    this.builder = null;
    this.trip = null;
    this.tripGroup = new THREE.Group();
    this.scene.add(this.tripGroup);
    this.stopProps = [];
    this.anim = [];
  }

  initLights() {
    this.hemi = new THREE.HemisphereLight(0xf2f8ff, 0xc9dfae, 2.5);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff0da, 1.7);
    this.sunDir = new THREE.Vector3(-0.3, 1, 0.25).normalize();
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    // 전조등: 항상 존재(셰이더 재컴파일 방지), 끄면 세기 0
    this.headlight = new THREE.SpotLight(0xfff1d0, 0, 50, 0.6, 0.85, 1.7);
    this.headlight.position.set(0, 0.9, -1.2);
    this.headlight.target.position.set(0, 0, -18);
  }

  initSky() {
    const g = new THREE.SphereGeometry(1000, 24, 12);
    this.skyU = {
      uZenith: { value: new THREE.Color() },
      uMid: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uSun: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uDim: { value: 1 },
    };
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: this.skyU,
      vertexShader:
        'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: [
        'uniform vec3 uZenith; uniform vec3 uMid; uniform vec3 uHorizon; uniform vec3 uSun; uniform vec3 uSunDir; uniform float uDim;',
        'varying vec3 vDir;',
        'void main(){',
        '  float h = clamp(vDir.y, 0.0, 1.0);',
        '  vec3 c = mix(uHorizon, uMid, smoothstep(0.0, 0.16, h));',
        '  c = mix(c, uZenith, smoothstep(0.14, 0.7, h));',
        '  float sd = max(dot(normalize(vDir), uSunDir), 0.0);',
        '  c += uSun * (pow(sd, 14.0) * 0.4 + pow(sd, 400.0) * 0.7);',
        '  gl_FragColor = vec4(c * uDim, 1.0);',
        '  #include <colorspace_fragment>',
        '}',
      ].join('\n'),
    });
    this.sky = new THREE.Mesh(g, m);
    this.sky.renderOrder = -10;
    this.sky.frustumCulled = false;
    this.scene.add(this.sky);
  }

  initFar() {
    this.groundMat = new THREE.MeshLambertMaterial({ color: 0x9ccc82 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(3200, 3200).rotateX(-Math.PI / 2), this.groundMat);
    ground.position.y = W.farGroundY;
    this.ground = ground;
    this.scene.add(ground);

    this.hillMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, fog: false });
    const r = rng(77);
    this.hills = new THREE.Group();
    this.hills.add(new THREE.Mesh(hillsGeometry(700, 34, 70, 150, 0xb7c8e8, 0xc7d4ee, r), this.hillMat));
    this.hills.add(new THREE.Mesh(hillsGeometry(560, 46, 30, 85, 0x9fcba6, 0xb4d8b4, r), this.hillMat));
    this.hills.children.forEach((h) => (h.frustumCulled = false));
    this.scene.add(this.hills);

    this.cloudMat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x9aa4b0, flatShading: true, fog: false });
    const cr = rng(11);
    const parts = [];
    for (let i = 0; i < 9; i++) {
      const g = cloudGeometry(cr);
      const a = -Math.PI / 2 + (i - 4) * 0.4 + (cr() - 0.5) * 0.2;
      const rad = 380 + cr() * 160;
      g.rotateY(-a + Math.PI / 2);
      g.translate(Math.cos(a) * rad, 95 + cr() * 60, Math.sin(a) * rad);
      parts.push(g);
    }
    this.clouds = new THREE.Mesh(mergeSimple(parts), this.cloudMat);
    this.clouds.frustumCulled = false;
    this.scene.add(this.clouds);
  }

  initTrees() {
    const cap = W.chunksAlive * W.treesPerChunk;
    this.treeMeshes = {};
    for (const k of TREE_KINDS) {
      const im = new THREE.InstancedMesh(treeGeometry(k), treeMat, cap);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      im.frustumCulled = false;
      for (let i = 0; i < cap; i++) {
        im.setMatrixAt(i, ZERO);
        im.setColorAt(i, _col.setRGB(1, 1, 1));
      }
      this.treeMeshes[k] = im;
      this.scene.add(im);
    }
    const sg = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const sm = new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, opacity: 0.7 });
    this.treeShadows = new THREE.InstancedMesh(sg, sm, cap * TREE_KINDS.length);
    this.treeShadows.frustumCulled = false;
    this.treeShadows.renderOrder = 1;
    for (let i = 0; i < cap * TREE_KINDS.length; i++) this.treeShadows.setMatrixAt(i, ZERO);
    this.scene.add(this.treeShadows);
  }

  /* ---------- 날씨 ---------- */

  setWeather(key) {
    const w = WEATHERS[key] || WEATHERS.clear;
    this.weather = w;
    this.skyU.uZenith.value.set(w.sky.zenith);
    this.skyU.uMid.value.set(w.sky.mid);
    this.skyU.uHorizon.value.set(w.sky.horizon);
    this.skyU.uSun.value.set(w.sky.sun);
    this.skyU.uSunDir.value.set(...w.sky.sunDir).normalize();
    this.scene.fog.near = w.fog.near;
    this.scene.fog.far = w.fog.far;
    this.hemi.color.set(w.hemi.sky);
    this.hemi.groundColor.set(w.hemi.ground);
    this.sun.color.set(w.sun.color);
    this.sunDir.set(...w.sun.dir).normalize();
    this.hillMat.color.set(w.hills);
    this.cloudMat.emissive.set(w.clouds);
    this.groundMat.color.set(key === 'snow' ? 0xe8eef3 : key === 'sunset' ? 0xb7b98a : 0x9ccc82);
    U.snow.value = w.snow;
    U.lamp.value = w.lamps;
    this.applyLight();
  }

  applyLight() {
    const w = this.weather;
    const k = this.tunnelK;
    const T = CONFIG.tunnel;
    this.hemi.intensity = w.hemi.intensity * (1 - (1 - T.minLight) * k);
    this.hemi.color.set(w.hemi.sky).lerp(_col2.set(T.hemiSky), k);
    this.hemi.groundColor.set(w.hemi.ground).lerp(_col2.set(T.hemiGround), k);
    this.sun.intensity = w.sun.intensity * (1 - 0.92 * k);
    _col.set(w.fog.color);
    this.scene.fog.color.copy(_col.lerp(_col2.set(T.fog), 0.6 * k));
    this.scene.background.copy(this.scene.fog.color);
  }

  /* ---------- 여행 ---------- */

  disposeTrip() {
    const kill = [];
    this.tripGroup.traverse((o) => kill.push(o));
    for (const o of kill) {
      if (o.isSprite) {
        o.material.dispose();
        continue;
      }
      if (o.isInstancedMesh) o.dispose();
      if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose();
      if (o.userData.ownMat && o.material) o.material.dispose();
    }
    this.tripGroup.clear();
    this.stopProps = [];
    this.anim = [];
    this.wash = null;
    for (const slot of this.slots) {
      if (slot.mesh) {
        this.scene.remove(slot.mesh);
        slot.mesh.geometry.dispose();
        slot.mesh = null;
      }
      if (slot.water) {
        this.scene.remove(slot.water);
        slot.water.geometry.dispose();
        slot.water = null;
      }
      slot.index = -1;
      slot.trees = [];
    }
    this.rebuildTrees();
    this.job = null;
  }

  setTrip(trip) {
    this.disposeTrip();
    this.trip = trip;
    this.builder = new ChunkBuilder(trip);
    this.setWeather(trip.weather);
    for (const st of trip.stops) this.stopProps.push(st.type === 'light' ? this.makeSignal(st.s) : this.makeCrossing(st.s));
    this.makeGarage();
    const u = trip.unique;
    if (u.type === 'tunnel') this.makeTunnel(u.s0, u.s1);
    if (u.type === 'wash') this.makeWash(u.s0, u.s1);
    this.makeArrival(trip);
    for (const bt of trip.boats) this.makeBoat(bt);
    this.reset(0);
  }

  own(o) {
    o.userData.ownMat = true;
    return o;
  }

  /* --- 신호등 --- */

  makeSignal(sStop) {
    const group = new THREE.Group();
    const poleD = 10.4;
    const armLen = (poleD - 3.5) / 1.3 + 1.9;
    const b = new GeoBuilder();
    const lampPos = addSignalFrame(b, armLen, 5.4);
    group.add(new THREE.Mesh(b.build(), worldMat));
    const lampGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.12, 20).rotateX(Math.PI / 2);
    const lamps = ['red', 'yellow', 'green'].map((n, i) => {
      const mesh = this.own(new THREE.Mesh(lampGeo, lampMaterial(LAMP_OFF[n])));
      mesh.position.copy(lampPos[i]);
      group.add(mesh);
      return { name: n, mat: mesh.material, pos: lampPos[i] };
    });
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.85 })
    );
    glow.scale.set(2.6, 2.6, 1);
    group.add(glow);
    place(group, sStop + 14, poleD, 0, 0);
    group.scale.setScalar(1.3);
    this.tripGroup.add(group);
    const stop = this.makeStopLine(sStop);
    const sig = { kind: 'light', s: sStop, lamps, glow, stop, pulse: 0 };
    this.setSignal(sig, 'red');
    return sig;
  }

  makeStopLine(sStop) {
    const sb = new GeoBuilder();
    ribbon(sb, sStop - 0.5, sStop, 0.15, 7.0, 0.016, 0xffffff, 0.5);
    const stop = this.own(new THREE.Mesh(sb.build(), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x000000 })));
    this.tripGroup.add(stop);
    return stop;
  }

  setSignal(sig, state) {
    for (const l of sig.lamps) l.mat.color.set(l.name === state ? LAMP_ON[l.name] : LAMP_OFF[l.name]);
    const on = sig.lamps.find((l) => l.name === state);
    sig.glow.position.set(on.pos.x, on.pos.y, on.pos.z + 0.25);
    sig.glow.material.color.set(LAMP_ON[state]);
  }

  /* --- 기차 건널목 --- */

  makeCrossing(sStop) {
    const T = CONFIG.train;
    const trackS = sStop + T.trackOffset;
    const posts = [];
    const lampGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.1, 16).rotateX(Math.PI / 2);
    const mkPost = (s, d, yaw) => {
      const g = new THREE.Group();
      const b = new GeoBuilder();
      const lp = addCrossingPost(b, null);
      g.add(new THREE.Mesh(b.build(), worldMat));
      const lamps = lp.map((p) => {
        const m = this.own(new THREE.Mesh(lampGeo, lampMaterial(0x5a3a40)));
        m.position.copy(p);
        g.add(m);
        return m.material;
      });
      place(g, s, d, 0, yaw);
      this.tripGroup.add(g);
      posts.push(lamps);
    };
    mkPost(sStop + 2.4, 11.0, 0);
    mkPost(trackS + 4.2, -5.8, Math.PI);
    const mkArm = (s, d, yaw, len) => {
      const ab = new GeoBuilder();
      barrierArmInto(ab, len);
      const pivot = new THREE.Group();
      place(pivot, s, d, 1.0, yaw);
      const arm = new THREE.Mesh(ab.build(), worldMat);
      pivot.add(arm);
      this.tripGroup.add(pivot);
      return arm;
    };
    const armR = mkArm(sStop + 2.4, 9.4, 0, 8.6);
    const armL = mkArm(trackS + 4.2, -4.6, Math.PI, 4.3);
    armR.rotation.z = -1.35;
    armL.rotation.z = -1.35;
    const stop = this.makeStopLine(sStop);
    return { kind: 'train', s: sStop, trackS, posts, arms: [armR, armL], stop, pulse: 0, alarm: false, down: 0, downTarget: 0 };
  }

  /* --- 차고 · 터널 · 세차장 · 배 --- */

  makeGarage() {
    const b = new GeoBuilder();
    frameAt(0, CONFIG.road.lanes[1], 0, 0, _m);
    addGarage(b, _m);
    this.tripGroup.add(new THREE.Mesh(b.build(), worldMat));
  }

  makeTunnel(t0, t1) {
    const b = new GeoBuilder();
    frameAt(t0, 0, 0, 0, _m);
    addPortal(b, _m, 1);
    frameAt(t1, 0, 0, 0, _m);
    addPortal(b, _m, -1);
    // 산 둔덕: 터널 단면보다 큰 단면을 길이 방향으로 밀어낸 모양 (양 끝은 입구 벽 뒤)
    const sec = [
      [-40, -0.2],
      [-27, 8.5],
      [-12, 14.5],
      [2.75, 16.5],
      [17, 14.5],
      [31, 8.5],
      [45, -0.2],
    ];
    const r = rng(5);
    const pa = new THREE.Vector3();
    const pb = new THREE.Vector3();
    const pc = new THREE.Vector3();
    const pd = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const step = 6;
    for (let s0 = t0; s0 < t1 - 0.01; s0 += step) {
      const s1 = Math.min(t1, s0 + step);
      for (let i = 0; i < sec.length - 1; i++) {
        const j0 = (k, s) => sec[k][1] + (k > 0 && k < sec.length - 1 ? Math.sin(s * 0.11 + k) * 0.8 : 0);
        roadPoint(s0, sec[i][0], j0(i, s0), pa);
        roadPoint(s0, sec[i + 1][0], j0(i + 1, s0), pb);
        roadPoint(s1, sec[i + 1][0], j0(i + 1, s1), pc);
        roadPoint(s1, sec[i][0], j0(i, s1), pd);
        _col.set(0x86c46e).multiplyScalar(0.93 + r() * 0.12);
        b.quad(pa, pb, pc, pd, _col.getHex(), up);
      }
    }
    for (const [sc, dir] of [
      [t0, 1],
      [t1, -1],
    ]) {
      roadPoint(sc, 2.75, 0, pa);
      const hint = new THREE.Vector3();
      roadPoint(sc + dir, 2.75, 0, hint).sub(pa).negate();
      for (let i = 0; i < sec.length - 1; i++) {
        roadPoint(sc, sec[i][0], sec[i][1], pb);
        roadPoint(sc, sec[i + 1][0], sec[i + 1][1], pc);
        b.tri(pa, pb, pc, 0x78b862, hint);
      }
    }
    for (let i = 0; i < 16; i++) {
      const sz = t0 + 8 + r() * (t1 - t0 - 16);
      const k = Math.floor(r() * (sec.length - 3)) + 1;
      const f = r();
      const dx = sec[k][0] + (sec[k + 1][0] - sec[k][0]) * f;
      const dy = sec[k][1] + (sec[k + 1][1] - sec[k][1]) * f;
      frameAt(sz, dx, dy - 0.4, r() * 6, _m);
      b.part('cone7', new THREE.Matrix4().makeScale(3.4, 4.4, 3.4).setPosition(0, 2.2, 0).premultiply(_m), r() < 0.5 ? 0x6cc08a : 0x7bcb93, 0.05, r);
      b.part('cyl6', new THREE.Matrix4().makeScale(0.4, 1.0, 0.4).setPosition(0, 0.3, 0).premultiply(_m), 0xa47551);
    }
    this.tripGroup.add(new THREE.Mesh(b.build(), worldMat));
  }

  makeWash(w0, w1) {
    const b = new GeoBuilder();
    frameAt(w0, 0, 0, 0, _m);
    addCarWash(b, _m, w1 - w0);
    this.tripGroup.add(new THREE.Mesh(b.build(), worldMat));
    const bb = new GeoBuilder();
    brushGeometryInto(bb);
    const im = new THREE.InstancedMesh(bb.build(), worldMat, 8);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    im.frustumCulled = false;
    this.tripGroup.add(im);
    const L = w1 - w0;
    const brushes = [];
    for (const f of [0.33, 0.66]) {
      for (const d of [0.25, 3.5, 6.75]) brushes.push({ s: w0 + L * f, d, horiz: false });
      brushes.push({ s: w0 + L * f + 2.5, d: 3.5, horiz: true });
    }
    this.wash = { s0: w0, s1: w1, im, brushes, spin: 0 };
  }

  makeBoat(bt) {
    const g = new THREE.Mesh(boatGeometry(bt.d > 0 ? 0xff8a7a : 0x6cbcf0), actorMat);
    place(g, bt.s, bt.d, W.riverY, (bt.d > 0 ? 0.4 : -0.4) + Math.PI / 2);
    g.userData.baseY = g.position.y;
    g.userData.phase = bt.phase;
    this.tripGroup.add(g);
    this.anim.push((t) => {
      g.position.y = g.userData.baseY + Math.sin(t * 1.3 + g.userData.phase) * 0.12;
      g.rotation.z = Math.sin(t * 1.1 + g.userData.phase) * 0.04;
    });
  }

  /* --- 도착지 --- */

  parkingBoxes(sA) {
    const pb = new GeoBuilder();
    const s0 = sA - 2.8;
    const s1 = sA + 2.6;
    pb.setGlow(-1);
    for (const [dA, dB] of [
      [0.4, 3.1],
      [3.9, 6.6],
    ]) {
      ribbon(pb, s0, s1, dA, dA + 0.16, 0.014, PALETTE.white, 1);
      ribbon(pb, s0, s1, dB - 0.16, dB, 0.014, PALETTE.white, 1);
      ribbon(pb, s0, s0 + 0.16, dA, dB, 0.014, PALETTE.white, 1);
      ribbon(pb, s1 - 0.16, s1, dA, dB, 0.014, PALETTE.white, 1);
      ribbon(pb, s0 + 1.6, s1 - 1.6, (dA + dB) / 2 - 0.55, (dA + dB) / 2 + 0.55, 0.014, 0x8fcdf0, 1);
    }
    this.tripGroup.add(new THREE.Mesh(pb.build(), worldMat));
  }

  balloonArch(sA) {
    const span = 15.5;
    const arch = new THREE.Mesh(archGeometry(span), worldMat);
    place(arch, sA + 16, 2.75, 0, 0);
    this.tripGroup.add(arch);
    const R0 = span / 2 - 0.26 * 5;
    [-1, 1].forEach((sx, i) => {
      for (let k = 0; k < 2; k++) {
        const bm = new THREE.Mesh(balloonGeometry(i * 3 + k * 2), worldMat);
        frameAt(sA + 16, 2.75, 0, 0, _m);
        bm.position.set(sx * R0 + sx * k * 0.9 - sx * 0.3, 1.3, k * 0.6 - 0.3).applyMatrix4(_m);
        bm.quaternion.copy(arch.quaternion);
        const ph = i * 1.7 + k;
        const by = bm.position.y;
        this.tripGroup.add(bm);
        this.anim.push((t) => {
          bm.rotation.z = Math.sin(t * 1.3 + ph) * 0.06;
          bm.position.y = by + 0.05 * Math.sin(t * 1.7 + ph);
        });
      }
    });
  }

  makeArrival(trip) {
    const sA = trip.arrivalS;
    this.parkingBoxes(sA);
    const b = new GeoBuilder();
    const r = rng(trip.seed + 3);
    const type = trip.def.arrival;
    if (type === 'beach') {
      for (let s = sA - 16; s < sA + 120; s += 4) {
        ribbon(b, s, s + 4, 11.4, 44, 0.12, PALETTE.sand, 4);
        ribbon(b, s, s + 4, 44, 52, 0.12, PALETTE.sand, 4, W.waterY + 0.05);
        ribbon(b, s, s + 4, 50.5, 53, W.waterY + 0.06, 0xffffff, 4);
      }
      for (let i = 0; i < 7; i++) {
        frameAt(sA + 4 + i * 13 + r() * 5, 17 + r() * 22, 0.12, r() * 6, _m);
        addParasol(b, _m.clone(), r);
      }
      frameAt(sA + 30, 26, 0.12, 0, _m);
      b.part('sph', new THREE.Matrix4().makeScale(0.9, 0.9, 0.9).setPosition(0, 0.45, 0).premultiply(_m), 0xff6b6b);
    } else if (type === 'zoo') {
      frameAt(sA + 16, 0, 0, 0, _m);
      addZooGate(b, _m);
      for (let s = sA + 22; s < sA + 120; s += 8) {
        frameAt(s, 13, 0, Math.PI / 2, _m);
        addZooWall(b, _m, 8.05);
        frameAt(s, -7.5, 0, -Math.PI / 2, _m);
        addZooWall(b, _m, 8.05);
      }
      for (let s = sA - 12; s < sA + 22; s += 8) {
        frameAt(s, 13, 0, Math.PI / 2, _m);
        addZooWall(b, _m, 8.05);
      }
      const gp = giraffeParts();
      [
        [sA + 2, 18.5, 0.5],
        [sA + 34, 20, -0.2],
        [sA + 52, -14, Math.PI - 0.4],
      ].forEach(([s, d, extra], i) => {
        const body = new THREE.Mesh(gp.body, actorMat);
        place(body, s, d, 0, roadYawOffset(d) + extra);
        body.scale.setScalar(1.25);
        const neck = new THREE.Mesh(gp.neck, actorMat);
        neck.position.set(0, 3.0, -0.9);
        body.add(neck);
        this.tripGroup.add(body);
        this.anim.push((t) => {
          neck.rotation.x = -0.1 + Math.sin(t * 1.1 + i * 2) * 0.16;
          neck.rotation.z = Math.sin(t * 0.7 + i) * 0.08;
        });
      });
    } else if (type === 'grandma') {
      frameAt(sA + 20, 21, 0, -Math.PI / 2, _m);
      addHanok(b, _m.clone(), r);
      frameAt(sA + 30, 15.5, 0, -Math.PI / 2, _m);
      addJangdok(b, _m.clone(), r);
      for (let s = sA - 10; s < sA + 60; s += 4) {
        if (s > sA + 12 && s < sA + 17) continue;
        frameAt(s + 2, 12.6, 0, Math.PI / 2, _m);
        addStoneWall(b, _m.clone(), 4.05, r);
      }
      const tg = treeGeometry('persimmon');
      [
        [sA + 8, 16],
        [sA + 34, 24],
      ].forEach(([s, d]) => {
        const t = new THREE.Mesh(tg, treeMat);
        place(t, s, d, 0, r() * 6);
        t.scale.setScalar(1.15);
        this.tripGroup.add(t);
      });
      const pp = puppyParts();
      const pup = new THREE.Mesh(pp.body, actorMat);
      place(pup, sA + 7, 10.9, 0.15, Math.PI - 0.7);
      pup.scale.setScalar(1.35);
      const tail = new THREE.Mesh(pp.tail, actorMat);
      tail.position.set(0, 0.35, 0.42);
      pup.add(tail);
      this.tripGroup.add(pup);
      this.anim.push((t) => {
        tail.rotation.y = Math.sin(t * 16) * 0.6;
        pup.position.y = pup.userData.by + Math.abs(Math.sin(t * 3)) * 0.06;
      });
      pup.userData.by = pup.position.y;
    } else {
      this.balloonArch(sA);
      frameAt(sA + 40, -22, 0, 0, _m);
      addCarousel(b, _m.clone());
      const R = 14;
      const fp = ferrisParts(R);
      const base = new THREE.Group();
      place(base, sA + 62, 34, 0, 0);
      const stand = new THREE.Mesh(fp.stand, worldMat);
      base.add(stand);
      const wheel = new THREE.Mesh(fp.wheel, worldMat);
      wheel.position.y = R + 2.2;
      base.add(wheel);
      const gond = new THREE.InstancedMesh(fp.gondola, actorMat, 10);
      gond.frustumCulled = false;
      const gcols = [0xff8a7a, 0xffd166, 0x7fd6a6, 0x6cbcf0, 0xb69cf5];
      for (let i = 0; i < 10; i++) gond.setColorAt(i, _col.set(gcols[i % 5]));
      base.add(gond);
      this.tripGroup.add(base);
      this.anim.push((t) => {
        const a0 = t * 0.12;
        wheel.rotation.z = a0;
        for (let i = 0; i < 10; i++) {
          const a = a0 + (i / 10) * Math.PI * 2;
          _m.makeTranslation(Math.cos(a) * R, R + 2.2 + Math.sin(a) * R, 0);
          gond.setMatrixAt(i, _m);
        }
        gond.instanceMatrix.needsUpdate = true;
      });
    }
    if (b.pos.length) this.tripGroup.add(new THREE.Mesh(b.build(), worldMat));
  }

  /* ---------- 청크 스케줄러 ---------- */

  wantedIndices(sCar) {
    const first = Math.floor(sCar / W.chunkLen) - W.chunksBehind;
    const out = [];
    for (let i = first; i < first + W.chunksAlive; i++) out.push(i);
    return out;
  }

  slotOf(i) {
    return ((i % W.chunksAlive) + W.chunksAlive) % W.chunksAlive;
  }

  /** 프레임 예산 안에서 청크를 조금씩 만든다 */
  pump(sCar, budgetMs) {
    if (!this.builder) return;
    const t0 = performance.now();
    while (performance.now() - t0 < budgetMs) {
      if (!this.job) {
        const need = this.wantedIndices(sCar).find((i) => this.slots[this.slotOf(i)].index !== i);
        if (need == null) return;
        this.job = { index: need, gen: this.builder.build(need) };
      }
      const step = this.job.gen.next();
      if (step.done) {
        this.install(this.slotOf(this.job.index), this.job.index, step.value);
        this.job = null;
      }
    }
  }

  install(k, index, res) {
    const slot = this.slots[k];
    if (slot.mesh) {
      this.scene.remove(slot.mesh);
      slot.mesh.geometry.dispose();
    }
    if (slot.water) {
      this.scene.remove(slot.water);
      slot.water.geometry.dispose();
      slot.water = null;
    }
    slot.mesh = new THREE.Mesh(res.geometry, worldMat);
    this.scene.add(slot.mesh);
    if (res.water) {
      slot.water = new THREE.Mesh(res.water, waterMat);
      this.scene.add(slot.water);
    }
    slot.index = index;
    slot.trees = res.trees;
    this.rebuildTrees();
  }

  /** 모든 청크의 나무를 종류별로 빽빽하게 채우고 count를 맞춘다 (빈 인스턴스에 정점 비용을 쓰지 않음) */
  rebuildTrees() {
    const cap = W.chunksAlive * W.treesPerChunk;
    const counts = { pine: 0, round: 0, blossom: 0, persimmon: 0 };
    let sh = 0;
    for (const slot of this.slots) {
      for (const t of slot.trees) {
        if (!t.kind || counts[t.kind] >= cap) continue;
        const idx = counts[t.kind]++;
        _q.setFromAxisAngle(UP, t.rot);
        _v.set(t.x, t.y, t.z);
        _s.setScalar(t.scale);
        _m.compose(_v, _q, _s);
        const im = this.treeMeshes[t.kind];
        im.setMatrixAt(idx, _m);
        im.setColorAt(idx, _col.setRGB(t.tint, t.tint, t.tint * 0.98));
        _v.y += 0.05;
        _s.set(3.6 * t.scale, 1, 3.6 * t.scale);
        _m.compose(_v, _q.identity(), _s);
        this.treeShadows.setMatrixAt(sh++, _m);
      }
    }
    for (const kind of TREE_KINDS) {
      const im = this.treeMeshes[kind];
      im.count = counts[kind];
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
    this.treeShadows.count = sh;
    this.treeShadows.instanceMatrix.needsUpdate = true;
  }

  /** 즉시 만들기 (여행 시작·순간이동): 가까운 n개는 동기, 나머지는 pump가 이어서 */
  reset(sCar) {
    if (!this.builder) return;
    this.job = null;
    for (const slot of this.slots) slot.index = slot.index === -1 ? -1 : slot.index - 1e6;
    const want = this.wantedIndices(sCar);
    for (let n = 0; n < W.syncChunks && n < want.length; n++) {
      const i = want[n];
      const gen = this.builder.build(i);
      let step = gen.next();
      while (!step.done) step = gen.next();
      this.install(this.slotOf(i), i, step.value);
    }
  }

  /** 새가 앉을 곳(나무·허수아비·노점 지붕) */
  perchesBetween(s0, s1) {
    const out = [];
    for (const slot of this.slots) {
      for (const t of slot.trees) if (t.s >= s0 && t.s <= s1 && Math.abs(t.d) < 22) out.push(t);
    }
    return out;
  }

  /* ---------- 상태 조작 ---------- */

  setStopState(i, state) {
    const p = this.stopProps[i];
    if (!p) return;
    if (p.kind === 'light') this.setSignal(p, state);
    else if (state === 'green') {
      p.alarm = false;
      p.downTarget = 0;
    }
  }

  setStopPulse(i, on) {
    if (this.stopProps[i]) this.stopProps[i].pulse = on ? 1 : 0;
  }

  /** 건널목 경보 + 차단기 (down: 0 올림, 1 내림) */
  setCrossing(i, alarm, down) {
    const p = this.stopProps[i];
    if (!p || p.kind !== 'train') return;
    p.alarm = alarm;
    p.downTarget = down;
  }

  crossingDown(i) {
    const p = this.stopProps[i];
    return p && p.kind === 'train' ? p.down : 0;
  }

  /** 카메라 위치 s 기준 터널 어두움 (0~1) */
  tunnelFactor(s) {
    const u = this.trip && this.trip.unique;
    if (!u || u.type !== 'tunnel') return 0;
    const inside = Math.min(s - u.s0, u.s1 - s);
    if (inside <= -4) return 0;
    return Math.min(1, Math.max(0, (inside + 4) / CONFIG.tunnel.fade));
  }

  update(dt, camPos, sCam) {
    this.time += dt;
    const t = this.time;
    U.time.value = t;
    this.sky.position.copy(camPos);
    this.ground.position.x = camPos.x;
    this.ground.position.z = camPos.z;
    this.hills.position.set(camPos.x, 0, camPos.z);
    this.clouds.position.set(camPos.x, 0, camPos.z);
    this.clouds.rotation.y = t * 0.002;
    this.sun.position.copy(camPos).addScaledVector(this.sunDir, 100);
    this.sun.target.position.copy(camPos);

    const tk = this.tunnelFactor(sCam);
    if (Math.abs(tk - this.tunnelK) > 0.002) {
      this.tunnelK = tk;
      this.applyLight();
    }

    for (const p of this.stopProps) {
      const k = p.pulse ? 0.5 + 0.5 * Math.sin(t * 5.5) : 0;
      p.stop.material.emissive.setRGB(k * 0.9, k * 0.75, k * 0.25);
      if (p.kind === 'light') {
        p.glow.material.opacity = 0.75 + 0.15 * Math.sin(t * 3.1);
      } else {
        const sp = dt / CONFIG.train.barrierTime;
        p.down += Math.max(-sp, Math.min(sp, p.downTarget - p.down));
        const e = p.down * p.down * (3 - 2 * p.down);
        for (const a of p.arms) a.rotation.z = -1.35 * (1 - e);
        const ph = Math.floor(t * 2.6) % 2;
        for (const lamps of p.posts) {
          lamps[0].color.set(p.alarm && ph === 0 ? 0xff4a4a : 0x5a3a40);
          lamps[1].color.set(p.alarm && ph === 1 ? 0xff4a4a : 0x5a3a40);
        }
      }
    }

    if (this.wash) {
      const w = this.wash;
      w.spin += dt * 7;
      w.brushes.forEach((br, i) => {
        roadPoint(br.s, br.d, br.horiz ? 2.75 : 1.55, _v);
        _q.setFromAxisAngle(UP, roadYaw(br.s));
        if (br.horiz) {
          _q2.setFromAxisAngle(AX_Z, Math.PI / 2);
          _q.multiply(_q2);
          _q2.setFromAxisAngle(UP, w.spin);
          _q.multiply(_q2);
          _s.set(1, 2.6, 1);
        } else {
          _q2.setFromAxisAngle(UP, w.spin * (i % 2 ? 1 : -1));
          _q.multiply(_q2);
          _s.set(1, 1, 1);
        }
        _m.compose(_v, _q, _s);
        w.im.setMatrixAt(i, _m);
      });
      w.im.instanceMatrix.needsUpdate = true;
    }
    for (const fn of this.anim) fn(t);
  }
}

/** 도로 오른쪽(d>0) 소품이 도로를 바라보게 */
function roadYawOffset(d) {
  return d > 0 ? Math.PI / 2 : -Math.PI / 2;
}
