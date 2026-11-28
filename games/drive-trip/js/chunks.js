/**
 * 청크(40m) 생성기 — 구간 테마별 노변 단면 + 장식 함수. 제너레이터라서 프레임 예산 안에서 나눠 만든다.
 * 테마 전환 구간은 지면색 lerp + 소품 확률 혼합(own)으로 이음새를 감춘다.
 */
import * as THREE from '../vendor/three.module.min.js';
import { CONFIG, PALETTE, THEMES } from './config.js';
import { roadPoint, roadYaw } from './road.js';
import { GeoBuilder, ribbon, wall, rng, pick } from './geo.js';
import { themeBlend, themeAt } from './trip.js';
import { addHouse, addLamp, addFence, addBush, addPlanter } from './models.js';
import {
  addScarecrow,
  addGreenhouse,
  addRock,
  addLighthouse,
  addMushroom,
  addLog,
  addStoneWall,
  addJangdok,
  addHanok,
  addStall,
  addShop,
  addBunting,
  addBridgeArch,
  addPier,
  TUNNEL_SECTION,
} from './props.js';

const RD = CONFIG.road;
const W = CONFIG.world;
const P = PALETTE;
const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3(1, 1, 1);
const _m = new THREE.Matrix4();
const _c = new THREE.Color();
const _c2 = new THREE.Color();
const pv = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];

export function frameAt(s, d, y, extraYaw, out) {
  roadPoint(s, d, y, _v);
  _q.setFromAxisAngle(UP, roadYaw(s) + extraYaw);
  return out.compose(_v, _q, _s);
}

function grassHeight(s, d, hill) {
  const a = Math.abs(d);
  if (a < 24) return 0;
  const ramp = Math.min(1, (a - 24) / 20);
  const n = 0.55 * Math.sin(s * 0.043 + d * 0.11) + 0.45 * Math.sin(s * 0.019 - d * 0.07 + 1.3);
  return ramp * (0.9 + n) * 1.3 * hill;
}


export class ChunkBuilder {
  constructor(trip) {
    this.trip = trip;
    this.lights = trip.stops.filter((x) => x.type === 'light').map((x) => x.s);
    const train = trip.stops.find((x) => x.type === 'train');
    this.trackS = train ? train.s + CONFIG.train.trackOffset : null;
    this.trainStop = train ? train.s : null;
    const u = trip.unique;
    this.tunnel = u.type === 'tunnel' ? [u.s0, u.s1] : null;
    this.seaView = u.type === 'seaView' ? [u.s0, u.s1] : null;
    this.arrival = trip.arrivalS;
    const coast = trip.segments.find((g) => g.theme === 'coast');
    this.lighthouseS = null;
    if (coast) {
      let s = coast.start + 110;
      if (this.seaView && s > this.seaView[0] - 60) s = Math.min(coast.end - 140, this.seaView[1] + 90);
      this.lighthouseS = s;
    }
  }

  rowTheme(s) {
    return themeAt(this.trip, s);
  }

  /** 소품 단위 테마 소유 (블렌드 구간에선 확률로 섞음) */
  own(s, theme, r) {
    const bl = themeBlend(this.trip, s);
    if (bl.a === bl.b) return bl.a === theme;
    return (r() < bl.t ? bl.b : bl.a) === theme;
  }

  groundColor(s, out) {
    const bl = themeBlend(this.trip, s);
    out.set(THEMES[bl.a].ground);
    if (bl.t > 0) out.lerp(_c2.set(THEMES[bl.b].ground), bl.t);
    return out;
  }

  /** 소품을 놓아도 되는지 (횡단보도·선로·터널·도착지·차고 주변 비움) */
  clear(s, d) {
    const a = Math.abs(d);
    for (const L of this.lights) if (s > L - 12 && s < L + 14 && a < 26) return false;
    if (this.trackS != null && s > this.trackS - 12 && s < this.trackS + 9) return false;
    if (this.tunnel && s > this.tunnel[0] - 14 && s < this.tunnel[1] + 12 && a < 48) return false;
    if (s > this.arrival - 14 && s < this.arrival + 110 && a < 90) return false;
    if (s > -10 && s < 8 && d > 2 && d < 16) return false;
    return true;
  }

