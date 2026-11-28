/**
 * 로우폴리 장난감 모델 (정점색). 모든 모델의 로컬 앞쪽 = -Z, 오른쪽 = +X, 바닥 y=0.
 */
import * as THREE from '../vendor/three.module.min.js';
import { GeoBuilder, mat, pick } from './geo.js';
import { PALETTE } from './config.js';

const M = new THREE.Matrix4();
const H = new THREE.Matrix4();

/* ---------- 집 (앞면 = 로컬 +Z, 도로를 바라보도록 배치) ---------- */

export function addHouse(b, parent, r, theme) {
  const w = 5 + r() * 2.6;
  const dep = 4.4 + r() * 1.6;
  const two = r() < 0.4;
  const h = two ? 4.8 + r() * 0.6 : 3.0 + r() * 0.5;
  const wallC = pick(r, theme.walls);
  const roofC = pick(r, theme.roofs);
  const trimC = 0xffffff;

  b.part('box', mat(0, h / 2, 0, w, h, dep, 0, 0, 0, parent, M), wallC);
  b.part('box', mat(0, 0.18, 0, w + 0.14, 0.36, dep + 0.14, 0, 0, 0, parent, M), 0xe6dccd);
  const rh = 1.5 + r() * 0.9;
  b.part('prism', mat(0, h - 0.05, 0, w + 0.7, rh, dep + 0.9, 0, 0, 0, parent, M), roofC, 0.04, r);
  // 처마 아래 띠
  b.part('box', mat(0, h - 0.08, 0, w + 0.2, 0.16, dep + 0.2, 0, 0, 0, parent, M), trimC);

  if (r() < 0.55) {
    const cx = (r() - 0.5) * w * 0.5;
    b.part('box', mat(cx, h + rh * 0.55, -dep * 0.18, 0.55, 1.3, 0.55, 0, 0, 0, parent, M), 0xd98c7a);
  }

  const fz = dep / 2;
  const doorX = (r() - 0.5) * (w - 2.4);
  b.part('box', mat(doorX, 1.0, fz + 0.04, 1.05, 2.0, 0.12, 0, 0, 0, parent, M), 0xffffff);
  b.part('box', mat(doorX, 0.95, fz + 0.08, 0.85, 1.8, 0.1, 0, 0, 0, parent, M), pick(r, [0xb7876a, 0x8fb8de, 0xe39a8c]));
  b.part('box', mat(doorX + 0.28, 0.95, fz + 0.14, 0.1, 0.1, 0.06, 0, 0, 0, parent, M), 0xffd166);
  b.part('box', mat(doorX, 0.06, fz + 0.45, 1.5, 0.12, 0.7, 0, 0, 0, parent, M), 0xe6dccd);

  const floors = two ? [1.55, 3.6] : [1.55];
  const slots = [];
  for (let x = -w / 2 + 1.1; x <= w / 2 - 1.0; x += 1.7) slots.push(x);
  for (const fy of floors) {
    for (const x of slots) {
      if (fy < 2 && Math.abs(x - doorX) < 1.3) continue;
      addWindow(b, parent, x, fy, fz, 0);
    }
  }
  // 옆 창문
  addWindow(b, parent, w / 2, floors[floors.length - 1], 0, Math.PI / 2);
  addWindow(b, parent, -w / 2, floors[0], 0, -Math.PI / 2);
  return { w, dep };
}

function addWindow(b, parent, x, y, z, ry) {
  H.makeRotationY(ry).setPosition(x, y, z).premultiply(parent);
  b.part('box', mat(0, 0, 0.03, 0.98, 0.98, 0.1, 0, 0, 0, H, M), 0xffffff);
  b.setGlow(0.75);
  b.part('box', mat(0, 0, 0.07, 0.76, 0.76, 0.08, 0, 0, 0, H, M), 0xa9dcf7);
  b.setGlow(0);
  b.part('box', mat(0, 0, 0.1, 0.07, 0.76, 0.04, 0, 0, 0, H, M), 0xffffff);
  b.part('box', mat(0, -0.52, 0.12, 1.1, 0.12, 0.22, 0, 0, 0, H, M), 0xffffff);
}

/* ---------- 나무 (InstancedMesh용 단일 지오메트리) ---------- */

export function treeGeometry(kind) {
  const b = new GeoBuilder();
  const r = Math.random;
  if (kind === 'pine') {
    b.part('cyl6', mat(0, 0.6, 0, 0.34, 1.2, 0.34, 0, 0, 0, null, M), PALETTE.trunk);
    b.part('cone7', mat(0, 2.0, 0, 2.6, 2.4, 2.6, 0.3, 0, 0, null, M), 0x6cc08a, 0.05, r);
    b.part('cone7', mat(0, 3.2, 0, 1.9, 2.0, 1.9, 0, 0, 0, null, M), 0x7bcb93, 0.05, r);
    b.part('cone7', mat(0, 4.2, 0, 1.2, 1.4, 1.2, 0.2, 0, 0, null, M), 0x8bd59e, 0.05, r);
  } else if (kind === 'persimmon') {
    b.part('cyl6', mat(0, 1.0, 0, 0.4, 2.0, 0.4, 0, 0, 0, null, M), 0x8a5a3a);
    b.part('cyl6', mat(0.5, 2.1, 0, 0.18, 1.2, 0.18, 0, 0, -0.6, null, M), 0x8a5a3a);
    b.part('ico0', mat(0, 3.0, 0, 3.2, 2.4, 3.0, 0.3, 0, 0, null, M), 0x6fae5a, 0.06, r);
    b.part('ico0', mat(0.9, 3.4, 0.3, 1.9, 1.5, 1.8, 0.9, 0, 0, null, M), 0x7fbd62, 0.06, r);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 * 2.3;
      const rr = 1.1 + (i % 3) * 0.25;
      b.part('sph', mat(Math.cos(a) * rr, 2.6 + (i % 4) * 0.35, Math.sin(a) * rr, 0.34, 0.3, 0.34, 0, 0, 0, null, M), 0xff9a3d);
    }
  } else {
    const leaf = kind === 'blossom' ? 0xffc6d6 : 0x9bd672;
    const leaf2 = kind === 'blossom' ? 0xffd9e3 : 0xadde85;
    b.part('cyl6', mat(0, 0.9, 0, 0.36, 1.8, 0.36, 0, 0, 0, null, M), PALETTE.trunk);
    b.part('ico0', mat(0, 2.7, 0, 3.0, 2.6, 3.0, 0.3, 0, 0, null, M), leaf, 0.06, r);
    b.part('ico0', mat(0.7, 3.4, 0.2, 1.8, 1.6, 1.8, 0.9, 0, 0, null, M), leaf2, 0.06, r);
    b.part('ico0', mat(-0.6, 3.2, -0.3, 1.6, 1.4, 1.6, 0.2, 0, 0, null, M), leaf2, 0.06, r);
  }
  return b.build();
}

