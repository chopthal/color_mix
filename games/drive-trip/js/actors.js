/**
 * 움직이는 친구들: 경운기 · 횡단보도 동물 · 반대편 차 · 새/갈매기 · 기차 · 돌고래/물고기 · 파티클
 * 모두 한 번 만들어 여행마다 재사용한다 (여행별 dispose 없음).
 */
import * as THREE from '../vendor/three.module.min.js';
import { CONFIG } from './config.js';
import { roadPoint, roadYaw, advance } from './road.js';
import { makeBlob, softDotTexture } from './geo.js';
import { actorMat } from './materials.js';
import {
  tractorParts,
  animalGeometry,
  carGeometry,
  birdParts,
  trainGeometry,
  dolphinGeometry,
  fishGeometry,
} from './models.js';

const TR = CONFIG.tractor;
const CR = CONFIG.crossing;
const ON = CONFIG.oncoming;
const _v = new THREE.Vector3();
const BIRD_SCALE = 2.0;

function ease(t) {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
}

function place(obj, s, d, y, extraYaw) {
  roadPoint(s, d, y, obj.position);
  obj.rotation.set(0, roadYaw(s) + extraYaw, 0);
}

/* ---------- 경운기 ---------- */

export class Tractor {
  constructor(scene, sound) {
    this.sound = sound;
    const parts = tractorParts();
    this.group = new THREE.Group();
    this.body = new THREE.Mesh(parts.body, actorMat);
    this.group.add(this.body);
    this.arm = new THREE.Mesh(parts.arm, actorMat);
    this.arm.position.set(0.36, 1.45, -0.22);
    this.arm.rotation.z = -2.6;
    this.body.add(this.arm);
    this.blinkMat = new THREE.MeshLambertMaterial({ color: 0xffa040, emissive: 0x000000 });
    this.blinker = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), this.blinkMat);
    this.blinker.position.set(0.74, 0.7, 1.62);
    this.body.add(this.blinker);
    const front = this.blinker.clone();
    front.position.set(0.55, 1.15, -1.95);
    this.body.add(front);
    this.group.add(makeBlob(2.4, 4.4));
    this.group.visible = false;
    scene.add(this.group);

    this.puffs = [];
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.22, 0),
        new THREE.MeshLambertMaterial({ color: 0xf4f6fa, transparent: true, opacity: 0, depthWrite: false })
      );
      m.visible = false;
      m.userData.life = 0;
      scene.add(m);
      this.puffs.push(m);
    }
    this.reset();
  }

  reset() {
    this.state = 'off';
    this.s = 0;
    this.d = 0;
    this.v = 0;
    this.t = 0;
    this.blinkOn = false;
    this.blinkT = 0;
    this.yieldT = 0;
    this.d0 = 0;
    this.v0 = 0;
    this.waveT = -1;
    this.thanks = false;
    this.puffT = 0;
    this.group.visible = false;
    this.blinkMat.emissive.setRGB(0, 0, 0);
    this.arm.rotation.z = -2.6;
    for (const p of this.puffs) {
      p.visible = false;
      p.userData.life = 0;
    }
  }

  spawn(s, d, cargo) {
    this.reset();
    this.body.geometry = tractorParts(cargo).body;
    this.state = 'driving';
    this.s = s;
    this.d = d;
    this.v = TR.speed;
    this.group.visible = true;
  }

  get active() {
    return this.state === 'driving' || this.state === 'yielding' || this.state === 'parked';
  }

  /** 비켜 주기 시작 (thanks = 경적에 대한 응답이면 true) */
  startYield(thanks) {
    if (this.state !== 'driving') return;
    this.state = 'yielding';
    this.thanks = thanks;
    this.yieldT = 0;
    this.d0 = this.d;
    this.v0 = this.v;
  }

  /** stopS: 앞범퍼가 멈춰야 할 s (빨간불), 앞 차와의 간격 */
  update(dt, carS, stopS, onParked) {
    if (!this.active) return;
    this.t += dt;
    if (this.state === 'driving') {
      let vt = TR.speed;
      const dist = stopS - (this.s + 2.0);
      if (dist < 30) vt = Math.min(vt, Math.sqrt(2 * 1.2 * Math.max(0, dist)));
      this.v += (vt - this.v) * Math.min(1, dt * 3);
      this.s += advance(this.s, this.v, dt);
    } else if (this.state === 'yielding') {
      this.yieldT += dt;
      const k = ease(this.yieldT / TR.yieldTime);
      this.d = this.d0 + (CONFIG.road.shoulderD - this.d0) * k;
      this.v = this.v0 * (1 - k);
      this.s += advance(this.s, this.v, dt);
      if (this.yieldT >= TR.yieldTime) {
        this.state = 'parked';
        this.v = 0;
        this.waveT = -TR.waveDelay;
        if (onParked) onParked(this.thanks);
      }
    }

    // 깜빡이 (비키는 중·정차 중, 우리 차가 지나갈 때까지)
    if (this.state !== 'driving' && carS < this.s + 4) {
      this.blinkT += dt;
      const on = Math.floor(this.blinkT * TR.blinkHz * 2) % 2 === 0;
      if (on !== this.blinkOn) {
        this.blinkOn = on;
        if (this.sound) this.sound.tick(on);
      }
      this.blinkMat.emissive.setRGB(on ? 1 : 0, on ? 0.55 : 0, 0);
    } else {
      this.blinkMat.emissive.setRGB(0, 0, 0);
    }

    // 손 흔들기
    if (this.state === 'parked' && this.waveT < 3.2) {
      this.waveT += dt;
      if (this.waveT > 0) this.arm.rotation.z = -2.6 + Math.sin(this.waveT * 9) * 0.45;
    } else {
      this.arm.rotation.z += (-2.6 - this.arm.rotation.z) * Math.min(1, dt * 6);
    }

    const latYaw = this.state === 'yielding' ? -0.28 * Math.sin(Math.PI * Math.min(1, this.yieldT / TR.yieldTime)) : 0;
    place(this.group, this.s, this.d, 0, latYaw);
    this.body.position.y = this.v > 0.1 ? Math.abs(Math.sin(this.t * 22)) * 0.025 : Math.abs(Math.sin(this.t * 14)) * 0.01;

    this.updatePuffs(dt);
    if (carS > this.s + TR.despawnBehind) {
      this.state = 'done';
      this.group.visible = false;
    }
  }

  updatePuffs(dt) {
    this.puffT += dt;
    if (this.active && this.puffT > (this.v > 0.1 ? 0.45 : 0.9)) {
      this.puffT = 0;
      const p = this.puffs.find((q) => q.userData.life <= 0);
      if (p) {
        _v.set(0.32, 2.15, -1.6);
        this.body.localToWorld(_v);
        p.position.copy(_v);
        p.userData.life = 1.3;
        p.scale.setScalar(0.6);
        p.visible = true;
      }
    }
    for (const p of this.puffs) {
      if (p.userData.life <= 0) continue;
      p.userData.life -= dt;
      const k = 1 - p.userData.life / 1.3;
      p.position.y += dt * 0.7;
      p.scale.setScalar(0.6 + k * 1.4);
      p.material.opacity = 0.75 * (1 - k);
      if (p.userData.life <= 0) p.visible = false;
    }
  }

  hide() {
    this.reset();
    this.state = 'done';
  }
}

