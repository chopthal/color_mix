/**
 * 뾰로롱! 변신 숨바꼭질
 * 물건으로 변신해 숨고, 이번엔 흔들리는 물건을 콕 찾는다.
 * 실패·타이머·점수 없음. 들켜도 틀려도 웃고 다시 한다.
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
    phase: 'pick',
    round: 1,
    foundCount: 0,
    W: 0,
    H: 0,
    dpr: 1,
    ctx: null,
    bg: null,
    fairyId: 'sky',
    baseR: 24,
    kid: {
      x: 0,
      y: 0,
      r: 24,
      speed: 320,
      facing: 1,
      walk: 0,
      visible: true,
      target: null,
    },
    seeker: null,
    objects: [],
    hiddenObject: null,
    friendObject: null,
    foundObject: null,
    hideT: 0,
    giggleCd: 0,
    nearLatch: false,
    giveupT: 0,
    clueT: 0,
    pickT: 0,
    findT: 0,
    wrongCd: 0,
    foundT: 0,
    particles: [],
    floats: [],
    time: 0,
    lastT: 0,
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function textY(o, base) {
    return o.cy - o.size * (o.kind === 'teddy' ? Math.max(base, 0.95) : base);
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
    wall.addColorStop(0, '#fbfffd');
    wall.addColorStop(1, '#ddf4ec');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, floorY);

    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#d3efe5';
    for (let x = -20; x < W + 20; x += 54) {
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
    sky.addColorStop(0, '#dff4ff');
    sky.addColorStop(1, '#bfe6ff');
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
    ctx.fillStyle = '#8fd8c6';
    roundRectPath(ctx, wx - 14, wy - 10, 12, wh + 22, 6);
    ctx.fill();
    roundRectPath(ctx, wx + ww + 2, wy - 10, 12, wh + 22, 6);
    ctx.fill();

    // 문
    const dw = Math.min(W * 0.2, H * 0.3);
    const dh = H * 0.26;
    const dx = W / 2 - dw / 2;
    ctx.fillStyle = '#f6c68a';
    ctx.beginPath();
    ctx.moveTo(dx, dh);
    ctx.lineTo(dx, dw / 2);
    ctx.quadraticCurveTo(dx, 0, dx + dw / 2, 0);
    ctx.quadraticCurveTo(dx + dw, 0, dx + dw, dw / 2);
    ctx.lineTo(dx + dw, dh);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d99b4e';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = '#c47b3a';
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
    ctx.fillStyle = '#ffe3ef';
    roundRectPath(ctx, fx, fy, fw, fw * 0.8, 6);
    ctx.fill();
    drawStar(ctx, fx + fw / 2, fy + fw * 0.4, fw * 0.24, '#ffd43b');

    // 바닥
    const floor = ctx.createLinearGradient(0, floorY, 0, H);
    floor.addColorStop(0, '#f6dcbd');
    floor.addColorStop(1, '#e9c39b');
    ctx.fillStyle = floor;
    ctx.fillRect(0, floorY, W, H - floorY);
    ctx.strokeStyle = 'rgba(196, 148, 108, 0.32)';
    ctx.lineWidth = 2;
    for (let y = floorY + 26; y < H; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // 러그
    ctx.fillStyle = '#ffe0c7';
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.66, W * 0.46, H * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff2e4';
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
  /* 물건 배치                                                           */
  /* ------------------------------------------------------------------ */

  function objectLayout() {
    const portrait = G.H >= G.W;
    const size = portrait
      ? clamp(Math.min(G.W * 0.3, G.H * 0.13), 70, 130)
      : clamp(Math.min(G.W * 0.16, G.H * 0.26), 90, 170);
    return TH_OBJECTS.map((def) => {
      const p = portrait ? def.portrait : def.landscape;
      return {
        kind: def.kind,
        aria: def.aria,
        cx: G.W * p[0],
        cy: G.H * p[1],
        size,
      };
    });
  }

  function layoutObjects() {
    const old = G.objects;
    G.objects = objectLayout().map((p, i) => ({
      ...p,
      slot: i,
      hiddenChild: old[i] ? old[i].hiddenChild : false,
      hiddenFriend: old[i] ? old[i].hiddenFriend : false,
      wiggle: 0,
      pop: old[i] ? old[i].pop : 0,
    }));
    G.hiddenObject = G.objects.find((o) => o.hiddenChild) || null;
    G.friendObject = G.objects.find((o) => o.hiddenFriend) || null;
    if (G.foundObject) G.foundObject = G.objects[G.foundObject.slot] || null;
  }

  function patrolPoints() {
    const pts = G.H >= G.W ? TH_PATROL.portrait : TH_PATROL.landscape;
    return pts.map((p) => ({ x: G.W * p[0], y: G.H * p[1] }));
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

    G.baseR = clamp(Math.min(G.W, G.H) * 0.06, 18, 38);
    G.kid.r = G.baseR;
    G.kid.speed = Math.min(G.W, G.H) * 0.95;
    if (G.seeker) {
      G.seeker.r = G.baseR * 1.1;
      G.seeker.speed = clamp(Math.min(G.W, G.H) * 0.45, 160, 360);
    }

    layoutObjects();
    clampEntities();
    buildBackground();
  }

  function clampEntities() {
    const k = G.kid;
    k.x = clamp(k.x, k.r, G.W - k.r);
    k.y = clamp(k.y, G.H * 0.16 + k.r, G.H - k.r);
    if (G.seeker) {
      G.seeker.x = clamp(G.seeker.x, G.seeker.r, G.W - G.seeker.r);
      G.seeker.y = clamp(G.seeker.y, G.seeker.r, G.H - G.seeker.r);
    }
  }

  function doorPos() {
    return { x: G.W * 0.5, y: G.H * 0.12 };
  }

  function makeSeeker() {
    const fairy = TH_FAIRIES.find((f) => f.id === G.fairyId) || TH_FAIRIES[0];
    const door = doorPos();
    return {
      fairy,
      x: door.x,
      y: door.y,
      r: G.baseR * 1.1,
      speed: clamp(Math.min(G.W, G.H) * 0.45, 160, 360),
      facing: 1,
      walk: 0,
      state: 'idle',
      index: 0,
      pause: 0,
      phase: Math.random() * 6,
    };
  }

  /* ------------------------------------------------------------------ */
  /* 선택 화면                                                           */
  /* ------------------------------------------------------------------ */

  function buildSelect() {
    TH_FAIRIES.forEach((fairy) => {
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
        TH_SOUND.play('tap');
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
    G.round = 1;
    G.foundCount = 0;
    G.objects = [];
    layoutObjects();
    G.hiddenObject = null;
    G.friendObject = null;
    G.foundObject = null;
    G.particles = [];
    G.floats = [];
    G.time = 0;
    G.lastT = 0;
    G.kid.x = G.W * 0.5;
    G.kid.y = G.H * 0.88;
    G.kid.visible = true;
    G.kid.target = null;
    G.kid.walk = 0;

    G.seeker = makeSeeker();
    startPick();
  }

  function startPick() {
    G.phase = 'pick';
    G.pickT = 0;
    G.hideT = 0;
    G.giggleCd = 0;
    G.nearLatch = false;
    G.giveupT = 0;
    G.clueT = 0;
    G.findT = 0;
    G.wrongCd = 0;
    G.foundT = 0;
    G.hiddenObject = null;
    G.friendObject = null;
    G.foundObject = null;

    G.objects.forEach((o) => {
      o.hiddenChild = false;
      o.hiddenFriend = false;
      o.wiggle = 0;
      o.pop = 0;
    });

    G.kid.x = G.W * 0.5;
    G.kid.y = G.H * 0.88;
    G.kid.visible = true;
    G.kid.target = null;
    G.kid.walk = 0;

    const door = doorPos();
    const s = G.seeker;
    s.x = door.x;
    s.y = door.y;
    s.state = 'idle';
    s.index = 0;
    s.pause = 0;
    s.walk = 0;
  }

  function startHiding(obj) {
    if (G.phase !== 'pick') return;
    G.phase = 'hide';
    G.hiddenObject = obj;
    obj.hiddenChild = true;
    obj.wiggle = 1;
    obj.pop = 1;
    G.kid.visible = false;
    G.kid.target = null;
    G.hideT = 0;
    G.giggleCd = 0;
    G.nearLatch = false;
    G.giveupT = 0;
    const pts = patrolPoints();
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < pts.length; i += 1) {
      const d = Math.hypot(pts[i].x - obj.cx, pts[i].y - obj.cy);
      if (d < best) {
        best = d;
        nearest = i;
      }
    }
    G.seeker.state = 'patrol';
    G.seeker.index = nearest;
    G.seeker.pause = 0;

    TH_SOUND.play('poof');
    burst(obj.cx, obj.cy, 16, 'star');
    floatText(obj.cx, textY(obj, 0.55), '뾰로롱!', '#7c3aed');
  }

  function startFind() {
    G.phase = 'find';
    if (G.hiddenObject) G.hiddenObject.hiddenChild = false;
    G.hiddenObject = null;

    G.kid.visible = true;
    G.kid.x = G.W * 0.5;
    G.kid.y = G.H * 0.88;
    G.kid.target = null;
    G.kid.walk = 0;
    G.seeker.state = 'hidden';

    G.foundObject = null;
    G.friendObject = G.objects[Math.floor(rand(0, G.objects.length))];
    G.friendObject.hiddenFriend = true;

    G.clueT = 0.6;
    G.findT = 0;
    G.wrongCd = 0;

    burst(G.kid.x, G.kid.y, 10, 'star');
  }

  function resolveTap(obj) {
    if (G.phase !== 'find' || G.wrongCd > 0) return;
    G.findT = 0;
    G.kid.target = { x: obj.cx, y: obj.cy + obj.size * 0.5 };

    if (obj === G.friendObject) {
      found(obj);
      return;
    }

    obj.pop = 1;
    obj.wiggle = 1;
    G.wrongCd = 0.45;
    floatText(obj.cx, textY(obj, 0.55), '?', '#5b6b7a');
    TH_SOUND.play('wrong');
    burst(obj.cx, obj.cy, 6, 'sparkle');
  }

  function found(obj) {
    G.phase = 'found';
    G.foundT = 1.7;
    obj.hiddenFriend = false;
    obj.pop = 1;
    G.foundObject = obj;
    G.foundCount += 1;
    G.kid.target = { x: obj.cx, y: obj.cy + obj.size * 0.5 };

    TH_SOUND.play('found');
    burst(obj.cx, obj.cy, 20, 'star');
    floatText(obj.cx, textY(obj, 0.55), '까르르!', '#ff6b9d');
  }

  function nextRound() {
    G.round += 1;
    if (G.round > 2) {
      showEnding();
    } else {
      startPick();
    }
  }

  function showEnding() {
    if (G.state !== 'play') return;
    G.state = 'ending';
    G.phase = 'ending';
    els.ending.classList.add('is-on');
    TH_SOUND.play('win');
    confettiBurst();
  }

  function showSelect() {
    G.state = 'select';
    G.phase = 'pick';
    els.ending.classList.remove('is-on');
    els.select.classList.add('is-on');
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

  function updateKid(dt) {
    const k = G.kid;
    if (k.target) {
      const dx = k.target.x - k.x;
      const dy = k.target.y - k.y;
      const d = Math.hypot(dx, dy);
      if (d < 4) {
        k.target = null;
      } else {
        const step = Math.min(d, k.speed * dt);
        k.x += (dx / d) * step;
        k.y += (dy / d) * step;
        k.walk += step * 0.06;
        if (Math.abs(dx) > 1) k.facing = dx < 0 ? -1 : 1;
      }
    }
    k.x = clamp(k.x, k.r, G.W - k.r);
    k.y = clamp(k.y, G.H * 0.16 + k.r, G.H - k.r);
  }

  function updateSeeker(dt) {
    const s = G.seeker;
    if (!s) return;
    if (s.state !== 'patrol') return;

    const pts = patrolPoints();
    const p = pts[s.index];
    const d = moveToward(s, p.x, p.y, s.speed, dt);
    if (d < 8) {
      s.pause += dt;
      if (s.pause > 0.25) {
        s.index = (s.index + 1) % pts.length;
        s.pause = 0;
      }
    } else {
      s.pause = 0;
    }
  }

  function checkNear() {
    const h = G.hiddenObject;
    if (!h || !G.seeker) return;
    const s = G.seeker;
    const near = h.size * 1.05 + 10;
    const d = Math.hypot(s.x - h.cx, s.y - h.cy);

    if (d > near * 1.4) G.nearLatch = false;

    if (!G.nearLatch && d < near && G.giggleCd <= 0) {
      G.giggleCd = 2.2;
      G.nearLatch = true;
      h.wiggle = 1;
      floatText(h.cx, textY(h, 0.6), '히히!', '#ff6b9d');
      TH_SOUND.play('giggle');
      burst(h.cx, h.cy, 6, 'sparkle');
    }
  }

  function giveUp() {
    if (G.phase !== 'hide') return;
    G.phase = 'giveup';
    G.giveupT = 1.3;
    if (G.seeker) G.seeker.state = 'giveup';
    TH_SOUND.play('giveup');
  }

  function triggerClue() {
    const o = G.friendObject;
    if (!o) return;
    o.wiggle = 1;
    floatText(o.cx, o.cy - o.size * 0.9, '♪', '#7c3aed');
    burst(o.cx, o.cy, 5, 'sparkle');
    TH_SOUND.play('clue');
  }

  function updateObjects(dt) {
    for (let i = 0; i < G.objects.length; i += 1) {
      const o = G.objects[i];
      o.wiggle = Math.max(0, o.wiggle - dt * 1.6);
      o.pop = Math.max(0, o.pop - dt * 1.8);
    }
  }

  function update(dt) {
    G.time += dt;
    updateParticles(dt);
    updateFloats(dt);
    updateObjects(dt);

    if (G.state !== 'play') return;

    updateKid(dt);
    updateSeeker(dt);

    if (G.phase === 'pick') {
      G.pickT += dt;
    } else if (G.phase === 'hide') {
      G.hideT += dt;
      G.giggleCd = Math.max(0, G.giggleCd - dt);
      checkNear();
      if (G.hideT >= 6.5) giveUp();
    } else if (G.phase === 'giveup') {
      G.giveupT -= dt;
      if (G.giveupT <= 0) startFind();
    } else if (G.phase === 'find') {
      G.findT += dt;
      G.wrongCd = Math.max(0, G.wrongCd - dt);
      G.clueT -= dt;
      if (G.clueT <= 0 && G.friendObject) {
        triggerClue();
        G.clueT = 2.4;
      }
    } else if (G.phase === 'found') {
      G.foundT -= dt;
      if (G.foundT <= 0) nextRound();
    }
  }

  /* ------------------------------------------------------------------ */
  /* 파티클                                                              */
  /* ------------------------------------------------------------------ */

  function burst(x, y, count, kind) {
    const colors = ['#ffd43b', '#ff8fc4', '#6ba8ff', '#b28dff', '#7fe0c4', '#ffffff'];
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
    const colors = ['#ffd43b', '#ff8fc4', '#6ba8ff', '#b28dff', '#7fe0c4', '#ff9f80'];
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
    G.floats.push({ x, y, text, color, life: 1, max: 1 });
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
  /* 물건 그리기                                                         */
  /* ------------------------------------------------------------------ */

  function drawPiano(ctx, s) {
    ctx.fillStyle = '#8b5a2b';
    roundRectPath(ctx, -0.58 * s, -0.5 * s, 1.16 * s, 1.0 * s, 0.08 * s);
    ctx.fill();

    ctx.fillStyle = '#6f4420';
    roundRectPath(ctx, -0.62 * s, -0.58 * s, 1.24 * s, 0.16 * s, 0.06 * s);
    ctx.fill();

    ctx.fillStyle = '#a86b3c';
    roundRectPath(ctx, -0.5 * s, -0.4 * s, 1.0 * s, 0.34 * s, 0.05 * s);
    ctx.fill();

    ctx.fillStyle = '#fffaf0';
    roundRectPath(ctx, -0.52 * s, -0.06 * s, 1.04 * s, 0.2 * s, 0.04 * s);
    ctx.fill();

    ctx.fillStyle = '#3d2b1f';
    for (let i = 0; i < 7; i += 1) {
      ctx.fillRect((-0.44 + i * 0.132) * s, -0.06 * s, 0.055 * s, 0.12 * s);
    }

    ctx.fillStyle = '#6f4420';
    ctx.fillRect(-0.48 * s, 0.46 * s, 0.14 * s, 0.12 * s);
    ctx.fillRect(0.34 * s, 0.46 * s, 0.14 * s, 0.12 * s);

    ctx.fillStyle = '#f3e3c3';
    roundRectPath(ctx, -0.22 * s, -0.52 * s, 0.44 * s, 0.08 * s, 0.02 * s);
    ctx.fill();

    ctx.fillStyle = '#f6c68a';
    ctx.beginPath();
    ctx.arc(-0.36 * s, -0.18 * s, 0.045 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0.36 * s, -0.18 * s, 0.045 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGift(ctx, s) {
    ctx.fillStyle = '#ff9ec4';
    roundRectPath(ctx, -0.46 * s, -0.34 * s, 0.92 * s, 0.8 * s, 0.08 * s);
    ctx.fill();

    ctx.fillStyle = '#f06595';
    roundRectPath(ctx, -0.52 * s, -0.44 * s, 1.04 * s, 0.24 * s, 0.06 * s);
    ctx.fill();

    ctx.fillStyle = '#ffd43b';
    ctx.fillRect(-0.06 * s, -0.44 * s, 0.12 * s, 0.9 * s);
    ctx.fillRect(-0.52 * s, -0.28 * s, 1.04 * s, 0.08 * s);

    ctx.beginPath();
    ctx.ellipse(-0.14 * s, -0.53 * s, 0.15 * s, 0.1 * s, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0.14 * s, -0.53 * s, 0.15 * s, 0.1 * s, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -0.52 * s, 0.07 * s, 0, Math.PI * 2);
    ctx.fill();

    drawStar(ctx, 0, 0.12 * s, 0.14 * s, '#fff3bf');
  }

  function drawTeddy(ctx, s) {
    ctx.fillStyle = '#c98a5a';
    ctx.beginPath();
    ctx.ellipse(-0.24 * s, 0.44 * s, 0.18 * s, 0.13 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0.24 * s, 0.44 * s, 0.18 * s, 0.13 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-0.42 * s, 0.06 * s, 0.14 * s, 0.2 * s, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0.42 * s, 0.06 * s, 0.14 * s, 0.2 * s, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0.12 * s, 0.36 * s, 0.4 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f0d3b0';
    ctx.beginPath();
    ctx.ellipse(0, 0.18 * s, 0.22 * s, 0.26 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c98a5a';
    ctx.beginPath();
    ctx.arc(-0.3 * s, -0.78 * s, 0.14 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0.3 * s, -0.78 * s, 0.14 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -0.48 * s, 0.38 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f0b8a0';
    ctx.beginPath();
    ctx.arc(-0.3 * s, -0.78 * s, 0.075 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0.3 * s, -0.78 * s, 0.075 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f0d3b0';
    ctx.beginPath();
    ctx.ellipse(0, -0.4 * s, 0.18 * s, 0.14 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4a3f52';
    ctx.beginPath();
    ctx.arc(-0.14 * s, -0.56 * s, 0.04 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0.14 * s, -0.56 * s, 0.04 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -0.41 * s, 0.05 * s, 0.035 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#4a3f52';
    ctx.lineWidth = Math.max(1.5, s * 0.02);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -0.37 * s, 0.1 * s, 0.25, Math.PI - 0.25);
    ctx.stroke();
  }

  function drawSofa(ctx, s) {
    ctx.fillStyle = '#3fae9f';
    roundRectPath(ctx, -0.58 * s, -0.5 * s, 1.16 * s, 0.62 * s, 0.16 * s);
    ctx.fill();

    ctx.fillStyle = '#5cc9b8';
    roundRectPath(ctx, -0.66 * s, -0.02 * s, 1.32 * s, 0.44 * s, 0.14 * s);
    ctx.fill();

    ctx.fillStyle = '#3fae9f';
    roundRectPath(ctx, -0.76 * s, -0.18 * s, 0.24 * s, 0.56 * s, 0.1 * s);
    ctx.fill();
    roundRectPath(ctx, 0.52 * s, -0.18 * s, 0.24 * s, 0.56 * s, 0.1 * s);
    ctx.fill();

    ctx.fillStyle = '#a8ece2';
    roundRectPath(ctx, -0.44 * s, -0.06 * s, 0.4 * s, 0.3 * s, 0.1 * s);
    ctx.fill();
    roundRectPath(ctx, 0.04 * s, -0.06 * s, 0.4 * s, 0.3 * s, 0.1 * s);
    ctx.fill();

    ctx.fillStyle = '#2f8f85';
    ctx.fillRect(-0.5 * s, 0.4 * s, 0.12 * s, 0.14 * s);
    ctx.fillRect(0.38 * s, 0.4 * s, 0.12 * s, 0.14 * s);

    drawStar(ctx, -0.24 * s, 0.1 * s, 0.09 * s, '#ffffff');
  }

  const OBJECT_DRAW = {
    piano: drawPiano,
    teddy: drawTeddy,
    sofa: drawSofa,
    gift: drawGift,
  };

  function drawObject(ctx, o, t) {
    ctx.save();
    ctx.fillStyle = 'rgba(60, 50, 80, 0.13)';
    ctx.beginPath();
    ctx.ellipse(o.cx, o.cy + o.size * 0.52, o.size * 0.58, o.size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    const pop = 1 + o.pop * 0.12;
    const wob = REDUCED ? 0 : o.wiggle * Math.sin(t * 30 + o.slot) * 0.06;
    ctx.translate(o.cx, o.cy);
    ctx.rotate(wob);
    ctx.scale(pop, pop);
    const fn = OBJECT_DRAW[o.kind] || drawGift;
    fn(ctx, o.size);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* 요정·아이 그리기                                                    */
  /* ------------------------------------------------------------------ */

  function drawFairy(ctx, fairy, x, y, r, o) {
    o = o || {};
    const t = o.t || 0;
    const facing = o.facing || 1;
    const walk = o.walk || 0;
    const hop = o.hop || 0;
    const peek = o.peek || 0;
    const bob = REDUCED ? 0 : Math.sin(t * 3 + (o.phase || 0)) * r * 0.05 + hop * r * 0.14;

    ctx.save();
    ctx.fillStyle = 'rgba(60, 50, 80, 0.14)';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 1.02, r * 0.6, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(x, y - bob);
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
      ctx.fillStyle = '#115e59';
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
    const hop = o.hop || 0;

    ctx.save();
    ctx.fillStyle = 'rgba(60, 50, 80, 0.16)';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.98, r * 0.62, r * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(x, y - hop * r * 0.16);
    ctx.scale(facing, 1);

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

  /* ------------------------------------------------------------------ */
  /* 파티클·힌트·HUD                                                     */
  /* ------------------------------------------------------------------ */

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
      const size = Math.round(G.baseR * 1.05);
      ctx.font = 'bold ' + size + 'px "Jua", sans-serif';
      const tw = ctx.measureText(f.text).width;
      const bw = tw + 20;
      const bh = size + 12;

      ctx.globalAlpha = k * 0.9;
      ctx.fillStyle = '#ffffff';
      roundRectPath(ctx, f.x - bw / 2, f.y - bh / 2, bw, bh, bh / 2);
      ctx.fill();

      ctx.globalAlpha = k;
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawClue(ctx) {
    if (G.phase !== 'find' || !G.friendObject) return;
    const o = G.friendObject;
    const bob = REDUCED ? 0 : Math.sin(G.time * 4) * 5;
    const alpha = REDUCED ? 0.85 : 0.65 + Math.sin(G.time * 4 + 1) * 0.25;
    const gy = o.cy - o.size * (o.kind === 'teddy' ? 1.02 : 0.78);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold ' + Math.round(G.baseR * 1.2) + 'px "Jua", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeText('♪', o.cx, gy + bob);
    ctx.fillStyle = '#7c3aed';
    ctx.fillText('♪', o.cx, gy + bob);
    ctx.restore();
  }

  function drawHints(ctx) {
    if (G.phase === 'pick' && G.pickT > 0.8 && G.objects.length) {
      const o = G.objects[2] || G.objects[0];
      const bob = REDUCED ? 0 : Math.sin(G.time * 5) * 6;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.font = Math.round(G.baseR * 1.15) + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👆', o.cx, o.cy - o.size * 0.6 + bob);
      ctx.restore();
    }

    if (G.phase === 'find' && G.findT > 5 && G.friendObject && G.friendObject !== G.foundObject) {
      const o = G.friendObject;
      const bob = REDUCED ? 0 : Math.sin(G.time * 5) * 6;
      const gy = o.cy - o.size * (o.kind === 'teddy' ? 1.06 : 0.6);
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.font = Math.round(G.baseR * 1.15) + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👆', o.cx, gy + bob);
      ctx.restore();
    }
  }

  function drawHud(ctx) {
    const n = 2;
    const gap = 24;
    const y = 20;
    const startX = 22;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    roundRectPath(ctx, startX - 14, y - 15, n * gap + 6, 30, 15);
    ctx.fill();
    for (let i = 0; i < n; i += 1) {
      drawStar(ctx, startX + i * gap, y, 9, i < G.foundCount ? '#ffd43b' : '#d9f2e8');
      if (i < G.foundCount) drawStar(ctx, startX + i * gap, y, 4.5, '#fff3bf');
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* 렌더                                                                */
  /* ------------------------------------------------------------------ */

  function render() {
    const ctx = G.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, G.W, G.H);

    if (G.bg) ctx.drawImage(G.bg, 0, 0, G.W, G.H);
    else {
      ctx.fillStyle = '#ddf4ec';
      ctx.fillRect(0, 0, G.W, G.H);
    }

    const sorted = G.objects.slice().sort((a, b) => a.cy - b.cy);
    for (let i = 0; i < sorted.length; i += 1) drawObject(ctx, sorted[i], G.time);

    if (G.kid.visible && G.state !== 'select') {
      drawKid(ctx, G.kid.x, G.kid.y, G.kid.r, {
        walk: G.kid.walk,
        facing: G.kid.facing,
      });
    }

    if (G.seeker && (G.phase === 'pick' || G.phase === 'hide' || G.phase === 'giveup')) {
      const s = G.seeker;
      drawFairy(ctx, s.fairy, s.x, s.y, s.r, {
        t: G.time,
        facing: s.facing,
        walk: s.walk,
        peek: G.phase === 'giveup',
        phase: s.phase,
      });
    }

    if (G.phase === 'found' && G.foundObject && G.seeker) {
      const o = G.foundObject;
      const hop = REDUCED ? 0 : Math.abs(Math.sin(G.time * 6)) * 0.8;
      drawFairy(ctx, G.seeker.fairy, o.cx, o.cy - o.size * 0.15, G.baseR * 1.02, {
        t: G.time,
        facing: 1,
        hop,
      });
    }

    drawParticles(ctx);
    drawFloats(ctx);
    if (G.state === 'play') drawClue(ctx);

    if (G.state === 'play') {
      drawHints(ctx);
      drawHud(ctx);
    }
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

  function hitObject(p) {
    for (let i = 0; i < G.objects.length; i += 1) {
      const o = G.objects[i];
      const half = o.size * 0.95 + 12;
      if (Math.abs(p.x - o.cx) <= half && Math.abs(p.y - o.cy) <= half) return o;
    }
    return null;
  }

  function bindUI() {
    els.canvas.addEventListener('pointerdown', (e) => {
      if (G.state !== 'play') return;
      e.preventDefault();
      TH_SOUND.unlock();

      const obj = hitObject(toStage(e));
      if (!obj) return;

      if (G.phase === 'pick') startHiding(obj);
      else if (G.phase === 'find') resolveTap(obj);
    });
    els.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    els.startBtn.addEventListener('click', () => {
      TH_SOUND.unlock();
      TH_SOUND.play('pop');
      startRound();
    });

    els.btnAgain.addEventListener('click', () => {
      TH_SOUND.play('pop');
      startRound();
    });

    els.btnChange.addEventListener('click', () => {
      TH_SOUND.play('tap');
      showSelect();
    });

    els.sound.addEventListener('click', () => {
      TH_SOUND.muted = !TH_SOUND.muted;
      els.sound.textContent = TH_SOUND.muted ? '🔇' : '🔊';
      if (!TH_SOUND.muted) TH_SOUND.play('tap');
    });

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 120));
  }

  function init() {
    buildSelect();
    bindUI();
    resize();
    G.kid.x = G.W * 0.5;
    G.kid.y = G.H * 0.88;
    requestAnimationFrame(loop);
  }

  init();
})();
