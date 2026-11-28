/**
 * 여행 계획(시드 랜덤): 구간 배열 · 정지 이벤트(신호등·건널목) · 경운기 · 고유 이벤트 · 날씨.
 * 이벤트는 구간 경계와 서로 120m 이상 떨어뜨려 겹치지 않게 놓는다.
 */
import { CONFIG, DESTINATIONS, WEATHERS } from './config.js';
import { rng } from './geo.js';
import { CARGOS } from './models.js';

const SC = CONFIG.schedule;

function pickWeather(r) {
  const keys = Object.keys(WEATHERS);
  const total = keys.reduce((k, n) => k + WEATHERS[n].weight, 0);
  let x = r() * total;
  for (const k of keys) {
    x -= WEATHERS[k].weight;
    if (x < 0) return k;
  }
  return 'clear';
}

/**
 * @param {string} destKey sea | zoo | grandma | park
 * @param {{weather?: string, seed?: number}} opts
 */
export function planTrip(destKey, opts = {}) {
  const def = DESTINATIONS[destKey];
  const seed = opts.seed == null ? Math.floor(Math.random() * 1e9) : opts.seed;
  const r = rng(seed);
  const weather = opts.weather && WEATHERS[opts.weather] ? opts.weather : pickWeather(r);

  let acc = 0;
  const segments = def.segments.map((g) => {
    const seg = { theme: g.theme, start: acc, end: acc + g.length };
    acc += g.length;
    return seg;
  });
  const length = acc;
  const arrivalS = length - SC.arrivalBack;

  // 고유 이벤트
  const u = def.unique;
  const useg = segments[u.seg];
  const center = useg.start + (useg.end - useg.start) * u.at;
  const unique = { type: u.type, s0: center, s1: center };
  if (u.len) {
    unique.s0 = Math.round(center - u.len / 2);
    unique.s1 = unique.s0 + u.len;
  } else {
    unique.s0 = unique.s1 = Math.round(center);
  }

  const blocked = [
    [-Infinity, SC.startClear],
    [arrivalS - SC.endClear, Infinity],
    [unique.s0 - SC.minGap, unique.s1 + SC.minGap],
  ];
  for (let i = 1; i < segments.length; i++) {
    const b = segments[i].start;
    blocked.push([b - SC.boundaryClear, b + SC.boundaryClear]);
  }
  const placed = [];
  const themeAtS = (s) => (segments.find((g) => s >= g.start && s < g.end) || segments[segments.length - 1]).theme;
  const ok = (s, avoidThemes) => {
    if (blocked.some(([a, b]) => s > a && s < b)) return false;
    if (placed.some((p) => Math.abs(p - s) < SC.minGap)) return false;
    return !avoidThemes.includes(themeAtS(s));
  };
  const place = (avoidThemes) => {
    for (let k = 0; k < 400; k++) {
      const s = Math.round(SC.startClear + r() * (arrivalS - SC.endClear - SC.startClear));
      if (ok(s, avoidThemes)) {
        placed.push(s);
        return s;
      }
    }
    return null;
  };

  const lightCount = 2 + (r() < 0.5 ? 1 : 0);
  const lights = [];
  for (let i = 0; i < lightCount; i++) {
    const s = place(['bridge']);
    if (s != null) lights.push(s);
  }
  lights.sort((a, b) => a - b);
  const tractorCount = 1 + (r() < 0.5 ? 1 : 0);
  const tractors = [];
  for (let i = 0; i < tractorCount; i++) {
    const s = place(['market']);
    if (s != null) tractors.push({ s, trigger: s - CONFIG.tractor.spawnAhead, cargo: CARGOS[Math.floor(r() * CARGOS.length)] });
  }
  tractors.sort((a, b) => a.s - b.s);

  const stops = lights.map((s, i) => ({ type: 'light', s, state: i === 0 || r() < 0.5 ? 'red' : 'green' }));
  if (unique.type === 'train') stops.push({ type: 'train', s: unique.s0, state: 'red' });
  stops.sort((a, b) => a.s - b.s);

  const straight = [[0, 0]];
  for (const st of stops) straight.push([st.s - 5, st.s + 12]);
  if (unique.type === 'tunnel') straight.push([unique.s0 - 10, unique.s1 + 10]);
  if (unique.type === 'wash') straight.push([unique.s0 - CONFIG.wash.slowFrom, unique.s1]);
  for (const g of segments) if (g.theme === 'bridge') straight.push([g.start - 10, g.end + 10]);
  straight.push([arrivalS - 20, arrivalS + 90]);

  const boats = [];
  for (const g of segments) {
    if (g.theme !== 'bridge') continue;
    const n = 1 + (r() < 0.6 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      boats.push({ s: g.start + 60 + r() * (g.end - g.start - 120), d: (r() < 0.5 ? -1 : 1) * (38 + r() * 40), phase: r() * 6 });
    }
  }

  return {
    dest: destKey,
    def,
    seed,
    weather,
    rand: r,
    segments,
    length,
    arrivalS,
    unique,
    stops,
    tractors,
    straight,
    boats,
  };
}

/** 구간 블렌드: s에서 {a, b, t} (t=0이면 a만, 1이면 b만) */
export function themeBlend(trip, s) {
  const segs = trip.segments;
  const half = CONFIG.world.themeBlend / 2;
  for (let i = 0; i < segs.length; i++) {
    const g = segs[i];
    if (s < g.end || i === segs.length - 1) {
      if (i < segs.length - 1 && s > g.end - half) {
        return { a: g.theme, b: segs[i + 1].theme, t: (s - (g.end - half)) / (2 * half) };
      }
      if (i > 0 && s < g.start + half) {
        return { a: segs[i - 1].theme, b: g.theme, t: (s - (g.start - half)) / (2 * half) };
      }
      return { a: g.theme, b: g.theme, t: 0 };
    }
  }
  return { a: segs[0].theme, b: segs[0].theme, t: 0 };
}

/** 이 지점의 대표 테마 (블렌드 중간에서 바뀜) */
export function themeAt(trip, s) {
  const bl = themeBlend(trip, s);
  return bl.t < 0.5 ? bl.a : bl.b;
}