/* ---------- 가로등 · 울타리 · 덤불 ---------- */

export function addLamp(b, parent) {
  b.part('cyl6', mat(0, 0.12, 0, 0.5, 0.24, 0.5, 0, 0, 0, parent, M), 0x8d9bb5);
  b.part('cyl6', mat(0, 2.3, 0, 0.18, 4.4, 0.18, 0, 0, 0, parent, M), 0x9aa8c2);
  b.part('box', mat(-0.55, 4.45, 0, 1.2, 0.14, 0.14, 0, 0, 0, parent, M), 0x9aa8c2);
  b.part('hemi', mat(-1.1, 4.32, 0, 0.62, 0.36, 0.62, 0, Math.PI, 0, parent, M), 0x9aa8c2);
  b.setGlow(1);
  b.part('sph', mat(-1.1, 4.3, 0, 0.36, 0.22, 0.36, 0, 0, 0, parent, M), 0xfff2b8);
  b.setGlow(0);
}

/** 길이 len(로컬 X축) 울타리 한 조각 */
export function addFence(b, parent, len) {
  b.part('box', mat(0, 0.42, 0, len, 0.09, 0.06, 0, 0, 0, parent, M), 0xffffff);
  b.part('box', mat(0, 0.72, 0, len, 0.09, 0.06, 0, 0, 0, parent, M), 0xffffff);
  const n = Math.max(1, Math.round(len / 0.75));
  for (let i = 0; i <= n; i++) {
    const x = -len / 2 + (len * i) / n;
    b.part('box', mat(x, 0.48, 0.04, 0.13, 0.96, 0.06, 0, 0, 0, parent, M), 0xffffff);
  }
}

export function addBush(b, parent, r, flowers) {
  const s = 0.8 + r() * 0.6;
  b.part('ico0', mat(0, 0.35 * s, 0, 1.3 * s, 0.9 * s, 1.1 * s, r() * 3, 0, 0, parent, M), 0x86c86b, 0.08, r);
  b.part('ico0', mat(0.5 * s, 0.3 * s, 0.2, 0.9 * s, 0.7 * s, 0.9 * s, r() * 3, 0, 0, parent, M), 0x95d278, 0.08, r);
  const fc = pick(r, flowers);
  for (let i = 0; i < 4; i++) {
    const a = r() * Math.PI * 2;
    b.part(
      'ico0',
      mat(Math.cos(a) * 0.45 * s, 0.62 * s + r() * 0.15, Math.sin(a) * 0.4 * s, 0.2, 0.2, 0.2, a, 0, 0, parent, M),
      fc
    );
  }
}

export function addPlanter(b, parent) {
  b.part('box', mat(0, 0.17, 0, 1.3, 0.06, 1.3, 0, 0, 0, parent, M), 0xb48a6a);
}

/* ---------- 신호등 (기둥 + 도로 위로 뻗은 팔 + 큰 둥근 램프) ---------- */

/**
 * parent 기준: 기둥 위치 원점, 로컬 -X 쪽으로 팔이 도로를 가로지름.
 * 반환: 램프 중심 로컬 좌표 3개 (빨강·노랑·초록)
 */
export function addSignalFrame(b, armLen, height) {
  b.part('cyl6', mat(0, 0.15, 0, 0.6, 0.3, 0.6, 0, 0, 0, null, M), 0x8d9bb5);
  b.part('cyl10', mat(0, height / 2, 0, 0.3, height, 0.3, 0, 0, 0, null, M), 0xf2c94c);
  b.part('cyl10', mat(-armLen / 2, height - 0.15, 0, 0.22, armLen, 0.22, 0, 0, Math.PI / 2, null, M), 0xf2c94c);
  b.part('sph', mat(0, height, 0, 0.4, 0.4, 0.4, 0, 0, 0, null, M), 0xf2c94c);
  const hx = -armLen + 1.9;
  const hy = height - 0.85;
  // 하우징 (둥근 캡슐 느낌: 상자 + 양 끝 원기둥)
  b.part('box', mat(hx, hy, 0, 2.7, 1.12, 0.5, 0, 0, 0, null, M), 0x4b5670);
  b.part('cyl10', mat(hx - 1.35, hy, 0, 1.12, 0.5, 1.12, 0, Math.PI / 2, 0, null, M), 0x4b5670);
  b.part('cyl10', mat(hx + 1.35, hy, 0, 1.12, 0.5, 1.12, 0, Math.PI / 2, 0, null, M), 0x4b5670);
  b.part('box', mat(hx, hy + 0.62, 0, 0.18, 0.4, 0.18, 0, 0, 0, null, M), 0x4b5670);
  const lamps = [];
  for (let i = 0; i < 3; i++) {
    const lx = hx - 1.0 + i * 1.0;
    // 차양
    b.part('box', mat(lx, hy + 0.47, 0.42, 0.82, 0.07, 0.38, 0, 0, 0, null, M), 0x3b4560);
    lamps.push(new THREE.Vector3(lx, hy, 0.28));
  }
  return lamps;
}

