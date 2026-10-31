/**
 * 쿵쿵! 공룡 범퍼섬
 * 드래그로 공룡을 끌어 친구와 부딪히고, 열매를 모아 황금 열매를 함께 민다.
 * HP·KO·승패 없음. 부딪힘은 놀이 형식, 결과는 둘 다 성공.
 */
(() => {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const els = {
    canvas: document.getElementById('arenaCanvas'),
    stage: document.getElementById('stage'),
    select: document.getElementById('selectScreen'),
    dinoGrid: document.getElementById('dinoGrid'),
    friendRow: document.getElementById('friendRow'),
    arenaRow: document.getElementById('arenaRow'),
    startBtn: document.getElementById('btnStart'),
    ending: document.getElementById('endingOverlay'),
    btnAgain: document.getElementById('btnAgain'),
    btnChange: document.getElementById('btnChange'),
    basket: document.getElementById('basketPill'),
    toast: document.getElementById('toast'),
    friendChip: document.getElementById('friendChip'),
    friendName: document.getElementById('friendName'),
    sound: document.getElementById('btnSound'),
  };

  const G = {
    state: 'select',
    arena: DB_ARENAS[0],
    dinoId: 'giga',
    friendId: 'spino',
    friendManual: false,
    W: 0,
    H: 0,
    baseR: 28,
    baseSpeed: 360,
    ctx: null,
    bg: null,
    player: null,
    friend: null,
    fruits: [],
    particles: [],
    puddles: [],
    golden: null,
    ring: null,
    collected: 0,
    need: 5,
    pointer: { x: 0, y: 0 },
    dragging: false,
    shake: 0,
    time: 0,
    lastT: 0,
    bumpCd: 0,
    fruitCd: 0,
    aiTimer: 0,
    aiDash: 0,
    aiMode: 'wander',
    aiWander: { x: 0, y: 0 },
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  /* ------------------------------------------------------------------ */
  /* 유틸                                                                */
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

  function drawHorn(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.lineTo(x, y - h);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();
  }

  /* ------------------------------------------------------------------ */
  /* 공룡 그리기                                                         */
  /* ------------------------------------------------------------------ */

  function drawLeg(ctx, x, y, r, dino, art) {
    ctx.fillStyle = dino.color;
    roundRectPath(ctx, x - r * 0.15, y, r * 0.3, r * 0.46, r * 0.14);
    ctx.fill();
    ctx.fillStyle = dino.accent;
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.46, r * (art.webbed ? 0.24 : 0.19), r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawDino(ctx, dino, x, y, r, o) {
    o = o || {};
    const art = dino.art || {};
    const time = o.time || 0;
    const facing = o.facing || 1;
    const walk = o.walk || 0;
    const squash = o.squash || 0;
    const hop = o.hop || 0;
    const giggle = o.giggle || 0;
    const tilt = o.tilt || 0;
    const phase = o.phase || 0;

    const sx = 1 + squash * 0.26;
    const sy = 1 - squash * 0.2;
    const bob = Math.sin(time * 3 + phase) * r * 0.02;
    const lift = hop * r * 0.55;
    const wiggle = giggle > 0 ? Math.sin(time * 40) * r * 0.03 : 0;

    ctx.save();
    ctx.fillStyle = 'rgba(35, 60, 40, 0.16)';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.92, r * 0.8 * (1 + squash * 0.1), r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(x + wiggle, y - lift + bob);
    ctx.rotate(tilt);
    ctx.scale(facing * sx, sy);

    // 꼬리
    ctx.fillStyle = dino.color;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, r * 0.02);
    ctx.quadraticCurveTo(-r * 1.3, -r * 0.05, -r * 1.2, r * 0.36);
    ctx.quadraticCurveTo(-r * 0.95, r * 0.5, -r * 0.35, r * 0.42);
    ctx.closePath();
    ctx.fill();

    if (art.club) {
      ctx.fillStyle = dino.accent;
      ctx.beginPath();
      ctx.arc(-r * 1.2, r * 0.3, r * 0.27, 0, Math.PI * 2);
      ctx.fill();
    }

    if (art.plates) {
      ctx.fillStyle = dino.accent;
      for (let i = 0; i < 3; i += 1) {
        const px = -r * 0.45 + i * r * 0.32;
        const py = -r * 0.42 - i * r * 0.03;
        ctx.beginPath();
        ctx.moveTo(px - r * 0.14, py + r * 0.1);
        ctx.lineTo(px, py - r * 0.18);
        ctx.lineTo(px + r * 0.14, py + r * 0.1);
        ctx.closePath();
        ctx.fill();
      }
    }

    if (art.sail) {
      ctx.fillStyle = dino.accent;
      ctx.beginPath();
      ctx.moveTo(-r * 0.72, -r * 0.1);
      ctx.quadraticCurveTo(-r * 0.5, -r * 1.05, r * 0.02, -r * 0.42);
      ctx.quadraticCurveTo(-r * 0.25, -r * 0.2, -r * 0.72, -r * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = r * 0.04;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.5 + i * r * 0.16, -r * 0.2 - i * r * 0.14);
        ctx.lineTo(-r * 0.42 + i * r * 0.16, -r * 0.55 - i * r * 0.1);
        ctx.stroke();
      }
    }

    // 다리
    const legSwing = Math.sin(walk) * r * 0.1;
    drawLeg(ctx, -r * 0.28 + legSwing, r * 0.42, r, dino, art);
    drawLeg(ctx, r * 0.26 - legSwing, r * 0.42, r, dino, art);

    // 몸통
    const bodyRy = art.bigBelly ? r * 0.72 : r * 0.64;
    ctx.fillStyle = dino.color;
    ctx.beginPath();
    ctx.ellipse(-r * 0.02, r * 0.06, r * 0.8, bodyRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // 배
    ctx.fillStyle = dino.belly;
    ctx.beginPath();
    ctx.ellipse(r * 0.12, r * 0.3, r * 0.52, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 프릴
    if (art.frill) {
      const fx = r * 0.5;
      const fy = -r * 0.38;
      ctx.fillStyle = dino.accent;
      ctx.beginPath();
      ctx.ellipse(fx - r * 0.18, fy + r * 0.02, r * 0.95, r * 0.85, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.ellipse(fx - r * 0.22, fy - r * 0.05, r * 0.62, r * 0.55, -0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // 목 + 머리
    const hx = art.longNeck ? r * 0.68 : r * 0.52;
    const hy = art.longNeck ? -r * 1.02 : -r * 0.38;
    const hr = art.bigHead ? r * 0.52 : r * 0.42;

    ctx.strokeStyle = dino.color;
    ctx.lineWidth = r * (art.longNeck ? 0.34 : 0.5);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.1, -r * 0.1);
    ctx.quadraticCurveTo(hx * 0.8, hy * 0.5, hx, hy + hr * 0.5);
    ctx.stroke();

    ctx.fillStyle = dino.color;
    ctx.beginPath();
    ctx.ellipse(hx, hy, hr, hr * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hx + hr * 0.62, hy + hr * 0.2, hr * (art.longSnout ? 0.62 : 0.46), hr * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();

    if (art.dome) {
      ctx.fillStyle = dino.accent;
      ctx.beginPath();
      ctx.ellipse(hx, hy - hr * 0.22, hr * 0.92, hr * 0.7, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }

    if (art.horns) {
      ctx.fillStyle = dino.accent;
      drawHorn(ctx, hx + hr * 0.12, hy - hr * 0.72, hr * 0.16, hr * 0.55);
      drawHorn(ctx, hx + hr * 0.72, hy - hr * 0.32, hr * 0.15, hr * 0.45);
      drawHorn(ctx, hx + hr * 0.96, hy + hr * 0.06, hr * 0.13, hr * 0.32);
    }

    // 눈
    const ex = hx + hr * 0.22;
    const ey = hy - hr * 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex, ey, hr * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b2b3a';
    ctx.beginPath();
    ctx.arc(ex + hr * 0.06, ey + hr * 0.02, hr * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex + hr * 0.1, ey - hr * 0.04, hr * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // 입
    if (giggle > 0) {
      ctx.fillStyle = '#7a3b3b';
      ctx.beginPath();
      ctx.ellipse(hx + hr * 0.5, hy + hr * 0.36, hr * 0.2, hr * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(60,45,40,0.7)';
      ctx.lineWidth = r * 0.045;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(hx + hr * 0.5, hy + hr * 0.28, hr * 0.18, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }

    // 팔
    ctx.strokeStyle = dino.color;
    ctx.lineWidth = r * 0.16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.34, r * 0.12);
    ctx.lineTo(r * 0.5, r * 0.3);
    ctx.stroke();

    if (art.claws) {
      ctx.strokeStyle = dino.accent;
      ctx.lineWidth = r * 0.05;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(r * 0.5, r * 0.3);
        ctx.lineTo(r * (0.58 + i * 0.05), r * (0.36 + i * 0.03));
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* 선택 화면                                                           */
  /* ------------------------------------------------------------------ */

  function drawThumb(canvas, dino) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDino(ctx, dino, canvas.width / 2, canvas.height * 0.6, canvas.width * 0.3, {
      facing: 1,
      time: 0.7,
    });
  }

  function pickFriend(id) {
    if (id === 'giga') return 'spino';
    if (id === 'spino') return 'giga';
    const pool = DB_DINOS.filter((d) => d.id !== id);
    return pool[Math.floor(Math.random() * pool.length)].id;
  }

  function buildSelect() {
    els.dinoGrid.innerHTML = '';
    DB_DINOS.forEach((d) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dino-card';
      btn.dataset.id = d.id;
      btn.style.setProperty('--dino', d.color);
      btn.innerHTML =
        '<canvas class="dino-thumb" width="120" height="120" aria-hidden="true"></canvas>' +
        '<span class="dino-name">' + d.name + '</span>' +
        '<span class="dino-tag">' + d.tagline + '</span>';
      btn.addEventListener('click', () => {
        DB_SOUND.play('tap');
        selectDino(d.id);
      });
      els.dinoGrid.appendChild(btn);
      drawThumb(btn.querySelector('canvas'), d);
    });

    els.friendRow.innerHTML = '';
    const randomBtn = document.createElement('button');
    randomBtn.type = 'button';
    randomBtn.className = 'friend-btn random';
    randomBtn.setAttribute('aria-label', '친구 공룡 아무나');
    randomBtn.textContent = '🎲';
    randomBtn.addEventListener('click', () => {
      DB_SOUND.play('tap');
      selectFriend(pickFriend(G.dinoId));
    });
    els.friendRow.appendChild(randomBtn);

    DB_DINOS.forEach((d) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'friend-btn';
      btn.dataset.id = d.id;
      btn.style.setProperty('--dino', d.color);
      btn.setAttribute('aria-label', '친구 ' + d.name);
      const cv = document.createElement('canvas');
      cv.width = 96;
      cv.height = 96;
      cv.setAttribute('aria-hidden', 'true');
      btn.appendChild(cv);
      btn.addEventListener('click', () => {
        DB_SOUND.play('tap');
        selectFriend(d.id);
      });
      els.friendRow.appendChild(btn);
      drawDino(cv.getContext('2d'), d, 48, 56, 28, { facing: 1, time: 0.7 });
    });

    els.arenaRow.innerHTML = '';
    DB_ARENAS.forEach((a) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'arena-pill';
      btn.dataset.id = a.id;
      btn.innerHTML = '<span>' + a.emoji + '</span><span>' + a.name + '</span>';
      btn.addEventListener('click', () => {
        DB_SOUND.play('tap');
        selectArena(a.id);
      });
      els.arenaRow.appendChild(btn);
    });

    selectDino(G.dinoId);
    selectArena(G.arena.id);
  }

  function selectDino(id) {
    G.dinoId = id;
    if (!G.friendManual && G.friendId === id) {
      G.friendId = pickFriend(id);
    }
    els.dinoGrid.querySelectorAll('.dino-card').forEach((card) => {
      card.classList.toggle('is-selected', card.dataset.id === id);
    });
    updateFriendHighlight();
  }

  function selectFriend(id) {
    G.friendId = id;
    G.friendManual = true;
    updateFriendHighlight();
  }

  function updateFriendHighlight() {
    els.friendRow.querySelectorAll('.friend-btn[data-id]').forEach((btn) => {
      btn.classList.toggle('is-selected', btn.dataset.id === G.friendId);
    });
  }

  function selectArena(id) {
    const found = DB_ARENAS.find((a) => a.id === id);
    if (!found) return;
    G.arena = found;
    els.arenaRow.querySelectorAll('.arena-pill').forEach((pill) => {
      pill.classList.toggle('is-selected', pill.dataset.id === id);
    });
    if (G.W) buildBackground();
  }

  /* ------------------------------------------------------------------ */
  /* 라운드                                                              */
  /* ------------------------------------------------------------------ */

  function makeDino(id, x, y) {
    const dino = DB_DINOS.find((d) => d.id === id) || DB_DINOS[0];
    return {
      dino,
      x,
      y,
      vx: 0,
      vy: 0,
      r: G.baseR * (dino.size || 1),
      facing: x < G.W / 2 ? 1 : -1,
      squash: 0,
      hop: 0,
      giggle: 0,
      walk: 0,
      tilt: 0,
      phase: Math.random() * 6,
    };
  }

  function startRound() {
    if (!G.W || !G.H) resize();
    if (!G.friendId || (!G.friendManual && G.friendId === G.dinoId)) {
      G.friendId = pickFriend(G.dinoId);
    }

    els.select.classList.remove('is-on');
    els.ending.classList.remove('is-on');
    els.basket.hidden = false;
    els.friendChip.hidden = false;
    els.toast.classList.remove('is-on');

    G.state = 'play';
    G.player = makeDino(G.dinoId, G.W * 0.32, G.H * 0.66);
    G.friend = makeDino(G.friendId, G.W * 0.68, G.H * 0.34);
    G.fruits = [];
    G.particles = [];
    G.puddles = [];
    G.golden = null;
    G.ring = null;
    G.collected = 0;
    G.need = 5;
    G.time = 0;
    G.bumpCd = 0;
    G.fruitCd = 0;
    G.aiTimer = 1;
    G.aiDash = 0;
    G.aiMode = 'wander';
    G.aiWander = { x: G.W * 0.5, y: G.H * 0.5 };
    G.shake = 0;
    G.dragging = false;

    els.friendName.textContent = G.friend.dino.name;
    updateBasket();
  }

  function showSelect() {
    G.state = 'select';
    G.dragging = false;
    els.ending.classList.remove('is-on');
    els.select.classList.add('is-on');
    els.basket.hidden = true;
    els.friendChip.hidden = true;
    els.toast.classList.remove('is-on');
    G.golden = null;
    G.ring = null;
  }

  function updateBasket() {
    if (G.golden) {
      els.basket.innerHTML = '<span>🌟</span><span>황금 열매</span>';
      els.basket.classList.add('is-golden');
    } else {
      els.basket.innerHTML = '<span>🧺</span><span>' + G.collected + ' / ' + G.need + '</span>';
      els.basket.classList.remove('is-golden');
    }
  }

  let toastTimer = 0;
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('is-on'), 2800);
  }

  /* ------------------------------------------------------------------ */
  /* 크기·배경                                                           */
  /* ------------------------------------------------------------------ */

  function resize() {
    const rect = els.stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    G.W = rect.width;
    G.H = rect.height;
    G.baseR = clamp(Math.min(G.W, G.H) * 0.075, 22, 54);
    G.baseSpeed = Math.min(G.W, G.H) * 0.9;

    els.canvas.width = Math.round(G.W * dpr);
    els.canvas.height = Math.round(G.H * dpr);
    els.canvas.style.width = G.W + 'px';
    els.canvas.style.height = G.H + 'px';
    G.ctx = els.canvas.getContext('2d');
    G.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (G.player) {
      [G.player, G.friend].forEach((e) => {
        if (!e) return;
        e.r = G.baseR * (e.dino.size || 1);
        e.x = clamp(e.x, e.r + 8, G.W - e.r - 8);
        e.y = clamp(e.y, e.r + 8, G.H - e.r - 8);
      });
    }

    buildBackground();
  }

  let bgSeed = 1;
  function srnd() {
    bgSeed = (bgSeed * 1664525 + 1013904223) >>> 0;
    return bgSeed / 4294967296;
  }

  function buildBackground() {
    if (!G.W || !G.H) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(G.W * dpr));
    c.height = Math.max(1, Math.round(G.H * dpr));
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);

    const a = G.arena;
    bgSeed = a.id === 'meadow' ? 7 : a.id === 'river' ? 21 : 41;

    const sky = x.createLinearGradient(0, 0, 0, G.H);
    sky.addColorStop(0, a.sky[0]);
    sky.addColorStop(0.42, a.sky[1]);
    sky.addColorStop(1, a.ground[0]);
    x.fillStyle = sky;
    x.fillRect(0, 0, G.W, G.H);

    const inset = 8;
    const gr = x.createLinearGradient(0, inset, 0, G.H - inset);
    gr.addColorStop(0, a.ground[0]);
    gr.addColorStop(1, a.ground[1]);
    x.fillStyle = gr;
    roundRectPath(x, inset, inset, G.W - inset * 2, G.H - inset * 2, 26);
    x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.65)';
    x.lineWidth = 6;
    x.stroke();

    const n = Math.round((G.W * G.H) / 26000);

    if (a.id === 'meadow') {
      for (let i = 0; i < n; i += 1) {
        const px = 20 + srnd() * (G.W - 40);
        const py = 20 + srnd() * (G.H - 40);
        if (srnd() < 0.5) {
          const colors = ['#ffd166', '#ff9fb2', '#ffffff', '#c3a6ff'];
          x.fillStyle = colors[Math.floor(srnd() * colors.length)];
          for (let k = 0; k < 5; k += 1) {
            const ang = ((Math.PI * 2) / 5) * k;
            x.beginPath();
            x.arc(px + Math.cos(ang) * 4, py + Math.sin(ang) * 4, 3.2, 0, Math.PI * 2);
            x.fill();
          }
          x.fillStyle = '#ffd93d';
          x.beginPath();
          x.arc(px, py, 2.4, 0, Math.PI * 2);
          x.fill();
        } else {
          x.strokeStyle = 'rgba(80,160,80,0.55)';
          x.lineWidth = 2.5;
          for (let k = -1; k <= 1; k += 1) {
            x.beginPath();
            x.moveTo(px + k * 4, py + 8);
            x.quadraticCurveTo(px + k * 7, py, px + k * 5, py - 7);
            x.stroke();
          }
        }
      }
      for (let i = 0; i < 4; i += 1) {
        const px = 30 + srnd() * (G.W - 60);
        const py = 30 + srnd() * (G.H - 60);
        x.fillStyle = 'rgba(120,200,120,0.5)';
        x.beginPath();
        x.arc(px, py, 18, 0, Math.PI * 2);
        x.fill();
        x.beginPath();
        x.arc(px + 16, py + 4, 13, 0, Math.PI * 2);
        x.fill();
        x.beginPath();
        x.arc(px - 15, py + 5, 12, 0, Math.PI * 2);
        x.fill();
      }
    } else if (a.id === 'river') {
      for (let i = 0; i < n; i += 1) {
        const px = 24 + srnd() * (G.W - 48);
        const py = 24 + srnd() * (G.H - 48);
        x.strokeStyle = 'rgba(255,255,255,' + (0.25 + srnd() * 0.3) + ')';
        x.lineWidth = 2.5;
        x.beginPath();
        x.arc(px, py, 10 + srnd() * 16, 0.2, Math.PI * 1.2);
        x.stroke();
      }
      for (let i = 0; i < 5; i += 1) {
        const px = 40 + srnd() * (G.W - 80);
        const py = 40 + srnd() * (G.H - 80);
        x.fillStyle = 'rgba(90,180,130,0.55)';
        x.beginPath();
        x.ellipse(px, py, 16, 10, srnd() * 3, 0, Math.PI * 2);
        x.fill();
      }
    } else {
      for (let i = 0; i < n; i += 1) {
        const px = 24 + srnd() * (G.W - 48);
        const py = 24 + srnd() * (G.H - 48);
        x.strokeStyle = 'rgba(255,255,255,' + (0.35 + srnd() * 0.3) + ')';
        x.lineWidth = 2;
        x.beginPath();
        x.moveTo(px, py);
        x.lineTo(px + (srnd() - 0.5) * 40, py + (srnd() - 0.5) * 40);
        x.stroke();
      }
      for (let i = 0; i < n; i += 1) {
        const px = 20 + srnd() * (G.W - 40);
        const py = 20 + srnd() * (G.H - 40);
        x.fillStyle = 'rgba(255,255,255,0.8)';
        x.beginPath();
        x.arc(px, py, 1.8, 0, Math.PI * 2);
        x.fill();
      }
    }

    G.bg = c;
  }

  /* ------------------------------------------------------------------ */
  /* 물리                                                                */
  /* ------------------------------------------------------------------ */

  function frictionAt(x, y) {
    let f = G.arena.friction;
    for (let i = 0; i < G.puddles.length; i += 1) {
      const p = G.puddles[i];
      if (Math.hypot(x - p.x, y - p.y) < p.r) {
        f = Math.max(f, 0.992);
        break;
      }
    }
    return f;
  }

  function integrate(e, dt) {
    const f = Math.pow(frictionAt(e.x, e.y), dt * 60);
    e.vx *= f;
    e.vy *= f;
    e.x += e.vx * dt;
    e.y += e.vy * dt;

    const m = e.r + 8;
    if (e.x < m) {
      e.x = m;
      e.vx = Math.abs(e.vx) * 0.5;
    } else if (e.x > G.W - m) {
      e.x = G.W - m;
      e.vx = -Math.abs(e.vx) * 0.5;
    }
    if (e.y < m) {
      e.y = m;
      e.vy = Math.abs(e.vy) * 0.5;
    } else if (e.y > G.H - m) {
      e.y = G.H - m;
      e.vy = -Math.abs(e.vy) * 0.5;
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    const maxS = G.baseSpeed * p.dino.speed;

    if (G.dragging) {
      const dx = G.pointer.x - p.x;
      const dy = G.pointer.y - p.y;
      const d = Math.hypot(dx, dy);
      let tvx = 0;
      let tvy = 0;
      if (d > 2) {
        const s = Math.min(maxS, d * 9);
        tvx = (dx / d) * s;
        tvy = (dy / d) * s;
      }
      const k = 1 - Math.exp(-14 * dt);
      p.vx += (tvx - p.vx) * k;
      p.vy += (tvy - p.vy) * k;
    }

    integrate(p, dt);

    p.walk += Math.hypot(p.vx, p.vy) * dt * 0.06;
    p.tilt = clamp(p.vx / (maxS * 3), -0.18, 0.18);
    if (Math.abs(p.vx) > 10) p.facing = p.vx > 0 ? 1 : -1;
    p.squash = Math.max(0, p.squash - dt * 4);
    p.hop = Math.max(0, p.hop - dt * 2.4);
    p.giggle = Math.max(0, p.giggle - dt);
  }

  function steer(e, tx, ty, maxS, dt) {
    const dx = tx - e.x;
    const dy = ty - e.y;
    const d = Math.hypot(dx, dy);
    let tvx = 0;
    let tvy = 0;
    if (d > 6) {
      const s = Math.min(maxS, d * 4);
      tvx = (dx / d) * s;
      tvy = (dy / d) * s;
    }
    const k = 1 - Math.exp(-6 * dt);
    e.vx += (tvx - e.vx) * k;
    e.vy += (tvy - e.vy) * k;
  }

  function updateFriend(dt) {
    const f = G.friend;
    const maxS = G.baseSpeed * f.dino.speed * 0.86;
    G.aiTimer -= dt;

    if (G.golden && G.ring && G.golden.age > 1 && G.golden.playerTouched) {
      const gx = G.golden.x;
      const gy = G.golden.y;
      const dxr = G.ring.x - gx;
      const dyr = G.ring.y - gy;
      const dl = Math.hypot(dxr, dyr) || 1;
      const tx = gx - (dxr / dl) * (G.golden.r + f.r + 4);
      const ty = gy - (dyr / dl) * (G.golden.r + f.r + 4);
      steer(f, tx, ty, maxS, dt);
    } else {
      if (G.aiTimer <= 0) {
        G.aiTimer = 1.6 + Math.random() * 1.6;
        G.aiMode = Math.random() < 0.55 ? 'chase' : 'wander';
        if (G.aiMode === 'wander') {
          G.aiWander = { x: rand(60, G.W - 60), y: rand(60, G.H - 60) };
        }
        if (Math.random() < 0.5) G.aiDash = 0.55;
      }
      const tx = G.aiMode === 'chase' ? G.player.x : G.aiWander.x;
      const ty = G.aiMode === 'chase' ? G.player.y : G.aiWander.y;
      const boost = G.aiDash > 0 ? 1.35 : 1;
      steer(f, tx, ty, maxS * boost, dt);
    }

    G.aiDash = Math.max(0, G.aiDash - dt);
    integrate(f, dt);

    f.walk += Math.hypot(f.vx, f.vy) * dt * 0.06;
    f.tilt = clamp(f.vx / (maxS * 3), -0.18, 0.18);
    if (Math.abs(f.vx) > 10) f.facing = f.vx > 0 ? 1 : -1;
    f.squash = Math.max(0, f.squash - dt * 4);
    f.hop = Math.max(0, f.hop - dt * 2.4);
    f.giggle = Math.max(0, f.giggle - dt);
  }

  function collideDinos() {
    const a = G.player;
    const b = G.friend;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    const min = a.r + b.r;
    if (d >= min || d < 0.001) return;

    const nx = dx / d;
    const ny = dy / d;
    const overlap = min - d;
    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const vn = rvx * nx + rvy * ny;
    if (vn > 0) return;

    const speed = -vn;
    const abA = a.dino.ability;
    const abB = b.dino.ability;
    let e = 0.92;
    if (abA === 'bounce' || abB === 'bounce') e = 1.12;

    const j = (-(1 + e) * vn) / 2;
    a.vx -= j * nx;
    a.vy -= j * ny;
    b.vx += j * nx;
    b.vy += j * ny;

    if (abA === 'knock') {
      b.vx += nx * 120;
      b.vy += ny * 120;
    }
    if (abB === 'knock') {
      a.vx -= nx * 120;
      a.vy -= ny * 120;
    }
    if (abA === 'bulldoze') {
      b.vx += nx * 90;
      b.vy += ny * 90;
      a.vx *= 0.7;
      a.vy *= 0.7;
    }
    if (abB === 'bulldoze') {
      a.vx -= nx * 90;
      a.vy -= ny * 90;
      b.vx *= 0.7;
      b.vy *= 0.7;
    }

    if (speed < 60) return;

    a.squash = 1;
    b.squash = 1;
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

    if (G.bumpCd <= 0) {
      DB_SOUND.play('bump');
      G.bumpCd = 0.18;
    }
    burst(mid.x, mid.y, REDUCED ? 5 : 11, 'star');

    if (abA === 'roar' || abB === 'roar') {
      (abA === 'roar' ? b : a).hop = 1;
    }
    if (abA === 'quake' || abB === 'quake') {
      G.shake = REDUCED ? 0 : 1;
    }
    if (abA === 'tickle' || abB === 'tickle') {
      (abA === 'tickle' ? b : a).giggle = 1.2;
    }
    if (abA === 'slippery' || abB === 'slippery') {
      addPuddle(mid);
    }

    if (G.fruitCd <= 0 && G.collected < G.need && !G.golden) {
      spawnFruit(mid);
      if (abA === 'quake' || abB === 'quake') spawnFruit(mid);
      G.fruitCd = 1.1;
    }
  }

  function spawnFruit(from) {
    const emojis = ['🍎', '🍇', '🍊', '🍓', '🍋', '🍉', '🍑', '🍐'];
    G.fruits.push({
      x: from.x + rand(-0.3, 0.3) * G.baseR,
      y: from.y - G.baseR * 0.9,
      vx: rand(-170, 170),
      vy: rand(-340, -200),
      r: G.baseR * 0.36,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      angle: 0,
      spin: rand(-3, 3),
      age: 0,
    });
    if (G.fruits.length > 7) G.fruits.shift();
    burst(from.x, from.y, 6, 'star');
  }

  function updateFruits(dt) {
    const p = G.player;
    const f = G.friend;

    for (let i = G.fruits.length - 1; i >= 0; i -= 1) {
      const fr = G.fruits[i];
      const fric = Math.pow(0.975, dt * 60);
      fr.age += dt;
      fr.vx *= fric;
      fr.vy *= fric;
      fr.x += fr.vx * dt;
      fr.y += fr.vy * dt;
      fr.angle += (fr.vx * 0.002 + fr.spin * dt);

      const m = fr.r + 8;
      if (fr.x < m) {
        fr.x = m;
        fr.vx = Math.abs(fr.vx) * 0.6;
      } else if (fr.x > G.W - m) {
        fr.x = G.W - m;
        fr.vx = -Math.abs(fr.vx) * 0.6;
      }
      if (fr.y < m) {
        fr.y = m;
        fr.vy = Math.abs(fr.vy) * 0.6;
      } else if (fr.y > G.H - m) {
        fr.y = G.H - m;
        fr.vy = -Math.abs(fr.vy) * 0.6;
      }

      if (fr.age > 0.28 && dist(p, fr) < p.r + fr.r * 0.7) {
        collectFruit(fr);
        continue;
      }
      if (dist(f, fr) < f.r + fr.r) {
        pushFruit(fr, f);
      }
    }
  }

  function pushFruit(fr, e) {
    const dx = fr.x - e.x;
    const dy = fr.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const min = e.r + fr.r;
    fr.x = e.x + (dx / d) * min;
    fr.y = e.y + (dy / d) * min;
    const sp = Math.max(120, Math.hypot(e.vx, e.vy) * 0.8);
    fr.vx = (dx / d) * sp;
    fr.vy = (dy / d) * sp;
  }

  function collectFruit(fr) {
    const i = G.fruits.indexOf(fr);
    if (i < 0) return;
    G.fruits.splice(i, 1);
    G.collected += 1;
    DB_SOUND.play('collect');
    burst(fr.x, fr.y, 8, 'star');
    updateBasket();

    if (G.collected >= G.need && !G.golden) {
      spawnGolden();
    }
  }

  function spawnGolden() {
    const min = Math.min(G.W, G.H);
    const angle = rand(0, Math.PI * 2);
    const d = min * 0.34;
    G.golden = {
      x: G.W / 2,
      y: G.H / 2,
      vx: 0,
      vy: 0,
      r: G.baseR * 1.15,
      age: 0,
      playerTouched: false,
    };
    G.ring = {
      x: clamp(G.W / 2 + Math.cos(angle) * d, 90, G.W - 90),
      y: clamp(G.H / 2 + Math.sin(angle) * d, 90, G.H - 90),
      r: G.baseR * 1.7,
    };
    DB_SOUND.play('golden');
    updateBasket();
    toast('황금 열매를 반짝이 속으로 밀어요!');
  }

  function updateGolden(dt) {
    const g = G.golden;
    if (!g) return;
    g.age += dt;

    const fric = Math.pow(0.965, dt * 60);
    g.vx *= fric;
    g.vy *= fric;
    g.x += g.vx * dt;
    g.y += g.vy * dt;

    const m = g.r + 8;
    if (g.x < m) {
      g.x = m;
      g.vx = Math.abs(g.vx) * 0.6;
    } else if (g.x > G.W - m) {
      g.x = G.W - m;
      g.vx = -Math.abs(g.vx) * 0.6;
    }
    if (g.y < m) {
      g.y = m;
      g.vy = Math.abs(g.vy) * 0.6;
    } else if (g.y > G.H - m) {
      g.y = G.H - m;
      g.vy = -Math.abs(g.vy) * 0.6;
    }

    [G.player, G.friend].forEach((e) => {
      const dx = g.x - e.x;
      const dy = g.y - e.y;
      const d = Math.hypot(dx, dy);
      const min = e.r + g.r;
      if (d < min && d > 0.001) {
        if (e === G.player) g.playerTouched = true;
        const nx = dx / d;
        const ny = dy / d;
        g.x = e.x + nx * min;
        g.y = e.y + ny * min;
        const sp = Math.max(90, Math.hypot(e.vx, e.vy) * 0.95);
        g.vx = nx * sp;
        g.vy = ny * sp;
        e.vx *= 0.45;
        e.vy *= 0.45;
        e.squash = Math.max(e.squash, 0.5);
        if (G.bumpCd <= 0) {
          DB_SOUND.play('tap');
          G.bumpCd = 0.2;
        }
      }
    });

    if (G.ring && g.age > 1.2 && g.playerTouched) {
      if (Math.hypot(g.x - G.ring.x, g.y - G.ring.y) < G.ring.r * 0.62) {
        winRound();
      }
    }
  }

  function winRound() {
    if (G.state !== 'play') return;
    G.state = 'ending';
    DB_SOUND.play('win');
    if (G.golden) burst(G.golden.x, G.golden.y, REDUCED ? 10 : 26, 'star');
    for (let i = 0; i < 5; i += 1) {
      setTimeout(() => {
        if (G.state === 'ending') confettiBurst();
      }, i * 170);
    }
    setTimeout(() => {
      if (G.state === 'ending') els.ending.classList.add('is-on');
    }, 650);
  }

  /* ------------------------------------------------------------------ */
  /* 파티클·물웅덩이                                                      */
  /* ------------------------------------------------------------------ */

  function burst(x, y, count, kind) {
    if (G.particles.length > 220) return;
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(60, 220);
      G.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 60,
        life: 0,
        max: rand(0.5, 0.9),
        size: rand(4, 8),
        color:
          kind === 'star'
            ? 'hsl(' + rand(40, 60) + ', 95%, ' + rand(55, 70) + '%)'
            : 'hsl(' + rand(0, 360) + ', 90%, 65%)',
        kind,
      });
    }
  }

  function confettiBurst() {
    for (let i = 0; i < 16; i += 1) {
      G.particles.push({
        x: rand(0, G.W),
        y: rand(-40, G.H * 0.25),
        vx: rand(-80, 80),
        vy: rand(40, 160),
        life: 0,
        max: rand(1.4, 2.4),
        size: rand(5, 9),
        color: 'hsl(' + rand(0, 360) + ', 90%, 62%)',
        kind: 'confetti',
      });
    }
  }

  function updateParticles(dt) {
    for (let i = G.particles.length - 1; i >= 0; i -= 1) {
      const p = G.particles[i];
      p.life += dt;
      if (p.life >= p.max) {
        G.particles.splice(i, 1);
        continue;
      }
      p.vy += (p.kind === 'confetti' ? 320 : 140) * dt;
      p.vx *= Math.pow(0.96, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  function addPuddle(at) {
    G.puddles.push({
      x: at.x,
      y: at.y,
      r: G.baseR * 1.1,
      life: 0,
      max: 7,
    });
    if (G.puddles.length > 6) G.puddles.shift();
  }

  function updatePuddles(dt) {
    for (let i = G.puddles.length - 1; i >= 0; i -= 1) {
      G.puddles[i].life += dt;
      if (G.puddles[i].life >= G.puddles[i].max) G.puddles.splice(i, 1);
    }
  }

  /* ------------------------------------------------------------------ */
  /* 렌더                                                                */
  /* ------------------------------------------------------------------ */

  function drawRing(ctx) {
    const ring = G.ring;
    const t = G.time;
    const pulse = 1 + Math.sin(t * 4) * 0.08;
    ctx.save();
    ctx.translate(ring.x, ring.y);
    ctx.scale(pulse, pulse);
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = 'hsla(' + ((t * 80 + 120) % 360) + ', 90%, 72%, 0.55)';
    ctx.beginPath();
    ctx.arc(0, 0, ring.r * 0.78, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = ring.r * 0.16;
    ctx.strokeStyle = 'hsla(' + ((t * 80) % 360) + ', 92%, 62%, 0.95)';
    ctx.beginPath();
    ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 3; i += 1) {
      const ang = t * 2 + i * 2.1;
      drawStar(ctx, Math.cos(ang) * ring.r * 1.05, Math.sin(ang * 1.3) * ring.r * 1.05, ring.r * 0.13, '#ffffff');
    }
    ctx.restore();
  }

  function drawPuddle(ctx, p) {
    const a = 0.28 * (1 - p.life / p.max);
    ctx.fillStyle = 'rgba(120, 210, 255, ' + a + ')';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.r, p.r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,' + a * 0.9 + ')';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawFruit(ctx, f) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.angle);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, f.r * 1.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 160, 90, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = f.r * 2.2 + 'px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.emoji, 0, 0);
    ctx.restore();
  }

  function drawGolden(ctx) {
    const g = G.golden;
    const pulse = 1 + Math.sin(G.time * 5) * 0.05;
    ctx.save();
    ctx.translate(g.x, g.y);

    const glow = ctx.createRadialGradient(0, 0, g.r * 0.4, 0, 0, g.r * 2.2);
    glow.addColorStop(0, 'rgba(255,225,120,0.75)');
    glow.addColorStop(1, 'rgba(255,225,120,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, g.r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.scale(pulse, pulse);
    const grad = ctx.createLinearGradient(-g.r, -g.r, g.r, g.r);
    grad.addColorStop(0, '#fff4c2');
    grad.addColorStop(0.5, '#ffd54a');
    grad.addColorStop(1, '#f2a900');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, g.r * 0.85, g.r * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.ellipse(-g.r * 0.25, -g.r * 0.35, g.r * 0.18, g.r * 0.28, -0.5, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 3; i += 1) {
      const ang = G.time * 2 + i * 2.1;
      drawStar(
        ctx,
        Math.cos(ang) * g.r * 1.3,
        Math.sin(ang * 1.3) * g.r * 1.3,
        g.r * 0.16,
        '#fff9c4'
      );
    }
    ctx.restore();
  }

  function drawDinoEntity(ctx, e) {
    drawDino(ctx, e.dino, e.x, e.y, e.r, {
      facing: e.facing,
      walk: e.walk,
      squash: e.squash,
      hop: e.hop,
      giggle: e.giggle,
      tilt: e.tilt,
      time: G.time,
      phase: e.phase,
    });
  }

  function drawHint(ctx) {
    const p = G.player;
    const fade = clamp((4.5 - G.time) / 1.5, 0, 1);
    if (fade <= 0) return;
    ctx.save();
    ctx.globalAlpha = fade * (0.6 + Math.sin(G.time * 6) * 0.2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 1.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = fade;
    ctx.font = p.r * 0.9 + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👆', p.x, p.y - p.r * 2.2 + Math.sin(G.time * 4) * 4);
    ctx.restore();
  }

  function drawParticles(ctx) {
    for (let i = 0; i < G.particles.length; i += 1) {
      const p = G.particles[i];
      const k = 1 - p.life / p.max;
      ctx.globalAlpha = Math.max(0, k);
      if (p.kind === 'star') {
        drawStar(ctx, p.x, p.y, p.size * k, p.color);
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 6);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
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

    if (G.bg) {
      ctx.drawImage(G.bg, 0, 0, G.W, G.H);
    } else {
      ctx.fillStyle = G.arena.ground[0];
      ctx.fillRect(0, 0, G.W, G.H);
    }

    if (G.ring) drawRing(ctx);
    for (let i = 0; i < G.puddles.length; i += 1) drawPuddle(ctx, G.puddles[i]);
    for (let i = 0; i < G.fruits.length; i += 1) drawFruit(ctx, G.fruits[i]);
    if (G.golden) drawGolden(ctx);

    if (G.friend) drawDinoEntity(ctx, G.friend);
    if (G.player) drawDinoEntity(ctx, G.player);
    if (G.state === 'play' && G.player) drawHint(ctx);

    drawParticles(ctx);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* 루프                                                                */
  /* ------------------------------------------------------------------ */

  function update(dt) {
    G.time += dt;
    G.shake = Math.max(0, G.shake - dt * 2.2);
    updateParticles(dt);
    updatePuddles(dt);

    if (G.state !== 'play') return;

    G.bumpCd = Math.max(0, G.bumpCd - dt);
    G.fruitCd = Math.max(0, G.fruitCd - dt);

    updatePlayer(dt);
    updateFriend(dt);
    collideDinos();
    updateFruits(dt);
    updateGolden(dt);
  }

  function loop(ts) {
    requestAnimationFrame(loop);
    const dt = G.lastT ? Math.min(0.033, (ts - G.lastT) / 1000) : 0.016;
    G.lastT = ts;
    if (G.state === 'select') return;
    update(dt);
    render();
  }

  /* ------------------------------------------------------------------ */
  /* 입력·초기화                                                         */
  /* ------------------------------------------------------------------ */

  function setPointer(e) {
    const r = els.canvas.getBoundingClientRect();
    G.pointer.x = e.clientX - r.left;
    G.pointer.y = e.clientY - r.top;
  }

  function endDrag() {
    G.dragging = false;
  }

  function bindUI() {
    els.canvas.addEventListener('pointerdown', (e) => {
      if (G.state !== 'play') return;
      e.preventDefault();
      G.dragging = true;
      setPointer(e);
      DB_SOUND.unlock();
      try {
        els.canvas.setPointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
    });
    els.canvas.addEventListener('pointermove', (e) => {
      if (!G.dragging) return;
      setPointer(e);
    });
    els.canvas.addEventListener('pointerup', endDrag);
    els.canvas.addEventListener('pointercancel', endDrag);
    window.addEventListener('pointerup', endDrag);
    els.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    els.startBtn.addEventListener('click', () => {
      DB_SOUND.play('pop');
      startRound();
    });

    els.btnAgain.addEventListener('click', () => {
      DB_SOUND.play('pop');
      startRound();
    });

    els.btnChange.addEventListener('click', () => {
      DB_SOUND.play('tap');
      showSelect();
    });

    els.sound.addEventListener('click', () => {
      DB_SOUND.muted = !DB_SOUND.muted;
      els.sound.textContent = DB_SOUND.muted ? '🔇' : '🔊';
      if (!DB_SOUND.muted) DB_SOUND.play('tap');
    });

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 120));
  }

  function init() {
    buildSelect();
    bindUI();
    resize();
    requestAnimationFrame(loop);
  }

  init();
})();
