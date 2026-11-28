/**
 * 구간 테마 소품 · 이벤트 지형 · 도착지 랜드마크 (정점색, 병합용).
 * 모든 함수는 (b: GeoBuilder, P: 부모 행렬) — 로컬 앞쪽 -Z, 오른쪽 +X, 바닥 y=0.
 */
import * as THREE from '../vendor/three.module.min.js';
import { mat, pick } from './geo.js';

const M = new THREE.Matrix4();
const H = new THREE.Matrix4();

/* ---------- 논밭 ---------- */

export function addScarecrow(b, P, r) {
  const shirt = pick(r, [0xff8a7a, 0x6cbcf0, 0x9fdc8f]);
  b.part('cyl6', mat(0, 1.1, 0, 0.14, 2.2, 0.14, 0, 0, 0, P, M), 0xa47551);
  b.part('box', mat(0, 1.62, 0, 1.9, 0.12, 0.12, 0, 0, 0, P, M), 0xa47551);
  b.part('box', mat(0, 1.42, 0, 0.8, 0.75, 0.4, 0, 0, 0, P, M), shirt);
  for (const sx of [-1, 1]) b.part('box', mat(sx * 0.62, 1.6, 0, 0.5, 0.3, 0.32, 0, 0, 0, P, M), shirt);
  b.part('sph', mat(0, 2.12, 0, 0.58, 0.56, 0.56, 0, 0, 0, P, M), 0xfff1d6);
  for (const sx of [-1, 1]) b.part('sph', mat(sx * 0.12, 2.15, -0.26, 0.08, 0.1, 0.06, 0, 0, 0, P, M), 0x3d2b1f);
  for (const sx of [-1, 1]) b.part('sph', mat(sx * 0.18, 2.03, -0.23, 0.1, 0.07, 0.05, 0, 0, 0, P, M), 0xffb3c1);
  b.part('cyl10', mat(0, 2.38, 0, 1.0, 0.06, 1.0, 0, 0, 0, P, M), 0xf6d77a);
  b.part('cyl10', mat(0, 2.5, 0, 0.5, 0.24, 0.5, 0, 0, 0, P, M), 0xf6d77a);
}

/** 비닐하우스: 길이 L이 로컬 Z축 */
export function addGreenhouse(b, P, L) {
  b.part('halfcyl', mat(0, 0, 0, 6, L, 6, 0, -Math.PI / 2, 0, P, M), 0xeef5f7);
  for (let z = -L / 2 + 1; z <= L / 2 - 1; z += 3) {
    b.part('box', mat(0, 0.06, z, 6.1, 0.12, 0.12, 0, 0, 0, P, M), 0xc8d4d8);
  }
  b.part('box', mat(0, 1.0, -L / 2 - 0.02, 1.2, 2.0, 0.06, 0, 0, 0, P, M), 0xb7cdd3);
}

/* ---------- 해안 ---------- */

export function addRock(b, P, r, s) {
  b.part('ico0', mat(0, 0, 0, s * 1.5, s, s * 1.3, r() * 6, r() * 0.5, 0, P, M), pick(r, [0xc9c6c0, 0xb9b6b2, 0xd8d3cb]), 0.08, r);
}

export function addLighthouse(b, P) {
  b.part('cyl12', mat(0, 0.5, 0, 4.4, 1.0, 4.4, 0, 0, 0, P, M), 0xe6e0d6);
  const bands = [0xffffff, 0xff7b6b, 0xffffff, 0xff7b6b, 0xffffff];
  bands.forEach((c, i) => {
    const w = 2.7 - i * 0.22;
    b.part('cyl12', mat(0, 1 + i * 1.7 + 0.85, 0, w, 1.7, w, 0, 0, 0, P, M), c);
  });
  b.part('cyl12', mat(0, 9.65, 0, 2.6, 0.3, 2.6, 0, 0, 0, P, M), 0x4b5670);
  b.setGlow(1);
  b.part('cyl12', mat(0, 10.4, 0, 1.6, 1.2, 1.6, 0, 0, 0, P, M), 0xfff2b0);
  b.setGlow(0);
  b.part('cone7', mat(0, 11.6, 0, 2.2, 1.3, 2.2, 0, 0, 0, P, M), 0xff7b6b);
  b.part('sph', mat(0, 12.35, 0, 0.35, 0.35, 0.35, 0, 0, 0, P, M), 0xffd166);
}