/* ---------- 동물 친구 (오리·토끼·곰) — 앞쪽 -Z, 카메라는 오른쪽(+X)면을 봄 ---------- */

function eyes(b, P, y, z, spread, size) {
  for (const sx of [-1, 1]) {
    b.part('sph', mat(sx * spread, y, z, size, size * 1.15, size, 0, 0, 0, P, M), 0x2f2f3a);
    b.part('sph', mat(sx * spread + 0.02, y + size * 0.25, z - size * 0.35, size * 0.35, size * 0.35, size * 0.3, 0, 0, 0, P, M), 0xffffff);
  }
}

function cheeks(b, P, y, z, spread) {
  for (const sx of [-1, 1]) b.part('sph', mat(sx * spread, y, z, 0.12, 0.08, 0.06, 0, 0, 0, P, M), 0xffa3b5);
}

export function animalGeometry(kind) {
  const b = new GeoBuilder();
  const HEAD = new THREE.Matrix4();
  if (kind === 'duck') {
    b.part('sph', mat(0, 0.45, 0.05, 0.75, 0.62, 0.95, 0, 0, 0, null, M), 0xffe07a);
    b.part('sph', mat(0, 0.6, 0.5, 0.3, 0.3, 0.3, 0, -0.6, 0, null, M), 0xffe07a);
    for (const sx of [-1, 1]) b.part('sph', mat(sx * 0.36, 0.5, 0.08, 0.16, 0.36, 0.55, 0, 0.2, 0, null, M), 0xffd45a);
    for (const sx of [-1, 1]) b.part('sph', mat(sx * 0.16, 0.05, -0.05, 0.24, 0.08, 0.32, 0, 0, 0, null, M), 0xffa24d);
    HEAD.makeRotationY(-0.6).setPosition(0, 0.98, -0.28);
    b.part('sph', mat(0, 0, 0, 0.56, 0.54, 0.56, 0, 0, 0, HEAD, M), 0xffe58f);
    b.part('sph', mat(0, -0.06, -0.3, 0.26, 0.1, 0.3, 0, 0, 0, HEAD, M), 0xffa24d);
    eyes(b, HEAD, 0.06, -0.22, 0.15, 0.09);
    cheeks(b, HEAD, -0.06, -0.18, 0.22);
  } else if (kind === 'rabbit') {
    b.part('sph', mat(0, 0.45, 0.05, 0.7, 0.72, 0.8, 0, 0, 0, null, M), 0xfdf7f2);
    b.part('sph', mat(0, 0.48, 0.45, 0.26, 0.26, 0.26, 0, 0, 0, null, M), 0xffffff);
    for (const sx of [-1, 1]) b.part('sph', mat(sx * 0.18, 0.06, -0.12, 0.22, 0.12, 0.38, 0, 0, 0, null, M), 0xf5ece4);
    HEAD.makeRotationY(-0.6).setPosition(0, 1.02, -0.18);
    b.part('sph', mat(0, 0, 0, 0.6, 0.56, 0.56, 0, 0, 0, HEAD, M), 0xfdf7f2);
    for (const sx of [-1, 1]) {
      b.part('sph', mat(sx * 0.13, 0.48, 0.05, 0.17, 0.62, 0.12, 0, -0.15, sx * -0.12, HEAD, M), 0xfdf7f2);
      b.part('sph', mat(sx * 0.13, 0.48, 0.0, 0.08, 0.46, 0.06, 0, -0.15, sx * -0.12, HEAD, M), 0xffb8c8);
    }
    b.part('sph', mat(0, -0.04, -0.28, 0.08, 0.06, 0.06, 0, 0, 0, HEAD, M), 0xff8fa8);
    eyes(b, HEAD, 0.05, -0.22, 0.15, 0.085);
    cheeks(b, HEAD, -0.08, -0.2, 0.2);
  } else {
    b.part('sph', mat(0, 0.5, 0.05, 0.82, 0.8, 0.88, 0, 0, 0, null, M), 0xc89a72);
    b.part('sph', mat(0, 0.45, -0.3, 0.46, 0.5, 0.2, 0, 0, 0, null, M), 0xead1b5);
    for (const sx of [-1, 1]) b.part('sph', mat(sx * 0.2, 0.07, -0.1, 0.26, 0.14, 0.36, 0, 0, 0, null, M), 0xb88a64);
    HEAD.makeRotationY(-0.6).setPosition(0, 1.12, -0.18);
    b.part('sph', mat(0, 0, 0, 0.66, 0.6, 0.62, 0, 0, 0, HEAD, M), 0xc89a72);
    for (const sx of [-1, 1]) {
      b.part('sph', mat(sx * 0.25, 0.27, 0.02, 0.22, 0.22, 0.12, 0, 0, 0, HEAD, M), 0xc89a72);
      b.part('sph', mat(sx * 0.25, 0.27, -0.03, 0.12, 0.12, 0.06, 0, 0, 0, HEAD, M), 0xead1b5);
    }
    b.part('sph', mat(0, -0.08, -0.27, 0.28, 0.2, 0.16, 0, 0, 0, HEAD, M), 0xead1b5);
    b.part('sph', mat(0, -0.04, -0.35, 0.1, 0.07, 0.06, 0, 0, 0, HEAD, M), 0x4a3a35);
    eyes(b, HEAD, 0.06, -0.25, 0.15, 0.08);
    cheeks(b, HEAD, -0.07, -0.22, 0.22);
  }
  return b.build();
}