/* ---------- 횡단보도 동물 친구 ---------- */

export class AnimalCrew {
  constructor(scene, sound) {
    this.sound = sound;
    this.animals = ['duck', 'rabbit', 'bear'].map((kind, i) => {
      const g = new THREE.Group();
      const mesh = new THREE.Mesh(animalGeometry(kind), actorMat);
      g.add(mesh);
      g.add(makeBlob(1.3, 1.3));
      g.scale.setScalar(CR.scale);
      g.visible = false;
      scene.add(g);
      return { kind, group: g, mesh, i, p: 0, d: CR.fromD, arrived: false, hop: 0 };
    });
    this.sStop = 0;
    this.state = 'off';
    this.t = 0;
  }

  /** walk: 인도(연석 0.15m)가 있는 구간인지 */
  placeWaiting(sStop, walk) {
    this.sStop = sStop;
    this.walk = walk;
    this.state = 'waiting';
    this.t = 0;
    for (const a of this.animals) {
      a.d = CR.fromD - a.i * 0.35;
      a.p = 0;
      a.arrived = false;
      a.hop = 0;
      a.group.visible = true;
      this.pose(a, 0);
    }
  }

  laneS(a) {
    return this.sStop + CR.crossOffset + (a.i - 1) * 0.95;
  }