  inTunnel(s) {
    return this.tunnel && s >= this.tunnel[0] && s <= this.tunnel[1];
  }

  /**
   * @returns 제너레이터 — 끝나면 { geometry, water, trees }
   */
  *build(index) {
    const s0 = index * W.chunkLen;
    const s1 = s0 + W.chunkLen;
    const r = rng(index * 9973 + 17 + this.trip.seed * 13);
    const b = new GeoBuilder();
    const wb = new GeoBuilder();
    const trees = [];
    const ctx = { b, wb, trees, r, s0, s1 };

    this.road(ctx);
    yield;
    this.sides(ctx);
    yield;
    this.events(ctx);
    yield;
    const done = new Set();
    for (let s = s0 + 1; s < s1; s += 10) done.add(this.rowTheme(s));
    const bl0 = themeBlend(this.trip, s0);
    const bl1 = themeBlend(this.trip, s1);
    for (const t of [bl0.a, bl0.b, bl1.a, bl1.b]) done.add(t);
    for (const theme of done) {
      const fn = this['decor_' + theme];
      if (fn) {
        fn.call(this, ctx, theme);
        yield;
      }
    }
    return {
      geometry: b.build(),
      water: wb.pos.length ? wb.build() : null,
      trees,
    };
  }

  /* ---------- 노면 · 차선 ---------- */

  road({ b, s0, s1 }) {
    b.setGlow(-1);
    ribbon(b, s0, s1, RD.edgeL, 7.0, 0, P.asphalt, W.rowStep);
    ribbon(b, s0, s1, 7.0, RD.edgeR, 0, P.shoulder, W.rowStep);
    for (let s = s0; s < s1 - 1e-6; s += 1) {
      const sm = s + 0.5;
      let inCross = false;
      let nearStop = false;
      for (const L of this.lights) {
        if (sm > L - 0.6 && sm < L + 7.2) inCross = true;
        if (sm > L - 30 && sm <= L) nearStop = true;
      }
      if (this.trackS != null) {
        if (sm > this.trackS - 2.2 && sm < this.trackS + 2.2) inCross = true;
        if (sm > this.trainStop - 30 && sm <= this.trainStop) nearStop = true;
        if (sm > this.trainStop - 0.6 && sm < this.trainStop + 0.2) inCross = true;
      }
      if (sm > this.arrival - 3 && sm < this.arrival + 3) inCross = true;
      const y = 0.012;
      ribbon(b, s, s + 1, -3.62, -3.47, y, P.white, 1);
      ribbon(b, s, s + 1, 6.93, 7.08, y, P.white, 1);
      if (inCross) continue;
      ribbon(b, s, s + 1, -0.22, -0.08, y, P.yellow, 1);
      ribbon(b, s, s + 1, 0.08, 0.22, y, P.yellow, 1);
      const m8 = ((sm % 8) + 8) % 8;
      if (nearStop || m8 < 3) ribbon(b, s, s + 1, 3.43, 3.57, y, P.white, 1);
    }
    b.setGlow(0);
  }

  /* ---------- 노변 단면 (2m 행마다 테마별) ---------- */