/* ---------- 경운기 (주황) + 운전사 돼지 ---------- */

export const CARGOS = ['cabbage', 'pumpkin', 'hay', 'watermelon'];

/** 짐 더미: 바닥(0.55) 위로 2~3층 */
function addCargo(b, kind) {
  const r = Math.random;
  const spots = [
    [-0.45, 0.3, 0],
    [0.4, 0.35, 0],
    [-0.4, 1.0, 0],
    [0.42, 1.05, 0],
    [0, 0.68, 1],
    [-0.1, 1.25, 1],
    [0.25, 0.2, 1],
    [0.05, 0.95, 2],
  ];
  for (const [x, z, layer] of spots) {
    const y = 0.78 + layer * 0.36;
    if (kind === 'hay') {
      b.part('box', mat(x * 0.9, y - 0.05, z, 0.74, 0.42, 0.56, r() * 0.3, 0, 0, null, M), 0xf2d06b, 0.06, r);
      b.part('box', mat(x * 0.9, y - 0.05, z, 0.76, 0.44, 0.06, r() * 0.3, 0, 0, null, M), 0xd9a94a);
    } else if (kind === 'pumpkin') {
      b.part('sph', mat(x, y, z, 0.66, 0.5, 0.66, r() * 3, 0, 0, null, M), 0xffa24d, 0.06, r);
      b.part('cyl6', mat(x, y + 0.28, z, 0.08, 0.14, 0.08, 0, 0, 0, null, M), 0x5f8f3a);
    } else if (kind === 'watermelon') {
      b.part('sph', mat(x, y, z, 0.62, 0.55, 0.78, r() * 3, 0, 0, null, M), r() < 0.5 ? 0x4fa84a : 0x5fbf55, 0.05, r);
      b.part('sph', mat(x, y + 0.02, z, 0.64, 0.12, 0.8, 0, 0, 0, null, M), 0x2f7d3a);
    } else {
      b.part('ico0', mat(x, y, z, 0.62, 0.52, 0.62, r() * 3, 0, 0, null, M), 0x9ad66f, 0.08, r);
      b.part('ico0', mat(x, y + 0.08, z, 0.36, 0.32, 0.36, r() * 3, 0, 0, null, M), 0xc8ec9c);
    }
  }
}

const tractorCache = {};

/** 경운기 몸통(짐 종류별 캐시 — 여행이 바뀌어도 재사용) + 손 흔드는 팔 */
export function tractorParts(cargo = 'cabbage') {
  if (tractorCache[cargo]) return tractorCache[cargo];
  const body = new GeoBuilder();
  const O = 0xff9a3d;
  const O2 = 0xffb15e;
  // 앞 엔진부
  body.part('box', mat(0, 0.9, -1.45, 1.05, 0.75, 1.0, 0, 0, 0, null, M), O);
  body.part('box', mat(0, 1.32, -1.45, 0.85, 0.12, 0.8, 0, 0, 0, null, M), O2);
  body.part('cyl6', mat(0.32, 1.7, -1.6, 0.12, 0.8, 0.12, 0, 0, 0, null, M), 0x7a8296);
  body.part('box', mat(0, 0.95, -1.98, 0.7, 0.45, 0.06, 0, 0, 0, null, M), 0xfff1d6);
  for (const sx of [-1, 1]) {
    body.part('cyl10', mat(sx * 0.72, 0.52, -1.4, 1.04, 0.32, 1.04, 0, 0, Math.PI / 2, null, M), 0x4a4f5e);
    body.part('cyl10', mat(sx * 0.9, 0.52, -1.4, 0.46, 0.06, 0.46, 0, 0, Math.PI / 2, null, M), 0xffd166);
  }
  // 핸들 바
  for (const sx of [-1, 1]) {
    body.part('cyl6', mat(sx * 0.32, 1.25, -0.75, 0.07, 1.2, 0.07, 0, Math.PI / 2 - 0.35, 0, null, M), 0x7a8296);
  }
  // 짐칸 (뒤) — 낮게 깔고 짐을 높이 쌓아 뒤에서도 잘 보이게
  body.part('box', mat(0, 0.45, 0.55, 1.75, 0.14, 2.0, 0, 0, 0, null, M), 0xc98d58);
  body.part('box', mat(0, 0.64, 1.53, 1.75, 0.3, 0.08, 0, 0, 0, null, M), 0xe0ad74);
  for (const sx of [-1, 1]) body.part('box', mat(sx * 0.86, 0.64, 0.55, 0.08, 0.3, 2.0, 0, 0, 0, null, M), 0xe0ad74);
  body.part('box', mat(0, 0.64, -0.42, 1.75, 0.3, 0.08, 0, 0, 0, null, M), 0xe0ad74);
  for (const sx of [-1, 1]) {
    body.part('cyl10', mat(sx * 0.95, 0.3, 0.7, 0.6, 0.22, 0.6, 0, 0, Math.PI / 2, null, M), 0x4a4f5e);
    body.part('cyl10', mat(sx * 1.07, 0.3, 0.7, 0.26, 0.05, 0.26, 0, 0, Math.PI / 2, null, M), 0xffd166);
  }
  addCargo(body, cargo);
  // 뒤 반사판(빨강) 왼쪽
  body.part('box', mat(-0.72, 0.64, 1.58, 0.22, 0.14, 0.04, 0, 0, 0, null, M), 0xff6b6b);
  // 운전사 돼지 (앉은 몸통 + 머리)
  body.part('box', mat(0, 0.86, -0.25, 0.7, 0.12, 0.45, 0, 0, 0, null, M), 0x6f7fa6);
  body.part('sph', mat(0, 1.25, -0.22, 0.72, 0.72, 0.62, 0, 0, 0, null, M), 0xffb6c4);
  body.part('sph', mat(0, 1.85, -0.25, 0.64, 0.6, 0.6, 0, 0, 0, null, M), 0xffc2cf);
  for (const sx of [-1, 1]) body.part('cone6', mat(sx * 0.22, 2.17, -0.2, 0.2, 0.22, 0.12, 0, 0.3, sx * -0.4, null, M), 0xff9fb4);
  body.part('cyl10', mat(0, 1.8, -0.57, 0.26, 0.12, 0.2, 0, Math.PI / 2, 0, null, M), 0xff9fb4);
  // 모자(밀짚)
  body.part('cyl10', mat(0, 2.12, -0.25, 0.95, 0.05, 0.95, 0, 0, 0, null, M), 0xf6d77a);
  body.part('cyl10', mat(0, 2.24, -0.25, 0.5, 0.22, 0.5, 0, 0, 0, null, M), 0xf6d77a);
  body.part('cyl10', mat(0, 2.15, -0.25, 0.52, 0.05, 0.52, 0, 0, 0, null, M), 0xff8fa8);

  const arm = new GeoBuilder();
  arm.part('sph', mat(0, 0.22, 0, 0.16, 0.5, 0.16, 0, 0, 0, null, M), 0xffb6c4);
  arm.part('sph', mat(0, 0.48, 0, 0.2, 0.2, 0.2, 0, 0, 0, null, M), 0xffc2cf);
  const out = { body: body.build(), arm: arm.build() };
  out.body.userData.keep = true;
  out.arm.userData.keep = true;
  tractorCache[cargo] = out;
  return out;
}