/* ---------- 숲 ---------- */

export function addMushroom(b, P, r) {
  const s = 0.6 + r() * 0.6;
  const cap = pick(r, [0xff6b6b, 0xff9f45, 0xffb3c1]);
  b.part('cyl6', mat(0, 0.22 * s, 0, 0.26 * s, 0.44 * s, 0.26 * s, 0, 0, 0, P, M), 0xfff4e0);
  b.part('hemi', mat(0, 0.4 * s, 0, 0.9 * s, 0.6 * s, 0.9 * s, 0, 0, 0, P, M), cap);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + r();
    b.part('sph', mat(Math.cos(a) * 0.22 * s, 0.6 * s, Math.sin(a) * 0.22 * s, 0.12 * s, 0.07 * s, 0.12 * s, 0, 0, 0, P, M), 0xffffff);
  }
}

export function addLog(b, P) {
  b.part('cyl10', mat(0, 0.3, 0, 0.6, 2.4, 0.6, 0, 0, Math.PI / 2, P, M), 0xa47551);
  for (const sx of [-1, 1]) b.part('cyl10', mat(sx * 1.21, 0.3, 0, 0.5, 0.04, 0.5, 0, 0, Math.PI / 2, P, M), 0xe8c79a);
}

/* ---------- 시골길 ---------- */

/** 돌담 (로컬 X축 길이 len) */
export function addStoneWall(b, P, len, r) {
  const n = Math.max(2, Math.round(len / 0.8));
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < n; i++) {
      const x = -len / 2 + (len * (i + 0.5 + (row ? 0.5 : 0) * 0.5)) / n;
      const s = row ? 0.55 + r() * 0.15 : 0.75 + r() * 0.2;
      b.part(
        'ico0',
        mat(x, row ? 0.95 : 0.4, 0, s * 1.4, s * 1.1, s * 1.1, r() * 3, 0, 0, P, M),
        pick(r, [0xd5cbbb, 0xc6bba8, 0xe0d8ca, 0xbfb4a3]),
        0.05,
        r
      );
    }
  }
}

export function addJangdok(b, P, r) {
  b.part('box', mat(0, 0.2, 0, 3.4, 0.4, 1.8, 0, 0, 0, P, M), 0xd8d0c2, 0.03, r);
  const xs = [-1.2, -0.4, 0.45, 1.25];
  xs.forEach((x, i) => {
    const s = 0.55 + ((i * 37) % 5) * 0.06;
    const z = i % 2 ? 0.35 : -0.25;
    b.part('sph', mat(x, 0.4 + s * 0.55, z, s * 1.05, s * 1.15, s * 1.05, 0, 0, 0, P, M), 0x8f5a3a);
    b.part('cyl10', mat(x, 0.4 + s * 1.12, z, s * 0.7, 0.08, s * 0.7, 0, 0, 0, P, M), 0x6e4229);
    b.part('sph', mat(x - s * 0.18, 0.4 + s * 0.75, z - s * 0.4, s * 0.18, s * 0.25, s * 0.08, 0, 0, 0, P, M), 0xb98364);
  });
}

/** 한옥 (앞면 +Z) */
export function addHanok(b, P, r) {
  const w = 7 + r() * 2;
  const d = 5;
  b.part('box', mat(0, 0.3, 0, w + 0.6, 0.6, d + 0.6, 0, 0, 0, P, M), 0xd8d0c2);
  b.part('box', mat(0, 1.75, 0, w, 2.3, d, 0, 0, 0, P, M), 0xfaf6ee);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) b.part('box', mat((sx * w) / 2, 1.75, (sz * d) / 2, 0.28, 2.3, 0.28, 0, 0, 0, P, M), 0x8a5a3a);
  }
  b.part('box', mat(0, 2.85, d / 2 + 0.02, w, 0.18, 0.12, 0, 0, 0, P, M), 0x8a5a3a);
  for (let x = -w / 2 + 1.3; x < w / 2 - 0.8; x += 1.6) {
    b.part('box', mat(x, 1.6, d / 2 + 0.05, 1.1, 1.3, 0.08, 0, 0, 0, P, M), 0xc89a6a);
    b.setGlow(0.7);
    b.part('box', mat(x, 1.6, d / 2 + 0.09, 0.9, 1.1, 0.06, 0, 0, 0, P, M), 0xfff4dc);
    b.setGlow(0);
  }
  b.part('prism', mat(0, 2.95, 0, w + 2.2, 1.7, d + 2.4, 0, 0, 0, P, M), 0x5f6b7e, 0.03, r);
  b.part('box', mat(0, 4.62, 0, w + 1.4, 0.22, 0.5, 0, 0, 0, P, M), 0x4c5668);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      b.part('box', mat((sx * (w + 2.0)) / 2, 3.05, (sz * (d + 2.2)) / 2, 0.7, 0.18, 0.7, 0, sz * 0.3, -sx * 0.35, P, M), 0x5f6b7e);
    }
  }
}