  sides(ctx) {
    const { b, wb, s0, s1, r } = ctx;
    const step = W.rowStep;
    const ch = RD.curbH;
    for (let sa = s0; sa < s1 - 1e-6; sa += step) {
      const sb = sa + step;
      const sm = (sa + sb) / 2;
      const theme = this.rowTheme(sm);
      const kind = THEMES[theme].side;
      const tile = Math.floor(sm / 2) % 2 === 0 ? P.walkA : P.walkB;
      const gc = this.groundColor(sm, _c).getHex();
      const tun = this.inTunnel(sm);
      const hill = theme === 'forest' || theme === 'coast' ? 1.8 : theme === 'country' ? 1.3 : 1;

      // 오른쪽
      let edgeR;
      if (kind === 'walk') {
        ribbon(b, sa, sb, RD.edgeR, RD.edgeR + RD.curbW, ch, P.curb, step);
        wall(b, sa, sb, RD.edgeR, 0, ch, P.curb, -1, step);
        ribbon(b, sa, sb, RD.edgeR + RD.curbW, 12.8, ch, tile, step);
        wall(b, sa, sb, 12.8, 0, ch, P.walkB, 1, step);
        edgeR = 12.8;
      } else if (kind === 'deck') {
        ribbon(b, sa, sb, RD.edgeR, 10.8, ch, P.curb, step);
        wall(b, sa, sb, RD.edgeR, 0, ch, P.curb, -1, step);
        wall(b, sa, sb, 10.8, -1.0, ch, 0xe9e4da, 1, step);
        edgeR = null;
      } else if (theme === 'coast') {
        ribbon(b, sa, sb, RD.edgeR, 10.6, 0.02, P.verge, step);
        wall(b, sa, sb, 10.6, 0, 0.45, 0xf1ece2, -1, step);
        ribbon(b, sa, sb, 10.6, 11.4, 0.45, 0xfaf6ee, step);
        wall(b, sa, sb, 11.4, W.waterY - 0.3, 0.45, 0xe2dccf, 1, step);
        ribbon(b, sa, sb, 11.4, 12.4, W.waterY + 0.03, 0xffffff, step);
        edgeR = null;
      } else {
        ribbon(b, sa, sb, RD.edgeR, 11.0, 0.02, tun ? P.curb : P.verge, step);
        edgeR = 11.0;
      }
      if (edgeR != null) this.ground(b, sa, sb, [edgeR, edgeR + 2.2, edgeR + 6, 24, 31, 42, 56, 74, 104, 165], gc, r, hill);
      else ribbon(wb, sa, sb, kind === 'deck' ? 10.8 : 11.4, 270, kind === 'deck' ? W.riverY : W.waterY, 0xffffff, step);

      // 왼쪽
      let edgeL;
      if (kind === 'walk') {
        ribbon(b, sa, sb, RD.edgeL - RD.curbW, RD.edgeL, ch, P.curb, step);
        wall(b, sa, sb, RD.edgeL, 0, ch, P.curb, 1, step);
        ribbon(b, sa, sb, -7.3, RD.edgeL - RD.curbW, ch, tile, step);
        wall(b, sa, sb, -7.3, 0, ch, P.walkB, -1, step);
        edgeL = -7.3;
      } else if (kind === 'deck') {
        ribbon(b, sa, sb, -5.3, RD.edgeL, ch, P.curb, step);
        wall(b, sa, sb, RD.edgeL, 0, ch, P.curb, 1, step);
        wall(b, sa, sb, -5.3, -1.0, ch, 0xe9e4da, -1, step);
        ribbon(b, sa, sb, -5.3, 10.8, -1.0, 0xd8d2c6, step);
        edgeL = null;
      } else {
        ribbon(b, sa, sb, -5.5, RD.edgeL, 0.02, tun ? P.curb : P.verge, step);
        edgeL = -5.5;
      }
      if (edgeL != null) this.ground(b, sa, sb, [-165, -104, -74, -56, -42, -31, -24, edgeL - 6, edgeL - 2.2, edgeL], gc, r, hill);
      else ribbon(wb, sa, sb, -270, -5.3, W.riverY, 0xffffff, step);

      if (tun) this.tunnelRow(b, sa, sb);
    }
  }

  ground(b, sa, sb, cols, color, r, hill) {
    for (let j = 0; j < cols.length - 1; j++) {
      const da = cols[j];
      const db = cols[j + 1];
      roadPoint(sa, da, grassHeight(sa, da, hill), pv[0]);
      roadPoint(sa, db, grassHeight(sa, db, hill), pv[1]);
      roadPoint(sb, db, grassHeight(sb, db, hill), pv[2]);
      roadPoint(sb, da, grassHeight(sb, da, hill), pv[3]);
      _c.set(color).multiplyScalar(1 + (r() - 0.5) * 0.09);
      b.tri(pv[0], pv[1], pv[2], _c.getHex(), UP);
      _c.set(color).multiplyScalar(1 + (r() - 0.5) * 0.09);
      b.tri(pv[0], pv[2], pv[3], _c.getHex(), UP);
    }
  }

