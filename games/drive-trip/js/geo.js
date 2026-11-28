/**
 * 지오메트리 병합 빌더 + 공용 텍스처.
 * 모든 정적 풍경은 정점색(vertex color) 삼각형으로 모아 청크당 1 드로우콜.
 */
import * as THREE from '../vendor/three.module.min.js';
import { roadPoint } from './road.js';

const BASES = {};
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _n = new THREE.Vector3();

export function rng(seed) {
  let t = seed >>> 0;
  return function next() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(r, list) {
  return list[Math.floor(r() * list.length) % list.length];
}

/** 볼록 도형의 삼각형이 바깥을 보도록 감기 방향 정리 */
function orientOutward(arr, cx, cy, cz) {
  for (let i = 0; i < arr.length; i += 9) {
    _a.set(arr[i + 3] - arr[i], arr[i + 4] - arr[i + 1], arr[i + 5] - arr[i + 2]);
    _b.set(arr[i + 6] - arr[i], arr[i + 7] - arr[i + 1], arr[i + 8] - arr[i + 2]);
    _n.crossVectors(_a, _b);
    const mx = (arr[i] + arr[i + 3] + arr[i + 6]) / 3 - cx;
    const my = (arr[i + 1] + arr[i + 4] + arr[i + 7]) / 3 - cy;
    const mz = (arr[i + 2] + arr[i + 5] + arr[i + 8]) / 3 - cz;
    if (_n.x * mx + _n.y * my + _n.z * mz < 0) {
      for (let k = 0; k < 3; k++) {
        const t = arr[i + 3 + k];
        arr[i + 3 + k] = arr[i + 6 + k];
        arr[i + 6 + k] = t;
      }
    }
  }
  return arr;
}

/** 박공 지붕용 삼각기둥: 용마루 X축, 바닥 y=0 z∈[-.5,.5], 꼭대기 y=1 */
function prismArray() {
  const L = -0.5;
  const H = 0.5;
  const pts = [
    [L, 0, -0.5, L, 0, 0.5, L, 1, 0],
    [H, 0, -0.5, H, 0, 0.5, H, 1, 0],
    [L, 0, 0.5, H, 0, 0.5, H, 1, 0],
    [L, 0, 0.5, H, 1, 0, L, 1, 0],
    [L, 0, -0.5, H, 0, -0.5, H, 1, 0],
    [L, 0, -0.5, H, 1, 0, L, 1, 0],
    [L, 0, -0.5, H, 0, -0.5, H, 0, 0.5],
    [L, 0, -0.5, H, 0, 0.5, L, 0, 0.5],
  ];
  return orientOutward(new Float32Array(pts.flat()), 0, 0.33, 0);
}

export function baseArray(key) {
  if (BASES[key]) return BASES[key];
  let g = null;
  switch (key) {
    case 'box':
      g = new THREE.BoxGeometry(1, 1, 1);
      break;
    case 'cyl6':
      g = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
      break;
    case 'cyl10':
      g = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
      break;
    case 'cone6':
      g = new THREE.ConeGeometry(0.5, 1, 6);
      break;
    case 'cone7':
      g = new THREE.ConeGeometry(0.5, 1, 7);
      break;
    case 'ico0':
      g = new THREE.IcosahedronGeometry(0.5, 0);
      break;
    case 'ico1':
      g = new THREE.IcosahedronGeometry(0.5, 1);
      break;
    case 'sph':
      g = new THREE.SphereGeometry(0.5, 10, 7);
      break;
    case 'hemi':
      g = new THREE.SphereGeometry(0.5, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2);
      break;
    case 'halfcyl':
      g = new THREE.CylinderGeometry(0.5, 0.5, 1, 12, 1, false, -Math.PI / 2, Math.PI);
      break;
    case 'cyl12':
      g = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
      break;
    case 'sphHi':
      g = new THREE.SphereGeometry(0.5, 14, 10);
      break;
    case 'prism':
      BASES[key] = prismArray();
      return BASES[key];
    default:
      throw new Error('unknown base ' + key);
  }
  const ni = g.index ? g.toNonIndexed() : g;
  BASES[key] = ni.attributes.position.array.slice();
  g.dispose();
  ni.dispose();
  return BASES[key];
}

/** 위치(px,py,pz), 크기(sx,sy,sz), 회전(ry, rx, rz) → Matrix4 (parent 곱) */
export function mat(px, py, pz, sx, sy, sz, ry = 0, rx = 0, rz = 0, parent = null, out = new THREE.Matrix4()) {
  _e.set(rx, ry, rz, 'YXZ');
  _q.setFromEuler(_e);
  _p.set(px, py, pz);
  _s.set(sx, sy, sz);
  out.compose(_p, _q, _s);
  if (parent) out.premultiply(parent);
  return out;
}

export class GeoBuilder {
  constructor() {
    this.pos = [];
    this.col = [];
    this.glw = [];
    this.glowValue = 0;
    this.hasGlow = false;
  }

  /** 이후 추가하는 면의 발광 값: 0 없음, 0~1 가로등·창문(날씨에 따라 켜짐), 2 항상 켜짐 */
  setGlow(v) {
    this.glowValue = v;
    if (v) this.hasGlow = true;
  }

  pushColor(color, n, jitter, r) {
    _c.set(color);
    let f = 1;
    if (jitter && r) f = 1 + (r() * 2 - 1) * jitter;
    for (let i = 0; i < n; i++) {
      this.col.push(_c.r * f, _c.g * f, _c.b * f);
      this.glw.push(this.glowValue);
    }
  }

  /** 기본 도형을 행렬로 변환해 추가. jitter>0이면 삼각형마다 밝기 흔들림(로우폴리 느낌) */
  part(key, matrix, color, jitter = 0, r = null) {
    const arr = baseArray(key);
    const e = matrix.elements;
    for (let i = 0; i < arr.length; i += 3) {
      const x = arr[i];
      const y = arr[i + 1];
      const z = arr[i + 2];
      this.pos.push(
        e[0] * x + e[4] * y + e[8] * z + e[12],
        e[1] * x + e[5] * y + e[9] * z + e[13],
        e[2] * x + e[6] * y + e[10] * z + e[14]
      );
    }
    if (jitter && r) {
      for (let t = 0; t < arr.length / 9; t++) this.pushColor(color, 3, jitter, r);
    } else {
      this.pushColor(color, arr.length / 3, 0, null);
    }
  }

  tri(a, b, c, color, hint) {
    _a.subVectors(b, a);
    _b.subVectors(c, a);
    _n.crossVectors(_a, _b);
    if (hint && _n.dot(hint) < 0) {
      const t = b;
      b = c;
      c = t;
    }
    this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    this.pushColor(color, 3, 0, null);
  }

  quad(a, b, c, d, color, hint) {
    this.tri(a, b, c, color, hint);
    this.tri(a, c, d, color, hint);
  }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    if (this.hasGlow) g.setAttribute('glow', new THREE.Float32BufferAttribute(this.glw, 1));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }
}

