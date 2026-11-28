/**
 * 날씨 파티클(비·눈, Points 1개씩) + 앞 유리 오버레이(2D 캔버스: 빗방울·거품·와이퍼).
 */
import * as THREE from '../vendor/three.module.min.js';
import { CONFIG } from './config.js';
import { streakTexture, softDotTexture } from './geo.js';

const BOX = { x: 30, y: 22, z: 34 };

function makePoints(n, tex, size, opacity) {
  const pos = new Float32Array(n * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size, map: tex, transparent: true, opacity, depthWrite: false, sizeAttenuation: true, color: 0xffffff })
  );
  pts.frustumCulled = false;
  pts.visible = false;
  return pts;
}

export class Precip {
  constructor(scene) {
    this.rain = makePoints(900, streakTexture(), 0.9, 0.55);
    this.rain.material.color.set(0xdde9f4);
    this.snow = makePoints(700, softDotTexture(), 0.3, 0.95);
    scene.add(this.rain, this.snow);
    this.kind = null;
    this.seeded = false;
    this.t = 0;
  }

  set(kind) {
    this.kind = kind === 'rain' || kind === 'snow' ? kind : null;
    this.rain.visible = this.kind === 'rain';
    this.snow.visible = this.kind === 'snow';
    this.seeded = false;
  }

  update(dt, cam, dim) {
    if (!this.kind) return;
    this.t += dt;
    const pts = this.kind === 'rain' ? this.rain : this.snow;
    const arr = pts.geometry.attributes.position.array;
    const n = arr.length / 3;
    if (!this.seeded) {
      for (let i = 0; i < n; i++) {
        arr[i * 3] = cam.x + (Math.random() - 0.5) * 2 * BOX.x;
        arr[i * 3 + 1] = cam.y - 4 + Math.random() * BOX.y;
        arr[i * 3 + 2] = cam.z + (Math.random() - 0.5) * 2 * BOX.z;
      }
      this.seeded = true;
    }
    const fall = this.kind === 'rain' ? 17 : 1.6;
    for (let i = 0; i < n; i++) {
      let x = arr[i * 3];
      let y = arr[i * 3 + 1] - fall * dt;
      let z = arr[i * 3 + 2];
      if (this.kind === 'snow') {
        x += Math.sin(this.t * 0.9 + i) * 0.4 * dt;
        z += Math.cos(this.t * 0.7 + i * 1.3) * 0.4 * dt;
      }
      if (y < cam.y - 4) y += BOX.y;
      if (x - cam.x > BOX.x) x -= 2 * BOX.x;
      else if (cam.x - x > BOX.x) x += 2 * BOX.x;
      if (z - cam.z > BOX.z) z -= 2 * BOX.z;
      else if (cam.z - z > BOX.z) z += 2 * BOX.z;
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    pts.geometry.attributes.position.needsUpdate = true;
    pts.material.opacity = (this.kind === 'rain' ? 0.55 : 0.95) * dim;
  }
}

/* ---------- 앞 유리 ---------- */

function sprite(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  return c;
}

export class Windshield {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 0.5;
    this.drops = [];
    this.foam = [];
    this.raining = false;
    this.auto = false;
    this.autoT = 0;
    this.wipeT = -1;
    this.angle = 0;
    this.prevAngle = 0;
    this.dirty = true;
    this.dropImg = sprite(64, (x, n) => {
      const g = x.createRadialGradient(n * 0.42, n * 0.38, n * 0.04, n / 2, n / 2, n / 2);
      g.addColorStop(0, 'rgba(255,255,255,0.85)');
      g.addColorStop(0.25, 'rgba(225,240,255,0.25)');
      g.addColorStop(0.8, 'rgba(160,190,220,0.22)');
      g.addColorStop(1, 'rgba(120,150,190,0)');
      x.fillStyle = g;
      x.beginPath();
      x.arc(n / 2, n / 2, n / 2, 0, Math.PI * 2);
      x.fill();
    });
    this.foamImgs = ['255,255,255', '255,214,226', '214,238,255'].map((rgb) =>
      sprite(96, (x, n) => {
        const blobs = [
          [0.5, 0.5, 0.3],
          [0.3, 0.42, 0.2],
          [0.7, 0.4, 0.22],
          [0.42, 0.7, 0.2],
          [0.66, 0.68, 0.18],
        ];
        for (const [bx, by, br] of blobs) {
          const g = x.createRadialGradient(bx * n - br * n * 0.3, by * n - br * n * 0.3, 1, bx * n, by * n, br * n);
          g.addColorStop(0, 'rgba(255,255,255,1)');
          g.addColorStop(0.7, 'rgba(' + rgb + ',0.95)');
          g.addColorStop(1, 'rgba(' + rgb + ',0.55)');
          x.fillStyle = g;
          x.beginPath();
          x.arc(bx * n, by * n, br * n, 0, Math.PI * 2);
          x.fill();
        }
      })
    );
    this.resize();
  }