  /** 터널 안쪽 아치 (안쪽을 보는 면) + 주황 조명 줄 */
  tunnelRow(b, sa, sb) {
    const sec = TUNNEL_SECTION;
    const band = Math.floor(sa / 4) % 2 === 0;
    const center = new THREE.Vector3();
    for (let i = 0; i < sec.length - 1; i++) {
      const [d0, y0] = sec[i];
      const [d1, y1] = sec[i + 1];
      roadPoint(sa, d0, y0, pv[0]);
      roadPoint(sa, d1, y1, pv[1]);
      roadPoint(sb, d1, y1, pv[2]);
      roadPoint(sb, d0, y0, pv[3]);
      roadPoint((sa + sb) / 2, 2.75, 3.2, center);
      const mid = pv[0].clone().add(pv[2]).multiplyScalar(0.5);
      const hint = center.sub(mid);
      const ceiling = y0 > 5 && y1 > 5;
      const c = ceiling ? 0xefe4d6 : band ? 0xfaf0e2 : 0xf1e4d0;
      b.quad(pv[0], pv[1], pv[2], pv[3], c, hint);
    }
    if (Math.floor(sa) % 6 === 0) {
      b.setGlow(2);
      for (const [d, y] of [
        [-4.6, 4.6],
        [10.1, 4.6],
      ]) {
        frameAt(sa + 1, d, y, 0, _m);
        b.part('box', new THREE.Matrix4().makeScale(0.18, 0.22, 1.4).premultiply(_m), 0xffb45e);
      }
      b.setGlow(0);
    }
  }

  /* ---------- 이벤트 지형 (횡단보도·선로) ---------- */

  events({ b, s0, s1 }) {
    for (const L of this.lights) {
      const c0 = L + 1.5;
      const c1 = L + 5.5;
      if (c1 < s0 || c0 > s1) continue;
      const a = Math.max(c0, s0);
      const z = Math.min(c1, s1);
      if (z > a) {
        b.setGlow(-1);
        for (let d = -3.75; d < RD.edgeR - 0.4; d += 1.0) ribbon(b, a, z, d, d + 0.55, 0.013, P.white, 1);
        b.setGlow(0);
        const kR = THEMES[this.rowTheme(L)].side === 'walk';
        ribbon(b, a, z, kR ? 12.8 : 11, 22, 0.03, P.path, 2);
        ribbon(b, a, z, -22, kR ? -7.3 : -5.5, 0.03, P.path, 2);
      }
      const o0 = L + 6.6;
      if (o0 >= s0 && o0 < s1) ribbon(b, o0, Math.min(o0 + 0.45, s1), -3.45, -0.15, 0.014, P.white, 0.5);
    }
    if (this.trackS != null && this.trackS >= s0 && this.trackS < s1) {
      const t = this.trackS;
      b.setGlow(-1);
      ribbon(b, t - 1.9, t + 1.9, RD.edgeL, RD.edgeR, 0.02, 0x6f7486, 0.5);
      b.setGlow(0);
      frameAt(t, 0, 0, 0, _m);
      const yaw = new THREE.Matrix4();
      for (const side of [-1, 1]) {
        const dStart = side > 0 ? RD.edgeR : RD.edgeL;
        const len = 120;
        const mid = dStart + side * (len / 2);
        yaw.makeScale(len, 0.12, 3.4).setPosition(mid, 0.06, 0).premultiply(_m);
        b.part('box', yaw, 0xc8c2b6);
        for (let k = 0; k < len; k += 1.3) {
          yaw.makeScale(0.32, 0.12, 2.8).setPosition(dStart + side * k, 0.16, 0).premultiply(_m);
          b.part('box', yaw, 0x9b7653);
        }
      }
      for (const rz of [-0.75, 0.75]) {
        yaw.makeScale(260, 0.14, 0.12).setPosition(2.75, 0.2, rz).premultiply(_m);
        b.part('box', yaw, 0x8b93a6);
      }
      const o0 = this.trainStop + CONFIG.train.trackOffset + 2.8;
      ribbon(b, o0, o0 + 0.45, -3.45, -0.15, 0.014, P.white, 0.5);
    }
  }