const UP = new THREE.Vector3(0, 1, 0);
const _r0 = new THREE.Vector3();
const _r1 = new THREE.Vector3();
const _r2 = new THREE.Vector3();
const _r3 = new THREE.Vector3();

/** 도로를 따라 휘는 띠(지면): s0..s1, d 범위 dA..dB, 높이 y. colorFn(row, sMid) 가능 */
export function ribbon(b, s0, s1, dA, dB, y, color, step = 2, yB = null) {
  const n = Math.max(1, Math.ceil((s1 - s0) / step - 1e-6));
  const yb = yB == null ? y : yB;
  for (let i = 0; i < n; i++) {
    const sa = s0 + ((s1 - s0) * i) / n;
    const sb = s0 + ((s1 - s0) * (i + 1)) / n;
    const c = typeof color === 'function' ? color(i, (sa + sb) / 2) : color;
    roadPoint(sa, dA, y, _r0);
    roadPoint(sa, dB, yb, _r1);
    roadPoint(sb, dB, yb, _r2);
    roadPoint(sb, dA, y, _r3);
    b.quad(_r0, _r1, _r2, _r3, c, UP);
  }
}

/** 도로를 따라가는 세로 벽(연석 옆면 등). facing = +1(오른쪽을 봄) / -1 */
export function wall(b, s0, s1, d, y0, y1, color, facing, step = 2) {
  const n = Math.max(1, Math.ceil((s1 - s0) / step - 1e-6));
  const hint = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const sa = s0 + ((s1 - s0) * i) / n;
    const sb = s0 + ((s1 - s0) * (i + 1)) / n;
    roadPoint(sa, d, y0, _r0);
    roadPoint(sb, d, y0, _r1);
    roadPoint(sb, d, y1, _r2);
    roadPoint(sa, d, y1, _r3);
    roadPoint(sa, d + facing, y0, hint).sub(_r0);
    b.quad(_r0, _r1, _r2, _r3, color, hint);
  }
}

/* ---------- 텍스처 ---------- */

let blobTex = null;
export function blobTexture() {
  if (blobTex) return blobTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 31);
  g.addColorStop(0, 'rgba(40,50,70,0.55)');
  g.addColorStop(0.55, 'rgba(40,50,70,0.32)');
  g.addColorStop(1, 'rgba(40,50,70,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  blobTex = new THREE.CanvasTexture(c);
  return blobTex;
}

let glowTex = null;
export function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 63);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.14)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

let blobGeo = null;
let blobMat = null;
/** 반투명 원형 바닥 그림자 (실시간 그림자맵 대신) */
export function makeBlob(w, l) {
  if (!blobGeo) {
    blobGeo = new THREE.PlaneGeometry(1, 1);
    blobGeo.rotateX(-Math.PI / 2);
    blobMat = new THREE.MeshBasicMaterial({
      map: blobTexture(),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
  }
  const m = new THREE.Mesh(blobGeo, blobMat);
  m.scale.set(w, 1, l);
  m.position.y = 0.03;
  m.renderOrder = 1;
  return m;
}

/* ---------- 파티클·오버레이용 텍스처 (한 번만 만들고 계속 재사용) ---------- */

function canvasTex(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let softDot = null;
/** 둥근 부드러운 점 (눈송이·거품·물보라) */
export function softDotTexture() {
  if (!softDot) {
    softDot = canvasTex(64, (x, n) => {
      const g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.55, 'rgba(255,255,255,0.85)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, n, n);
    });
  }
  return softDot;
}

let streak = null;
/** 세로 빗줄기 */
export function streakTexture() {
  if (!streak) {
    streak = canvasTex(64, (x, n) => {
      const g = x.createLinearGradient(0, 0, 0, n);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.9)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.fillRect(n / 2 - 1.5, 0, 3, n);
    });
  }
  return streak;
}

/** position·color·normal(+glow)만 가진 비인덱스 지오메트리 합치기 (입력은 dispose) */
export function mergeSimple(list) {
  const out = new THREE.BufferGeometry();
  const names = ['position', 'color', 'normal'];
  for (const n of names) {
    const total = list.reduce((k, g) => k + g.attributes[n].array.length, 0);
    const arr = new Float32Array(total);
    let o = 0;
    for (const g of list) {
      arr.set(g.attributes[n].array, o);
      o += g.attributes[n].array.length;
    }
    out.setAttribute(n, new THREE.BufferAttribute(arr, 3));
  }
  list.forEach((g) => g.dispose());
  out.computeBoundingSphere();
  return out;
}