/* ---------- 시장 거리 ---------- */

/** 노점 (앞면 +Z = 도로 쪽), 폭 w */
export function addStall(b, P, r, colors, w = 3.6) {
  const [ca, cb] = colors;
  b.part('box', mat(0, 0.5, 0, w, 1.0, 1.4, 0, 0, 0, P, M), 0xd9a86e, 0.03, r);
  b.part('box', mat(0, 1.02, 0, w + 0.1, 0.06, 1.5, 0, 0, 0, P, M), 0xe9c08a);
  for (const sx of [-1, 1]) b.part('box', mat((sx * w) / 2, 1.5, 0.8, 0.12, 3.0, 0.12, 0, 0, 0, P, M), 0x8a5a3a);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (w * (i + 0.5)) / n;
    b.part('box', mat(x, 2.75, 0.55, w / n + 0.01, 0.08, 2.2, 0, 0.32, 0, P, M), i % 2 ? cb : ca);
    b.part('box', mat(x, 2.37, 1.6, w / n + 0.01, 0.34, 0.06, 0, 0, 0, P, M), i % 2 ? cb : ca);
  }
  const fruits = [0xff6b6b, 0xffa24d, 0xffd84a, 0x8fd36b, 0xb48af0];
  for (let k = 0; k < 3; k++) {
    const x = -w / 2 + 0.65 + k * ((w - 1.3) / 2);
    b.part('box', mat(x, 1.25, 0.15, 0.85, 0.38, 0.7, 0, 0, 0, P, M), 0xc98d58);
    const fc = pick(r, fruits);
    for (let j = 0; j < 5; j++) {
      b.part('sph', mat(x - 0.25 + (j % 3) * 0.25, 1.5 + (j > 2 ? 0.12 : 0), 0.0 + (j > 2 ? 0.15 : -0.1) + (j % 2) * 0.12, 0.26, 0.26, 0.26, 0, 0, 0, P, M), fc);
    }
  }
}

/** 상가 건물 (평지붕, 간판 띠는 그림 없는 색면) */
export function addShop(b, P, r, theme) {
  const w = 6 + r() * 2.5;
  const h = 4.2 + r() * 2.4;
  const dep = 5;
  const wall = pick(r, theme.walls);
  b.part('box', mat(0, h / 2, 0, w, h, dep, 0, 0, 0, P, M), wall);
  b.part('box', mat(0, h + 0.15, 0, w + 0.3, 0.3, dep + 0.3, 0, 0, 0, P, M), 0xe6dccd);
  b.part('box', mat(0, 3.05, dep / 2 + 0.06, w - 0.6, 0.7, 0.12, 0, 0, 0, P, M), pick(r, theme.roofs));
  b.part('box', mat(0, 1.25, dep / 2 + 0.05, w - 1.2, 2.2, 0.1, 0, 0, 0, P, M), 0xffffff);
  b.setGlow(0.8);
  b.part('box', mat(0, 1.3, dep / 2 + 0.1, w - 1.6, 1.9, 0.06, 0, 0, 0, P, M), 0xbfe6f7);
  b.setGlow(0);
  if (h > 5) {
    for (let x = -w / 2 + 1.2; x < w / 2 - 0.8; x += 1.8) {
      b.part('box', mat(x, h - 1.2, dep / 2 + 0.04, 0.9, 0.9, 0.08, 0, 0, 0, P, M), 0xffffff);
      b.setGlow(0.7);
      b.part('box', mat(x, h - 1.2, dep / 2 + 0.08, 0.7, 0.7, 0.06, 0, 0, 0, P, M), 0xa9dcf7);
      b.setGlow(0);
    }
  }
}