/* ---------- 반대편 차 ---------- */

export function carGeometry(color) {
  const b = new GeoBuilder();
  b.part('box', mat(0, 0.62, 0, 1.8, 0.62, 3.8, 0, 0, 0, null, M), color);
  b.part('sph', mat(0, 0.62, -1.9, 1.8, 0.62, 0.5, 0, 0, 0, null, M), color);
  b.part('sph', mat(0, 0.62, 1.9, 1.8, 0.62, 0.5, 0, 0, 0, null, M), color);
  b.part('box', mat(0, 1.18, 0.25, 1.52, 0.56, 2.0, 0, 0, 0, null, M), 0xbfe6fb);
  b.part('box', mat(0, 1.5, 0.25, 1.56, 0.1, 2.05, 0, 0, 0, null, M), color);
  for (const sx of [-1, 1]) {
    for (const sz of [-1.25, 1.25]) {
      b.part('cyl10', mat(sx * 0.86, 0.36, sz, 0.66, 0.26, 0.66, 0, 0, Math.PI / 2, null, M), 0x4a4f5e);
    }
    b.part('sph', mat(sx * 0.6, 0.72, -2.12, 0.34, 0.24, 0.1, 0, 0, 0, null, M), 0xfff6c8);
  }
  b.part('box', mat(0, 0.38, -2.15, 1.7, 0.16, 0.12, 0, 0, 0, null, M), 0xf4efe6);
  return b.build();
}

/* ---------- 작은 새 ---------- */

export function birdParts(color) {
  const body = new GeoBuilder();
  body.part('sph', mat(0, 0, 0, 0.3, 0.26, 0.42, 0, 0, 0, null, M), color);
  body.part('sph', mat(0, 0.12, -0.2, 0.24, 0.22, 0.22, 0, 0, 0, null, M), color);
  body.part('cone6', mat(0, 0.1, -0.36, 0.08, 0.14, 0.08, 0, -Math.PI / 2, 0, null, M), 0xffb14d);
  body.part('sph', mat(0, -0.05, 0.02, 0.22, 0.16, 0.3, 0, 0, 0, null, M), 0xffffff);
  const wing = new GeoBuilder();
  wing.part('sph', mat(0.2, 0, 0, 0.42, 0.05, 0.24, 0, 0, 0, null, M), color);
  return { body: body.build(), wing: wing.build() };
}

/* ---------- 공원 아치(무지개) + 풍선 ---------- */

export function archGeometry(span) {
  const b = new GeoBuilder();
  const colors = [0xff9b85, 0xffc56b, 0xffe07a, 0x9fdc8f, 0x8fcdf0, 0xc2a8f5];
  const R0 = span / 2;
  const tube = 0.26;
  colors.forEach((c, i) => {
    const g = new THREE.TorusGeometry(R0 - i * tube * 2, tube, 5, 28, Math.PI);
    const ni = g.toNonIndexed();
    const arr = ni.attributes.position.array;
    for (let k = 0; k < arr.length; k += 3) b.pos.push(arr[k], arr[k + 1] + 1.2, arr[k + 2]);
    b.pushColor(c, arr.length / 3, 0, null);
    g.dispose();
    ni.dispose();
  });
  for (const sx of [-1, 1]) {
    b.part('cyl10', mat(sx * (R0 - tube * 5), 0.6, 0, 1.9, 1.2, 1.9, 0, 0, 0, null, M), 0xffffff);
    b.part('cyl10', mat(sx * (R0 - tube * 5), 1.25, 0, 2.1, 0.12, 2.1, 0, 0, 0, null, M), 0xffb8c8);
  }
  return b.build();
}

