/**
 * 반짝반짝 별사탕을 지켜요
 * 상자에 별사탕을 숨기고, 다가오는 요정을 드래그로 콩! 밀어낸다.
 * 실패·타이머·점수 없음. 요정이 상자를 열어도 축하하고 다시 숨기면 그만.
 * 변주: 콩 연출 3종 로테이션 · 장소 2종 · 스티커 도감 재방문.
 */
(() => {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STORE = window.KidsKit ? KidsKit.store('star-candy') : null;
  const ROUNDS_PER_SESSION = 3;

  const els = {
    canvas: document.getElementById('gameCanvas'),
    stage: document.getElementById('stage'),
    select: document.getElementById('selectScreen'),
    fairyRow: document.getElementById('fairyRow'),
    startBtn: document.getElementById('btnStart'),
    ending: document.getElementById('endingOverlay'),
    endingTitle: document.getElementById('endingTitle'),
    endingSub: document.getElementById('endingSub'),
    endingStickers: document.getElementById('endingStickers'),
    btnAgain: document.getElementById('btnAgain'),
    btnChange: document.getElementById('btnChange'),
    sound: document.getElementById('btnSound'),
    welcomeBanner: document.getElementById('welcomeBanner'),
    welcomeText: document.getElementById('welcomeText'),
    stickerAlbum: document.getElementById('stickerAlbum'),
    placeHint: document.getElementById('placeHint'),
  };

  const G = {
    state: 'select',
    phase: 'hide',
    W: 0,
    H: 0,
    dpr: 1,
    ctx: null,
    bg: null,
    fairyId: 'blue',
    placeId: 'nursery',
    placeIdx: 0,
    baseR: 24,
    player: {
      x: 0,
      y: 0,
      r: 24,
      speed: 320,
      facing: 1,
      walk: 0,
      squash: 0,
      hop: 0,
    },
    ai: null,
    boxes: [],
    hiddenBox: null,
    candy: {
      x: 0,
      y: 0,
      r: 20,
      mode: 'hidden',
      t: 0,
      fromX: 0,
      fromY: 0,
      toX: 0,
      toY: 0,
      flyT: 0,
    },
    particles: [],
    floats: [],
    pointer: { x: 0, y: 0 },
    dragging: false,
    noDragT: 0,
    showDragHint: false,
    bumped: 0,
    need: 5,
    bumpCd: 0,
    knockFxIdx: 0,
    winTimer: 0,
    shake: 0,
    time: 0,
    lastT: 0,
    phaseT: 0,
    sessionRound: 0,
    betweenTimer: 0,
    images: {},
    assetReady: false,
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function hasImg(key) {
    const img = G.images[key];
    return !!(img && img.dataset && img.dataset.kidsKitPlaceholder !== '1' && img.naturalWidth > 0);
  }

  function drawSprite(ctx, key, x, y, w, h) {
    if (!hasImg(key)) return false;
    ctx.drawImage(G.images[key], x - w / 2, y - h / 2, w, h);
    return true;
  }

  function getOwnedStickers() {
    if (!STORE) return [];
    const list = STORE.get('stickers', []);
    return Array.isArray(list) ? list : [];
  }

  function unlockNextSticker() {
    const owned = getOwnedStickers();
    const next = SC_STICKERS.find((s) => owned.indexOf(s.id) < 0);
    if (!next) return null;
    if (STORE) STORE.set('stickers', owned.concat([next.id]));
    return next;
  }

  function currentPlace() {
    return SC_PLACES.find((p) => p.id === G.placeId) || SC_PLACES[0];
  }

  function pickPlaceForRound() {
    G.placeIdx = (G.placeIdx + (G.sessionRound > 0 ? 1 : 0)) % SC_PLACES.length;
    if (G.sessionRound === 0 && STORE) {
      const visits = STORE.get('visits', 0) | 0;
      G.placeIdx = visits % SC_PLACES.length;
    }
    G.placeId = SC_PLACES[G.placeIdx].id;
    if (els.placeHint) {
      els.placeHint.textContent = '오늘 장소: ' + currentPlace().label;
    }
  }

  function renderStickerAlbum() {
    if (!els.stickerAlbum) return;
    const owned = getOwnedStickers();
    els.stickerAlbum.innerHTML = '';
    SC_STICKERS.forEach((s) => {
      const slot = document.createElement('div');
      slot.className = 'sticker-slot' + (owned.indexOf(s.id) >= 0 ? ' is-owned' : '');
      slot.title = s.label;
      slot.textContent = owned.indexOf(s.id) >= 0 ? s.emoji : '❔';
      els.stickerAlbum.appendChild(slot);
    });
  }

  function showWelcomeIfReturning() {
    if (!els.welcomeBanner) return;
    const owned = getOwnedStickers();
    const visits = STORE ? STORE.get('visits', 0) | 0 : 0;
    if (owned.length === 0 && visits < 1) {
      els.welcomeBanner.hidden = true;
      return;
    }
    els.welcomeBanner.hidden = false;
    if (els.welcomeText) {
      if (owned.length > 0) {
        els.welcomeText.textContent = '스티커가 반겨 줘!';
      } else {
        els.welcomeText.textContent = '또 왔구나! 별사탕 지키자';
      }
    }
    renderStickerAlbum();
  }

  /* ------------------------------------------------------------------ */
  /* 그리기 유틸                                                         */
  /* ------------------------------------------------------------------ */

  function roundRectPath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function drawStar(ctx, x, y, r, color) {
    if (r <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? r : r * 0.45;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHeart(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.9);
    ctx.bezierCurveTo(-s * 1.2, s * 0.1, -s * 0.6, -s * 0.9, 0, -s * 0.15);
    ctx.bezierCurveTo(s * 0.6, -s * 0.9, s * 1.2, s * 0.1, 0, s * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawNote(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = s * 0.24;
    ctx.beginPath();
    ctx.ellipse(-s * 0.3, s * 0.55, s * 0.42, s * 0.32, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0.1, s * 0.5);
    ctx.lineTo(s * 0.1, -s * 0.85);
    ctx.lineTo(s * 0.75, -s * 0.65);
    ctx.stroke();
    ctx.restore();
  }

  function drawPattern(ctx, pattern, x, y, s, color) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    if (pattern === 'star') {
      drawStar(ctx, x, y, s, color);
    } else if (pattern === 'heart') {
      drawHeart(ctx, x, y, s * 0.8, color);
    } else if (pattern === 'dot') {
      ctx.fillStyle = color;
      [-0.8, 0, 0.8].forEach((k) => {
        ctx.beginPath();
        ctx.arc(x + k * s, y - Math.abs(k) * s * 0.2, s * 0.26, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (pattern === 'note') {
      drawNote(ctx, x, y, s * 0.8, color);
    } else if (pattern === 'moon') {
      // 초승달: 큰 원에서 오른쪽 원을 파낸 모양(arc 두 개)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, s, -0.92, 0.92, true);
      ctx.arc(x + s * 0.5, y, s * 0.8, 1.43, -1.43 + Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();
    } else if (pattern === 'stripe') {
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.26;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + i * s - s * 0.4, y + s * 0.7);
        ctx.lineTo(x + i * s + s * 0.4, y - s * 0.7);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* 배경 — 지키기/드래그 정체성 (밤 보물방 · 별 정원)                    */
  /* ------------------------------------------------------------------ */

  function drawCandyJars(ctx, W, H) {
    const jars = [
      [W * 0.08, H * 0.78, '#ff8fc4'],
      [W * 0.18, H * 0.82, '#ffd43b'],
      [W * 0.88, H * 0.8, '#8ce0c0'],
    ];
    jars.forEach(([jx, jy, fill]) => {
      const jw = Math.min(W * 0.07, 42);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      roundRectPath(ctx, jx - jw / 2, jy - jw * 1.1, jw, jw * 1.15, 8);
      ctx.fill();
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(jx, jy - jw * 0.35, jw * 0.28, jw * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8f0ff';
      roundRectPath(ctx, jx - jw * 0.28, jy - jw * 1.22, jw * 0.56, jw * 0.18, 4);
      ctx.fill();
    });
  }

  function drawCandyBushes(ctx, W, H) {
    const bushes = [
      [W * 0.1, H * 0.82, '#69db7c'],
      [W * 0.9, H * 0.8, '#ff922b'],
    ];
    bushes.forEach(([bx, by, leaf]) => {
      const s = Math.min(W * 0.1, 56);
      ctx.fillStyle = leaf;
      ctx.beginPath();
      ctx.ellipse(bx, by, s * 0.7, s * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(bx - s * 0.35, by - s * 0.15, s * 0.4, s * 0.35, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(bx + s * 0.35, by - s * 0.15, s * 0.4, s * 0.35, 0.3, 0, Math.PI * 2);
      ctx.fill();
      drawStar(ctx, bx, by - s * 0.45, s * 0.22, '#ffd43b');
    });
  }

  function buildBackground() {
    if (!G.W || !G.H) return;
    const place = currentPlace();
    const bgKey = place.id === 'garden' ? 'bg-garden' : 'bg-nursery';
    const dpr = G.dpr;
    const c = document.createElement('canvas');
    c.width = Math.round(G.W * dpr);
    c.height = Math.round(G.H * dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = G.W;
    const H = G.H;
    const floorY = H * 0.72;

    if (hasImg(bgKey)) {
      ctx.drawImage(G.images[bgKey], 0, 0, W, H);
      // 배경 webp는 가운데 놀이 공간을 비우므로, 문 슬롯을 위에 겹친다.
      const dw = Math.min(W * 0.22, H * 0.28);
      const dh = H * 0.28;
      drawSprite(ctx, 'door', W / 2, dh * 0.55, dw * 1.1, dh * 1.05);
      G.bg = c;
      return;
    }

    const wall = ctx.createLinearGradient(0, 0, 0, floorY);
    wall.addColorStop(0, place.wallTop);
    wall.addColorStop(1, place.wallBottom);
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, floorY);

    // 별 점묘 (밤 지키기 방 — 낮 줄무늬 거실과 구분)
    ctx.save();
    for (let i = 0; i < 28; i += 1) {
      const sx = ((i * 97) % W);
      const sy = 12 + ((i * 53) % (floorY * 0.55));
      const sr = 1.2 + (i % 3);
      ctx.globalAlpha = 0.35 + (i % 4) * 0.12;
      drawStar(ctx, sx, sy, sr, i % 2 ? '#ffe066' : '#ffffff');
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = place.stripe;
    for (let x = -30; x < W + 30; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 28, 0);
      ctx.lineTo(x + 8, floorY);
      ctx.lineTo(x - 20, floorY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 달 창문 (둥근 창 — transform-hide의 사각 낮 창문과 분리)
    const ww = Math.min(W * 0.2, H * 0.2);
    const wx = W * 0.1;
    const wy = Math.max(H * 0.08, 12);
    ctx.fillStyle = place.windowFrame;
    ctx.beginPath();
    ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2 + 8, 0, Math.PI * 2);
    ctx.fill();
    const sky = ctx.createRadialGradient(wx + ww * 0.45, wy + ww * 0.4, 4, wx + ww / 2, wy + ww / 2, ww / 2);
    sky.addColorStop(0, '#9ecfff');
    sky.addColorStop(1, '#1b2a4a');
    ctx.fillStyle = sky;
    ctx.beginPath();
    ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3bf';
    ctx.beginPath();
    ctx.arc(wx + ww * 0.58, wy + ww * 0.4, ww * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = sky;
    ctx.beginPath();
    ctx.arc(wx + ww * 0.68, wy + ww * 0.34, ww * 0.14, 0, Math.PI * 2);
    ctx.fill();

    // 사각 요새 문 (아치 문과 구분) + 별 손잡이
    const dw = Math.min(W * 0.22, H * 0.28);
    const dh = H * 0.28;
    const dx = W / 2 - dw / 2;
    if (!drawSprite(ctx, 'door', W / 2, dh * 0.55, dw * 1.1, dh * 1.05)) {
      ctx.fillStyle = place.door;
      roundRectPath(ctx, dx, 8, dw, dh, 14);
      ctx.fill();
      ctx.strokeStyle = place.doorStroke;
      ctx.lineWidth = 6;
      ctx.stroke();
      // 캔디케인 문틀
      ctx.fillStyle = '#ff6b9d';
      roundRectPath(ctx, dx - 10, 4, 12, dh + 8, 6);
      ctx.fill();
      roundRectPath(ctx, dx + dw - 2, 4, 12, dh + 8, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let y = 16; y < dh; y += 18) {
        ctx.fillRect(dx - 8, y, 8, 8);
        ctx.fillRect(dx + dw, y + 6, 8, 8);
      }
      drawStar(ctx, dx + dw * 0.72, dh * 0.55, 8, '#fff3bf');
    }

    // 보물 액자 (방패형 별)
    const fw = Math.min(W * 0.12, 68);
    const fx = W - fw - W * 0.07;
    const fy = H * 0.1;
    ctx.fillStyle = '#ffe066';
    roundRectPath(ctx, fx - 6, fy - 6, fw + 12, fw * 0.85 + 12, 10);
    ctx.fill();
    ctx.fillStyle = '#4c1d6e';
    roundRectPath(ctx, fx, fy, fw, fw * 0.85, 8);
    ctx.fill();
    drawStar(ctx, fx + fw / 2, fy + fw * 0.4, fw * 0.28, '#ffd43b');

    // 바닥
    const floor = ctx.createLinearGradient(0, floorY, 0, H);
    floor.addColorStop(0, place.floorTop);
    floor.addColorStop(1, place.floorBottom);
    ctx.fillStyle = floor;
    ctx.fillRect(0, floorY, W, H - floorY);
    ctx.strokeStyle = 'rgba(255, 220, 240, 0.12)';
    ctx.lineWidth = 2;
    for (let y = floorY + 22; y < H; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // 별 러그 (타원 + 가장자리 별)
    ctx.fillStyle = place.rugOuter;
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.66, W * 0.44, H * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = place.rugInner;
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.66, W * 0.34, H * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    drawStar(ctx, W * 0.5, H * 0.64, Math.min(W, H) * 0.035, '#ffd43b');

    if (place.prop === 'jars') drawCandyJars(ctx, W, H);
    else drawCandyBushes(ctx, W, H);

    G.bg = c;
  }

  /* ------------------------------------------------------------------ */
  /* 상자 배치                                                           */
  /* ------------------------------------------------------------------ */

  function boxPositions() {
    const portrait = G.H >= G.W;
    const size = portrait
      ? clamp(Math.min(G.W * 0.25, G.H * 0.145), 58, 122)
      : clamp(Math.min(G.W * 0.145, G.H * 0.22), 58, 128);
    const pts = portrait
      ? [
          [0.18, 0.44],
          [0.5, 0.39],
          [0.82, 0.44],
          [0.32, 0.66],
          [0.68, 0.66],
        ]
      : [
          [0.12, 0.58],
          [0.31, 0.52],
          [0.5, 0.49],
          [0.69, 0.52],
          [0.88, 0.58],
        ];
    return pts.map((p) => ({ x: G.W * p[0], y: G.H * p[1], s: size }));
  }

  function layoutBoxes() {
    const old = G.boxes;
    G.boxes = boxPositions().map((p, i) => ({
      slot: i,
      cx: p.x,
      cy: p.y,
      size: p.s,
      def: SC_BOXES[i],
      open: old[i] ? old[i].open : false,
      hidden: old[i] ? old[i].hidden : false,
      pop: old[i] ? old[i].pop : 0,
      wobble: 0,
    }));
    G.hiddenBox = G.boxes.find((b) => b.hidden) || null;
  }

  /* ------------------------------------------------------------------ */
  /* 크기·초기화                                                         */
  /* ------------------------------------------------------------------ */

  function resize() {
    const rect = els.stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    G.W = rect.width;
    G.H = rect.height;
    G.dpr = dpr;

    els.canvas.width = Math.round(G.W * dpr);
    els.canvas.height = Math.round(G.H * dpr);
    els.canvas.style.width = G.W + 'px';
    els.canvas.style.height = G.H + 'px';
    G.ctx = els.canvas.getContext('2d');
    G.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    G.baseR = clamp(Math.min(G.W, G.H) * 0.062, 18, 40);
    G.player.r = G.baseR;
    G.player.speed = Math.min(G.W, G.H) * 1.5;
    if (G.ai) {
      G.ai.r = G.baseR * 1.15;
      G.ai.speed = clamp(Math.min(G.W, G.H) * 0.4, 150, 320);
    }

    layoutBoxes();
    clampEntities();
    buildBackground();
  }

  function clampEntities() {
    const p = G.player;
    p.x = clamp(p.x, p.r, G.W - p.r);
    p.y = clamp(p.y, G.H * 0.18 + p.r, G.H - p.r);
    if (G.ai) {
      G.ai.x = clamp(G.ai.x, G.ai.r, G.W - G.ai.r);
      G.ai.y = clamp(G.ai.y, G.ai.r, G.H - G.ai.r);
    }
  }

  function doorPos() {
    return { x: G.W * 0.5, y: G.H * 0.14 };
  }

  function makeAI() {
    const fairy = SC_FAIRIES.find((f) => f.id === G.fairyId) || SC_FAIRIES[0];
    const door = doorPos();
    return {
      fairy,
      x: door.x,
      y: door.y,
      vx: 0,
      vy: 0,
      r: G.baseR * 1.15,
      speed: clamp(Math.min(G.W, G.H) * 0.4, 150, 320),
      facing: 1,
      walk: 0,
      hop: 0,
      bubble: 0,
      spin: 0,
      plop: 0,
      knockFx: 'bubble',
      state: 'idle',
      stateT: 0,
      progress: 0,
      phase: Math.random() * 6,
    };
  }

  /* ------------------------------------------------------------------ */
  /* 선택 화면                                                           */
  /* ------------------------------------------------------------------ */

  function buildSelect() {
    SC_FAIRIES.forEach((fairy) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fairy-card';
      btn.dataset.id = fairy.id;
      btn.style.setProperty('--fairy', fairy.color);
      btn.setAttribute('aria-label', fairy.label + ' 요정');

      const cv = document.createElement('canvas');
      cv.className = 'fairy-thumb';
      cv.width = 208;
      cv.height = 208;
      const ctx = cv.getContext('2d');
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      drawFairy(ctx, fairy, 52, 58, 34, { t: 0.4, facing: 1 });

      const label = document.createElement('span');
      label.textContent = fairy.label;

      btn.appendChild(cv);
      btn.appendChild(label);
      btn.addEventListener('click', () => {
        SC_SOUND.play('tap');
        selectFairy(fairy.id);
      });
      els.fairyRow.appendChild(btn);
    });
    selectFairy(G.fairyId);
  }

  function selectFairy(id) {
    G.fairyId = id;
    Array.prototype.forEach.call(els.fairyRow.children, (btn) => {
      btn.classList.toggle('is-selected', btn.dataset.id === id);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 라운드                                                              */
  /* ------------------------------------------------------------------ */

  function startRound(opts) {
    opts = opts || {};
    if (!G.W || !G.H) resize();

    els.select.classList.remove('is-on');
    els.ending.classList.remove('is-on');

    if (!opts.continueSession) {
      G.sessionRound = 0;
      G.knockFxIdx = 0;
      if (STORE) {
        const visits = (STORE.get('visits', 0) | 0) + 1;
        STORE.set('visits', visits);
      }
    }

    pickPlaceForRound();
    buildBackground();

    G.state = 'play';
    G.phase = 'hide';
    G.phaseT = 0;
    G.bumped = 0;
    G.need = 5;
    G.bumpCd = 0;
    G.winTimer = 0;
    G.shake = 0;
    G.time = 0;
    G.lastT = 0;
    G.particles = [];
    G.floats = [];
    G.dragging = false;
    G.noDragT = 0;
    G.showDragHint = false;

    G.boxes = [];
    layoutBoxes();
    G.hiddenBox = null;

    G.player.x = G.W * 0.5;
    G.player.y = G.H * 0.86;
    G.player.walk = 0;
    G.player.squash = 0;
    G.player.hop = 0;

    G.ai = makeAI();

    const c = G.candy;
    c.mode = 'float';
    c.x = G.W * 0.5;
    c.y = G.H * 0.26;
    c.r = G.baseR * 0.9;
    c.t = 0;

    floatText(G.W * 0.5, G.H * 0.2, currentPlace().label, '#ffe066');
  }

  function showSelect() {
    G.state = 'select';
    G.phase = 'hide';
    G.dragging = false;
    G.sessionRound = 0;
    G.betweenTimer = 0;
    els.ending.classList.remove('is-on');
    showWelcomeIfReturning();
    pickPlaceForRound();
    els.select.classList.add('is-on');
  }

  function showEnding() {
    if (G.state !== 'play') return;
    G.state = 'ending';
    G.phase = 'ending';
    G.dragging = false;

    const owned = getOwnedStickers();
    if (els.endingTitle) els.endingTitle.textContent = '오늘 별사탕 잘 지켰어!';
    if (els.endingSub) {
      els.endingSub.textContent = owned.length
        ? '스티커 ' + owned.length + '개랑 콩콩! 신났어요'
        : '콩콩! 신나게 놀았어요';
    }
    if (els.endingStickers) {
      els.endingStickers.innerHTML = owned
        .map((id) => {
          const s = SC_STICKERS.find((x) => x.id === id);
          return s ? '<span>' + s.emoji + '</span>' : '';
        })
        .join('');
    }

    els.ending.classList.add('is-on');
    SC_SOUND.play('win');
    confettiBurst();
    if (window.KidsKit) KidsKit.haptic('success');
  }

  function onRoundCleared() {
    G.sessionRound += 1;
    const sticker = unlockNextSticker();
    if (sticker) {
      floatText(G.W * 0.5, G.H * 0.28, sticker.emoji + ' ' + sticker.label, '#ffd43b');
      SC_SOUND.play('hide');
      if (window.KidsKit) KidsKit.haptic('success');
    }

    if (G.sessionRound >= ROUNDS_PER_SESSION) {
      showEnding();
      return;
    }

    // 세션 안 다음 장소로 이어 놀기 (3~5분 호흡)
    G.winTimer = 0;
    G.phase = 'between';
    G.betweenTimer = sticker ? 0.95 : 0.55;
    G.dragging = false;
  }

  /* ------------------------------------------------------------------ */
  /* 숨기기·열기                                                         */
  /* ------------------------------------------------------------------ */

  function hitBox(p) {
    for (let i = 0; i < G.boxes.length; i += 1) {
      const b = G.boxes[i];
      const half = b.size * 0.6 + 10;
      if (Math.abs(p.x - b.cx) <= half && Math.abs(p.y - b.cy) <= half) return b;
    }
    return null;
  }

  function hideCandy(box) {
    if (!(G.phase === 'hide' || G.phase === 'rehide')) return;

    G.boxes.forEach((b) => {
      b.hidden = false;
      b.open = false;
    });
    box.hidden = true;
    box.pop = 1;
    G.hiddenBox = box;
    G.phase = 'guard';
    G.phaseT = 0;
    G.noDragT = 0;
    G.showDragHint = false;

    const c = G.candy;
    c.mode = 'toBox';
    c.flyT = 0;
    c.fromX = c.x;
    c.fromY = c.y;
    c.toX = box.cx;
    c.toY = box.cy;
    c.r = G.baseR * 0.9;

    SC_SOUND.play('hide');
    burst(box.cx, box.cy, 8, 'sparkle');
    floatText(box.cx, box.cy - box.size * 0.7, '반짝!', '#ffd43b');

    if (G.ai) {
      G.ai.progress = 0;
      G.ai.state = 'return';
      G.ai.stateT = 0;
    }
  }

  function openBox() {
    const box = G.hiddenBox;
    G.phase = 'caught';
    G.phaseT = 0;
    if (box) box.open = true;

    const a = G.ai;
    a.state = 'open';
    a.stateT = 2.2;
    a.progress = 1;
    a.hop = 1;

    const c = G.candy;
    c.mode = 'ai';
    c.r = G.baseR * 0.85;
    if (box) {
      c.x = box.cx;
      c.y = box.cy;
    }

    SC_SOUND.play('caught');
    burst(c.x, c.y, 14, 'star');
    // 승패 허용: 요정이 가져가도 축하
    floatText(box ? box.cx : G.W * 0.5, (box ? box.cy : G.H * 0.4) - 36, '요정 축하해!', '#74c0fc');
    floatText(box ? box.cx : G.W * 0.5, (box ? box.cy : G.H * 0.4) + 8, '다시 숨겨볼까?', '#ff8fc4');
    G.shake = 0.25;
    if (window.KidsKit) KidsKit.haptic('soft');
  }

  /* ------------------------------------------------------------------ */
  /* 업데이트                                                            */
  /* ------------------------------------------------------------------ */

  function moveToward(e, tx, ty, speed, dt) {
    const dx = tx - e.x;
    const dy = ty - e.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.001) return d;
    const step = Math.min(d, speed * dt);
    e.x += (dx / d) * step;
    e.y += (dy / d) * step;
    e.walk += step * 0.08;
    if (Math.abs(dx) > 2) e.facing = dx < 0 ? -1 : 1;
    return d;
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (G.dragging) {
      const dx = G.pointer.x - p.x;
      const dy = G.pointer.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 1) {
        const step = Math.min(d, p.speed * dt);
        p.x += (dx / d) * step;
        p.y += (dy / d) * step;
        if (Math.abs(dx) > 1) p.facing = dx < 0 ? -1 : 1;
        p.walk += step * 0.07;
      }
    }
    p.x = clamp(p.x, p.r, G.W - p.r);
    p.y = clamp(p.y, G.H * 0.18 + p.r, G.H - p.r);
    p.squash = Math.max(0, p.squash - dt * 3.5);
    p.hop = Math.max(0, p.hop - dt * 2.6);
  }

  function aiTarget() {
    const b = G.hiddenBox;
    if (!b) return doorPos();
    return {
      x: b.cx,
      y: Math.min(G.H - G.baseR, b.cy + b.size * 0.78),
    };
  }

  function updateAI(dt) {
    const a = G.ai;
    if (!a) return;

    switch (a.state) {
      case 'idle':
        break;
      case 'wait':
        a.stateT -= dt;
        if (a.stateT <= 0 && G.phase === 'guard' && G.hiddenBox) {
          a.state = 'approach';
          a.progress = 0;
        }
        break;
      case 'approach': {
        if (!G.hiddenBox) {
          a.state = 'return';
          break;
        }
        const tgt = aiTarget();
        const d = moveToward(a, tgt.x, tgt.y, a.speed, dt);
        if (d < 5) {
          a.state = 'peek';
          a.progress = 0;
        }
        break;
      }
      case 'peek':
        a.progress += dt / 2.6;
        a.walk += dt * 7;
        a.hop = Math.max(0, Math.sin(G.time * 12) * 0.5 + 0.5);
        if (a.progress >= 1) openBox();
        break;
      case 'knocked': {
        a.stateT -= dt;
        const fx = a.knockFx || 'bubble';
        if (fx === 'plop') {
          a.vy += 900 * dt;
          a.x += a.vx * dt;
          a.y += a.vy * dt;
          const floor = G.H - a.r * 1.05;
          if (a.y >= floor) {
            a.y = floor;
            a.vy = -Math.abs(a.vy) * 0.35;
            a.vx *= 0.7;
            a.plop = 1;
          }
          a.spin = Math.max(0, a.stateT / 1.4);
        } else if (fx === 'firework') {
          a.x += a.vx * dt * 0.35;
          a.y += a.vy * dt * 0.35;
          const k = Math.pow(0.05, dt);
          a.vx *= k;
          a.vy *= k;
          a.spin = Math.max(0, a.stateT / 1.2);
          if (Math.random() < dt * 8) {
            burst(a.x + rand(-20, 20), a.y + rand(-40, 10), 3, 'firework');
          }
        } else {
          a.x += a.vx * dt;
          a.y += a.vy * dt;
          const k = Math.pow(0.02, dt);
          a.vx *= k;
          a.vy *= k;
          a.bubble = Math.max(0, a.stateT / 1.3);
          a.spin = Math.max(0, a.stateT / 1.3);
        }
        a.x = clamp(a.x, a.r, G.W - a.r);
        a.y = clamp(a.y, a.r, G.H - a.r);
        a.plop = Math.max(0, (a.plop || 0) - dt * 1.5);
        if (a.stateT <= 0) {
          a.bubble = 0;
          a.spin = 0;
          a.plop = 0;
          a.state = 'return';
        }
        break;
      }
      case 'return': {
        const door = doorPos();
        const d = moveToward(a, door.x, door.y, a.speed * 1.25, dt);
        if (d < 5) {
          a.state = 'wait';
          a.stateT = 0.9;
        }
        break;
      }
      case 'open':
        a.stateT -= dt;
        a.hop = Math.max(0, Math.sin(G.time * 12) * 0.5 + 0.5);
        if (a.stateT <= 0 && G.phase === 'caught') {
          G.phase = 'rehide';
          G.phaseT = 0;
          a.state = 'return';
          G.candy.mode = 'float';
          SC_SOUND.play('tap');
        }
        break;
      default:
        break;
    }
  }

  function checkBump() {
    if (G.phase !== 'guard' || !G.ai) return;
    if (G.bumpCd > 0) return;
    const a = G.ai;
    if (a.state !== 'approach' && a.state !== 'peek') return;
    if (!G.dragging) return;
    const d = dist(G.player, a);
    if (d < G.player.r + a.r * 1.05) doBump();
  }

  function updateDragHint(dt) {
    if (G.phase !== 'guard' || !G.ai || G.bumped > 0) {
      G.noDragT = 0;
      G.showDragHint = false;
      return;
    }
    const approaching = G.ai.state === 'approach' || G.ai.state === 'peek';
    if (!approaching) {
      G.noDragT = 0;
      G.showDragHint = false;
      return;
    }
    if (G.dragging) {
      G.noDragT = 0;
      G.showDragHint = false;
      return;
    }
    G.noDragT += dt;
    if (G.noDragT >= 3) G.showDragHint = true;
  }

  function doBump() {
    const a = G.ai;
    const p = G.player;
    const ang = Math.atan2(a.y - p.y, a.x - p.x) || 0;
    const power = Math.min(G.W, G.H) * 1.9;
    const fx = SC_KNOCK_FX[G.knockFxIdx % SC_KNOCK_FX.length];
    G.knockFxIdx += 1;

    a.knockFx = fx;
    a.vx = Math.cos(ang) * power;
    a.vy = Math.sin(ang) * power;
    a.state = 'knocked';
    a.stateT = fx === 'plop' ? 1.45 : fx === 'firework' ? 1.25 : 1.3;
    a.bubble = fx === 'bubble' ? 1 : 0;
    a.spin = 1;
    a.plop = fx === 'plop' ? 1 : 0;

    G.bumpCd = 0.85;
    G.bumped = Math.min(G.need, G.bumped + 1);
    G.shake = fx === 'firework' ? 0.4 : 0.55;
    p.squash = 1;
    p.hop = 1;

    if (fx === 'bubble') {
      SC_SOUND.play('bump');
      SC_SOUND.play('boing');
      burst(a.x, a.y, 12, 'star');
      floatText(a.x, a.y - a.r * 1.7, '띠용~', '#74c0fc');
    } else if (fx === 'plop') {
      SC_SOUND.play('bump');
      SC_SOUND.play('boing');
      burst(a.x, a.y, 10, 'star');
      floatText(a.x, a.y - a.r * 1.7, '통통!', '#ff922b');
      a.vy = Math.min(a.vy, -power * 0.15);
    } else {
      SC_SOUND.play('bump');
      SC_SOUND.play('win');
      fireworkBurst(a.x, a.y - a.r);
      floatText(a.x, a.y - a.r * 1.7, '팡팡!', '#ffd43b');
    }

    floatText(p.x, p.y - p.r * 1.8, '콩!', '#ff6b9d');
    if (window.KidsKit) KidsKit.haptic('medium');

    if (G.bumped >= G.need && G.winTimer <= 0) G.winTimer = 1.4;
  }

  function updateCandy(dt) {
    const c = G.candy;
    c.t += dt;
    if (c.mode === 'float') {
      const tx = G.W * 0.5 + Math.sin(c.t * 1.5) * 8;
      const ty = G.H * 0.28 + Math.sin(c.t * 2.4) * 8;
      c.x += (tx - c.x) * Math.min(1, dt * 6);
      c.y += (ty - c.y) * Math.min(1, dt * 6);
      c.r = G.baseR * 0.9;
    } else if (c.mode === 'toBox') {
      c.flyT += dt;
      const k = clamp(c.flyT / 0.26, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      c.x = c.fromX + (c.toX - c.fromX) * e;
      c.y = c.fromY + (c.toY - c.fromY) * e;
      c.r = G.baseR * 0.9 * (1 - e * 0.5);
      if (k >= 1) c.mode = 'hidden';
    } else if (c.mode === 'ai') {
      const a = G.ai;
      if (a) {
        const tx = a.x;
        const ty = a.y - a.r * 1.95;
        c.x += (tx - c.x) * Math.min(1, dt * 9);
        c.y += (ty - c.y) * Math.min(1, dt * 9);
      }
    }
  }

  function updateBoxes(dt) {
    const a = G.ai;
    for (let i = 0; i < G.boxes.length; i += 1) {
      const b = G.boxes[i];
      b.pop = Math.max(0, b.pop - dt * 1.8);
      let w = 0;
      if (b === G.hiddenBox && G.phase === 'guard' && a) {
        const d = Math.hypot(a.x - b.cx, a.y - b.cy);
        const near = clamp(1 - d / (b.size * 2.4), 0, 1);
        w = near * (a.state === 'peek' ? 1 : 0.7);
      }
      b.wobble += (w - b.wobble) * Math.min(1, dt * 6);
    }
  }

  function update(dt) {
    G.time += dt;
    G.shake = Math.max(0, G.shake - dt * 2.2);
    updateParticles(dt);
    updateFloats(dt);

    if (G.state !== 'play') return;

    G.phaseT += dt;
    G.bumpCd = Math.max(0, G.bumpCd - dt);

    if (G.phase === 'between') {
      G.betweenTimer -= dt;
      if (G.betweenTimer <= 0) {
        G.betweenTimer = 0;
        startRound({ continueSession: true });
      }
      return;
    }

    updatePlayer(dt);
    updateAI(dt);
    updateCandy(dt);
    updateBoxes(dt);
    checkBump();
    updateDragHint(dt);

    if (G.winTimer > 0) {
      G.winTimer -= dt;
      if (G.winTimer <= 0) {
        G.winTimer = 0;
        onRoundCleared();
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* 파티클                                                              */
  /* ------------------------------------------------------------------ */

  function burst(x, y, count, kind) {
    const colors = ['#ffd43b', '#ff8fc4', '#8ce0c0', '#b8a6ff', '#ffb08a', '#ffffff'];
    for (let i = 0; i < count; i += 1) {
      const ang = rand(0, Math.PI * 2);
      const sp = rand(70, 250);
      G.particles.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 70,
        life: rand(0.45, 0.95),
        max: 0.95,
        size: rand(4, 9),
        color: colors[Math.floor(rand(0, colors.length))],
        kind: kind || 'star',
      });
    }
  }

  function fireworkBurst(x, y) {
    const colors = ['#ffd43b', '#ff6b9d', '#74c0fc', '#b8a6ff', '#69db7c', '#ffffff'];
    for (let ring = 0; ring < 2; ring += 1) {
      for (let i = 0; i < 14; i += 1) {
        const ang = (i / 14) * Math.PI * 2 + ring * 0.2;
        const sp = 120 + ring * 80 + rand(0, 40);
        G.particles.push({
          x,
          y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 40,
          life: rand(0.7, 1.2),
          max: 1.2,
          size: rand(5, 10),
          color: colors[Math.floor(rand(0, colors.length))],
          kind: 'firework',
        });
      }
    }
  }

  function confettiBurst() {
    const colors = ['#ffd43b', '#ff8fc4', '#8ce0c0', '#b8a6ff', '#ffb08a', '#5c9dff'];
    for (let i = 0; i < 70; i += 1) {
      G.particles.push({
        x: rand(0, G.W),
        y: rand(-40, -6),
        vx: rand(-40, 40),
        vy: rand(60, 160),
        life: rand(1.4, 2.4),
        max: 2.4,
        size: rand(6, 11),
        color: colors[Math.floor(rand(0, colors.length))],
        kind: 'confetti',
      });
    }
  }

  function updateParticles(dt) {
    for (let i = G.particles.length - 1; i >= 0; i -= 1) {
      const p = G.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        G.particles.splice(i, 1);
        continue;
      }
      p.vy += (p.kind === 'firework' ? 120 : 380) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.99;
    }
  }

  function floatText(x, y, text, color) {
    G.floats.push({ x, y, text, color, life: 1.05, max: 1.05 });
  }

  function updateFloats(dt) {
    for (let i = G.floats.length - 1; i >= 0; i -= 1) {
      const f = G.floats[i];
      f.life -= dt;
      f.y -= 46 * dt;
      if (f.life <= 0) G.floats.splice(i, 1);
    }
  }

  /* ------------------------------------------------------------------ */
  /* 엔티티 그리기                                                       */
  /* ------------------------------------------------------------------ */

  function drawBox(ctx, b, t) {
    const s = b.size;
    const wob = REDUCED ? 0 : b.wobble * Math.sin(t * 26 + b.slot) * 0.05;
    ctx.save();
    ctx.translate(b.cx, b.cy);
    ctx.rotate(wob);
    const pop = 1 + b.pop * 0.14;
    ctx.scale(pop, pop);

    if (drawSprite(ctx, 'box-' + b.def.pattern, 0, 0, s * 1.05, s * 1.05)) {
      // 이미지에 상자별 색·무늬가 들어 있어 코드 무늬는 겹치지 않는다.
      ctx.restore();
      return;
    }

    ctx.fillStyle = 'rgba(20, 10, 40, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.47, s * 0.5, s * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = b.def.color;
    roundRectPath(ctx, -s / 2, -s * 0.42, s, s * 0.9, s * 0.14);
    ctx.fill();

    ctx.fillStyle = b.def.dark;
    roundRectPath(ctx, -s * 0.54, -s * 0.5, s * 1.08, s * 0.27, s * 0.1);
    ctx.fill();

    ctx.fillStyle = b.def.ribbon;
    ctx.fillRect(-s * 0.07, -s * 0.5, s * 0.14, s * 0.98);
    ctx.fillRect(-s * 0.54, -s * 0.39, s * 1.08, s * 0.09);

    ctx.fillStyle = b.def.dark;
    ctx.beginPath();
    ctx.ellipse(-s * 0.14, -s * 0.53, s * 0.13, s * 0.09, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.14, -s * 0.53, s * 0.13, s * 0.09, 0.5, 0, Math.PI * 2);
    ctx.fill();

    drawPattern(ctx, b.def.pattern, 0, s * 0.13, s * 0.17, b.def.motif || b.def.ribbon);

    if (b.open) {
      ctx.fillStyle = '#2b1a38';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.36, s * 0.42, s * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(-s * 0.12, -s * 0.62);
      ctx.rotate(-0.28);
      ctx.fillStyle = b.def.dark;
      roundRectPath(ctx, -s * 0.5, -s * 0.1, s, s * 0.22, s * 0.08);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawCandy(ctx, x, y, r, t) {
    if (drawSprite(ctx, 'candy', x, y, r * 2.4, r * 2.4)) return;
    ctx.save();
    ctx.translate(x, y);
    const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.1);
    glow.addColorStop(0, 'rgba(255, 235, 130, 0.85)');
    glow.addColorStop(1, 'rgba(255, 235, 130, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(Math.sin(t * 1.6) * 0.12 + t * 0.35);
    drawStar(ctx, 0, 0, r, '#f59f00');
    drawStar(ctx, 0, 0, r * 0.78, '#ffd43b');
    drawStar(ctx, 0, 0, r * 0.42, '#fff3bf');

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(-r * 0.22, -r * 0.22, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFairy(ctx, fairy, x, y, r, o) {
    o = o || {};
    const t = o.t || 0;
    const facing = o.facing || 1;
    const walk = o.walk || 0;
    const hop = o.hop || 0;
    const bubble = o.bubble || 0;
    const spin = o.spin || 0;
    const plop = o.plop || 0;
    const peek = o.peek || 0;
    const bob = REDUCED ? 0 : Math.sin(t * 3 + (o.phase || 0)) * r * 0.05 + hop * r * 0.14;
    const fairyKey = 'fairy-' + fairy.id;

    ctx.save();
    ctx.fillStyle = 'rgba(20, 10, 40, 0.28)';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 1.02, r * (0.6 + plop * 0.35), r * (0.16 + plop * 0.08), 0, 0, Math.PI * 2);
    ctx.fill();

    if (bubble > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, bubble) * 0.9;
      const br = r * (1.35 + 0.25 * bubble);
      ctx.fillStyle = 'rgba(170, 225, 255, 0.32)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - bob, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x - br * 0.3, y - bob - br * 0.35, br * 0.22, 0.6, 2.2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.translate(x, y - bob);
    if (!REDUCED && spin > 0) ctx.rotate(Math.sin(t * 22) * 0.18 * spin);
    if (plop > 0) ctx.scale(1 + plop * 0.35, 1 - plop * 0.28);
    ctx.scale(facing, 1);

    if (drawSprite(ctx, fairyKey, 0, 0, r * 2.6, r * 2.6)) {
      ctx.restore();
      return;
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.85, -r * 0.12, r * 0.34, r * 0.55, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.85, -r * 0.12, r * 0.34, r * 0.55, 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fairy.accent;
    const swing = Math.sin(walk) * r * 0.12;
    ctx.beginPath();
    ctx.ellipse(-r * 0.34, r * 0.94 + swing, r * 0.22, r * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.34, r * 0.94 - swing, r * 0.22, r * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fairy.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fairy.belly;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.28, r * 0.56, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fairy.color;
    ctx.beginPath();
    ctx.ellipse(-r * 0.92, r * 0.2, r * 0.2, r * 0.14, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.92, r * 0.2, r * 0.2, r * 0.14, 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 143, 196, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.48, r * 0.16, r * 0.16, r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.48, r * 0.16, r * 0.16, r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4a3f52';
    if (peek) {
      ctx.beginPath();
      ctx.arc(-r * 0.28, -r * 0.12, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * 0.28, -r * 0.12, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, r * 0.26, r * 0.13, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(-r * 0.28, -r * 0.14, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * 0.28, -r * 0.14, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4a3f52';
      ctx.lineWidth = Math.max(2, r * 0.08);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, r * 0.08, r * 0.24, 0.25, Math.PI - 0.25);
      ctx.stroke();
    }

    ctx.strokeStyle = fairy.accent;
    ctx.lineWidth = Math.max(2, r * 0.07);
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, -r * 1.5);
    ctx.stroke();
    ctx.fillStyle = fairy.accent;
    ctx.beginPath();
    ctx.arc(0, -r * 1.56, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    if (fairy.hat === 'crown') {
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.94);
      ctx.lineTo(-r * 0.24, -r * 1.3);
      ctx.lineTo(0, -r * 1.02);
      ctx.lineTo(r * 0.24, -r * 1.3);
      ctx.lineTo(r * 0.4, -r * 0.94);
      ctx.closePath();
      ctx.fill();
    } else if (fairy.hat === 'bow') {
      ctx.fillStyle = '#ff6b9d';
      ctx.beginPath();
      ctx.ellipse(-r * 0.4, -r * 1.12, r * 0.2, r * 0.14, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(r * 0.4, -r * 1.12, r * 0.2, r * 0.14, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath();
      ctx.arc(0, -r * 1.12, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    } else {
      drawStar(ctx, 0, -r * 1.62, r * 0.2, '#ffe066');
    }

    if (peek) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(120, 90, 110, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r * 0.95, -r * 1.5, r * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7a2c4e';
      ctx.font = 'bold ' + Math.round(r * 0.5) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', r * 0.95, -r * 1.46);
    }

    ctx.restore();
  }

  function drawKid(ctx, x, y, r, o) {
    o = o || {};
    const walk = o.walk || 0;
    const facing = o.facing || 1;
    const squash = o.squash || 0;
    const hop = o.hop || 0;

    ctx.save();
    ctx.fillStyle = 'rgba(20, 10, 40, 0.28)';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.98, r * 0.62, r * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(x, y - hop * r * 0.16);
    ctx.scale(facing * (1 + squash * 0.14), 1 - squash * 0.1);

    if (drawSprite(ctx, 'kid', 0, -r * 0.2, r * 2.8, r * 2.8)) {
      ctx.restore();
      return;
    }

    const swing = Math.sin(walk) * r * 0.22;
    ctx.fillStyle = '#4c6ef5';
    roundRectPath(ctx, -r * 0.44, r * 0.46 + swing, r * 0.34, r * 0.5, r * 0.16);
    ctx.fill();
    roundRectPath(ctx, r * 0.1, r * 0.46 - swing, r * 0.34, r * 0.5, r * 0.16);
    ctx.fill();

    ctx.fillStyle = '#364fc7';
    ctx.beginPath();
    ctx.ellipse(-r * 0.27, r * 0.98 + swing, r * 0.21, r * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.27, r * 0.98 - swing, r * 0.21, r * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4dabf7';
    roundRectPath(ctx, -r * 0.56, -r * 0.24, r * 1.12, r * 0.86, r * 0.28);
    ctx.fill();

    drawStar(ctx, 0, r * 0.16, r * 0.19, '#e7f5ff');

    ctx.fillStyle = '#ffd8b0';
    ctx.beginPath();
    ctx.arc(-r * 0.66, r * 0.02, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.66, r * 0.02, r * 0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffd8b0';
    ctx.beginPath();
    ctx.arc(0, -r * 0.95, r * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5a3b2e';
    ctx.beginPath();
    ctx.arc(0, -r * 0.95, r * 0.82, Math.PI * 1.02, Math.PI * 1.98);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-r * 0.28, -r * 1.5, r * 0.26, r * 0.16, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4a3f52';
    ctx.beginPath();
    ctx.arc(-r * 0.28, -r * 0.92, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.28, -r * 0.92, r * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#4a3f52';
    ctx.lineWidth = Math.max(2, r * 0.075);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -r * 0.76, r * 0.22, 0.3, Math.PI - 0.3);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 143, 160, 0.55)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.48, -r * 0.74, r * 0.14, r * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.48, -r * 0.74, r * 0.14, r * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(r * 0.72, -r * 0.18);
    ctx.rotate(-0.35);
    ctx.strokeStyle = '#fff3bf';
    ctx.lineWidth = Math.max(2, r * 0.12);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -r * 0.82);
    ctx.stroke();
    drawStar(ctx, 0, -r * 0.98, r * 0.3, '#ffd43b');
    ctx.restore();

    ctx.restore();
  }

  function drawParticles(ctx) {
    for (let i = 0; i < G.particles.length; i += 1) {
      const p = G.particles[i];
      const k = Math.max(0, p.life / p.max);
      ctx.globalAlpha = k;
      if (p.kind === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 7);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.62);
        ctx.restore();
      } else if (p.kind === 'firework') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * k * 0.55, 0, Math.PI * 2);
        ctx.fill();
        drawStar(ctx, p.x, p.y, p.size * k * 0.7, p.color);
      } else {
        drawStar(ctx, p.x, p.y, p.size * k, p.color);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawFloats(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < G.floats.length; i += 1) {
      const f = G.floats[i];
      const k = Math.max(0, f.life / f.max);
      ctx.globalAlpha = k;
      const size = Math.round(G.baseR * 1.05);
      ctx.font = 'bold ' + size + 'px "Jua", sans-serif';
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(40, 20, 60, 0.55)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawHints(ctx) {
    if (G.phase === 'hide' || G.phase === 'rehide') {
      if (G.phaseT > 0.9 && G.boxes.length) {
        const b = G.boxes[2];
        const bob = REDUCED ? 0 : Math.sin(G.time * 5) * 6;
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.font = Math.round(G.baseR * 1.15) + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👆', b.cx, b.cy - b.size * 0.82 + bob);
        ctx.restore();
      }
    }

    if (G.showDragHint && G.ai && G.phase === 'guard') {
      const p = G.player;
      const a = G.ai;
      const x0 = p.x;
      const y0 = p.y - p.r * 1.55;
      const x1 = a.x;
      const y1 = a.y - a.r * 1.35;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const pulse = REDUCED ? 1 : 0.82 + 0.18 * (0.5 + 0.5 * Math.sin(G.time * 6.5));
      const mid = 0.42 + (REDUCED ? 0 : 0.12 * Math.sin(G.time * 5.2));
      const fx = x0 + dx * mid;
      const fy = y0 + dy * mid;

      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 7 * pulse;
      ctx.lineCap = 'round';
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);

      const tip = 18 * pulse;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - ux * tip - uy * tip * 0.7, y1 - uy * tip + ux * tip * 0.7);
      ctx.lineTo(x1 - ux * tip + uy * tip * 0.7, y1 - uy * tip - ux * tip * 0.7);
      ctx.closePath();
      ctx.fill();

      const finger = Math.round(G.baseR * (1.55 * pulse));
      ctx.font = finger + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255, 120, 170, 0.55)';
      ctx.shadowBlur = 12;
      ctx.fillText('👆', fx, fy);
      ctx.restore();
    }
  }

  function drawHud(ctx) {
    const n = G.need;
    const gap = 22;
    const y = 20;
    const startX = 22;
    ctx.save();
    ctx.fillStyle = 'rgba(40, 20, 60, 0.45)';
    roundRectPath(ctx, startX - 14, y - 15, n * gap + 6, 30, 15);
    ctx.fill();
    for (let i = 0; i < n; i += 1) {
      drawStar(ctx, startX + i * gap, y, 9, i < G.bumped ? '#ffd43b' : '#6b4a78');
      if (i < G.bumped) drawStar(ctx, startX + i * gap, y, 4.5, '#fff3bf');
    }
    ctx.restore();
  }

  function render() {
    const ctx = G.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, G.W, G.H);

    ctx.save();
    if (G.shake > 0 && !REDUCED) {
      const s = G.shake * 6;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }

    if (G.bg) ctx.drawImage(G.bg, 0, 0, G.W, G.H);
    else {
      ctx.fillStyle = '#3d2a5c';
      ctx.fillRect(0, 0, G.W, G.H);
    }

    for (let i = 0; i < G.boxes.length; i += 1) drawBox(ctx, G.boxes[i], G.time);

    if (G.candy.mode !== 'hidden') {
      drawCandy(ctx, G.candy.x, G.candy.y, G.candy.r, G.candy.t);
    }

    if (G.ai && G.state !== 'select') {
      const a = G.ai;
      drawFairy(ctx, a.fairy, a.x, a.y, a.r, {
        t: G.time,
        facing: a.facing,
        walk: a.walk,
        hop: a.hop,
        bubble: a.bubble,
        spin: a.spin,
        plop: a.plop || 0,
        peek: a.state === 'peek',
        phase: a.phase,
      });
    }

    drawKid(ctx, G.player.x, G.player.y, G.player.r, {
      walk: G.player.walk,
      facing: G.player.facing,
      squash: G.player.squash,
      hop: G.player.hop,
    });

    drawParticles(ctx);
    drawFloats(ctx);
    if (G.state === 'play') {
      drawHints(ctx);
      drawHud(ctx);
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* 루프·입력                                                           */
  /* ------------------------------------------------------------------ */

  function loop(ts) {
    requestAnimationFrame(loop);
    const dt = G.lastT ? Math.min(0.033, (ts - G.lastT) / 1000) : 0.016;
    G.lastT = ts;
    if (G.state === 'select') return;
    update(dt);
    render();
  }

  function toStage(e) {
    const rect = els.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function endDrag() {
    G.dragging = false;
  }

  function bindUI() {
    els.canvas.addEventListener('pointerdown', (e) => {
      if (G.state !== 'play') return;
      e.preventDefault();
      SC_SOUND.unlock();
      const p = toStage(e);

      if (G.phase === 'hide' || G.phase === 'rehide') {
        const box = hitBox(p);
        if (box) {
          hideCandy(box);
          return;
        }
      }

      G.dragging = true;
      G.noDragT = 0;
      G.showDragHint = false;
      G.pointer = p;
      try {
        els.canvas.setPointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
    });

    els.canvas.addEventListener('pointermove', (e) => {
      if (!G.dragging) return;
      G.pointer = toStage(e);
    });
    els.canvas.addEventListener('pointerup', endDrag);
    els.canvas.addEventListener('pointercancel', endDrag);
    window.addEventListener('pointerup', endDrag);
    els.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    els.startBtn.addEventListener('click', () => {
      SC_SOUND.unlock();
      SC_SOUND.play('pop');
      startRound();
    });

    els.btnAgain.addEventListener('click', () => {
      SC_SOUND.play('pop');
      startRound();
    });

    els.btnChange.addEventListener('click', () => {
      SC_SOUND.play('tap');
      showSelect();
    });

    els.sound.addEventListener('click', () => {
      SC_SOUND.muted = !SC_SOUND.muted;
      if (window.KidsKit) KidsKit.sound.setMuted(SC_SOUND.muted);
      els.sound.textContent = SC_SOUND.muted ? '🔇' : '🔊';
      if (!SC_SOUND.muted) SC_SOUND.play('tap');
    });

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 120));

    if (window.KidsKit) {
      KidsKit.restButton({
        parent: document.body,
        onRest: () => {
          window.location.href = '../../index.html';
        },
      });
    }
  }

  function preloadAssets() {
    if (!window.KidsKit || !KidsKit.assets) {
      G.assetReady = true;
      return Promise.resolve();
    }
    return KidsKit.assets.preload(SC_ASSET_SLOTS).then((res) => {
      G.images = res.images || {};
      G.assetReady = true;
      buildBackground();
    });
  }

  function init() {
    if (window.KidsKit && KidsKit.sound.isMuted()) {
      SC_SOUND.muted = true;
      els.sound.textContent = '🔇';
    }
    buildSelect();
    showWelcomeIfReturning();
    pickPlaceForRound();
    bindUI();
    resize();
    G.player.x = G.W * 0.5;
    G.player.y = G.H * 0.86;
    preloadAssets();
    requestAnimationFrame(loop);
  }

  init();
})();
