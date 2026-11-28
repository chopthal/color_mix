/**
 * 도로 중심선: 진행 거리 s(호 길이) → 월드 좌표.
 * 곡률 κ(s)를 적분해 표로 만든다 → 직선 구간(정지 이벤트·터널·다리·도착)은 κ=0이 보장되고 이음새가 매끈하다.
 * 월드 규약: 진행 방향 ≈ -Z, 오른쪽 = +X (우측통행, d>0 이 우리 쪽).
 */
import { CONFIG } from './config.js';

const TAU = Math.PI * 2;
const R = CONFIG.road;
const STEP = R.tableStep;

let S0 = -300;
let N = 0;
let X = new Float64Array(0);
let Z = new Float64Array(0);
let H = new Float64Array(0);

function smooth01(t) {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
}

/**
 * @param {() => number} rand 시드 랜덤
 * @param {Array<[number, number]>} straight 직선으로 둘 [s0, s1] 구간 목록 (점이면 s0 = s1)
 * @param {number} sMax 표 끝 (여행 길이 + 여유)
 */
export function buildRoad(rand, straight, sMax) {
  const p1 = rand() * TAU;
  const p2 = rand() * TAU;
  const sEnd = sMax + 700;
  N = Math.ceil((sEnd - S0) / STEP) + 1;
  X = new Float64Array(N);
  Z = new Float64Array(N);
  H = new Float64Array(N);
  const mask = (s) => {
    let m = 1;
    for (const [a, b] of straight) {
      const dist = s < a ? a - s : s > b ? s - b : 0;
      m *= smooth01((dist - R.hold) / R.blend);
      if (m === 0) return 0;
    }
    return m;
  };
  const kappa = (s, h) => {
    const k = R.kappa1 * Math.sin((TAU * s) / R.wave1 + p1) + R.kappa2 * Math.sin((TAU * s) / R.wave2 + p2);
    // 방향이 한쪽으로 계속 흐르지 않게 살짝 되돌림
    return (k - h * 0.0035) * mask(s);
  };
  const i0 = Math.round(-S0 / STEP);
  X[i0] = 0;
  Z[i0] = 0;
  H[i0] = 0;
  for (let i = i0; i < N - 1; i++) {
    const s = S0 + i * STEP;
    const hm = H[i] + kappa(s + STEP / 2, H[i]) * (STEP / 2);
    H[i + 1] = H[i] + kappa(s + STEP / 2, hm) * STEP;
    X[i + 1] = X[i] + Math.sin(hm) * STEP;
    Z[i + 1] = Z[i] - Math.cos(hm) * STEP;
  }
  for (let i = i0; i > 0; i--) {
    const s = S0 + i * STEP;
    const hm = H[i] - kappa(s - STEP / 2, H[i]) * (STEP / 2);
    H[i - 1] = H[i] - kappa(s - STEP / 2, hm) * STEP;
    X[i - 1] = X[i] - Math.sin(hm) * STEP;
    Z[i - 1] = Z[i] + Math.cos(hm) * STEP;
  }
}

function sample(s) {
  let f = (s - S0) / STEP;
  if (f < 0) f = 0;
  const last = N - 1;
  if (f >= last) {
    const extra = s - (S0 + last * STEP);
    const h = H[last];
    return [X[last] + Math.sin(h) * extra, Z[last] - Math.cos(h) * extra, h];
  }
  const i = Math.floor(f);
  const t = f - i;
  return [X[i] + (X[i + 1] - X[i]) * t, Z[i] + (Z[i + 1] - Z[i]) * t, H[i] + (H[i + 1] - H[i]) * t];
}

/** (s, d, y) → out(Vector3). d는 중심선(노란선) 기준 오른쪽 + */
export function roadPoint(s, d, y, out) {
  const [x, z, h] = sample(s);
  out.x = x + d * Math.cos(h);
  out.y = y;
  out.z = z + d * Math.sin(h);
  return out;
}

/** 진행 방향을 바라보는 Y축 회전값 (모델 앞쪽 = 로컬 -Z) */
export function roadYaw(s) {
  return -sample(s)[2];
}

/** s는 호 길이이므로 속도 × 시간 그대로 */
export function advance(s, v, dt) {
  return v * dt;
}