  resize() {
    this.w = Math.max(1, Math.round(window.innerWidth * this.scale));
    this.h = Math.max(1, Math.round(window.innerHeight * this.scale));
    this.cv.width = this.w;
    this.cv.height = this.h;
    this.dirty = true;
  }

  pivots() {
    const len = Math.max(this.w * 0.62, this.h * 1.05);
    return [
      { x: this.w * 0.2, y: this.h * 1.04, len },
      { x: this.w * 0.62, y: this.h * 1.04, len },
    ];
  }

  setRain(on) {
    this.raining = on;
  }

  setAuto(on) {
    this.auto = on;
    this.autoT = 0;
    if (on) this.wipe();
  }

  wipe() {
    if (this.wipeT < 0) this.wipeT = 0;
  }

  addFoam(n) {
    for (let i = 0; i < n; i++) {
      if (this.foam.length > 46) break;
      this.foam.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h * 0.85,
        r: (0.035 + Math.random() * 0.05) * Math.max(this.w, this.h),
        img: Math.floor(Math.random() * 3),
        vy: 0,
        a: 0,
      });
    }
    this.dirty = true;
  }

  /** 거품을 아래로 흘려보냄 (와이퍼를 안 켰을 때 세차장 출구) */
  slideFoam() {
    for (const f of this.foam) f.vy = f.vy || 20 + Math.random() * 40;
  }

  get foamCount() {
    return this.foam.length;
  }

  clearAll() {
    this.drops = [];
    this.foam = [];
    this.wipeT = -1;
    this.auto = false;
    this.raining = false;
    this.dirty = true;
  }

  sweptBy(px, py) {
    if (this.wipeT < 0) return false;
    const a0 = Math.min(this.prevAngle, this.angle) - 0.04;
    const a1 = Math.max(this.prevAngle, this.angle) + 0.04;
    for (const p of this.pivots()) {
      const dx = px - p.x;
      const dy = p.y - py;
      const d = Math.hypot(dx, dy);
      if (d > p.len) continue;
      const a = Math.atan2(dy, dx);
      if (a >= a0 && a <= a1) return true;
    }
    return false;
  }

  update(dt, speed) {
    const W = CONFIG.wiper;
    if (this.raining) {
      const rate = 10 + speed * 0.6;
      if (Math.random() < rate * dt * 2) {
        if (this.drops.length > 110) this.drops.shift();
        this.drops.push({ x: Math.random() * this.w, y: Math.random() * this.h, r: (2.5 + Math.random() * 6) * this.scale * 2.2, vy: 0 });
      }
      this.dirty = true;
    }
    for (const d of this.drops) {
      if (d.r > 6 && Math.random() < dt * 0.4) d.vy = 18 + Math.random() * 30;
      d.y += d.vy * dt;
    }
    this.drops = this.drops.filter((d) => d.y < this.h + 20);
    for (const f of this.foam) {
      f.a = Math.min(1, f.a + dt * 3);
      if (f.vy) {
        f.vy += 120 * dt;
        f.y += f.vy * dt;
        this.dirty = true;
      }
    }
    this.foam = this.foam.filter((f) => f.y - f.r < this.h);

    if (this.auto) {
      this.autoT += dt;
      if (this.autoT > W.period) {
        this.autoT = 0;
        this.wipe();
      }
    }
    if (this.wipeT >= 0) {
      this.wipeT += dt;
      const k = this.wipeT / W.sweep;
      this.prevAngle = this.angle;
      this.angle = Math.sin(Math.min(1, k) * Math.PI) * (Math.PI * 0.62);
      this.drops = this.drops.filter((d) => !this.sweptBy(d.x, d.y));
      this.foam = this.foam.filter((f) => !this.sweptBy(f.x, f.y));
      if (k >= 1) {
        this.wipeT = -1;
        this.angle = 0;
      }
      this.dirty = true;
    }
    if (this.dirty) this.draw();
  }

  draw() {
    const x = this.ctx;
    x.clearRect(0, 0, this.w, this.h);
    for (const d of this.drops) x.drawImage(this.dropImg, d.x - d.r, d.y - d.r, d.r * 2, d.r * 2.2);
    for (const f of this.foam) {
      x.globalAlpha = f.a;
      x.drawImage(this.foamImgs[f.img], f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
    }
    x.globalAlpha = 1;
    if (this.wipeT >= 0 || this.auto) {
      const th = Math.max(4, this.h * 0.016);
      for (const p of this.pivots()) {
        const ex = p.x + Math.cos(this.angle) * p.len;
        const ey = p.y - Math.sin(this.angle) * p.len;
        x.lineCap = 'round';
        x.strokeStyle = 'rgba(61,43,31,0.9)';
        x.lineWidth = th * 1.6;
        x.beginPath();
        x.moveTo(p.x, p.y);
        x.lineTo(ex, ey);
        x.stroke();
        x.strokeStyle = 'rgba(90,100,120,0.95)';
        x.lineWidth = th;
        x.stroke();
      }
    }
    this.dirty = this.drops.length > 0 && this.raining;
  }
}