export function balloonGeometry(seed) {
  const b = new GeoBuilder();
  const colors = [0xff9fb8, 0xffe07a, 0x8fcdf0, 0xb9a2f0, 0x9fdc8f, 0xffb58a];
  const offs = [
    [0, 2.6, 0],
    [-0.55, 2.2, 0.2],
    [0.55, 2.3, -0.1],
    [0.1, 3.1, 0.35],
  ];
  offs.forEach(([x, y, z], i) => {
    const c = colors[(seed + i) % colors.length];
    b.part('sph', mat(x, y, z, 0.62, 0.74, 0.62, 0, 0, 0, null, M), c);
    b.part('cone6', mat(x, y - 0.4, z, 0.12, 0.12, 0.12, 0, Math.PI, 0, null, M), c);
    const len = y - 0.4;
    b.part('box', mat(x / 2, len / 2, z / 2, 0.03, len, 0.03, 0, 0, -Math.atan2(x, len), null, M), 0xffffff);
  });
  return b.build();
}

/* ---------- 우리 차 보닛 ---------- */

export function bonnetGeometry() {
  const g = new THREE.SphereGeometry(1, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  g.scale(1.2, 0.42, 1.5);
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color(PALETTE.carBody);
  const hi = new THREE.Color(0xffb3a6);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    // 가운데 살짝 밝은 띠
    const t = Math.max(0, 1 - Math.abs(x) / 0.28);
    tmp.copy(c).lerp(hi, t * 0.55);
    col[i * 3] = tmp.r;
    col[i * 3 + 1] = tmp.g;
    col[i * 3 + 2] = tmp.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/* ---------- 원경 언덕 링 · 구름 ---------- */

export function hillsGeometry(radius, count, hMin, hMax, colorA, colorB, seedR) {
  const b = new GeoBuilder();
  const a = new THREE.Vector3();
  const p = new THREE.Vector3();
  const q = new THREE.Vector3();
  const o = new THREE.Vector3();
  const ca = new THREE.Color(colorA);
  const cb = new THREE.Color(colorB);
  const tmp = new THREE.Color();
  const peaks = [];
  for (let i = 0; i < count; i++) peaks.push(hMin + seedR() * (hMax - hMin));
  for (let i = 0; i < count; i++) {
    const a0 = (i / count) * Math.PI * 2;
    const a1 = ((i + 1) / count) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const h = peaks[i];
    p.set(Math.cos(a0) * radius, -2, Math.sin(a0) * radius);
    q.set(Math.cos(a1) * radius, -2, Math.sin(a1) * radius);
    a.set(Math.cos(am) * (radius - 10), h, Math.sin(am) * (radius - 10));
    o.set(0, 0, 0);
    tmp.copy(ca).lerp(cb, seedR());
    const inward = new THREE.Vector3(-Math.cos(am), 0.2, -Math.sin(am));
    b.tri(p, q, a, tmp.getHex(), inward);
    // 사이 작은 봉우리
    const b2 = new THREE.Vector3(Math.cos(a1) * (radius - 4), (h + peaks[(i + 1) % count]) * 0.32, Math.sin(a1) * (radius - 4));
    tmp.copy(ca).lerp(cb, seedR());
    b.tri(a, q, b2, tmp.getHex(), inward);
  }
  return b.build();
}

export function cloudGeometry(r) {
  const b = new GeoBuilder();
  const n = 4 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const s = 6 + r() * 7;
    b.part('ico1', mat((i - n / 2) * 6 + r() * 3, r() * 3, r() * 4, s * 1.5, s, s * 1.1, r() * 3, 0, 0, null, M), 0xffffff, 0.02, r);
  }
  return b.build();
}

/* ---------- 기차 (4량, 둥근 파스텔) — 앞쪽 -Z, 원점 = 기관차 앞 ---------- */

export function trainGeometry(cars, carLen) {
  const b = new GeoBuilder();
  const bodies = [0x7cc6fe, 0xffb3c1, 0xffd166, 0x8fe0b8];
  for (let i = 0; i < cars; i++) {
    const zc = i * (carLen + 0.8) + carLen / 2;
    const c = bodies[i % bodies.length];
    const loco = i === 0;
    b.part('box', mat(0, 0.55, zc, 2.3, 0.3, carLen - 0.2, 0, 0, 0, null, M), 0x4a4f5e);
    for (const sz of [-1, 1]) {
      for (const sx of [-1, 1]) {
        b.part('cyl12', mat(sx * 1.0, 0.5, zc + sz * (carLen / 2 - 1.3), 0.9, 0.3, 0.9, 0, 0, Math.PI / 2, null, M), 0x3d3d48);
        b.part('cyl12', mat(sx * 1.16, 0.5, zc + sz * (carLen / 2 - 1.3), 0.4, 0.05, 0.4, 0, 0, Math.PI / 2, null, M), 0xffd166);
      }
    }
    b.part('box', mat(0, 1.7, zc, 2.6, 2.2, carLen, 0, 0, 0, null, M), c);
    b.part('box', mat(0, 0.85, zc, 2.64, 0.3, carLen + 0.04, 0, 0, 0, null, M), 0xffffff);
    b.part('halfcyl', mat(0, 2.8, zc, 2.6, carLen, 1.2, 0, -Math.PI / 2, 0, null, M), 0xffffff);
    const nWin = loco ? 1 : 3;
    for (let k = 0; k < nWin; k++) {
      const wz = loco ? zc + 1.4 : zc - carLen / 2 + 1.4 + k * ((carLen - 2.8) / 2);
      for (const sx of [-1, 1]) {
        b.part('box', mat(sx * 1.31, 2.0, wz, 0.06, 0.95, 1.3, 0, 0, 0, null, M), 0xffffff);
        b.part('box', mat(sx * 1.33, 2.0, wz, 0.06, 0.75, 1.1, 0, 0, 0, null, M), 0xbfe6f7);
      }
    }
    if (loco) {
      b.part('sphHi', mat(0, 1.6, zc - carLen / 2, 2.6, 2.0, 1.6, 0, 0, 0, null, M), c);
      b.part('cyl12', mat(0, 1.4, zc - carLen / 2 - 0.75, 0.7, 0.12, 0.7, 0, Math.PI / 2, 0, null, M), 0xfff6c8);
      b.part('box', mat(0, 2.3, zc - carLen / 2 + 0.1, 1.8, 0.7, 0.08, 0, 0, 0, null, M), 0xbfe6f7);
      b.part('cyl12', mat(0, 3.5, zc - 1.6, 0.7, 0.9, 0.7, 0, 0, 0, null, M), 0xff6b6b);
      b.part('cyl12', mat(0, 4.0, zc - 1.6, 1.0, 0.2, 1.0, 0, 0, 0, null, M), 0xff6b6b);
    }
  }
  const g = b.build();
  g.userData.keep = true;
  return g;
}

/* ---------- 바다 친구: 돌고래 · 물고기 ---------- */

export function dolphinGeometry() {
  const b = new GeoBuilder();
  b.part('sphHi', mat(0, 0, 0, 1.1, 1.0, 3.2, 0, 0, 0, null, M), 0x7fb3e0);
  b.part('sphHi', mat(0, -0.2, -0.1, 0.8, 0.6, 2.6, 0, 0, 0, null, M), 0xe9f4ff);
  b.part('cone7', mat(0, -0.05, -1.85, 0.42, 0.9, 0.38, 0, -Math.PI / 2, 0, null, M), 0x7fb3e0);
  b.part('prism', mat(0, 0.35, 0.2, 0.12, 0.8, 0.9, 0, 0, 0, null, M), 0x6aa3d4);
  b.part('box', mat(0, 0, 1.75, 1.4, 0.1, 0.5, 0, 0, 0, null, M), 0x6aa3d4);
  for (const sx of [-1, 1]) {
    b.part('sph', mat(sx * 0.42, 0.18, -1.0, 0.16, 0.18, 0.14, 0, 0, 0, null, M), 0x2f2f3a);
    b.part('sph', mat(sx * 0.4, -0.3, -0.6, 0.5, 0.08, 0.3, 0.4 * sx, 0, sx * 0.5, null, M), 0x6aa3d4);
  }
  const g = b.build();
  g.userData.keep = true;
  return g;
}

export function fishGeometry() {
  const b = new GeoBuilder();
  b.part('sphHi', mat(0, 0, 0, 0.5, 0.55, 0.9, 0, 0, 0, null, M), 0xffa24d);
  b.part('prism', mat(0, -0.25, 0.55, 0.06, 0.5, 0.45, 0, -Math.PI / 2, 0, null, M), 0xff8a3d);
  for (const sx of [-1, 1]) b.part('sph', mat(sx * 0.2, 0.08, -0.25, 0.1, 0.1, 0.08, 0, 0, 0, null, M), 0x2f2f3a);
  const g = b.build();
  g.userData.keep = true;
  return g;
}

/* ---------- 작은 배 ---------- */

export function boatGeometry(color) {
  const key = 'boat' + color;
  if (shared[key]) return shared[key];
  const b = new GeoBuilder();
  b.part('halfcyl', mat(0, 0.4, 0, 2.6, 6, 1.4, Math.PI, Math.PI / 2, 0, null, M), color);
  b.part('box', mat(0, 0.55, 0, 2.5, 0.3, 5.6, 0, 0, 0, null, M), 0xffffff);
  b.part('box', mat(0, 1.3, 0.6, 1.6, 1.2, 1.8, 0, 0, 0, null, M), 0xffffff);
  b.part('box', mat(0, 1.95, 0.6, 1.8, 0.14, 2.0, 0, 0, 0, null, M), color);
  b.part('cyl6', mat(0, 2.5, -1.2, 0.08, 2.4, 0.08, 0, 0, 0, null, M), 0xffffff);
  b.part('prism', mat(0, 2.6, -1.0, 0.04, 1.1, 0.8, 0, -Math.PI / 2, 0, null, M), 0xffd166);
  const g = b.build();
  g.userData.keep = true;
  shared[key] = g;
  return g;
}

/* ---------- 도착지 친구들 ---------- */

/** 기린: 몸통(고정) + 목(끄덕이는 부분, 피벗 = 어깨) */
const shared = {};

export function giraffeParts() {
  if (shared.giraffe) return shared.giraffe;
  const body = new GeoBuilder();
  const Y = 0xffd27a;
  const S = 0xc98a4b;
  body.part('sphHi', mat(0, 2.6, 0, 1.6, 1.35, 2.5, 0, 0, 0, null, M), Y);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) body.part('cyl10', mat(sx * 0.45, 1.1, sz * 0.75, 0.3, 2.3, 0.3, 0, 0, 0, null, M), Y);
  }
  [
    [0.5, 2.9, 0.4],
    [-0.5, 2.7, -0.3],
    [0.3, 2.3, -0.8],
    [-0.4, 2.4, 0.8],
  ].forEach(([x, y, z]) => body.part('sph', mat(x * 1.3, y, z, 0.5, 0.42, 0.5, 0, 0, 0, null, M), S));
  const neck = new GeoBuilder();
  neck.part('cyl10', mat(0, 1.6, 0, 0.55, 3.4, 0.55, 0, 0, 0, null, M), Y);
  neck.part('sph', mat(0.25, 1.2, 0.05, 0.25, 0.3, 0.25, 0, 0, 0, null, M), S);
  neck.part('sph', mat(-0.25, 2.2, 0.05, 0.25, 0.3, 0.25, 0, 0, 0, null, M), S);
  neck.part('sphHi', mat(0, 3.45, -0.35, 0.8, 0.7, 1.2, 0, 0, 0, null, M), Y);
  neck.part('sph', mat(0, 3.3, -0.9, 0.5, 0.4, 0.45, 0, 0, 0, null, M), 0xffe2a8);
  for (const sx of [-1, 1]) {
    neck.part('cyl6', mat(sx * 0.2, 4.0, -0.25, 0.1, 0.45, 0.1, 0, 0, 0, null, M), S);
    neck.part('sph', mat(sx * 0.2, 4.25, -0.25, 0.18, 0.18, 0.18, 0, 0, 0, null, M), S);
    neck.part('sph', mat(sx * 0.42, 3.62, -0.55, 0.12, 0.14, 0.1, 0, 0, 0, null, M), 0x2f2f3a);
    neck.part('sph', mat(sx * 0.48, 3.65, -0.1, 0.35, 0.12, 0.2, 0, 0, sx * 0.4, null, M), Y);
  }
  const out = { body: body.build(), neck: neck.build() };
  out.body.userData.keep = true;
  out.neck.userData.keep = true;
  shared.giraffe = out;
  return out;
}