  startCrossing() {
    if (this.state !== 'waiting') return;
    this.state = 'crossing';
    this.t = 0;
  }

  hide() {
    this.state = 'off';
    for (const a of this.animals) a.group.visible = false;
  }

  /** 반환: 마지막 친구가 인도에 도착했는지 */
  update(dt) {
    if (this.state === 'off') return false;
    this.t += dt;
    let allArrived = true;
    for (const a of this.animals) {
      if (this.state === 'crossing' && !a.arrived) {
        const start = a.i * CR.stagger;
        if (this.t > start) {
          const prevHop = Math.floor(a.hop);
          a.d = Math.min(CR.toD, a.d + CR.speed * dt);
          a.hop += dt * 2.7;
          if (Math.floor(a.hop) !== prevHop && this.sound) this.sound.step(a.i);
          if (a.d >= CR.toD) {
            a.arrived = true;
            a.hop = 0;
          }
        }
      }
      if (!a.arrived) allArrived = false;
      this.pose(a, dt);
    }
    if (this.state === 'crossing' && allArrived) {
      this.state = 'arrived';
      return true;
    }
    return false;
  }

  pose(a, dt) {
    const moving = this.state === 'crossing' && !a.arrived && this.t > a.i * CR.stagger;
    let y = 0.15;
    let sq = 1;
    if (moving) {
      const ph = (a.hop % 1) * Math.PI;
      const h = Math.sin(ph);
      y += h * 0.32;
      sq = 1 + (h - 0.5) * 0.12;
    } else {
      const br = Math.sin(this.t * 3 + a.i * 1.3);
      sq = 1 + br * 0.025;
      if (this.state === 'arrived') y += Math.max(0, Math.sin(this.t * 4 + a.i)) * 0.12;
    }
    const onWalk = this.walk && (a.d < -4.3 || a.d > 9.8);
    if (!onWalk) y -= 0.13;
    // 오른쪽(+d)을 보고 걷는다
    place(a.group, this.laneS(a), a.d, y, -Math.PI / 2);
    a.mesh.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    a.group.children[1].position.y = ((onWalk ? 0.18 : 0.05) - y) / CR.scale;
  }

  /** 아직 건너지 않은 친구들의 가운데 (없으면 false) */
  focus(out) {
    if (this.state !== 'waiting' && this.state !== 'crossing') return false;
    let n = 0;
    out.set(0, 0, 0);
    for (const a of this.animals) {
      if (a.arrived) continue;
      out.add(a.group.position);
      n++;
    }
    if (!n) return false;
    out.multiplyScalar(1 / n);
    return true;
  }
}

/* ---------- 반대편 차 ---------- */

export class Oncoming {
  constructor(scene) {
    this.geos = [0x8fcdf0, 0x9fdc8f, 0xffd166, 0xc2a8f5].map((c) => carGeometry(c));
    this.group = new THREE.Group();
    this.mesh = new THREE.Mesh(this.geos[0], actorMat);
    this.group.add(this.mesh);
    this.group.add(makeBlob(2.6, 5.0));
    this.group.visible = false;
    scene.add(this.group);
    this.variant = 0;
    this.reset(0);
  }

  reset(now) {
    this.active = false;
    this.group.visible = false;
    this.s = 0;
    this.v = 0;
    this.nextAt = now + 4;
  }

  /** blockers: 빨간불(또는 건너는 중)인 신호 정지선 s 목록 */
  update(dt, now, carS, blockers, allowSpawn) {
    if (!this.active) {
      if (allowSpawn && now >= this.nextAt) {
        this.active = true;
        this.s = carS + ON.spawnAhead;
        this.v = ON.speed;
        this.variant = (this.variant + 1) % this.geos.length;
        this.mesh.geometry = this.geos[this.variant];
        this.group.visible = true;
      }
      return;
    }
    let target = -Infinity;
    for (const sStop of blockers) {
      const t = sStop + ON.stopBeyond + 2.0;
      if (this.s > t - 0.5 && t > target) target = t;
    }
    let vt = ON.speed;
    if (target > -Infinity) vt = Math.min(vt, Math.sqrt(2 * 2.2 * Math.max(0, this.s - target)));
    this.v += (vt - this.v) * Math.min(1, dt * 2.5);
    if (vt === 0 || this.s - target < 0.05) this.v = Math.min(this.v, vt);
    this.s -= advance(this.s, this.v, dt);
    if (target > -Infinity) this.s = Math.max(this.s, target);
    place(this.group, this.s, CONFIG.road.oncomingD, 0, Math.PI);
    if (this.s < carS - 25) {
      this.active = false;
      this.group.visible = false;
      this.nextAt = now + ON.minInterval + Math.random() * (ON.maxInterval - ON.minInterval);
    }
  }
}