/** 깃발 줄: 로컬 X축으로 x0→x1, 높이 y */
export function addBunting(b, x0, x1, y, P) {
  const colors = [0xff8a7a, 0xffd166, 0x7fd6a6, 0x6cbcf0, 0xb69cf5];
  const len = x1 - x0;
  const n = Math.floor(Math.abs(len) / 0.95);
  const sag = 0.9;
  const pt = (t) => new THREE.Vector3(x0 + len * t, y - sag * 4 * t * (1 - t), 0).applyMatrix4(P);
  for (let i = 0; i < n; i++) {
    const t0 = (i + 0.1) / n;
    const t1 = (i + 0.9) / n;
    const a = pt(t0);
    const c = pt(t1);
    const tip = pt((t0 + t1) / 2);
    tip.y -= 0.7;
    const col = colors[i % colors.length];
    const f = new THREE.Vector3(0, 0, 1).transformDirection(P);
    b.tri(a, c, tip, col, f);
    b.tri(a, c, tip, col, f.clone().negate());
  }
  for (let i = 0; i < 12; i++) {
    const a = pt(i / 12);
    const c = pt((i + 1) / 12);
    const mid = a.clone().add(c).multiplyScalar(0.5);
    const dir = c.clone().sub(a);
    const l = dir.length();
    H.lookAt(a, c, new THREE.Vector3(0, 1, 0));
    H.setPosition(mid);
    b.part('box', mat(0, 0, 0, 0.04, 0.04, l, 0, 0, 0, H, M), 0xffffff);
  }
}

/* ---------- 다리 ---------- */

/** 아치 한 개: 로컬 Z(-)방향으로 길이 L, 높이 h, 위치는 P 원점(=아치 시작) */
export function addBridgeArch(b, P, L, h, color) {
  const n = 14;
  let prev = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = new THREE.Vector3(0, Math.sin(Math.PI * t) * h + 1.1, -L * t).applyMatrix4(P);
    if (prev) {
      const mid = prev.clone().add(p).multiplyScalar(0.5);
      H.lookAt(prev, p, new THREE.Vector3(0, 1, 0));
      H.setPosition(mid);
      b.part('box', mat(0, 0, 0, 0.42, 0.42, prev.distanceTo(p) + 0.12, 0, 0, 0, H, M), color);
      if (i % 2 === 0 && i < n) {
        const hy = Math.sin(Math.PI * t) * h;
        if (hy > 0.6) b.part('box', mat(0, 1.1 + hy / 2, -L * t, 0.12, hy, 0.12, 0, 0, 0, P, M), 0xffffff);
      }
    }
    prev = p;
  }
}

export function addPier(b, P) {
  b.part('cyl12', mat(0, -3.5, 0, 2.2, 6, 2.2, 0, 0, 0, P, M), 0xe2ddd3);
  b.part('box', mat(0, -0.75, 0, 3.2, 0.5, 2.6, 0, 0, 0, P, M), 0xd8d2c6);
}

/* ---------- 출발 차고 ---------- */

/** 차고 (우리 차 둘레, 앞쪽 -Z가 열림) */
export function addGarage(b, P) {
  const wall = 0xfff3e2;
  const trim = 0x7fc4f0;
  const half = 1.7;
  for (const sx of [-1, 1]) {
    b.part('box', mat(sx * (half + 0.15), 1.45, 0.6, 0.3, 2.9, 7.6, 0, 0, 0, P, M), wall);
    b.part('box', mat(sx * (half + 0.15), 0.25, 0.6, 0.34, 0.5, 7.64, 0, 0, 0, P, M), trim);
    b.part('box', mat(sx * (half + 0.35), 1.5, -3.2, 0.7, 3.0, 0.5, 0, 0, 0, P, M), trim);
  }
  b.part('box', mat(0, 3.0, 0.6, half * 2 + 1.2, 0.3, 7.8, 0, 0, 0, P, M), wall);
  b.part('box', mat(0, 3.05, -3.25, half * 2 + 1.4, 0.55, 0.55, 0, 0, 0, P, M), trim);
  b.part('cyl12', mat(0, 2.62, -3.05, 0.5, half * 2, 0.5, 0, 0, Math.PI / 2, P, M), 0xdfe8ef);
  b.part('box', mat(0, 1.45, 4.35, half * 2 + 0.6, 2.9, 0.3, 0, 0, 0, P, M), wall);
  b.part('prism', mat(0, 3.15, 0.6, half * 2 + 1.8, 1.5, 8.6, Math.PI / 2, 0, 0, P, M), 0xff9b85, 0.03, Math.random);
  // 선반 · 상자 · 타이어
  b.part('box', mat(half - 0.25, 1.55, 1.5, 0.4, 0.08, 2.6, 0, 0, 0, P, M), 0xc98d58);
  [0xffd166, 0x8fd6b5, 0xff9fb8].forEach((c, i) => b.part('box', mat(half - 0.3, 1.78, 0.6 + i * 0.8, 0.34, 0.4, 0.5, 0, 0, 0, P, M), c));
  b.part('cyl12', mat(-half + 0.35, 0.4, 2.0, 0.8, 0.3, 0.8, 0, 0, Math.PI / 2, P, M), 0x4a4f5e);
  b.setGlow(2);
  b.part('box', mat(0, 2.82, 1.0, 1.0, 0.08, 0.3, 0, 0, 0, P, M), 0xfff2c4);
  b.setGlow(0);
}