/** 앉아 있는 강아지: 몸통 + 꼬리(흔드는 부분) */
export function puppyParts() {
  if (shared.puppy) return shared.puppy;
  const body = new GeoBuilder();
  const C = 0xfff1dc;
  const E = 0xd9a46a;
  body.part('sphHi', mat(0, 0.45, 0, 0.8, 0.9, 0.85, 0, 0, 0, null, M), C);
  body.part('sphHi', mat(0, 1.05, -0.15, 0.78, 0.72, 0.72, 0, 0, 0, null, M), C);
  body.part('sph', mat(0, 0.95, -0.5, 0.36, 0.28, 0.3, 0, 0, 0, null, M), 0xffffff);
  body.part('sph', mat(0, 1.02, -0.66, 0.13, 0.1, 0.08, 0, 0, 0, null, M), 0x3d2b1f);
  for (const sx of [-1, 1]) {
    body.part('sph', mat(sx * 0.38, 1.05, -0.12, 0.2, 0.5, 0.3, 0, 0, sx * 0.25, null, M), E);
    body.part('sph', mat(sx * 0.15, 1.15, -0.47, 0.1, 0.12, 0.06, 0, 0, 0, null, M), 0x2f2f3a);
    body.part('sph', mat(sx * 0.2, 0.08, -0.3, 0.24, 0.14, 0.34, 0, 0, 0, null, M), C);
  }
  body.part('cyl10', mat(0, 0.78, -0.05, 0.6, 0.1, 0.6, 0, 0, 0, null, M), 0xff6b6b);
  const tail = new GeoBuilder();
  tail.part('sph', mat(0, 0.18, 0.12, 0.16, 0.42, 0.16, 0, 0.6, 0, null, M), E);
  const out = { body: body.build(), tail: tail.build() };
  out.body.userData.keep = true;
  out.tail.userData.keep = true;
  shared.puppy = out;
  return out;
}