/* ---------- 새 ---------- */

export class Birds {
  constructor(scene) {
    const colors = [0x8fcdf0, 0xffd166, 0xff9fb8];
    this.birds = colors.map((c) => {
      const parts = birdParts(c);
      const g = new THREE.Group();
      g.add(new THREE.Mesh(parts.body, actorMat));
      const wl = new THREE.Mesh(parts.wing, actorMat);
      const wr = new THREE.Mesh(parts.wing, actorMat);
      wr.rotation.y = Math.PI;
      const wlp = new THREE.Group();
      const wrp = new THREE.Group();
      wlp.add(wl);
      wrp.add(wr);
      wlp.position.x = 0.1;
      wrp.position.x = -0.1;
      g.add(wlp, wrp);
      g.visible = false;
      scene.add(g);
      return { g, wl: wlp, wr: wrp, life: 0, vel: new THREE.Vector3(), ph: Math.random() * 6 };
    });
  }

  /** 길가 나무에서 2~3마리가 도로 위 앞쪽 하늘로 날아오른다 */
  launch(tree) {
    const n = 2 + (Math.random() < 0.5 ? 1 : 0);
    const yaw = roadYaw(tree.s);
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const toCenter = -(Math.sign(tree.d) || 1);
    const rx = Math.cos(yaw) * toCenter;
    const rz = -Math.sin(yaw) * toCenter;
    for (let i = 0; i < n; i++) {
      const b = this.birds[i];
      b.life = 3.4;
      b.g.visible = true;
      b.g.position.set(tree.x + (Math.random() - 0.5) * 1.5, tree.y + 3.6 * tree.scale, tree.z + (Math.random() - 0.5) * 1.5);
      const fw = 2.2 + Math.random() * 1.2;
      const side = 1.4 + Math.random() * 1.2;
      b.vel.set(fx * fw + rx * side, 2.4 + Math.random() * 0.9, fz * fw + rz * side);
      b.g.rotation.y = Math.atan2(-b.vel.x, -b.vel.z);
      b.g.scale.setScalar(BIRD_SCALE);
      b.ph = Math.random() * 6;
    }
  }

  update(dt) {
    for (const b of this.birds) {
      if (b.life <= 0) continue;
      b.life -= dt;
      b.ph += dt * 24;
      b.g.position.addScaledVector(b.vel, dt);
      b.vel.y += dt * 0.6;
      const f = Math.sin(b.ph) * 0.9;
      b.wl.rotation.z = f;
      b.wr.rotation.z = -f;
      b.g.position.y += Math.sin(b.ph * 0.25) * dt * 0.6;
      if (b.life < 0.6) b.g.scale.setScalar(BIRD_SCALE * Math.max(0.01, b.life / 0.6));
      if (b.life <= 0) b.g.visible = false;
    }
  }

  hideAll() {
    for (const b of this.birds) {
      b.life = 0;
      b.g.visible = false;
    }
  }
}

/* ---------- 파티클 (Points 1개: 거품·물줄기·물보라) ---------- */