/* ---------- 터널 입구 (앞 = -Z, 구멍은 도로 단면) ---------- */

export const TUNNEL_SECTION = [
  [-5.2, 0],
  [-5.2, 3.6],
  [-3.6, 6.1],
  [-0.5, 7.4],
  [2.75, 7.8],
  [6.0, 7.4],
  [9.1, 6.1],
  [10.7, 3.6],
  [10.7, 0],
];

/** 터널 입구 벽면: P 원점 = 도로 중심선, 로컬 X = 오른쪽(d) */
export function addPortal(b, P, facing) {
  const stone = 0xe9d9bf;
  const stone2 = 0xd8c6a8;
  const zf = facing * 0.6;
  const outerL = -13;
  const outerR = 18.5;
  const top = 11;
  // 아치 둘레 돌 띠
  for (let i = 0; i < TUNNEL_SECTION.length - 1; i++) {
    const [d0, y0] = TUNNEL_SECTION[i];
    const [d1, y1] = TUNNEL_SECTION[i + 1];
    const a = new THREE.Vector3(d0, y0, zf).applyMatrix4(P);
    const c = new THREE.Vector3(d1, y1, zf).applyMatrix4(P);
    const mid = a.clone().add(c).multiplyScalar(0.5);
    H.lookAt(a, c, new THREE.Vector3(0, 1, 0).transformDirection(P));
    H.setPosition(mid);
    b.part('box', mat(0, 0, 0, 1.1, 1.1, a.distanceTo(c) + 0.6, 0, 0, 0, H, M), i % 2 ? stone : stone2);
  }
  // 벽면 (아치 바깥을 사각형까지 채움)
  const hint = new THREE.Vector3(0, 0, facing).transformDirection(P);
  const v = (d, y) => new THREE.Vector3(d, y, zf).applyMatrix4(P);
  const sec = TUNNEL_SECTION;
  for (let i = 1; i < sec.length - 2; i++) {
    const [d0, y0] = sec[i];
    const [d1, y1] = sec[i + 1];
    b.quad(v(d0, y0), v(d1, y1), v(d1, top), v(d0, top), 0xf1e4cd, hint);
  }
  b.quad(v(outerL, 0), v(-5.2, 0), v(-5.2, top), v(outerL, top), 0xf1e4cd, hint);
  b.quad(v(10.7, 0), v(outerR, 0), v(outerR, top), v(10.7, top), 0xf1e4cd, hint);
  b.part('box', mat(2.75, top + 0.35, zf, outerR - outerL + 1, 0.7, 1.6, 0, 0, 0, P, M), stone2);
}

/* ---------- 세차장 (P 원점 = 입구 쪽 도로 중심선, -Z로 길이 L) ---------- */