  /* ---------- 장식 공통 ---------- */

  frame(s, d, yaw) {
    return frameAt(s, d, 0, yaw, _m);
  }

  addTree(ctx, s, d, kind, scale, y = 0) {
    roadPoint(s, d, y, _v);
    ctx.trees.push({ kind, x: _v.x, y: _v.y, z: _v.z, s, d, scale, rot: ctx.r() * Math.PI * 2, tint: 0.92 + ctx.r() * 0.16 });
  }

  perch(ctx, s, d, h) {
    roadPoint(s, d, 0, _v);
    ctx.trees.push({ kind: null, x: _v.x, y: _v.y, z: _v.z, s, d, scale: h / 4.2 });
  }

  farTrees(ctx, theme, n, kinds) {
    const { r, s0 } = ctx;
    for (let i = 0; i < n; i++) {
      const s = s0 + r() * W.chunkLen;
      const side = r() < 0.5 ? 1 : -1;
      if (theme === 'coast' && side > 0) continue;
      const d = side * (28 + r() * 34);
      if (!this.own(s, theme, r) || !this.clear(s, d)) continue;
      const hill = theme === 'forest' || theme === 'coast' ? 1.8 : 1;
      this.addTree(ctx, s, d, pick(r, kinds), 0.9 + r() * 0.6, grassHeight(s, d, hill));
    }
  }

  bushes(ctx, theme, n, dR, dL) {
    const { b, r, s0 } = ctx;
    for (let i = 0; i < n; i++) {
      const s = s0 + r() * W.chunkLen;
      const side = dR == null || r() < 0.5 ? -1 : 1;
      const d = side > 0 ? dR + r() * 1.6 : dL - r() * 1.5;
      if (!this.own(s, theme, r) || !this.clear(s, d)) continue;
      addBush(b, this.frame(s, d, r() * 6), r, THEMES[theme].flowers);
    }
  }

  houses(ctx, theme, fn, fronts) {
    const { b, r, s0, s1 } = ctx;
    for (const side of [1, -1]) {
      const front = side > 0 ? fronts[0] : fronts[1];
      if (front == null) continue;
      let cur = s0 + r() * 3;
      while (cur < s1) {
        const est = 7.8;
        const sc = cur + est / 2;
        if (sc + est / 2 > s1 || !this.clear(sc, front) || !this.own(sc, theme, r) || r() > 0.85) {
          cur += 6;
          continue;
        }
        const hr = rng(Math.floor(cur * 13) + side * 7 + ctx.s0);
        const d = front + side * 2.7;
        frameAt(sc, d, 0, side > 0 ? -Math.PI / 2 : Math.PI / 2, _m);
        fn(b, _m, hr);
        cur += est + 3 + r() * 6;
        if (r() < 0.6 && this.clear(cur - 2, side * 15)) {
          this.addTree(ctx, cur - 2, side > 0 ? fronts[0] - 1.8 : fronts[1] + 1.8, r() < 0.5 ? 'pine' : 'round', 0.8 + r() * 0.3);
        }
      }
    }
  }

  /* ---------- 테마별 장식 ---------- */

