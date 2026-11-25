/**
 * 차곡차곡 블록 놀이방
 * 그리드 스냅 / 슬롯 규칙만 사용 (물리 엔진 없음).
 * 브릭·컵·와플 3방 + 작품 선반 최소 저장 + 정리 소프트 엔딩.
 */
(() => {
  'use strict';

  const MAX_BLOCKS = 40;
  const STORE_KEY = 'v1';
  const DRAG_THRESHOLD = 10;
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COLORS = {
    brick: ['#e85d4c', '#ff9f43', '#f6d860', '#7bc67e', '#5bb8e8', '#b07cc6'],
    cup: ['#e85d4c', '#ff9f43', '#f6d860', '#7bc67e', '#5bb8e8', '#b07cc6'],
    waffle: ['#f0c14a', '#e8916a', '#7bc67e', '#5bb8e8', '#d67bb8'],
  };

  const BRICK_SHAPES = [
    { id: '2x1', w: 2, h: 1 },
    { id: '2x2', w: 2, h: 2 },
    { id: '4x1', w: 4, h: 1 },
  ];

  /** 목표 실루엣: row 0 = 바닥 */
  const BRICK_GOALS = {
    free: { name: '자유롭게', cells: null },
    house: {
      name: '집',
      cells: [
        [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
        [1, 1], [5, 1],
        [1, 2], [5, 2],
        [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
        [2, 4], [3, 4], [4, 4],
        [3, 5],
      ],
    },
    rocket: {
      name: '로켓',
      cells: [
        [2, 0], [4, 0],
        [2, 1], [4, 1],
        [2, 2], [3, 2], [4, 2],
        [2, 3], [3, 3], [4, 3],
        [2, 4], [3, 4], [4, 4],
        [3, 5],
      ],
    },
    duck: {
      name: '오리',
      cells: [
        [1, 0], [2, 0], [4, 0], [5, 0],
        [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
        [2, 2], [3, 2], [4, 2], [5, 2],
        [4, 3], [5, 3],
      ],
    },
  };

  const WAFFLE_GOALS = {
    free: { name: '자유롭게', cells: null },
    flower: {
      name: '꽃',
      cells: [
        [2, 1], [1, 2], [2, 2], [3, 2], [2, 3],
      ],
    },
    butterfly: {
      name: '나비',
      cells: [
        [0, 1], [1, 1], [3, 1], [4, 1],
        [1, 2], [2, 2], [3, 2],
        [0, 3], [1, 3], [3, 3], [4, 3],
      ],
    },
    car: {
      name: '자동차',
      cells: [
        [1, 1], [3, 1],
        [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
        [1, 3], [2, 3], [3, 3],
      ],
    },
  };

  const ROOM_TITLE = {
    brick: '딸깍 브릭',
    cup: '컵 쌓기',
    waffle: '와플 블록',
  };

  const store = window.KidsKit
    ? window.KidsKit.store('blockRoom')
    : {
        get(_k, fb) {
          return fb;
        },
        set() {
          return false;
        },
      };

  const els = {
    stage: document.getElementById('stage'),
    appTitle: document.getElementById('appTitle'),
    btnSound: document.getElementById('btnSound'),
    screenPicker: document.getElementById('screenPicker'),
    screenPlay: document.getElementById('screenPlay'),
    screenCleanup: document.getElementById('screenCleanup'),
    roomGrid: document.getElementById('roomGrid'),
    shelfMini: document.getElementById('shelfMini'),
    shelfRow: document.getElementById('shelfRow'),
    btnBack: document.getElementById('btnBack'),
    goalStrip: document.getElementById('goalStrip'),
    btnTumble: document.getElementById('btnTumble'),
    btnBall: document.getElementById('btnBall'),
    board: document.getElementById('board'),
    boardGrid: document.getElementById('boardGrid'),
    boardPieces: document.getElementById('boardPieces'),
    boardFx: document.getElementById('boardFx'),
    hintHand: document.getElementById('hintHand'),
    hintBubble: document.getElementById('hintBubble'),
    hintText: document.getElementById('hintText'),
    tray: document.getElementById('tray'),
    fxLayer: document.getElementById('fxLayer'),
    cleanupArea: document.getElementById('cleanupArea'),
    cleanupBits: document.getElementById('cleanupBits'),
    cleanupBox: document.getElementById('cleanupBox'),
    cleanupDone: document.getElementById('cleanupDone'),
    boxLid: document.getElementById('boxLid'),
  };

  const G = {
    screen: 'picker',
    room: 'brick',
    goalId: 'free',
    pieces: [],
    nextId: 1,
    cell: 36,
    cols: 8,
    rows: 8,
    completedWorks: 0,
    pyramidBase: 3,
    cupSlots: [],
    cupPickMode: false,
    looseCups: [],
    firstHint: true,
    drag: null,
    visits: 0,
    flagShown: false,
    goalDone: false,
    softEndingOpen: false,
  };

  function loadSave() {
    const data = store.get(STORE_KEY, null);
    if (data && typeof data === 'object') {
      return {
        shelf: Array.isArray(data.shelf) ? data.shelf.slice(0, 6) : [],
        pyramidMax: data.pyramidMax >= 4 ? 4 : 3,
        visits: Number(data.visits) || 0,
      };
    }
    return { shelf: [], pyramidMax: 3, visits: 0 };
  }

  function saveSave(partial) {
    const cur = loadSave();
    const next = Object.assign({}, cur, partial || {});
    if (Array.isArray(next.shelf) && next.shelf.length > 6) {
      next.shelf = next.shelf.slice(-6);
    }
    store.set(STORE_KEY, next);
    return next;
  }

  function sound(kind) {
    if (!window.KidsKit || !KidsKit.sound) return;
    if (kind === 'click') KidsKit.sound.play('pop');
    else if (kind === 'cup') KidsKit.sound.play('boing');
    else if (kind === 'waffle') KidsKit.sound.play('whoosh');
    else if (kind === 'tumble' || kind === 'whoosh') KidsKit.sound.play('whoosh');
    else if (kind === 'win') KidsKit.sound.play('chime');
    else if (kind === 'sparkle') KidsKit.sound.play('sparkle');
    else KidsKit.sound.play('pop');
  }

  function haptic(kind) {
    if (window.KidsKit && KidsKit.haptic) KidsKit.haptic(kind || 'light');
  }

  function showScreen(name) {
    G.screen = name;
    els.screenPicker.classList.toggle('is-active', name === 'picker');
    els.screenPicker.hidden = name !== 'picker';
    els.screenPlay.classList.toggle('is-active', name === 'play');
    els.screenPlay.hidden = name !== 'play';
    els.screenCleanup.classList.toggle('is-active', name === 'cleanup');
    els.screenCleanup.hidden = name !== 'cleanup';
  }

  function boardRect() {
    return els.board.getBoundingClientRect();
  }

  function measureCell() {
    const r = boardRect();
    const pad = 8;
    const usableW = Math.max(160, r.width - pad * 2);
    const usableH = Math.max(160, r.height - pad * 2);
    if (G.room === 'waffle') {
      G.cols = 5;
      G.rows = 5;
    } else if (G.room === 'brick') {
      G.cols = 8;
      G.rows = 8;
    }
    G.cell = Math.floor(Math.min(usableW / G.cols, usableH / G.rows));
    els.board.style.setProperty('--cell', G.cell + 'px');
    return G.cell;
  }

  function gridOrigin() {
    const r = boardRect();
    const w = G.cols * G.cell;
    const h = G.rows * G.cell;
    return {
      x: (r.width - w) / 2,
      y: (r.height - h) / 2,
      w,
      h,
    };
  }

  /** 보드 로컬 좌표 → 그리드 (row 0 = 바닥) */
  function localToGrid(lx, ly, w, h) {
    const origin = gridOrigin();
    const col = Math.round((lx - origin.x) / G.cell);
    const topRowFromTop = Math.round((ly - origin.y) / G.cell);
    const row = G.rows - h - topRowFromTop;
    return { col, row };
  }

  function gridToLocal(col, row, w, h) {
    const origin = gridOrigin();
    const topRowFromTop = G.rows - row - h;
    return {
      x: origin.x + col * G.cell,
      y: origin.y + topRowFromTop * G.cell,
    };
  }

  function pieceCount() {
    return G.pieces.length + G.looseCups.length;
  }

  /* ------------------------------------------------------------------ */
  /* SVG 블록                                                             */
  /* ------------------------------------------------------------------ */

  function brickSvg(color, w, h) {
    const bw = w * 40;
    const bh = h * 40;
    const studs = [];
    for (let sy = 0; sy < h; sy++) {
      for (let sx = 0; sx < w; sx++) {
        const cx = 8 + sx * 40 + 12;
        const cy = 4 + sy * 40;
        studs.push(
          `<rect x="${cx}" y="${cy}" width="16" height="10" rx="4" fill="${color}" stroke="rgba(0,0,0,0.12)" stroke-width="1"/>`
        );
      }
    }
    return `<svg class="piece-svg" viewBox="0 0 ${bw} ${bh + 8}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="12" width="${bw - 4}" height="${bh - 4}" rx="5" fill="${color}" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>
      <rect x="6" y="16" width="${bw - 12}" height="6" rx="2" fill="rgba(255,255,255,0.28)"/>
      ${studs.join('')}
    </svg>`;
  }

  function cupSvg(color) {
    return `<svg class="piece-svg" viewBox="0 0 48 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 6 L14 46 H34 L40 6 Z" fill="${color}" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>
      <ellipse cx="24" cy="6" rx="16" ry="5" fill="${color}" stroke="rgba(0,0,0,0.12)" stroke-width="1"/>
      <path d="M12 14 H36" stroke="rgba(255,255,255,0.35)" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }

  function waffleSvg(color) {
    return `<svg class="piece-svg" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="6" fill="${color}" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>
      <path d="M2 16 H46 M2 32 H46 M16 2 V46 M32 2 V46" stroke="rgba(0,0,0,0.18)" stroke-width="2.5"/>
      <rect x="8" y="8" width="8" height="8" rx="1" fill="rgba(255,255,255,0.2)"/>
    </svg>`;
  }

  function goalIconSvg(goalId, room) {
    const cells =
      room === 'waffle'
        ? (WAFFLE_GOALS[goalId] && WAFFLE_GOALS[goalId].cells) || []
        : (BRICK_GOALS[goalId] && BRICK_GOALS[goalId].cells) || [];
    if (!cells || !cells.length) {
      return `<svg viewBox="0 0 28 22"><circle cx="14" cy="11" r="7" fill="#dfc9a0"/></svg>`;
    }
    let maxX = 0;
    let maxY = 0;
    cells.forEach(([x, y]) => {
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });
    const u = 4;
    const rects = cells
      .map(([x, y]) => {
        const yy = maxY - y;
        return `<rect x="${x * u}" y="${yy * u}" width="${u - 0.5}" height="${u - 0.5}" rx="0.5" fill="#8b6914"/>`;
      })
      .join('');
    return `<svg viewBox="0 0 ${(maxX + 1) * u} ${(maxY + 1) * u}">${rects}</svg>`;
  }

  /* ------------------------------------------------------------------ */
  /* 점유 그리드                                                          */
  /* ------------------------------------------------------------------ */

  function buildOccupancy(ignoreId) {
    const grid = [];
    for (let r = 0; r < G.rows; r++) {
      grid[r] = [];
      for (let c = 0; c < G.cols; c++) grid[r][c] = null;
    }
    G.pieces.forEach((p) => {
      if (p.id === ignoreId) return;
      for (let dy = 0; dy < p.h; dy++) {
        for (let dx = 0; dx < p.w; dx++) {
          const rr = p.row + dy;
          const cc = p.col + dx;
          if (rr >= 0 && rr < G.rows && cc >= 0 && cc < G.cols) {
            grid[rr][cc] = p.id;
          }
        }
      }
    });
    return grid;
  }

  function cellsFree(grid, col, row, w, h) {
    if (col < 0 || row < 0 || col + w > G.cols || row + h > G.rows) return false;
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (grid[row + dy][col + dx]) return false;
      }
    }
    return true;
  }

  function brickSupported(grid, col, row, w, h) {
    if (row === 0) return true;
    for (let dx = 0; dx < w; dx++) {
      const below = grid[row - 1][col + dx];
      if (!below) return false;
    }
    return true;
  }

  function settleBrick(col, row, w, h, ignoreId) {
    const grid = buildOccupancy(ignoreId);
    let r = row;
    if (!cellsFree(grid, col, r, w, h)) return null;
    while (r > 0 && cellsFree(grid, col, r - 1, w, h)) {
      r -= 1;
    }
    if (!brickSupported(grid, col, r, w, h) && r !== 0) {
      // 내려앉은 자리가 지지 안 되면 무효 — 다만 settle 루프가 바닥까지 가면 row0
      if (r === 0) return { col, row: r };
      return null;
    }
    if (!brickSupported(grid, col, r, w, h)) return null;
    return { col, row: r };
  }

  function findNearestBrick(col, row, w, h, ignoreId) {
    const grid = buildOccupancy(ignoreId);
    let best = null;
    let bestDist = Infinity;
    for (let c = 0; c <= G.cols - w; c++) {
      for (let r = 0; r <= G.rows - h; r++) {
        if (!cellsFree(grid, c, r, w, h)) continue;
        if (!brickSupported(grid, c, r, w, h)) continue;
        // 위에 떠 있지 않게: 바로 아래가 비어 있으면 안 됨(지지 검사로 충분)
        const dist = (c - col) * (c - col) + (r - row) * (r - row);
        if (dist < bestDist) {
          bestDist = dist;
          best = { col: c, row: r };
        }
      }
    }
    return best;
  }

  /** 활성 목표의 전체 칸·미채움 칸. 없으면 null (자유/컵/완료). */
  function activeGoalSets() {
    if (G.goalDone || !G.goalId) return null;
    const goals = G.room === 'waffle' ? WAFFLE_GOALS : BRICK_GOALS;
    const goal = goals[G.goalId];
    if (!goal || !goal.cells) return null;
    const filled = filledCells();
    const goalSet = new Set();
    const unfilled = new Set();
    goal.cells.forEach(([x, y]) => {
      const key = x + ',' + y;
      goalSet.add(key);
      if (!filled.has(key)) unfilled.add(key);
    });
    return { goalSet, unfilled };
  }

  /**
   * 후보 중 미채움 목표 칸을 가장 많이 덮고, 목표 밖을 가장 적게 덮는 위치.
   * 목표를 하나도 덮지 못하면 null → 호출측이 기존 순회 결과로 폴백.
   */
  function bestGoalAwareSlot(candidates, w, h) {
    const sets = activeGoalSets();
    if (!sets || candidates.length === 0) return null;
    let best = null;
    let bestCover = 0;
    let bestOutside = Infinity;
    candidates.forEach(({ col, row }) => {
      let cover = 0;
      let outside = 0;
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          const key = col + dx + ',' + (row + dy);
          if (sets.unfilled.has(key)) cover += 1;
          else if (!sets.goalSet.has(key)) outside += 1;
        }
      }
      if (cover === 0) return;
      if (cover > bestCover || (cover === bestCover && outside < bestOutside)) {
        bestCover = cover;
        bestOutside = outside;
        best = { col, row };
      }
    });
    return best;
  }

  function nextBrickSlot(w, h) {
    const grid = buildOccupancy(null);
    const candidates = [];
    for (let r = 0; r <= G.rows - h; r++) {
      for (let c = 0; c <= G.cols - w; c++) {
        if (!cellsFree(grid, c, r, w, h)) continue;
        if (!brickSupported(grid, c, r, w, h)) continue;
        candidates.push({ col: c, row: r });
      }
    }
    if (candidates.length === 0) return null;
    return bestGoalAwareSlot(candidates, w, h) || candidates[0];
  }

  /* 와플: 첫 조각 아무 곳, 이후 상하좌우 인접 */

  function waffleOccupied(ignoreId) {
    const set = new Set();
    G.pieces.forEach((p) => {
      if (p.id === ignoreId) return;
      set.add(p.col + ',' + p.row);
    });
    return set;
  }

  function waffleValid(col, row, ignoreId) {
    if (col < 0 || row < 0 || col >= G.cols || row >= G.rows) return false;
    const set = waffleOccupied(ignoreId);
    if (set.has(col + ',' + row)) return false;
    if (set.size === 0) return true;
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    return dirs.some(([dx, dy]) => set.has(col + dx + ',' + (row + dy)));
  }

  function findNearestWaffle(col, row, ignoreId) {
    let best = null;
    let bestDist = Infinity;
    for (let c = 0; c < G.cols; c++) {
      for (let r = 0; r < G.rows; r++) {
        if (!waffleValid(c, r, ignoreId)) continue;
        const dist = (c - col) * (c - col) + (r - row) * (r - row);
        if (dist < bestDist) {
          bestDist = dist;
          best = { col: c, row: r };
        }
      }
    }
    return best;
  }

  function nextWaffleSlot() {
    const candidates = [];
    for (let r = 0; r < G.rows; r++) {
      for (let c = 0; c < G.cols; c++) {
        if (waffleValid(c, r, null)) candidates.push({ col: c, row: r });
      }
    }
    if (candidates.length === 0) return null;
    return bestGoalAwareSlot(candidates, 1, 1) || candidates[0];
  }

  /* ------------------------------------------------------------------ */
  /* 컵 피라미드                                                          */
  /* ------------------------------------------------------------------ */

  function makeCupSlots(base) {
    const slots = [];
    let id = 0;
    for (let level = 0; level < base; level++) {
      const count = base - level;
      for (let i = 0; i < count; i++) {
        slots.push({
          id: id++,
          level,
          index: i,
          cup: null,
          below: level === 0 ? [] : [/* filled below */],
        });
      }
    }
    // below 링크: level L slot i rests on level L-1 slots i and i+1
    slots.forEach((s) => {
      if (s.level === 0) {
        s.below = [];
        return;
      }
      const lower = slots.filter((x) => x.level === s.level - 1);
      s.below = [lower[s.index], lower[s.index + 1]].filter(Boolean).map((x) => x.id);
    });
    return slots;
  }

  function cupSlotOpen(slot) {
    if (slot.cup) return false;
    if (slot.level === 0) return true;
    return slot.below.every((bid) => {
      const b = G.cupSlots.find((s) => s.id === bid);
      return b && b.cup;
    });
  }

  function layoutCupSlots() {
    const origin = gridOrigin();
    const base = G.pyramidBase;
    const cupW = Math.min(G.cell * 1.35, (origin.w - 8) / base);
    const cupH = cupW * 1.1;
    const totalW = base * cupW;
    const startX = origin.x + (origin.w - totalW) / 2;
    const baseY = origin.y + origin.h - cupH - 6;

    G.cupSlots.forEach((s) => {
      const count = base - s.level;
      const levelWidth = count * cupW;
      const levelStart = startX + (totalW - levelWidth) / 2;
      s.x = levelStart + s.index * cupW;
      s.y = baseY - s.level * (cupH * 0.72);
      s.w = cupW;
      s.h = cupH;
    });
  }

  function nextCupSlot() {
    return G.cupSlots.find((s) => cupSlotOpen(s)) || null;
  }

  function nearestCupSlot(lx, ly) {
    let best = null;
    let bestDist = Infinity;
    G.cupSlots.forEach((s) => {
      if (!cupSlotOpen(s) && !(G.drag && G.drag.fromSlot === s.id && !s.cup)) return;
      // when dragging from board cup, allow open slots
      if (!cupSlotOpen(s)) return;
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      const dist = (cx - lx) * (cx - lx) + (cy - ly) * (cy - ly);
      if (dist < bestDist) {
        bestDist = dist;
        best = s;
      }
    });
    return best;
  }

  function pyramidComplete() {
    return G.cupSlots.length > 0 && G.cupSlots.every((s) => s.cup);
  }

  /* ------------------------------------------------------------------ */
  /* 목표 검사                                                            */
  /* ------------------------------------------------------------------ */

  function filledCells() {
    const set = new Set();
    G.pieces.forEach((p) => {
      for (let dy = 0; dy < p.h; dy++) {
        for (let dx = 0; dx < p.w; dx++) {
          set.add(p.col + dx + ',' + (p.row + dy));
        }
      }
    });
    return set;
  }

  function checkGoalProgress() {
    if (G.room === 'cup') {
      renderCupSlots();
      if (pyramidComplete() && !G.goalDone) {
        onGoalComplete();
      }
      return;
    }
    const goals = G.room === 'waffle' ? WAFFLE_GOALS : BRICK_GOALS;
    const goal = goals[G.goalId];
    renderGoalCells(goal && goal.cells);
    if (!goal || !goal.cells || G.goalDone) return;
    const filled = filledCells();
    const ok = goal.cells.every(([x, y]) => filled.has(x + ',' + y));
    if (ok) onGoalComplete();
  }

  function sameColorTower() {
    if (G.room !== 'brick' || G.flagShown) return;
    const grid = buildOccupancy(null);
    for (let c = 0; c < G.cols; c++) {
      let run = 0;
      let color = null;
      for (let r = 0; r < G.rows; r++) {
        const id = grid[r][c];
        if (!id) {
          run = 0;
          color = null;
          continue;
        }
        const p = G.pieces.find((x) => x.id === id);
        if (!p) continue;
        if (p.color === color) run += 1;
        else {
          color = p.color;
          run = 1;
        }
        if (run >= 5) {
          G.flagShown = true;
          const pos = gridToLocal(c, r, 1, 1);
          const flag = document.createElement('div');
          flag.className = 'flag-fx';
          flag.textContent = '🚩';
          flag.style.left = pos.x + 'px';
          flag.style.top = pos.y - 28 + 'px';
          els.boardFx.appendChild(flag);
          sound('sparkle');
          return;
        }
      }
    }
  }

  function onGoalComplete() {
    G.goalDone = true;
    sound('win');
    haptic('success');
    burstConfetti();
    snapshotShelf();
    G.completedWorks += 1;

    if (G.room === 'cup') {
      const save = loadSave();
      if (G.pyramidBase >= 3 && save.pyramidMax < 4) {
        saveSave({ pyramidMax: 4 });
      }
    }

    if (G.room === 'brick' && G.goalId === 'rocket') {
      els.boardPieces.classList.add('rocket-fly');
      setTimeout(() => els.boardPieces.classList.remove('rocket-fly'), 1100);
    }
    if (G.room === 'waffle' && G.goalId === 'butterfly') {
      els.boardPieces.querySelectorAll('.piece').forEach((el) => el.classList.add('waffle-wing'));
    }
    if (G.room === 'waffle' && G.goalId === 'car') {
      els.boardPieces.classList.add('car-roll');
      setTimeout(() => els.boardPieces.classList.remove('car-roll'), 1200);
    }

    setTimeout(() => {
      if (G.completedWorks >= 2) {
        offerCleanup();
      }
    }, 1200);
  }

  function burstConfetti() {
    if (REDUCED) return;
    const colors = ['#e85d4c', '#ff9f43', '#f6d860', '#7bc67e', '#5bb8e8', '#b07cc6'];
    const rect = boardRect();
    for (let i = 0; i < 18; i++) {
      const bit = document.createElement('div');
      bit.className = 'confetti-bit';
      bit.style.left = rect.width * (0.2 + Math.random() * 0.6) + 'px';
      bit.style.top = rect.height * 0.2 + 'px';
      bit.style.background = colors[i % colors.length];
      bit.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      bit.style.setProperty('--dy', 80 + Math.random() * 120 + 'px');
      els.boardFx.appendChild(bit);
      setTimeout(() => bit.remove(), 1200);
    }
  }

  function snapshotShelf() {
    const save = loadSave();
    const entry = {
      room: G.room,
      goalId: G.goalId,
      blocks: G.pieces.map((p) => ({
        shape: p.shape,
        color: p.color,
        col: p.col,
        row: p.row,
        w: p.w,
        h: p.h,
      })),
      at: Date.now(),
    };
    const shelf = save.shelf.concat([entry]).slice(-6);
    saveSave({ shelf });
  }

  function offerCleanup() {
    if (G.screen === 'cleanup') return;
    showHint('블록 정리하자!');
    setTimeout(() => {
      hideHint();
      startCleanup();
    }, 900);
  }

  /* ------------------------------------------------------------------ */
  /* 렌더                                                                 */
  /* ------------------------------------------------------------------ */

  function clearBoardDom() {
    els.boardGrid.innerHTML = '';
    els.boardPieces.innerHTML = '';
    els.boardFx.innerHTML = '';
    els.hintHand.hidden = true;
  }

  function renderGoalCells(cells) {
    els.boardGrid.innerHTML = '';
    if (!cells) return;
    const filled = filledCells();
    cells.forEach(([x, y]) => {
      const pos = gridToLocal(x, y, 1, 1);
      const el = document.createElement('div');
      el.className = 'goal-cell' + (filled.has(x + ',' + y) ? ' is-filled' : '');
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      el.style.width = G.cell + 'px';
      el.style.height = G.cell + 'px';
      els.boardGrid.appendChild(el);
    });
  }

  function renderPieces() {
    els.boardPieces.innerHTML = '';
    G.pieces.forEach((p) => {
      const el = document.createElement('div');
      el.className = 'piece';
      el.dataset.id = String(p.id);
      const pos = gridToLocal(p.col, p.row, p.w, p.h);
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      el.style.width = p.w * G.cell + 'px';
      el.style.height = p.h * G.cell + 'px';
      if (G.room === 'brick') el.innerHTML = brickSvg(p.color, p.w, p.h);
      else if (G.room === 'waffle') el.innerHTML = waffleSvg(p.color);
      else el.innerHTML = cupSvg(p.color);
      bindPiecePointer(el, p);
      els.boardPieces.appendChild(el);
    });
  }

  function renderCupSlots() {
    els.boardGrid.innerHTML = '';
    els.boardPieces.innerHTML = '';
    layoutCupSlots();
    G.cupSlots.forEach((s) => {
      const slotEl = document.createElement('div');
      slotEl.className = 'cup-slot' + (cupSlotOpen(s) ? ' is-open' : '') + (s.cup ? ' has-cup' : '');
      slotEl.style.left = s.x + 'px';
      slotEl.style.top = s.y + 'px';
      slotEl.style.width = s.w + 'px';
      slotEl.style.height = s.h + 'px';
      if (s.cup) {
        const cup = document.createElement('div');
        cup.className = 'cup-piece';
        cup.dataset.slot = String(s.id);
        cup.innerHTML = cupSvg(s.cup.color);
        bindCupPointer(cup, s);
        slotEl.appendChild(cup);
      }
      els.boardGrid.appendChild(slotEl);
    });
    G.looseCups.forEach((c) => {
      const el = document.createElement('div');
      el.className = 'cup-piece is-loose';
      el.dataset.loose = String(c.id);
      el.style.left = c.x + 'px';
      el.style.top = c.y + 'px';
      el.style.width = (c.w || 56) + 'px';
      el.style.height = (c.h || 60) + 'px';
      el.innerHTML = cupSvg(c.color);
      bindLooseCupPointer(el, c);
      els.boardPieces.appendChild(el);
    });
  }

  function renderTray() {
    els.tray.innerHTML = '';
    if (G.cupPickMode) return;

    if (G.room === 'brick') {
      BRICK_SHAPES.forEach((shape, si) => {
        COLORS.brick.forEach((color, ci) => {
          if (si === 0 && ci > 2) return; // 트레이에 대표 조합만 (탭으로 충분)
          if (si === 1 && ci > 1) return;
          if (si === 2 && (ci < 3 || ci > 4)) return;
          addTrayBrick(shape, color);
        });
      });
      // 색 다양성: 각 shape마다 순환 색 추가
      BRICK_SHAPES.forEach((shape) => {
        const color = COLORS.brick[G.nextId % COLORS.brick.length];
        addTrayBrick(shape, color);
      });
    } else if (G.room === 'waffle') {
      COLORS.waffle.forEach((color) => addTrayWaffle(color));
    } else if (G.room === 'cup') {
      COLORS.cup.forEach((color) => addTrayCup(color));
    }
  }

  function addTrayBrick(shape, color) {
    const item = document.createElement('div');
    item.className = 'tray-item';
    item.style.width = Math.max(56, shape.w * 28) + 'px';
    item.style.height = Math.max(56, shape.h * 28) + 'px';
    item.innerHTML = brickSvg(color, shape.w, shape.h);
    const proto = { kind: 'brick', shape: shape.id, w: shape.w, h: shape.h, color };
    bindTrayPointer(item, proto);
    els.tray.appendChild(item);
  }

  function addTrayWaffle(color) {
    const item = document.createElement('div');
    item.className = 'tray-item';
    item.style.width = '56px';
    item.style.height = '56px';
    item.innerHTML = waffleSvg(color);
    bindTrayPointer(item, { kind: 'waffle', shape: '1x1', w: 1, h: 1, color });
    els.tray.appendChild(item);
  }

  function addTrayCup(color) {
    const item = document.createElement('div');
    item.className = 'tray-item';
    item.style.width = '56px';
    item.style.height = '60px';
    item.innerHTML = cupSvg(color);
    bindTrayPointer(item, { kind: 'cup', shape: 'cup', w: 1, h: 1, color });
    els.tray.appendChild(item);
  }

  function renderGoals() {
    els.goalStrip.innerHTML = '';
    const goals =
      G.room === 'waffle'
        ? WAFFLE_GOALS
        : G.room === 'brick'
          ? BRICK_GOALS
          : { pyramid: { name: '피라미드' } };
    Object.keys(goals).forEach((id) => {
      const g = goals[id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'goal-chip' + (G.goalId === id || (G.room === 'cup' && id === 'pyramid' && G.goalId === 'pyramid') ? ' is-active' : '');
      btn.dataset.goal = id;
      if (G.room === 'cup' && id === 'pyramid') {
        btn.innerHTML = `<span class="goal-chip__art" aria-hidden="true">🔺</span><span>${g.name}</span>`;
      } else if (id === 'free') {
        btn.innerHTML = `<span class="goal-chip__art" aria-hidden="true">✨</span><span>${g.name}</span>`;
      } else {
        btn.innerHTML = `<span class="goal-chip__art">${goalIconSvg(id, G.room)}</span><span>${g.name}</span>`;
      }
      btn.addEventListener('click', () => {
        if (G.room === 'cup') {
          G.goalId = 'pyramid';
        } else {
          G.goalId = id;
        }
        G.goalDone = false;
        G.flagShown = false;
        renderGoals();
        if (G.room === 'brick' || G.room === 'waffle') {
          clearPiecesKeepTray();
          checkGoalProgress();
        }
        sound('click');
      });
      els.goalStrip.appendChild(btn);
    });
    if (G.room === 'cup') {
      G.goalId = 'pyramid';
    }
  }

  function clearPiecesKeepTray() {
    G.pieces = [];
    G.looseCups = [];
    G.cupPickMode = false;
    if (G.room === 'cup') {
      G.cupSlots.forEach((s) => {
        s.cup = null;
      });
      renderCupSlots();
    } else {
      renderPieces();
      checkGoalProgress();
    }
  }

  function showHint(text) {
    els.hintText.textContent = text;
    els.hintBubble.hidden = false;
  }

  function hideHint() {
    els.hintBubble.hidden = true;
  }

  /* ------------------------------------------------------------------ */
  /* 포인터                                                               */
  /* ------------------------------------------------------------------ */

  function bindTrayPointer(el, proto) {
    el.addEventListener('pointerdown', (e) => {
      if (pieceCount() >= MAX_BLOCKS) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      startDrag({
        source: 'tray',
        proto,
        piece: null,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        w: proto.kind === 'cup' ? 56 : proto.w * G.cell,
        h: proto.kind === 'cup' ? 60 : proto.h * G.cell,
        moved: false,
        ghost: null,
        pointerId: e.pointerId,
        targetEl: el,
      });
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_err) {
        /* ignore */
      }
    });
  }

  function bindPiecePointer(el, piece) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      startDrag({
        source: 'board',
        proto: null,
        piece,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        w: piece.w * G.cell,
        h: piece.h * G.cell,
        moved: false,
        ghost: el,
        pointerId: e.pointerId,
        targetEl: el,
      });
      el.classList.add('is-dragging');
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_err) {
        /* ignore */
      }
    });
  }

  function bindCupPointer(el, slot) {
    el.addEventListener('pointerdown', (e) => {
      // 위에 컵이 있으면 이동 불가(아래 빼기 방지) — 꼭대기부터
      const above = G.cupSlots.some(
        (s) => s.cup && s.below && s.below.indexOf(slot.id) !== -1
      );
      if (above) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      const cup = slot.cup;
      startDrag({
        source: 'cup-slot',
        proto: { kind: 'cup', color: cup.color, shape: 'cup', w: 1, h: 1 },
        piece: null,
        fromSlot: slot.id,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        w: slot.w,
        h: slot.h,
        moved: false,
        ghost: null,
        pointerId: e.pointerId,
        targetEl: el,
        color: cup.color,
      });
      slot.cup = null;
      renderCupSlots();
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_err) {
        /* ignore */
      }
    });
  }

  function bindLooseCupPointer(el, cup) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      startDrag({
        source: 'loose-cup',
        proto: { kind: 'cup', color: cup.color, shape: 'cup', w: 1, h: 1 },
        piece: null,
        looseId: cup.id,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        w: cup.w || 56,
        h: cup.h || 60,
        moved: false,
        ghost: el,
        pointerId: e.pointerId,
        targetEl: el,
        color: cup.color,
      });
      el.classList.add('is-dragging');
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_err) {
        /* ignore */
      }
    });
  }

  function startDrag(state) {
    G.drag = state;
    if (state.source === 'tray' || state.source === 'cup-slot') {
      const ghost = document.createElement('div');
      ghost.className = 'piece is-dragging';
      ghost.style.position = 'fixed';
      ghost.style.left = state.startX - state.offsetX + 'px';
      ghost.style.top = state.startY - state.offsetY + 'px';
      ghost.style.width = state.w + 'px';
      ghost.style.height = state.h + 'px';
      ghost.style.zIndex = '100';
      ghost.style.pointerEvents = 'none';
      const color = state.proto.color;
      if (state.proto.kind === 'brick') ghost.innerHTML = brickSvg(color, state.proto.w, state.proto.h);
      else if (state.proto.kind === 'waffle') ghost.innerHTML = waffleSvg(color);
      else ghost.innerHTML = cupSvg(color);
      document.body.appendChild(ghost);
      state.ghost = ghost;
    }
  }

  function onPointerMove(e) {
    const d = G.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
      d.moved = true;
    }
    if (!d.moved) return;
    const left = e.clientX - d.offsetX;
    const top = e.clientY - d.offsetY;
    if (d.ghost) {
      if (d.source === 'board' || d.source === 'loose-cup') {
        const br = boardRect();
        d.ghost.style.left = left - br.left + 'px';
        d.ghost.style.top = top - br.top + 'px';
      } else {
        d.ghost.style.left = left + 'px';
        d.ghost.style.top = top + 'px';
      }
    }
  }

  function onPointerUp(e) {
    const d = G.drag;
    if (!d || e.pointerId !== d.pointerId) return;
    G.drag = null;

    const isTap = !d.moved;
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (d.ghost && (d.source === 'tray' || d.source === 'cup-slot')) {
      d.ghost.remove();
    }
    if (d.ghost && d.source === 'board') {
      d.ghost.classList.remove('is-dragging');
    }

    if (d.source === 'loose-cup') {
      finishLooseCup(d, clientX, clientY, isTap);
      return;
    }

    if (G.room === 'cup') {
      finishCupDrop(d, clientX, clientY, isTap);
      return;
    }

    if (isTap && d.source === 'tray') {
      placeFromTrayTap(d.proto);
      return;
    }

    if (isTap && d.source === 'board') {
      // 탭으로 보드 조각 집으면 무시(유지)
      renderPieces();
      return;
    }

    finishGridDrop(d, clientX, clientY);
  }

  function placeFromTrayTap(proto) {
    if (pieceCount() >= MAX_BLOCKS) return;
    if (G.room === 'brick') {
      const spot = nextBrickSlot(proto.w, proto.h);
      if (!spot) return;
      addPiece(proto, spot.col, spot.row);
      sound('click');
      haptic('light');
    } else if (G.room === 'waffle') {
      const spot = nextWaffleSlot();
      if (!spot) return;
      addPiece(proto, spot.col, spot.row);
      sound('waffle');
      haptic('soft');
    } else if (G.room === 'cup') {
      const slot = nextCupSlot();
      if (!slot) return;
      slot.cup = { color: proto.color, id: G.nextId++ };
      sound('cup');
      haptic('light');
      renderCupSlots();
      checkGoalProgress();
    }
    bumpPress();
  }

  function addPiece(proto, col, row) {
    const p = {
      id: G.nextId++,
      shape: proto.shape,
      color: proto.color,
      w: proto.w,
      h: proto.h,
      col,
      row,
    };
    G.pieces.push(p);
    renderPieces();
    checkGoalProgress();
    sameColorTower();
    hideFirstHint();
    return p;
  }

  function finishGridDrop(d, clientX, clientY) {
    const br = boardRect();
    const overBoard =
      clientX >= br.left && clientX <= br.right && clientY >= br.top && clientY <= br.bottom;
    const trayR = els.tray.getBoundingClientRect();
    const overTray =
      clientX >= trayR.left && clientX <= trayR.right && clientY >= trayR.top && clientY <= trayR.bottom;

    if (d.source === 'board' && overTray) {
      G.pieces = G.pieces.filter((p) => p.id !== d.piece.id);
      renderPieces();
      checkGoalProgress();
      sound('click');
      return;
    }

    if (!overBoard && d.source === 'tray') {
      // 보드 밖 → 무시(트레이 유지)
      return;
    }

    if (!overBoard && d.source === 'board') {
      // 가장 가까운 유효 위치로
      const nearest =
        G.room === 'waffle'
          ? findNearestWaffle(d.piece.col, d.piece.row, d.piece.id)
          : findNearestBrick(d.piece.col, d.piece.row, d.piece.w, d.piece.h, d.piece.id);
      if (nearest) {
        d.piece.col = nearest.col;
        d.piece.row = nearest.row;
      }
      renderPieces();
      checkGoalProgress();
      sameColorTower();
      return;
    }

    const lx = clientX - br.left - d.offsetX;
    const ly = clientY - br.top - d.offsetY;
    const w = d.source === 'board' ? d.piece.w : d.proto.w;
    const h = d.source === 'board' ? d.piece.h : d.proto.h;
    const ignoreId = d.source === 'board' ? d.piece.id : null;
    let { col, row } = localToGrid(lx, ly, w, h);

    if (G.room === 'brick') {
      let settled = settleBrick(col, row, w, h, ignoreId);
      if (!settled) settled = findNearestBrick(col, row, w, h, ignoreId);
      if (!settled) {
        if (d.source === 'board') renderPieces();
        return;
      }
      if (d.source === 'board') {
        d.piece.col = settled.col;
        d.piece.row = settled.row;
        renderPieces();
      } else {
        if (pieceCount() >= MAX_BLOCKS) return;
        addPiece(d.proto, settled.col, settled.row);
      }
      sound('click');
      haptic('light');
      bumpPress();
      sameColorTower();
      checkGoalProgress();
      hideFirstHint();
    } else if (G.room === 'waffle') {
      if (!waffleValid(col, row, ignoreId)) {
        const n = findNearestWaffle(col, row, ignoreId);
        if (!n) {
          if (d.source === 'board') renderPieces();
          return;
        }
        col = n.col;
        row = n.row;
      }
      if (d.source === 'board') {
        d.piece.col = col;
        d.piece.row = row;
        renderPieces();
      } else {
        if (pieceCount() >= MAX_BLOCKS) return;
        addPiece(d.proto, col, row);
      }
      sound('waffle');
      haptic('soft');
      bumpPress();
      checkGoalProgress();
    }
  }

  function finishCupDrop(d, clientX, clientY, isTap) {
    if (isTap && d.source === 'tray') {
      placeFromTrayTap(d.proto);
      return;
    }

    const trayR = els.tray.getBoundingClientRect();
    const overTray =
      clientX >= trayR.left && clientX <= trayR.right && clientY >= trayR.top && clientY <= trayR.bottom;

    if (overTray && (d.source === 'cup-slot' || d.source === 'board')) {
      // 트레이로 복귀
      sound('cup');
      renderCupSlots();
      checkGoalProgress();
      return;
    }

    const br = boardRect();
    const lx = clientX - br.left - d.offsetX;
    const ly = clientY - br.top - d.offsetY;
    let slot = nearestCupSlot(lx + d.w / 2, ly + d.h / 2);

    if (!slot && d.source === 'cup-slot') {
      // 원위치 복구
      const origin = G.cupSlots.find((s) => s.id === d.fromSlot);
      if (origin && !origin.cup) {
        origin.cup = { color: d.color || d.proto.color, id: G.nextId++ };
      }
      renderCupSlots();
      return;
    }

    if (!slot) {
      renderCupSlots();
      return;
    }

    if (pieceCount() >= MAX_BLOCKS && d.source === 'tray') return;

    slot.cup = { color: (d.proto && d.proto.color) || d.color, id: G.nextId++ };
    sound('cup');
    haptic('light');
    renderCupSlots();
    checkGoalProgress();
    hideFirstHint();
  }

  function finishLooseCup(d, clientX, clientY, isTap) {
    const trayR = els.tray.getBoundingClientRect();
    const overTray =
      isTap ||
      (clientX >= trayR.left &&
        clientX <= trayR.right &&
        clientY >= trayR.top &&
        clientY <= trayR.bottom);

    // 탭이거나 트레이 근처면 줍기 성공
    const br = boardRect();
    const nearTray = clientY > br.bottom - 40;

    if (overTray || nearTray || isTap) {
      G.looseCups = G.looseCups.filter((c) => c.id !== d.looseId);
      sound('cup');
      haptic('light');
      if (d.ghost) d.ghost.remove();
      renderCupSlots();
      if (G.looseCups.length === 0) {
        G.cupPickMode = false;
        els.btnBall.hidden = false;
        renderTray();
      }
      return;
    }

    // 위치 갱신
    const cup = G.looseCups.find((c) => c.id === d.looseId);
    if (cup) {
      cup.x = clientX - br.left - d.offsetX;
      cup.y = clientY - br.top - d.offsetY;
    }
    if (d.ghost) d.ghost.classList.remove('is-dragging');
    renderCupSlots();
  }

  function bumpPress() {
    const last = els.boardPieces.querySelector('.piece:last-child');
    if (!last) return;
    last.classList.remove('is-press');
    void last.offsetWidth;
    last.classList.add('is-press');
  }

  function hideFirstHint() {
    if (!G.firstHint) return;
    G.firstHint = false;
    els.hintHand.hidden = true;
    const spark = els.boardFx.querySelector('.cell-sparkle');
    if (spark) spark.remove();
    hideHint();
  }

  /* ------------------------------------------------------------------ */
  /* 와르르 / 공 굴리기                                                    */
  /* ------------------------------------------------------------------ */

  function tumble() {
    sound('tumble');
    haptic('medium');
    if (G.room === 'cup') {
      tumbleCups();
      return;
    }
    const nodes = els.boardPieces.querySelectorAll('.piece');
    nodes.forEach((el, i) => {
      el.classList.add('is-tumble');
      const dx = (Math.random() * 2 - 1) * 120;
      const dy = 80 + Math.random() * 100;
      const rot = (Math.random() * 2 - 1) * 40;
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 700);
    });
    setTimeout(() => {
      G.pieces = [];
      G.goalDone = false;
      G.flagShown = false;
      renderPieces();
      checkGoalProgress();
    }, 720);
  }

  function tumbleCups() {
    const filled = G.cupSlots.filter((s) => s.cup);
    if (!filled.length) return;
    G.cupPickMode = true;
    G.goalDone = false;
    els.btnBall.hidden = true;
    els.tray.innerHTML = '';
    const loose = [];
    filled.forEach((s) => {
      loose.push({
        id: G.nextId++,
        color: s.cup.color,
        x: s.x + (Math.random() * 40 - 20),
        y: s.y + 40 + Math.random() * 60,
        w: s.w,
        h: s.h,
      });
      s.cup = null;
    });
    G.looseCups = loose;
    renderCupSlots();
    sound('sparkle');
  }

  function rollBall() {
    if (G.room !== 'cup' || G.cupPickMode) return;
    const ball = document.createElement('div');
    ball.className = 'ball-fx';
    const origin = gridOrigin();
    const fromX = origin.x + origin.w - 40;
    const toX = origin.x + 10;
    const fromY = origin.y + 10;
    const toY = origin.y + origin.h - 50;
    ball.style.left = fromX + 'px';
    ball.style.top = fromY + 'px';
    ball.style.transition = REDUCED ? 'none' : 'left 0.65s linear, top 0.65s ease-in';
    els.boardFx.appendChild(ball);
    sound('whoosh');
    // 다음 프레임에 목표 좌표로 보내 CSS transition 사용 (rAF 스로틀 회피)
    setTimeout(() => {
      ball.style.left = toX + 'px';
      ball.style.top = toY + 'px';
    }, 30);
    setTimeout(() => {
      ball.remove();
      tumbleCups();
    }, REDUCED ? 50 : 700);
  }

  /* ------------------------------------------------------------------ */
  /* 방 시작                                                              */
  /* ------------------------------------------------------------------ */

  function enterRoom(room) {
    G.room = room;
    G.pieces = [];
    G.looseCups = [];
    G.cupPickMode = false;
    G.goalDone = false;
    G.flagShown = false;
    G.nextId = 1;

    const save = loadSave();
    G.pyramidBase = room === 'cup' ? (save.pyramidMax >= 4 ? 4 : 3) : 3;

    els.appTitle.textContent = ROOM_TITLE[room] || '차곡차곡 블록';
    els.board.classList.toggle('is-cup', room === 'cup');
    els.board.classList.toggle('is-waffle', room === 'waffle');
    els.btnBall.hidden = room !== 'cup';
    els.btnTumble.hidden = false;

    if (room === 'cup') {
      G.goalId = 'pyramid';
      G.cupSlots = makeCupSlots(G.pyramidBase);
    } else if (room === 'waffle') {
      G.goalId = 'free';
    } else {
      G.goalId = 'free';
    }

    showScreen('play');
    measureCell();
    clearBoardDom();
    renderGoals();
    renderTray();

    if (room === 'cup') {
      renderCupSlots();
    } else {
      renderPieces();
      checkGoalProgress();
    }

    if (G.firstHint && room === 'brick') {
      showFirstVisitHint();
    }
  }

  function showFirstVisitHint() {
    measureCell();
    const pos = gridToLocal(0, 0, 1, 1);
    const spark = document.createElement('div');
    spark.className = 'cell-sparkle';
    spark.style.left = pos.x + 'px';
    spark.style.top = pos.y + 'px';
    spark.style.width = G.cell + 'px';
    spark.style.height = G.cell + 'px';
    els.boardFx.appendChild(spark);

    els.hintHand.hidden = false;
    els.hintHand.style.left = pos.x + G.cell * 0.3 + 'px';
    els.hintHand.style.top = pos.y - 10 + 'px';
  }

  function openPicker() {
    els.appTitle.textContent = '차곡차곡 블록';
    showScreen('picker');
    renderShelfMini();
    G.firstHint = false;
  }

  function renderShelfMini() {
    const save = loadSave();
    if (!save.shelf.length) {
      els.shelfMini.hidden = true;
      return;
    }
    els.shelfMini.hidden = false;
    els.shelfRow.innerHTML = '';
    const icon = { brick: '🧱', cup: '🥤', waffle: '🧇' };
    save.shelf.forEach((item) => {
      const chip = document.createElement('div');
      chip.className = 'shelf-chip';
      chip.textContent = icon[item.room] || '⭐';
      els.shelfRow.appendChild(chip);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 정리 놀이                                                            */
  /* ------------------------------------------------------------------ */

  function startCleanup() {
    showScreen('cleanup');
    els.cleanupDone.hidden = true;
    els.cleanupBox.classList.remove('is-closed', 'is-shake');
    els.cleanupBits.innerHTML = '';

    const colors = COLORS.brick;
    const bits = [];
    for (let i = 0; i < 8; i++) {
      const el = document.createElement('div');
      el.className = 'cleanup-bit';
      const x = 10 + Math.random() * 70;
      const y = 5 + Math.random() * 50;
      el.style.left = x + '%';
      el.style.top = y + '%';
      el.innerHTML = brickSvg(colors[i % colors.length], 1, 1);
      els.cleanupBits.appendChild(el);
      bits.push(el);

      el.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        const move = (m) => {
          const area = els.cleanupArea.getBoundingClientRect();
          el.style.left = ((m.clientX - area.left) / area.width) * 100 + '%';
          el.style.top = ((m.clientY - area.top) / area.height) * 100 + '%';
        };
        const up = (u) => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          const box = els.cleanupBox.getBoundingClientRect();
          if (
            u.clientX >= box.left &&
            u.clientX <= box.right &&
            u.clientY >= box.top &&
            u.clientY <= box.bottom
          ) {
            putBitInBox(el, bits);
          }
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      });
    }
  }

  function putBitInBox(el, bits) {
    el.classList.add('is-in');
    sound('click');
    if ([].every.call(bits, (b) => b.classList.contains('is-in'))) {
      finishCleanup();
    }
  }

  function shakeBoxCleanup() {
    els.cleanupBox.classList.add('is-shake');
    sound('tumble');
    haptic('medium');
    const bits = els.cleanupBits.querySelectorAll('.cleanup-bit');
    bits.forEach((b) => b.classList.add('is-in'));
    setTimeout(() => {
      els.cleanupBox.classList.remove('is-shake');
      finishCleanup();
    }, 500);
  }

  function finishCleanup() {
    els.cleanupBox.classList.add('is-closed');
    els.cleanupDone.hidden = false;
    sound('win');
    setTimeout(() => {
      if (window.KidsKit && KidsKit.softEnding) {
        KidsKit.softEnding({
          title: '오늘도 멋지게 만들었어. 다음에 또 쌓자!',
          emoji: '🌟',
          onAgain: () => {
            G.completedWorks = 0;
            openPicker();
          },
          onRest: () => {
            location.href = '../../index.html';
          },
        });
      } else {
        G.completedWorks = 0;
        openPicker();
      }
    }, 900);
  }

  /* ------------------------------------------------------------------ */
  /* 이벤트 바인딩                                                         */
  /* ------------------------------------------------------------------ */

  function bindUi() {
    els.roomGrid.querySelectorAll('.room-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound('click');
        enterRoom(btn.dataset.room);
      });
    });

    els.btnBack.addEventListener('click', () => {
      sound('click');
      openPicker();
    });

    els.btnTumble.addEventListener('click', () => {
      tumble();
    });

    els.btnBall.addEventListener('click', () => {
      rollBall();
    });

    els.cleanupBox.addEventListener('click', () => {
      shakeBoxCleanup();
    });

    els.btnSound.addEventListener('click', () => {
      if (!window.KidsKit || !KidsKit.sound) return;
      const muted = KidsKit.sound.toggleMute();
      els.btnSound.textContent = muted ? '🔇' : '🔊';
    });

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    window.addEventListener('resize', () => {
      if (G.screen !== 'play') return;
      measureCell();
      if (G.room === 'cup') renderCupSlots();
      else {
        renderPieces();
        checkGoalProgress();
      }
    });

    if (window.KidsKit && KidsKit.restButton) {
      KidsKit.restButton({
        position: 'tr',
        onRest: () => {
          location.href = '../../index.html';
        },
      });
    }

    if (window.KidsKit && KidsKit.sound) {
      els.btnSound.textContent = KidsKit.sound.isMuted() ? '🔇' : '🔊';
    }
  }

  function init() {
    bindUi();
    const save = loadSave();
    G.visits = save.visits + 1;
    saveSave({ visits: G.visits });

    // 1회차: 방 고르기 생략 → 브릭
    if (G.visits <= 1) {
      G.firstHint = true;
      enterRoom('brick');
    } else {
      G.firstHint = false;
      openPicker();
    }
  }

  init();
})();