export function addCarWash(b, P, L) {
  const dL = -0.9;
  const dR = 7.9;
  const roofY = 5.0;
  const pastel = [0x8fcdf0, 0xff9fb8, 0xffd166, 0x9fdc8f, 0xc2a8f5];
  for (const z of [0, -L]) {
    for (const d of [dL, dR]) {
      b.part('box', mat(d, roofY / 2, z, 0.8, roofY, 0.8, 0, 0, 0, P, M), 0xffffff);
      b.part('box', mat(d, 0.4, z, 0.95, 0.8, 0.95, 0, 0, 0, P, M), 0x8fcdf0);
    }
    b.part('box', mat((dL + dR) / 2, roofY + 0.5, z, dR - dL + 1.4, 1.2, 1.0, 0, 0, 0, P, M), 0x6cbcf0);
    pastel.forEach((c, i) => {
      const x = dL + 0.8 + i * ((dR - dL - 1.6) / (pastel.length - 1));
      b.part('cyl12', mat(x, roofY + 0.55, z + (z === 0 ? 0.52 : -0.52), 0.8, 0.08, 0.8, 0, Math.PI / 2, 0, P, M), c);
      b.part('sph', mat(x + 0.3, roofY + 1.3 + (i % 2) * 0.3, z, 0.6, 0.6, 0.6, 0, 0, 0, P, M), 0xffffff);
    });
  }
  for (const d of [dL, dR]) {
    b.part('box', mat(d, 1.0, -L / 2, 0.3, 2.0, L, 0, 0, 0, P, M), 0x8fcdf0);
    for (let z = -2; z > -L + 1; z -= 4) b.part('cyl12', mat(d + (d < 0 ? 0.18 : -0.18), 1.1, z, 1.1, 0.06, 1.1, 0, 0, Math.PI / 2, P, M), [0xff9fb8, 0xffd166, 0xffffff][Math.abs(Math.round(z)) % 3]);
    b.part('box', mat(d, 3.3, -L / 2, 0.12, 2.6, L, 0, 0, 0, P, M), 0xe4f6ff);
    b.setGlow(2);
    b.part('box', mat(d + (d < 0 ? 0.25 : -0.25), roofY - 0.25, -L / 2, 0.12, 0.14, L - 1, 0, 0, 0, P, M), d < 0 ? 0xffc3d6 : 0xb5e2fb);
    b.setGlow(0);
  }
  b.part('box', mat((dL + dR) / 2, roofY + 0.05, -L / 2, dR - dL + 0.4, 0.3, L, 0, 0, 0, P, M), 0xffd6e2);
}

/** 회전 브러시 (InstancedMesh용, 축 = Y) */
export function brushGeometryInto(b) {
  const cols = [0x6cbcf0, 0xff9fb8, 0xffd166];
  b.part('cyl6', mat(0, 0, 0, 0.18, 2.8, 0.18, 0, 0, 0, null, M), 0xdfe8ef);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.part('box', mat(Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34, 0.2, 2.6, 0.34, -a, 0, 0, null, M), cols[i % 3]);
  }
}

/* ---------- 기차 건널목 ---------- */

/** 경보기 기둥 (경보등 위치 2개 반환, 로컬) */
export function addCrossingPost(b, P) {
  for (let i = 0; i < 6; i++) b.part('cyl10', mat(0, 0.35 + i * 0.6, 0, 0.22, 0.6, 0.22, 0, 0, 0, P, M), i % 2 ? 0x3d3d48 : 0xffd84a);
  b.part('box', mat(0, 3.9, 0.06, 2.0, 0.32, 0.08, 0, 0, Math.PI / 4, P, M), 0xffffff);
  b.part('box', mat(0, 3.9, 0.06, 2.0, 0.32, 0.08, 0, 0, -Math.PI / 4, P, M), 0xffffff);
  b.part('box', mat(0, 3.9, 0.02, 2.1, 0.42, 0.06, 0, 0, Math.PI / 4, P, M), 0xff6b6b);
  b.part('box', mat(0, 3.9, 0.02, 2.1, 0.42, 0.06, 0, 0, -Math.PI / 4, P, M), 0xff6b6b);
  b.part('box', mat(0, 2.85, 0, 1.6, 0.14, 0.14, 0, 0, 0, P, M), 0x3d3d48);
  for (const sx of [-1, 1]) b.part('cyl12', mat(sx * 0.6, 2.85, 0.05, 0.62, 0.26, 0.62, 0, Math.PI / 2, 0, P, M), 0x2f3444);
  b.part('box', mat(0, 0.45, 0, 0.7, 0.9, 0.5, 0, 0, 0, P, M), 0xc7ccd6);
  return [new THREE.Vector3(-0.6, 2.85, 0.2), new THREE.Vector3(0.6, 2.85, 0.2)];
}

/** 차단기 팔 (피벗 원점, -X 방향으로 len) */
export function barrierArmInto(b, len) {
  const n = Math.round(len / 0.9);
  for (let i = 0; i < n; i++) {
    b.part('box', mat(-(i + 0.5) * (len / n), 0, 0, len / n + 0.01, 0.2, 0.14, 0, 0, 0, null, M), i % 2 ? 0xffffff : 0xff6b6b);
  }
  b.part('box', mat(0.35, 0, 0, 0.8, 0.4, 0.4, 0, 0, 0, null, M), 0x3d3d48);
}