export class Particles {
  constructor(scene, count = 520) {
    this.n = count;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) pos[i * 3 + 1] = -1000;
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.points = new THREE.Points(
      this.geo,
      new THREE.PointsMaterial({
        size: 0.42,
        map: softDotTexture(),
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        sizeAttenuation: true,
      })
    );
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.vel = new Float32Array(count * 3);
    this.life = new Float32Array(count);
    this.grav = new Float32Array(count);
    this.cursor = 0;
    this.alive = 0;
    this.color = new THREE.Color();
  }

  /** at 주변에 n개. opt: spread, vel(Vector3), jitter, color(hex | hex[]), life, gravity */
  emit(at, n, opt) {
    const pos = this.geo.attributes.position.array;
    const col = this.geo.attributes.color.array;
    const colors = Array.isArray(opt.color) ? opt.color : [opt.color];
    for (let k = 0; k < n; k++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.n;
      const sp = opt.spread || 0.5;
      pos[i * 3] = at.x + (Math.random() - 0.5) * sp;
      pos[i * 3 + 1] = at.y + (Math.random() - 0.5) * sp;
      pos[i * 3 + 2] = at.z + (Math.random() - 0.5) * sp;
      const j = opt.jitter || 1;
      this.vel[i * 3] = (opt.vel ? opt.vel.x : 0) + (Math.random() - 0.5) * j;
      this.vel[i * 3 + 1] = (opt.vel ? opt.vel.y : 0) + (Math.random() - 0.5) * j;
      this.vel[i * 3 + 2] = (opt.vel ? opt.vel.z : 0) + (Math.random() - 0.5) * j;
      this.life[i] = (opt.life || 1) * (0.7 + Math.random() * 0.5);
      this.grav[i] = opt.gravity == null ? 9 : opt.gravity;
      this.color.set(colors[k % colors.length]);
      col[i * 3] = this.color.r;
      col[i * 3 + 1] = this.color.g;
      col[i * 3 + 2] = this.color.b;
    }
    this.alive = this.n;
    this.geo.attributes.color.needsUpdate = true;
  }

  update(dt) {
    if (!this.alive) return;
    const pos = this.geo.attributes.position.array;
    let any = 0;
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        pos[i * 3 + 1] = -1000;
        continue;
      }
      any++;
      this.vel[i * 3 + 1] -= this.grav[i] * dt;
      pos[i * 3] += this.vel[i * 3] * dt;
      pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
    }
    this.alive = any;
    this.geo.attributes.position.needsUpdate = true;
  }

  clear() {
    this.life.fill(0);
    const pos = this.geo.attributes.position.array;
    for (let i = 0; i < this.n; i++) pos[i * 3 + 1] = -1000;
    this.geo.attributes.position.needsUpdate = true;
    this.alive = 0;
  }
}

/* ---------- 기차 ---------- */

export class Train {
  constructor(scene, sound) {
    const T = CONFIG.train;
    this.sound = sound;
    this.mesh = new THREE.Mesh(trainGeometry(T.cars, T.carLen), actorMat);
    this.mesh.visible = false;
    this.total = T.cars * (T.carLen + 0.8);
    scene.add(this.mesh);
    this.reset();
  }

  reset() {
    this.active = false;
    this.mesh.visible = false;
    this.u = 0;
    this.chug = 0;
    this.passed = false;
  }

  start(trackS) {
    this.trackS = trackS;
    this.u = CONFIG.train.startU;
    this.active = true;
    this.passed = false;
    this.mesh.visible = true;
    if (this.sound) this.sound.whistle();
  }

  /** 반환: 꼬리가 도로를 지나간 순간 true (한 번) */
  update(dt) {
    if (!this.active) return false;
    this.u += CONFIG.train.speed * dt;
    roadPoint(this.trackS, this.u, 0.2, this.mesh.position);
    this.mesh.rotation.set(0, roadYaw(this.trackS) - Math.PI / 2, 0);
    this.mesh.position.y = 0.2 + Math.abs(Math.sin(this.u * 1.4)) * 0.03;
    this.chug += dt;
    if (this.chug > 0.32) {
      this.chug = 0;
      if (this.sound) this.sound.chug();
    }
    let justPassed = false;
    if (!this.passed && this.u - this.total > CONFIG.road.edgeR + 2) {
      this.passed = true;
      justPassed = true;
    }
    if (this.u - this.total > 140) {
      this.active = false;
      this.mesh.visible = false;
    }
    return justPassed;
  }
}

/* ---------- 돌고래 · 물고기 점프 ---------- */

export class Jumpers {
  constructor(scene, particles, sound) {
    this.particles = particles;
    this.sound = sound;
    const mk = (geo, kind) => {
      const m = new THREE.Mesh(geo, actorMat);
      m.visible = false;
      scene.add(m);
      return { m, kind, active: false, t: 0, dur: 1, p0: new THREE.Vector3(), dir: new THREE.Vector3(), len: 0, h: 0, yaw: 0 };
    };
    this.list = [mk(dolphinGeometry(), 'dolphin'), mk(dolphinGeometry(), 'dolphin'), mk(fishGeometry(), 'fish'), mk(fishGeometry(), 'fish')];
  }

