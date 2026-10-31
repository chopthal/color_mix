/**
 * 반짝반짝 별사탕을 지켜요
 * 상자에 별사탕을 숨기고, 다가오는 요정을 드래그로 콩! 밀어낸다.
 * 실패·타이머·점수 없음. 요정이 상자를 열어도 다시 숨기면 그만.
 */
(() => {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const els = {
    canvas: document.getElementById('gameCanvas'),
    stage: document.getElementById('stage'),
    select: document.getElementById('selectScreen'),
    fairyRow: document.getElementById('fairyRow'),
    startBtn: document.getElementById('btnStart'),
    ending: document.getElementById('endingOverlay'),
    btnAgain: document.getElementById('btnAgain'),
    btnChange: document.getElementById('btnChange'),
    sound: document.getElementById('btnSound'),
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
    bumped: 0,
    need: 5,
    bumpCd: 0,
    winTimer: 0,
    shake: 0,
    time: 0,
    lastT: 0,
    phaseT: 0,
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

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
  /* 배경                                                                */
  /* ------------------------------------------------------------------ */

  function buildBackground() {
    if (!G.W || !G.H) return;
    const dpr = G.dpr;
    const c = document.createElement('canvas');
    c.width = Math.round(G.W * dpr);
    c.height = Math.round(G.H * dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = G.W;
    const H = G.H;
    const floorY = H * 0.72;

    const wall = ctx.createLinearGradient(0, 0, 0, floorY);
    wall.addColorStop(0, '#fff8f0');
    wall.addColorStop(1, '#ffe4ef');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, floorY);

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ffe1ee';
    for (let x = -20; x < W + 20; x += 52) {
      ctx.fillRect(x, 0, 22, floorY);
    }
    ctx.restore();

    // 창문
    const ww = Math.min(W * 0.22, H * 0.22);
    const wh = ww * 0.95;
    const wx = W * 0.08;
    const wy = Math.max(H * 0.07, 10);
    ctx.fillStyle = '#ffffff';
    roundRectPath(ctx, wx - 6, wy - 6, ww + 12, wh + 12, 12);
    ctx.fill();
    const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
    sky.addColorStop(0, '#d9f0ff');
    sky.addColorStop(1, '#bfe4ff');
    ctx.fillStyle = sky;
    roundRectPath(ctx, wx, wy, ww, wh, 8);
    ctx.fill();
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.arc(wx + ww * 0.7, wy + wh * 0.3, ww * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.moveTo(wx, wy + wh / 2);
    ctx.lineTo(wx + ww, wy + wh / 2);
    ctx.stroke();
    ctx.fillStyle = '#ff9ec4';
    roundRectPath(ctx, wx - 14, wy - 10, 12, wh + 22, 6);
    ctx.fill();
    roundRectPath(ctx, wx + ww + 2, wy - 10, 12, wh + 22, 6);
    ctx.fill();

    // 문 (요정이 들어오는 곳)
    const dw = Math.min(W * 0.2, H * 0.3);
    const dh = H * 0.26;
    const dx = W / 2 - dw / 2;
    ctx.fillStyle = '#ffd8a8';
    ctx.beginPath();
    ctx.moveTo(dx, dh);
    ctx.lineTo(dx, dw / 2);
    ctx.quadraticCurveTo(dx, 0, dx + dw / 2, 0);
    ctx.quadraticCurveTo(dx + dw, 0, dx + dw, dw / 2);
    ctx.lineTo(dx + dw, dh);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f2b705';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = '#f08c5a';
    ctx.beginPath();
    ctx.arc(dx + dw * 0.78, dh * 0.6, 5, 0, Math.PI * 2);
    ctx.fill();

    // 액자
    const fw = Math.min(W * 0.13, 70);
    const fx = W - fw - W * 0.06;
    const fy = H * 0.09;
    ctx.fillStyle = '#ffffff';
    roundRectPath(ctx, fx - 5, fy - 5, fw + 10, fw * 0.8 + 10, 8);
    ctx.fill();
    ctx.fillStyle = '#c5f6e0';
    roundRectPath(ctx, fx, fy, fw, fw * 0.8, 6);
    ctx.fill();
    drawStar(ctx, fx + fw / 2, fy + fw * 0.4, fw * 0.24, '#ffd43b');

    // 바닥
    const floor = ctx.createLinearGradient(0, floorY, 0, H);
    floor.addColorStop(0, '#f7dcbd');
    floor.addColorStop(1, '#ecc49a');
    ctx.fillStyle = floor;
    ctx.fillRect(0, floorY, W, H - floorY);
    ctx.strokeStyle = 'rgba(200, 150, 110, 0.35)';
    ctx.lineWidth = 2;
    for (let y = floorY + 26; y < H; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // 러그
    ctx.fillStyle = '#ffd6e0';
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.66, W * 0.46, H * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9f0';
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.66, W * 0.38, H * 0.115, 0, 0, Math.PI * 2);
    ctx.fill();

    // 화분
    const px = W * 0.07;
    const py = H * 0.8;
    const pw = Math.min(W * 0.1, 54);
    ctx.fillStyle = '#e07a5f';
    roundRectPath(ctx, px, py, pw, pw * 0.8, 8);
    ctx.fill();
    ctx.fillStyle = '#69b578';
    ctx.beginPath();
    ctx.ellipse(px + pw * 0.5, py - pw * 0.12, pw * 0.42, pw * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + pw * 0.28, py - pw * 0.32, pw * 0.24, pw * 0.34, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + pw * 0.72, py - pw * 0.32, pw * 0.24, pw * 0.34, 0.5, 0, Math.PI * 2);
    ctx.fill();

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

  function startRound() {
    if (!G.W || !G.H) resize();

    els.select.classList.remove('is-on');
    els.ending.classList.remove('is-on');

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
  }

  function showSelect() {
    G.state = 'select';
    G.phase = 'hide';
    G.dragging = false;
    els.ending.classList.remove('is-on');
    els.select.classList.add('is-on');
  }

  function showEnding() {
    if (G.state !== 'play') return;
    G.state = 'ending';
    G.phase = 'ending';
    G.dragging = false;
    els.ending.classList.add('is-on');
    SC_SOUND.play('win');
    confettiBurst();
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
    a.stateT = 1.9;
    a.progress = 1;

    const c = G.candy;
    c.mode = 'ai';
    c.r = G.baseR * 0.85;
    if (box) {
      c.x = box.cx;
      c.y = box.cy;
    }

    SC_SOUND.play('caught');
    burst(c.x, c.y, 12, 'star');
    floatText(box ? box.cx : G.W * 0.5, (box ? box.cy : G.H * 0.4) - 24, '앗!', '#e64980');
    G.shake = 0.35;
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
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        const k = Math.pow(0.02, dt);
        a.vx *= k;
        a.vy *= k;
        a.bubble = Math.max(0, a.stateT / 1.3);
        a.spin = Math.max(0, a.stateT / 1.3);
        a.x = clamp(a.x, a.r, G.W - a.r);
        a.y = clamp(a.y, a.r, G.H - a.r);
        if (a.stateT <= 0) {
          a.bubble = 0;
          a.spin = 0;
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

  function doBump() {
    const a = G.ai;
    const p = G.player;
    const ang = Math.atan2(a.y - p.y, a.x - p.x) || 0;
    const power = Math.min(G.W, G.H) * 1.9;

    a.vx = Math.cos(ang) * power;
    a.vy = Math.sin(ang) * power;
    a.state = 'knocked';
    a.stateT = 1.3;
    a.bubble = 1;
    a.spin = 1;

    G.bumpCd = 0.85;
    G.bumped = Math.min(G.need, G.bumped + 1);
    G.shake = 0.55;
    p.squash = 1;
    p.hop = 1;

    SC_SOUND.play('bump');
    SC_SOUND.play('boing');
    burst(a.x, a.y, 12, 'star');
    floatText(a.x, a.y - a.r * 1.7, '콩!', '#ff6b9d');

    if (G.bumped >= G.need && G.winTimer <= 0) G.winTimer = 1.6;
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

    updatePlayer(dt);
    updateAI(dt);
    updateCandy(dt);
    updateBoxes(dt);
    checkBump();

    if (G.winTimer > 0) {
      G.winTimer -= dt;
      if (G.winTimer <= 0) {
        G.winTimer = 0;
        showEnding();
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
      p.vy += 380 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.99;
    }
  }

  function floatText(x, y, text, color) {
    G.floats.push({ x, y, text, color, life: 0.95, max: 0.95 });
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

    ctx.fillStyle = 'rgba(90, 60, 80, 0.13)';
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

    drawPattern(ctx, b.def.pattern, 0, s * 0.13, s * 0.17, b.def.ribbon);

    if (b.open) {
      ctx.fillStyle = '#6b5540';
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
    const peek = o.peek || 0;
    const bob = REDUCED ? 0 : Math.sin(t * 3 + (o.phase || 0)) * r * 0.05 + hop * r * 0.14;

    ctx.save();
    ctx.fillStyle = 'rgba(90, 60, 80, 0.14)';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 1.02, r * 0.6, r * 0.16, 0, 0, Math.PI * 2);
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
    ctx.scale(facing, 1);

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
    ctx.fillStyle = 'rgba(90, 60, 80, 0.16)';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.98, r * 0.62, r * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(x, y - hop * r * 0.16);
    ctx.scale(facing * (1 + squash * 0.14), 1 - squash * 0.1);

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

    ctx.fillStyle = '#e7f5ff';
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
      const size = Math.round(G.baseR * 1.1);
      ctx.font = 'bold ' + size + 'px "Jua", sans-serif';
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
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

    if (G.phase === 'guard' && G.ai && G.bumped === 0 && G.phaseT > 1 && G.phaseT < 6) {
      const p = G.player;
      const a = G.ai;
      const alpha = clamp((6 - G.phaseT) / 2, 0, 1) * 0.8;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.setLineDash([9, 9]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - p.r * 1.6);
      ctx.lineTo(a.x, a.y - a.r * 1.4);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = Math.round(G.baseR * 1.05) + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👆', p.x, p.y - p.r * 2.4);
      ctx.restore();
    }
  }

  function drawHud(ctx) {
    const n = G.need;
    const gap = 22;
    const y = 20;
    const startX = 22;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    roundRectPath(ctx, startX - 14, y - 15, n * gap + 6, 30, 15);
    ctx.fill();
    for (let i = 0; i < n; i += 1) {
      drawStar(ctx, startX + i * gap, y, 9, i < G.bumped ? '#ffd43b' : '#ffdbe8');
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
      ctx.fillStyle = '#ffe4ef';
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
      els.sound.textContent = SC_SOUND.muted ? '🔇' : '🔊';
      if (!SC_SOUND.muted) SC_SOUND.play('tap');
    });

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 120));
  }

  function init() {
    buildSelect();
    bindUI();
    resize();
    G.player.x = G.W * 0.5;
    G.player.y = G.H * 0.86;
    requestAnimationFrame(loop);
  }

  init();
})();