/* ---------- 도착지 ---------- */

export function addParasol(b, P, r) {
  const c = pick(r, [0xff8a7a, 0x6cbcf0, 0xffd166, 0x7fd6a6, 0xb69cf5]);
  b.part('cyl6', mat(0, 1.2, 0, 0.1, 2.4, 0.1, 0, 0, 0, P, M), 0xffffff);
  b.part('cone7', mat(0, 2.6, 0, 3.4, 0.9, 3.4, 0, 0, 0, P, M), c);
  b.part('cone7', mat(0, 2.62, 0, 1.4, 0.95, 1.4, 0.4, 0, 0, P, M), 0xffffff);
  b.part('box', mat(1.2, 0.04, 0.6, 1.0, 0.06, 2.0, 0.3, 0, 0, P, M), pick(r, [0xffffff, 0xffb3c1, 0x9fdc8f]));
}

export function addZooGate(b, P) {
  for (const sx of [-1, 1]) {
    const x = 2.75 + sx * 8.2;
    b.part('cyl12', mat(x, 3, 0, 2.2, 6, 2.2, 0, 0, 0, P, M), 0x9fdc8f);
    b.part('sph', mat(x, 6.3, 0, 2.6, 1.6, 2.6, 0, 0, 0, P, M), 0xffd166);
    for (const ex of [-1, 1]) b.part('sph', mat(x + ex * 0.9, 7.1, 0, 0.8, 0.8, 0.5, 0, 0, 0, P, M), 0xc89a72);
  }
  b.part('box', mat(2.75, 6.4, 0, 16.4, 1.3, 0.8, 0, 0, 0, P, M), 0xffb58a);
  b.part('cyl12', mat(2.75, 7.4, 0.2, 3.4, 0.3, 3.4, 0, Math.PI / 2, 0, P, M), 0xffffff);
  b.part('cyl12', mat(2.75, 7.4, 0.36, 2.6, 0.1, 2.6, 0, Math.PI / 2, 0, P, M), 0x7bd389);
  // 발자국 무늬
  for (let i = 0; i < 4; i++) {
    const x = 2.75 - 6 + i * 4 + (i > 1 ? 2.2 : 0);
    if (Math.abs(x - 2.75) < 2) continue;
    b.part('cyl10', mat(x, 6.35, 0.42, 0.5, 0.06, 0.5, 0, Math.PI / 2, 0, P, M), 0x8a5a3a);
    for (let k = 0; k < 3; k++) b.part('cyl10', mat(x - 0.32 + k * 0.32, 6.78, 0.42, 0.2, 0.06, 0.2, 0, Math.PI / 2, 0, P, M), 0x8a5a3a);
  }
}

/** 동물원 담 (로컬 X축 길이 len) */
export function addZooWall(b, P, len) {
  b.part('box', mat(0, 1.25, 0, len, 2.5, 0.6, 0, 0, 0, P, M), 0xf6e3c4);
  b.part('box', mat(0, 2.6, 0, len + 0.2, 0.25, 0.8, 0, 0, 0, P, M), 0x9fdc8f);
  for (let x = -len / 2 + 2; x < len / 2; x += 4) b.part('cyl10', mat(x, 1.3, 0.32, 0.9, 0.05, 0.9, 0, Math.PI / 2, 0, P, M), 0xffd166);
}

export function addCarousel(b, P) {
  b.part('cyl12', mat(0, 0.3, 0, 9, 0.6, 9, 0, 0, 0, P, M), 0xfff1d6);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.part('cyl6', mat(Math.cos(a) * 3.8, 2.2, Math.sin(a) * 3.8, 0.16, 3.6, 0.16, 0, 0, 0, P, M), 0xffd166);
  }
  b.part('cyl12', mat(0, 2.2, 0, 2.2, 3.6, 2.2, 0, 0, 0, P, M), 0xff9fb8);
  b.part('cone7', mat(0, 5.2, 0, 10, 2.8, 10, 0, 0, 0, P, M), 0xff8a7a);
  b.part('cone7', mat(0, 5.25, 0, 5, 2.9, 5, 0.45, 0, 0, P, M), 0xffffff);
  b.part('sph', mat(0, 6.8, 0, 0.6, 0.6, 0.6, 0, 0, 0, P, M), 0xffd166);
}