  /** 수면 위 p0에서 dir(수평 단위벡터) 방향으로 점프 */
  jump(kind, p0, dir) {
    const j = this.list.find((x) => x.kind === kind && !x.active);
    if (!j) return false;
    j.active = true;
    j.t = 0;
    const dolphin = kind === 'dolphin';
    j.dur = dolphin ? 1.7 : 1.0;
    j.len = dolphin ? 11 : 3.6;
    j.h = dolphin ? 4.4 : 1.8;
    j.p0.copy(p0);
    j.dir.copy(dir);
    j.yaw = Math.atan2(-dir.x, -dir.z);
    j.m.visible = true;
    j.m.scale.setScalar(dolphin ? 1.5 : 1.8);
    this.splash(j.p0, dolphin);
    return true;
  }

  splash(at, big) {
    this.particles.emit(at, big ? 26 : 12, {
      spread: big ? 1.4 : 0.5,
      vel: new THREE.Vector3(0, big ? 5 : 3.5, 0),
      jitter: big ? 3.5 : 2,
      color: [0xffffff, 0xd8f1ff],
      life: 0.9,
      gravity: 9,
    });
    if (this.sound) this.sound.splash(big);
  }

  update(dt) {
    for (const j of this.list) {
      if (!j.active) continue;
      j.t += dt;
      const k = Math.min(1, j.t / j.dur);
      const y = 4 * j.h * k * (1 - k);
      j.m.position.copy(j.p0).addScaledVector(j.dir, j.len * k);
      j.m.position.y = j.p0.y + y - 0.6 * (k < 0.08 || k > 0.92 ? 1 : 0);
      const vy = 4 * j.h * (1 - 2 * k);
      j.m.rotation.set(Math.atan2(vy, j.len), j.yaw, 0, 'YXZ');
      if (k >= 1) {
        j.active = false;
        j.m.visible = false;
        _v.copy(j.p0).addScaledVector(j.dir, j.len);
        this.splash(_v, j.kind === 'dolphin');
      }
    }
  }

  get busy() {
    return this.list.some((j) => j.active);
  }

  hideAll() {
    for (const j of this.list) {
      j.active = false;
      j.m.visible = false;
    }
  }
}

/* ---------- 갈매기 (바다 위를 빙글빙글) ---------- */

export class Gulls {
  constructor(scene) {
    this.items = [0, 1, 2].map((i) => {
      const parts = birdParts(0xffffff);
      const g = new THREE.Group();
      g.add(new THREE.Mesh(parts.body, actorMat));
      const wl = new THREE.Group();
      const wr = new THREE.Group();
      const a = new THREE.Mesh(parts.wing, actorMat);
      const b = new THREE.Mesh(parts.wing, actorMat);
      b.rotation.y = Math.PI;
      wl.add(a);
      wr.add(b);
      wl.position.x = 0.1;
      wr.position.x = -0.1;
      g.add(wl, wr);
      g.scale.setScalar(2.4);
      g.visible = false;
      scene.add(g);
      return { g, wl, wr, ph: i * 2.1 };
    });
    this.center = null;
    this.t = 0;
  }

  /** center(Vector3) 위를 돈다. null이면 숨김 */
  setCenter(center) {
    this.center = center;
    for (const it of this.items) it.g.visible = !!center;
  }

  update(dt) {
    if (!this.center) return;
    this.t += dt;
    for (const it of this.items) {
      const a = this.t * 0.45 + it.ph;
      const rad = 9 + it.ph * 2;
      it.g.position.set(this.center.x + Math.cos(a) * rad, this.center.y + Math.sin(this.t * 0.8 + it.ph) * 1.2, this.center.z + Math.sin(a) * rad);
      it.g.rotation.set(0, -a, Math.sin(a) * 0.2 + 0.25);
      const f = Math.sin(this.t * 5 + it.ph) * 0.55;
      it.wl.rotation.z = f;
      it.wr.rotation.z = -f;
    }
  }
}