  decor_town(ctx, theme) {
    const { b, r, s0, s1 } = ctx;
    const T = THEMES.town;
    for (let s = s0; s < s1 - 0.1; s += 4) {
      const sm = s + 2;
      if (!this.own(sm, theme, r)) continue;
      if (this.clear(sm, 13.35)) addFence(b, this.frame(sm, 13.35, Math.PI / 2), 4);
      if (this.clear(sm, -7.85)) addFence(b, this.frame(sm, -7.85, -Math.PI / 2), 4);
    }
    for (let s = Math.ceil(s0 / 30) * 30; s < s1; s += 30) {
      if (this.own(s, theme, r) && this.clear(s, 12.2) && !this.inTunnel(s)) addLamp(b, this.frame(s, 12.2, 0));
    }
    for (let s = Math.ceil((s0 - 8) / 16) * 16 + 8; s < s1; s += 16) {
      if (!this.own(s, theme, r)) continue;
      for (const d of [11.9, -6.4]) {
        if (!this.clear(s, d)) continue;
        addPlanter(b, this.frame(s, d, 0));
        this.addTree(ctx, s, d, r() < T.blossom ? 'blossom' : 'round', 0.85 + r() * 0.2);
      }
    }
    this.houses(ctx, theme, (bb, M, hr) => addHouse(bb, M, hr, T), [17.2, -12.2]);
    this.bushes(ctx, theme, 5, 14.1, -8.6);
    this.farTrees(ctx, theme, T.farTrees, ['pine', 'round', 'round', 'blossom']);
  }

  decor_market(ctx, theme) {
    const { b, r, s0, s1 } = ctx;
    const T = THEMES.market;
    for (const side of [1, -1]) {
      for (let s = s0 + 2.2; s < s1 - 2; s += 4.4) {
        const d = side > 0 ? 14.4 : -8.9;
        if (!this.own(s, theme, r) || !this.clear(s, d) || r() < 0.12) continue;
        addStall(b, this.frame(s, d, side > 0 ? -Math.PI / 2 : Math.PI / 2), r, pick(r, T.awnings));
        if (r() < 0.3) this.perch(ctx, s, d, 3.0);
      }
    }
    this.houses(ctx, theme, (bb, M, hr) => addShop(bb, M, hr, T), [17.8, -12.6]);
    for (let s = Math.ceil(s0 / 32) * 32 + 6; s < s1; s += 32) {
      if (!this.own(s, theme, r) || !this.clear(s, 0)) continue;
      frameAt(s, 0, 0, 0, _m);
      addBunting(b, -7.0, 12.6, 6.4, _m.clone());
      for (const d of [-7.1, 12.7]) {
        const Mp = this.frame(s, d, 0);
        b.part('cyl6', new THREE.Matrix4().makeScale(0.16, 6.6, 0.16).setPosition(0, 3.3, 0).premultiply(Mp), 0xffffff);
      }
    }
    for (let s = Math.ceil(s0 / 24) * 24 + 12; s < s1; s += 24) {
      if (this.own(s, theme, r) && this.clear(s, 12.2)) addLamp(b, this.frame(s, 12.2, 0));
    }
    this.farTrees(ctx, theme, T.farTrees, ['round', 'blossom']);
  }

  decor_farm(ctx, theme) {
    const { b, r, s0, s1 } = ctx;
    const cellColors = [0x9fd36a, 0xb4de7e, 0x8fcf8a, 0xa6dcc3, 0xc4e38c];
    const ghSide = r() < 0.45 ? (r() < 0.5 ? 1 : -1) : 0;
    for (let sc = Math.floor(s0 / 10) * 10; sc < s1; sc += 10) {
      const a = Math.max(sc, s0);
      const z = Math.min(sc + 10, s1);
      if (z - a < 0.5) continue;
      const sm = (a + z) / 2;
      if (this.rowTheme(sm) !== 'farm') continue;
      for (const side of [1, -1]) {
        for (let k = 0; k < 6; k++) {
          const dIn = side > 0 ? 12 + k * 9 : -6.5 - k * 9;
          const dOut = dIn + side * 9;
          const d0 = Math.min(dIn, dOut);
          const d1 = Math.max(dIn, dOut);
          if (!this.clear(sm, (d0 + d1) / 2)) continue;
          if (ghSide === side && k >= 1 && k <= 3) continue;
          const hc = rng(Math.floor(sc) * 31 + k * 7 + side);
          ribbon(b, a + 0.3, z - 0.3, d0 + 0.3, d1 - 0.3, 0.05, pick(hc, cellColors), z - a);
          ribbon(b, a, z, d0, d0 + 0.3, 0.12, 0xb9b07a, z - a);
          if (sc + 10 <= s1) ribbon(b, z - 0.3, z, d0, d1, 0.12, 0xb9b07a, 1);
        }
      }
    }
    if (ghSide) {
      const s = s0 + 8 + r() * 20;
      if (this.own(s, theme, r)) {
        for (let k = 0; k < 3; k++) {
          const d = ghSide > 0 ? 24 + k * 7 : -19 - k * 7;
          if (this.clear(s, d)) addGreenhouse(b, this.frame(s, d, 0), 14);
        }
      }
    }
    if (r() < 0.7) {
      const s = s0 + 5 + r() * 30;
      const d = (r() < 0.5 ? 1 : -1) * (16 + r() * 14);
      if (this.own(s, theme, r) && this.clear(s, d)) {
        addScarecrow(b, this.frame(s, d, r() < 0.5 ? -Math.PI / 2 : Math.PI / 2), r);
        this.perch(ctx, s, d, 2.6);
      }
    }
    this.bushes(ctx, theme, 2, 11.2, -5.8);
    this.farTrees(ctx, theme, THEMES.farm.farTrees, ['round', 'pine']);
  }