/** 관람차: 바퀴(회전, 로컬 XY 평면) + 받침 + 곤돌라 1개(인스턴스용) */
export function ferrisParts(radius) {
  const wheel = new GeoBuilder();
  const ring = new THREE.TorusGeometry(radius, 0.35, 6, 40).toNonIndexed();
  const arr = ring.attributes.position.array;
  for (let k = 0; k < arr.length; k++) wheel.pos.push(arr[k]);
  wheel.pushColor(0xff9fb8, arr.length / 3, 0, null);
  ring.dispose();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    wheel.part('box', mat((Math.cos(a) * radius) / 2, (Math.sin(a) * radius) / 2, 0, radius, 0.18, 0.18, 0, 0, a, null, M), 0xffffff);
  }
  wheel.part('cyl12', mat(0, 0, 0, 1.6, 0.9, 1.6, 0, Math.PI / 2, 0, null, M), 0xffd166);
  const stand = new GeoBuilder();
  for (const sz of [-0.8, 0.8]) {
    for (const sx of [-1, 1]) {
      stand.part('box', mat(sx * radius * 0.28, (radius + 2) / 2, sz, 0.5, radius + 2.6, 0.5, 0, 0, -sx * 0.27, null, M), 0xb69cf5);
    }
  }
  const gondola = new GeoBuilder();
  gondola.part('box', mat(0, -1.1, 0, 1.6, 1.3, 1.4, 0, 0, 0, null, M), 0xffffff);
  gondola.part('hemi', mat(0, -0.45, 0, 1.8, 0.8, 1.6, 0, 0, 0, null, M), 0xffffff);
  gondola.part('box', mat(0, -0.3, 0, 0.08, 0.6, 0.08, 0, 0, 0, null, M), 0x9aa8c2);
  return { wheel: wheel.build(), stand: stand.build(), gondola: gondola.build() };
}