  decor_coast(ctx, theme) {
    const { b, r, s0, s1 } = ctx;
    const T = THEMES.coast;
    for (let s = s0 + 1.5; s < s1; s += 3.2) {
      if (!this.own(s, theme, r) || this.rowTheme(s) !== 'coast') continue;
      const d = 12.6 + r() * 3;
      frameAt(s, d, W.waterY + 0.2, r() * 6, _m);
      addRock(b, _m, r, 0.9 + r() * 0.8);
      if (r() < 0.15) this.perch(ctx, s, d, 1.4);
    }
    if (this.lighthouseS != null && this.lighthouseS >= s0 && this.lighthouseS < s1) {
      const s = this.lighthouseS;
      frameAt(s, 11.4, 0, 0, _m);
      b.part('box', new THREE.Matrix4().makeScale(26, 0.6, 4).setPosition(13, 0.3 - 0.05, 0).premultiply(_m), 0xe6e0d6);
      b.part('box', new THREE.Matrix4().makeScale(26, 1.8, 3.6).setPosition(13, -0.9, 0).premultiply(_m), 0xd8d2c6);
      frameAt(s, 37, 0.6, 0, _m);
      addLighthouse(b, _m);
    }
    for (let s = Math.ceil(s0 / 8) * 8; s < s1; s += 8) {
      if (!this.own(s, theme, r) || this.rowTheme(s) !== 'coast') continue;
      frameAt(s, 11.0, 0.45, 0, _m);
      b.part('box', new THREE.Matrix4().makeScale(0.16, 0.7, 0.16).setPosition(0, 0.35, 0).premultiply(_m), 0xffffff);
    }
    this.houses(ctx, theme, (bb, M, hr) => addHouse(bb, M, hr, T), [null, -11.5]);
    for (let i = 0; i < 6; i++) {
      const s = s0 + r() * W.chunkLen;
      const d = -7 - r() * 6;
      if (this.own(s, theme, r) && this.clear(s, d)) this.addTree(ctx, s, d, 'pine', 0.8 + r() * 0.4);
    }
    this.bushes(ctx, theme, 2, null, -6);
    this.farTrees(ctx, theme, T.farTrees, ['pine', 'pine', 'round']);
  }

  decor_forest(ctx, theme) {
    const { b, r, s0 } = ctx;
    for (const side of [1, -1]) {
      for (let i = 0; i < 22; i++) {
        const s = s0 + r() * W.chunkLen;
        const d = side * (12.5 + Math.pow(r(), 1.4) * 44);
        if (!this.own(s, theme, r) || !this.clear(s, d)) continue;
        const kind = r() < 0.6 ? 'pine' : r() < 0.93 ? 'round' : 'blossom';
        this.addTree(ctx, s, d, kind, 0.85 + r() * 0.55, grassHeight(s, d, 1.8));
      }
    }
    for (let i = 0; i < 5; i++) {
      const s = s0 + r() * W.chunkLen;
      const side = r() < 0.5 ? 1 : -1;
      const d = side > 0 ? 11.4 + r() * 1.6 : -5.9 - r() * 1.5;
      if (this.own(s, theme, r) && this.clear(s, d)) addMushroom(b, this.frame(s, d, r() * 6), r);
    }
    if (r() < 0.5) {
      const s = s0 + r() * W.chunkLen;
      const d = r() < 0.5 ? 13.5 : -8;
      if (this.own(s, theme, r) && this.clear(s, d)) addLog(b, this.frame(s, d, r() * 1.2 - 0.6));
    }
    this.bushes(ctx, theme, 5, 11.6, -6.0);
    this.farTrees(ctx, theme, THEMES.forest.farTrees, ['pine', 'round']);
  }

  decor_country(ctx, theme) {
    const { b, r, s0, s1 } = ctx;
    for (let s = s0; s < s1 - 0.1; s += 4) {
      const sm = s + 2;
      if (!this.own(sm, theme, r)) continue;
      if (this.clear(sm, 12.6) && r() > 0.1) addStoneWall(b, this.frame(sm, 12.6, Math.PI / 2), 4.05, r);
      if (this.clear(sm, -6.8) && r() > 0.1) addStoneWall(b, this.frame(sm, -6.8, -Math.PI / 2), 4.05, r);
    }
    for (let i = 0; i < 4; i++) {
      const s = s0 + r() * W.chunkLen;
      const d = r() < 0.5 ? 15 + r() * 6 : -9.5 - r() * 6;
      if (this.own(s, theme, r) && this.clear(s, d)) this.addTree(ctx, s, d, 'persimmon', 0.85 + r() * 0.25);
    }
    if (r() < 0.6) {
      const side = r() < 0.5 ? 1 : -1;
      const s = s0 + 8 + r() * 24;
      const d = side > 0 ? 21 : -15;
      if (this.own(s, theme, r) && this.clear(s, d)) {
        addHanok(b, this.frame(s, d, side > 0 ? -Math.PI / 2 : Math.PI / 2), r);
        if (r() < 0.6 && this.clear(s + 7, d)) addJangdok(b, this.frame(s + 7, side * 15.5, side > 0 ? -Math.PI / 2 : Math.PI / 2), r);
      }
    }
    this.bushes(ctx, theme, 3, 11.3, -5.8);
    this.farTrees(ctx, theme, THEMES.country.farTrees, ['round', 'pine', 'persimmon']);
  }

  decor_bridge(ctx) {
    const { b, r, s0, s1 } = ctx;
    for (let s = s0; s < s1 - 0.01; s += 2) {
      const sm = s + 1;
      if (this.rowTheme(sm) !== 'bridge') continue;
      for (const d of [10.65, -5.15]) {
        const Mp = this.frame(s, d, 0);
        b.part('box', new THREE.Matrix4().makeScale(0.14, 1.0, 0.14).setPosition(0, 0.65, 0).premultiply(Mp), 0xffffff);
        const Mr = this.frame(sm, d, 0);
        b.part('box', new THREE.Matrix4().makeScale(0.18, 0.14, 2.05).setPosition(0, 1.15, 0).premultiply(Mr), 0x7cc6fe);
        b.part('box', new THREE.Matrix4().makeScale(0.08, 0.08, 2.05).setPosition(0, 0.65, 0).premultiply(Mr), 0xffffff);
      }
    }
    for (let s = Math.ceil(s0 / 40) * 40; s < s1; s += 40) {
      if (this.rowTheme(s + 20) !== 'bridge' || this.rowTheme(s) !== 'bridge') continue;
      for (const d of [10.65, -5.15]) {
        frameAt(s, d, 0, 0, _m);
        addBridgeArch(b, _m.clone(), 36, 6.2, 0x7cc6fe);
      }
      for (const d of [-1.5, 7.0]) addPier(b, this.frame(s, d, 0));
    }
  }
}
