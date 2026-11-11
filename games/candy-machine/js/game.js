(() => {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CANDIES = [
    { id: 'berry', name: '딸기', type: 'lollipop', color: '#ff6b8a', color2: '#ffd0dc', wrap: '#ffb3c6' },
    { id: 'grape', name: '포도', type: 'lollipop', color: '#9b6bd6', color2: '#e2ccf5', wrap: '#c9a8f0' },
    { id: 'lemon', name: '레몬', type: 'lollipop', color: '#ffd23f', color2: '#fff3b0', wrap: '#ffe27a' },
    { id: 'soda', name: '소다', type: 'lollipop', color: '#4fb8ff', color2: '#c9ebff', wrap: '#8fd0ff' },
    { id: 'star-yellow', name: '노랑', type: 'star', color: '#ffd23f', color2: '#fff0a8', wrap: '#ffe27a' },
    { id: 'star-pink', name: '분홍', type: 'star', color: '#ff8fc4', color2: '#ffd6e7', wrap: '#ffb3d6' },
    { id: 'star-mint', name: '민트', type: 'star', color: '#5fd6c0', color2: '#c9f5ec', wrap: '#8fe6d6' },
    { id: 'star-purple', name: '보라', type: 'star', color: '#b58cff', color2: '#e3d4ff', wrap: '#cdb3ff' },
    { id: 'melon', name: '수박', type: 'ball', color: '#7edc6f', color2: '#ff6b8a', wrap: '#a8e89c' },
    { id: 'orange', name: '오렌지', type: 'ball', color: '#ff9a3d', color2: '#ffc08a', wrap: '#ffb877' },
    { id: 'blueberry', name: '블루베리', type: 'ball', color: '#5b7cff', color2: '#aab8ff', wrap: '#8da0ff' },
    { id: 'choco', name: '초코', type: 'ball', color: '#8a5a3b', color2: '#c79a6f', wrap: '#b08256' },
  ];

  const els = {
    canvas: document.getElementById('gameCanvas'),
    stage: document.getElementById('stage'),
    sound: document.getElementById('btnSound'),
    reset: document.getElementById('btnReset'),
    ending: document.getElementById('endingOverlay'),
    again: document.getElementById('btnAgain'),
  };

  const G = {
    phase: 'machine',
    W: 0,
    H: 0,
    dpr: 1,
    ctx: null,
    time: 0,
    lastT: 0,
    // machine
    coin: { x: 0, y: 0, r: 30, inserted: false, fly: 0 },
    ready: false,
    selected: -1,
    drop: { active: false, t: 0, from: null, to: null },
    tray: { candy: -1, door: 0, open: false, flash: 0, shake: 0 },
    btnPos: [],
    candyCell: [],
    slotPos: { x: 0, y: 0 },
    trayPos: { x: 0, y: 0, w: 0, h: 0 },
    machine: { x: 0, y: 0, w: 0, h: 0 },
    // unwrap
    unwrap: 0,
    wrapperFly: 0,
    toEatTimer: 0,
    // eat
    current: -1,
    remaining: 1,
    biteHurt: false,
    biteCrack: false,
    boy: { mood: 'neutral', bandaid: false, puff: 0, blink: 0 },
    mutans: 0,
    eatBtn: { lick: { x: 0, y: 0, r: 46 }, bite: { x: 0, y: 0, r: 46 } },
    choiceBtn: { more: { x: 0, y: 0, r: 54 }, brush: { x: 0, y: 0, r: 54 } },
    // brush
    brush: { x: 0, y: 0, grabbed: false, homeX: 0, homeY: 0, progress: 0 },
    teeth: [],
    mouth: { x: 0, y: 0, w: 0, h: 0 },
    sparkle: 0,
    // face
    face: { cx: 0, cy: 0, r: 90 },
    // fx
    particles: [],
    floats: [],
    rings: [],
    hintTimer: 0,
    state: 'play',
  };

  const Sound = {
    ctx: null,
    master: null,
    muted: false,

    unlock() {
      if (!this.ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        try {
          this.ctx = new Ctx();
          this.master = this.ctx.createGain();
          this.master.gain.value = 0.7;
          this.master.connect(this.ctx.destination);
        } catch (err) {
          return;
        }
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    },

    tone(freq, dur, type, vol, when, slideTo) {
      if (!this.ctx || !this.master || this.muted) return;
      const t0 = this.ctx.currentTime + (when || 0);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol || 0.15), t0 + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.04);
    },

    noise(dur, vol, cutoff, when) {
      if (!this.ctx || !this.master || this.muted) return;
      const t0 = this.ctx.currentTime + (when || 0);
      const length = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cutoff || 1500;
      const gain = this.ctx.createGain();
      gain.gain.value = vol || 0.08;
      source.connect(filter).connect(gain).connect(this.master);
      source.start(t0);
    },

    coin() {
      this.tone(880, 0.09, 'sine', 0.16, 0, 1320);
      this.tone(1760, 0.12, 'sine', 0.1, 0.06);
      this.tone(660, 0.08, 'triangle', 0.08, 0.1);
    },

    button() {
      this.tone(540, 0.07, 'triangle', 0.12, 0, 700);
    },

    drop() {
      this.tone(300, 0.16, 'triangle', 0.16, 0, 180);
      this.noise(0.12, 0.05, 900);
    },

    door() {
      this.tone(220, 0.12, 'square', 0.06, 0, 160);
      this.noise(0.08, 0.04, 700);
    },

    rustle() {
      this.noise(0.18, 0.07, 2600);
      this.noise(0.12, 0.04, 3200, 0.05);
    },

    lick() {
      this.tone(420, 0.14, 'sine', 0.12, 0, 560);
      this.tone(320, 0.1, 'sine', 0.07, 0.06, 420);
    },

    happy() {
      [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.1, i * 0.08));
    },

    bite() {
      this.noise(0.1, 0.16, 2200);
      this.tone(240, 0.1, 'square', 0.09, 0, 140);
    },

    ouch() {
      this.tone(400, 0.28, 'sine', 0.13, 0, 240);
      this.tone(300, 0.22, 'triangle', 0.09, 0.05, 200);
    },

    sparkle() {
      [1046.5, 1318.5, 1568].forEach((f, i) => this.tone(f, 0.18, 'sine', 0.08, i * 0.07));
    },

    pop() {
      this.tone(600, 0.06, 'sine', 0.1, 0, 900);
      this.noise(0.06, 0.04, 1800);
    },

    brush() {
      this.noise(0.14, 0.06, 2000);
    },

    win() {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.12, i * 0.12));
    },
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function roundRectPath(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
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
      const rad = i % 2 === 0 ? r : r * 0.46;
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
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(-s, -s * 0.5, -s * 0.5, -s * 1.1, 0, -s * 0.4);
    ctx.bezierCurveTo(s * 0.5, -s * 1.1, s, -s * 0.5, 0, s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function burst(x, y, count, kind, colors, opts) {
    const o = opts || {};
    for (let i = 0; i < count; i += 1) {
      const ang = rand(0, Math.PI * 2);
      const sp = rand(o.minSpeed || 40, o.maxSpeed || 180);
      const maxLife = o.maxLife || 1;
      G.particles.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - (o.up || 40),
        g: o.g !== undefined ? o.g : 320,
        life: rand(o.minLife || 0.45, maxLife),
        max: maxLife,
        size: rand(o.minSize || 4, o.maxSize || 8),
        color: colors[Math.floor(rand(0, colors.length))],
        kind,
        rot: rand(0, Math.PI * 2),
        vr: rand(-6, 6),
      });
    }
  }

  function floatText(x, y, text, color, size) {
    G.floats.push({ x, y, text, color, life: 1, max: 1, size: size || 0 });
  }

  function spawnRing(x, y, maxR, color, width, life) {
    const l = life || 0.6;
    G.rings.push({ x, y, r: 6, maxR, life: l, max: l, color, width: width || 3 });
  }

  function confetti() {
    const colors = ['#ff6b8a', '#ffd23f', '#5fd6c0', '#b58cff', '#ff8fc4', '#ffffff'];
    for (let i = 0; i < 40; i += 1) {
      G.particles.push({
        x: rand(0, G.W),
        y: rand(-30, -4),
        vx: rand(-30, 30),
        vy: rand(40, 110),
        g: 60,
        life: rand(1.4, 2.4),
        max: 2.4,
        size: rand(5, 9),
        color: colors[Math.floor(rand(0, colors.length))],
        kind: 'confetti',
        rot: rand(0, Math.PI * 2),
        vr: rand(-4, 4),
      });
    }
  }

  function layout() {
    const W = G.W;
    const H = G.H;

    G.face.r = clamp(Math.min(W, H) * 0.24, 82, 130);
    G.face.cx = W / 2;
    G.face.cy = H * 0.34;

    const M = G.machine;
    M.w = clamp(W * 0.92, 300, 430);
    M.h = clamp(H * 0.72, 440, 620);
    M.x = (W - M.w) / 2;
    M.y = clamp(H * 0.05, 6, 22);

    G.slotPos.x = M.x + M.w * 0.82;
    G.slotPos.y = M.y + M.h * 0.13;

    G.coin.r = clamp(W * 0.085, 24, 34);
    G.coin.x = W / 2;
    G.coin.y = M.y + M.h + G.coin.r + 18;

    const cols = 4;
    const rows = 3;
    const bx = M.x + M.w * 0.13;
    const by = M.y + M.h * 0.47;
    const bw = M.w * 0.74;
    const bh = M.h * 0.34;
    G.btnPos = [];
    G.candyCell = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const idx = r * cols + c;
        const cx = bx + bw * ((c + 0.5) / cols);
        const cy = by + bh * ((r + 0.5) / rows);
        const br = clamp(M.w * 0.052, 17, 26);
        G.btnPos.push({ x: cx, y: cy, r: br });
        const glassY = M.y + M.h * 0.16;
        const glassH = M.h * 0.24;
        const gx = M.x + M.w * 0.5 + (c - 1.5) * (M.w * 0.2);
        const gy = glassY + glassH * 0.22 + r * (glassH * 0.34);
        const gr = clamp(M.w * 0.05, 13, 20);
        G.candyCell.push({ x: gx, y: gy, r: gr });
      }
    }

    G.trayPos.w = M.w * 0.4;
    G.trayPos.h = M.h * 0.13;
    G.trayPos.x = M.x + (M.w - G.trayPos.w) / 2;
    G.trayPos.y = M.y + M.h - G.trayPos.h - M.h * 0.015;

    G.eatBtn.lick.x = W * 0.28;
    G.eatBtn.lick.y = H * 0.84;
    G.eatBtn.lick.r = clamp(W * 0.13, 44, 56);
    G.eatBtn.bite.x = W * 0.72;
    G.eatBtn.bite.y = H * 0.84;
    G.eatBtn.bite.r = clamp(W * 0.13, 44, 56);

    G.choiceBtn.more.x = W * 0.3;
    G.choiceBtn.more.y = H * 0.84;
    G.choiceBtn.more.r = clamp(W * 0.15, 52, 64);
    G.choiceBtn.brush.x = W * 0.7;
    G.choiceBtn.brush.y = H * 0.84;
    G.choiceBtn.brush.r = clamp(W * 0.15, 52, 64);

    G.mouth.w = G.face.r * 0.9;
    G.mouth.h = G.face.r * 0.6;
    G.mouth.x = G.face.cx;
    G.mouth.y = G.face.cy + G.face.r * 0.34;

    G.brush.homeX = W / 2;
    G.brush.homeY = H * 0.84;
    if (!G.brush.grabbed) {
      G.brush.x = G.brush.homeX;
      G.brush.y = G.brush.homeY;
    }

    G.teeth = [];
    const spots = 12;
    const tw = G.mouth.w * 0.86;
    const tx0 = G.mouth.x - tw / 2;
    const ty = G.mouth.y - G.mouth.h * 0.18;
    for (let i = 0; i < spots; i += 1) {
      const x = tx0 + tw * ((i + 0.5) / spots);
      G.teeth.push({ x, y: ty });
    }
  }

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
    layout();
  }

  function toStage(e) {
    const rect = els.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function inCircle(p, c, pad) {
    return Math.hypot(p.x - c.x, p.y - c.y) <= c.r + (pad || 0);
  }

  function goMachine() {
    G.phase = 'machine';
    G.ready = false;
    G.selected = -1;
    G.coin.inserted = false;
    G.coin.fly = 0;
    G.drop.active = false;
    G.tray.candy = -1;
    G.tray.door = 0;
    G.tray.open = false;
    G.tray.flash = 0;
    G.tray.shake = 0;
    G.current = -1;
    G.remaining = 1;
    G.biteHurt = false;
    G.biteCrack = false;
    G.unwrap = 0;
    G.wrapperFly = 0;
    G.toEatTimer = 0;
    G.hintTimer = 0;
    layout();
  }

  function goUnwrap(idx) {
    G.phase = 'unwrap';
    G.current = idx;
    G.unwrap = 0;
    G.wrapperFly = 0;
    G.toEatTimer = 0;
  }

  function goEat() {
    G.phase = 'eat';
    G.remaining = 1;
    G.biteHurt = false;
    G.biteCrack = false;
    G.boy.mood = 'neutral';
  }

  function goChoice() {
    G.phase = 'choice';
    G.boy.mood = G.mutans >= 6 ? 'puffy' : 'neutral';
    G.boy.puff = clamp(G.mutans / 12, 0, 1);
  }

  function goBrush() {
    G.phase = 'brush';
    G.boy.mood = 'open';
    G.boy.puff = clamp(G.mutans / 12, 0, 1);
    G.brush.progress = 0;
    G.brush.x = G.brush.homeX;
    G.brush.y = G.brush.homeY;
  }

  function addBacteria(n) {
    G.mutans = Math.min(12, G.mutans + n);
  }

  function doLick() {
    if (G.phase !== 'eat' || G.remaining <= 0) return;
    Sound.lick();
    G.remaining -= 0.34;
    if (G.remaining < 0.02) G.remaining = 0;
    G.boy.mood = 'happy';
    const candy = CANDIES[G.current];
    const mx = G.face.cx;
    const my = G.face.cy + G.face.r * 0.55;
    if (G.remaining > 0) {
      addBacteria(1);
      floatText(mx + 30, my - 26, '쪽쪽~', '#d6336c', clamp(G.W * 0.055, 17, 25));
      burst(mx, my, 5, 'heart', ['#ff8fc4', '#ffb3d6', '#ffffff'], {
        minSpeed: 20, maxSpeed: 80, up: 60, g: -20, minLife: 0.6, maxLife: 1.1, minSize: 5, maxSize: 9,
      });
    } else {
      addBacteria(1);
      Sound.happy();
      floatText(mx + 30, my - 30, '꿀꺽! 달콤해~', '#e8590c', clamp(G.W * 0.06, 18, 26));
      burst(mx, my, 8, 'sparkle', ['#fff3bf', '#ffffff', '#ffe066'], {
        minSpeed: 40, maxSpeed: 140, up: 60, g: 160, minLife: 0.4, maxLife: 0.9, minSize: 3, maxSize: 6,
      });
      window.setTimeout(() => goChoice(), 900);
    }
  }

  function doBite() {
    if (G.phase !== 'eat' || G.remaining <= 0) return;
    Sound.bite();
    window.setTimeout(() => Sound.ouch(), 140);
    G.remaining = 0;
    G.biteCrack = true;
    G.biteHurt = true;
    G.boy.mood = 'wince';
    G.boy.bandaid = true;
    addBacteria(3);
    const candy = CANDIES[G.current];
    const mx = G.face.cx;
    const my = G.face.cy + G.face.r * 0.55;
    floatText(mx + 34, my - 30, '앗! 아야~', '#e63e3e', clamp(G.W * 0.06, 18, 26));
    floatText(mx, my + 46, '쪽쪽 녹여 먹자~', '#7a4a3a', clamp(G.W * 0.05, 16, 22));
    spawnRing(mx, my, clamp(G.W * 0.12, 34, 56), 'rgba(255,150,150,0.7)', 3, 0.5);
    window.setTimeout(() => goChoice(), 1400);
  }

  function finishBrush() {
    Sound.win();
    G.sparkle = 1.2;
    G.boy.mood = 'happy';
    G.boy.bandaid = false;
    G.boy.puff = 0;
    confetti();
    window.setTimeout(() => {
      els.ending.classList.add('is-on');
    }, 900);
  }

  function scrubBrush() {
    const headX = G.brush.x;
    const headY = G.brush.y - 26;
    const inMouth = Math.hypot(headX - G.mouth.x, headY - G.mouth.y) < G.mouth.w * 0.55;
    if (!inMouth) return;
    Sound.brush();
    G.brush.progress += 1;
    burst(headX, headY, 3, 'bubble', ['#d7b7ff', '#ffffff', '#c9b3f5'], {
      minSpeed: 20, maxSpeed: 70, up: 40, g: -30, minLife: 0.3, maxLife: 0.6, minSize: 2, maxSize: 5,
    });
    if (G.brush.progress % 2 === 0 && G.mutans > 0) {
      G.mutans -= 1;
      Sound.pop();
      const t = G.teeth[G.mutans];
      if (t) {
        burst(t.x, t.y, 6, 'sparkle', ['#ffffff', '#fff3bf', '#d7b7ff'], {
          minSpeed: 30, maxSpeed: 110, up: 40, g: 160, minLife: 0.3, maxLife: 0.7, minSize: 3, maxSize: 6,
        });
      }
      if (G.mutans === 0) finishBrush();
    }
  }

  function onPointerDown(e) {
    if (G.state !== 'play') return;
    e.preventDefault();
    Sound.unlock();
    const p = toStage(e);

    if (G.phase === 'machine') {
      if (!G.coin.inserted && inCircle(p, G.coin, 14)) {
        G.coin.inserted = true;
        G.coin.fly = 0;
        Sound.coin();
        spawnRing(G.slotPos.x, G.slotPos.y, 40, 'rgba(255,210,63,0.7)', 4, 0.5);
        window.setTimeout(() => { G.ready = true; }, 320);
        return;
      }
      if (G.ready && G.drop.active === false) {
        for (let i = 0; i < G.btnPos.length; i += 1) {
          if (inCircle(p, G.btnPos[i], 8)) {
            // 트레이에 사탕이 있으면 재선택 잠금 — 트레이 사탕만 살짝 흔들림
            if (G.tray.candy >= 0) {
              G.tray.shake = 1;
              return;
            }
            G.selected = i;
            Sound.button();
            G.drop.active = true;
            G.drop.t = 0;
            G.drop.from = { x: G.candyCell[i].x, y: G.candyCell[i].y };
            G.drop.to = { x: G.trayPos.x + G.trayPos.w / 2, y: G.trayPos.y + G.trayPos.h * 0.45 };
            Sound.drop();
            return;
          }
        }
      }
      if (G.tray.candy >= 0) {
        const take = { x: G.trayPos.x + G.trayPos.w / 2, y: G.trayPos.y + G.trayPos.h * 0.45, r: G.trayPos.h * 0.6 };
        if (!G.tray.open) {
          if (Math.abs(p.x - G.trayPos.x - G.trayPos.w / 2) < G.trayPos.w * 0.5 && Math.abs(p.y - G.trayPos.y) < G.trayPos.h) {
            G.tray.open = true;
            G.tray.door = 1;
            Sound.door();
            return;
          }
        } else if (inCircle(p, take, 20)) {
          goUnwrap(G.tray.candy);
          Sound.rustle();
          return;
        }
      }
      return;
    }

    if (G.phase === 'unwrap') {
      if (G.unwrap < 3) {
        G.unwrap += 1;
        Sound.rustle();
        const candy = CANDIES[G.current];
        const cxp = G.W / 2;
        const cyp = G.H * 0.44;
        burst(cxp, cyp, 4, 'sparkle', [candy.wrap, '#ffffff'], {
          minSpeed: 30, maxSpeed: 100, up: 40, g: 140, minLife: 0.3, maxLife: 0.6, minSize: 3, maxSize: 6,
        });
        if (G.unwrap >= 3) {
          G.wrapperFly = 1;
          Sound.happy();
          floatText(cxp, cyp - 60, '쏙!', '#7a4a3a', clamp(G.W * 0.07, 20, 30));
          burst(cxp, cyp, 8, 'wrapper', [candy.wrap, candy.color2], {
            minSpeed: 60, maxSpeed: 180, up: 70, g: 220, minLife: 0.6, maxLife: 1.1, minSize: 5, maxSize: 9,
          });
          window.setTimeout(() => goEat(), 900);
        }
      }
      return;
    }

    if (G.phase === 'eat') {
      if (inCircle(p, G.eatBtn.lick, 8)) doLick();
      else if (inCircle(p, G.eatBtn.bite, 8)) doBite();
      return;
    }

    if (G.phase === 'choice') {
      if (inCircle(p, G.choiceBtn.more, 8)) {
        Sound.button();
        goMachine();
        return;
      }
      if (inCircle(p, G.choiceBtn.brush, 8)) {
        Sound.button();
        goBrush();
        return;
      }
      return;
    }

    if (G.phase === 'brush') {
      if (Math.hypot(p.x - G.brush.x, p.y - G.brush.y) < 70) {
        G.brush.grabbed = true;
        G.brush.x = p.x;
        G.brush.y = p.y;
      }
      return;
    }
  }

  function onPointerMove(e) {
    if (G.state !== 'play') return;
    if (G.phase === 'brush' && G.brush.grabbed) {
      const p = toStage(e);
      const prevX = G.brush.x;
      const prevY = G.brush.y;
      G.brush.x = p.x;
      G.brush.y = clamp(p.y, G.face.cy, G.H - 40);
      const moved = Math.hypot(G.brush.x - prevX, G.brush.y - prevY);
      if (moved > 14) scrubBrush();
    }
  }

  function onPointerUp() {
    G.brush.grabbed = false;
  }

  function drawBackground() {
    const ctx = G.ctx;
    const W = G.W;
    const H = G.H;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#fff2ec');
    bg.addColorStop(0.6, '#fff6f1');
    bg.addColorStop(1, '#ffeef5');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 6; i += 1) {
      const x = (i * 173) % W;
      const y = (i * 97) % H;
      ctx.beginPath();
      ctx.arc(x, y, 4 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCoin(ctx) {
    const c = G.coin;
    let cx = c.x;
    let cy = c.y;
    let s = 1;
    if (c.inserted) {
      const k = clamp(c.fly, 0, 1);
      cx = lerp(c.x, G.slotPos.x, k);
      cy = lerp(c.y, G.slotPos.y, k);
      s = 1 - k * 0.7;
    } else if (!REDUCED) {
      cy += Math.sin(G.time * 3) * 4;
    }
    if (c.inserted && c.fly < 1) {
      // flown fully, hide
    }
    if (c.inserted && c.fly >= 1) return;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.fillStyle = '#e8a800';
    ctx.beginPath();
    ctx.arc(0, 0, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(0, 0, c.r - 4, 0, Math.PI * 2);
    ctx.fill();
    drawStar(ctx, 0, 0, c.r * 0.5, '#fff2b0');
    ctx.strokeStyle = '#e8a800';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, c.r - 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(-c.r * 0.3, -c.r * 0.32, c.r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCandyShape(ctx, x, y, r, candy, remaining, crack) {
    ctx.save();
    ctx.translate(x, y);
    const rr = r * (0.45 + 0.55 * clamp(remaining, 0, 1));
    if (remaining > 0) {
      if (candy.type === 'lollipop') {
        ctx.strokeStyle = '#f7f3e8';
        ctx.lineWidth = rr * 0.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, rr * 0.2);
        ctx.lineTo(0, rr * 1.5);
        ctx.stroke();
        ctx.fillStyle = candy.color;
        ctx.beginPath();
        ctx.arc(0, 0, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = candy.color2;
        ctx.lineWidth = rr * 0.28;
        ctx.beginPath();
        ctx.arc(0, 0, rr * 0.55, 0, Math.PI * 1.6);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.arc(-rr * 0.3, -rr * 0.32, rr * 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (candy.type === 'star') {
        drawStar(ctx, 0, 0, rr, candy.color);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(-rr * 0.25, -rr * 0.3, rr * 0.18, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = candy.color;
        ctx.beginPath();
        ctx.arc(0, 0, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = candy.color2;
        ctx.lineWidth = rr * 0.22;
        ctx.beginPath();
        ctx.arc(0, 0, rr * 0.4, 0.4, 2.6);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.arc(-rr * 0.32, -rr * 0.32, rr * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (crack) {
      ctx.strokeStyle = '#4a3a2b';
      ctx.lineWidth = Math.max(2, rr * 0.12);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-rr * 0.6, -rr * 0.3);
      ctx.lineTo(-rr * 0.15, 0);
      ctx.lineTo(-rr * 0.4, rr * 0.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rr * 0.1, -rr * 0.2);
      ctx.lineTo(rr * 0.4, rr * 0.1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWrapper(ctx, x, y, r, candy, peel) {
    const p = clamp(peel, 0, 1);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.1 + p * 0.4);
    ctx.translate(0, -p * 8);
    ctx.fillStyle = candy.wrap;
    roundRectPath(ctx, -r * 0.85, -r * 0.9, r * 1.7, r * 1.8, r * 0.3);
    ctx.fill();
    ctx.fillStyle = candy.color2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = candy.wrap;
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, -r * 0.5);
    ctx.lineTo(-r * 1.4, -r * 0.9);
    ctx.lineTo(-r * 1.4, -r * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(r * 0.85, r * 0.5);
    ctx.lineTo(r * 1.4, r * 0.9);
    ctx.lineTo(r * 1.4, r * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.5, r * 0.16, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMachine(ctx) {
    const M = G.machine;
    const x = M.x;
    const y = M.y;
    const w = M.w;
    const h = M.h;

    ctx.save();
    ctx.fillStyle = 'rgba(120,80,60,0.12)';
    roundRectPath(ctx, x + 6, y + 8, w, h, 24);
    ctx.fill();

    ctx.fillStyle = '#ff6b9d';
    roundRectPath(ctx, x, y, w, h, 24);
    ctx.fill();
    ctx.fillStyle = '#ff8fc4';
    roundRectPath(ctx, x, y, w, h - 10, 24);
    ctx.fill();

    // header light
    ctx.fillStyle = '#fff0f6';
    roundRectPath(ctx, x + w * 0.5 - w * 0.42, y + h * 0.03, w * 0.84, h * 0.1, 14);
    ctx.fill();
    ctx.fillStyle = '#c2255c';
    ctx.font = Math.round(clamp(w * 0.055, 16, 22)) + 'px "Jua", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍬 사탕 자판기', x + w * 0.5, y + h * 0.085);
    if (G.ready) {
      ctx.fillStyle = 'rgba(255,230,80,' + (0.4 + Math.sin(G.time * 5) * 0.25) + ')';
      ctx.beginPath();
      ctx.arc(x + w * 0.08, y + h * 0.085, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // coin slot
    ctx.fillStyle = '#7a4a3a';
    roundRectPath(ctx, G.slotPos.x - 22, G.slotPos.y - 12, 44, 22, 8);
    ctx.fill();
    ctx.fillStyle = '#3a2b1c';
    roundRectPath(ctx, G.slotPos.x - 3, G.slotPos.y - 9, 6, 16, 3);
    ctx.fill();

    // glass display
    const gx = x + w * 0.06;
    const gy = y + h * 0.16;
    const gw = w * 0.88;
    const gh = h * 0.25;
    ctx.fillStyle = '#e8f6ff';
    roundRectPath(ctx, gx, gy, gw, gh, 12);
    ctx.fill();
    ctx.strokeStyle = '#cbe4f5';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(gx + gw * 0.2, gy + gh * 0.2, gw * 0.16, gh * 0.5, 0.5, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < CANDIES.length; i += 1) {
      const cell = G.candyCell[i];
      if (i === G.selected && G.drop.active) continue;
      drawCandyShape(ctx, cell.x, cell.y, cell.r, CANDIES[i], 1, false);
    }

    // 진열 → 트레이 낙하 스프라이트 (이징·살짝 회전)
    if (G.drop.active && G.drop.from && G.drop.to && G.selected >= 0) {
      const dur = 0.45;
      const t = clamp(G.drop.t / dur, 0, 1);
      const ease = t * t * (3 - 2 * t);
      const dx = G.drop.from.x + (G.drop.to.x - G.drop.from.x) * ease;
      const dy = G.drop.from.y + (G.drop.to.y - G.drop.from.y) * ease;
      const cellR = G.candyCell[G.selected] ? G.candyCell[G.selected].r : 18;
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(ease * 0.55);
      drawCandyShape(ctx, 0, 0, cellR, CANDIES[G.selected], 1, false);
      ctx.restore();
    }

    // buttons
    for (let i = 0; i < G.btnPos.length; i += 1) {
      const b = G.btnPos[i];
      const candy = CANDIES[i];
      const lit = G.ready;
      const pulse = lit ? 1 + Math.sin(G.time * 4 + i) * 0.05 : 0;
      ctx.save();
      ctx.fillStyle = lit ? candy.color : '#e8b9c9';
      ctx.beginPath();
      ctx.arc(b.x, b.y + 3, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = lit ? candy.color2 : '#f3d3dd';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * pulse || b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = lit ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // dispenser tray + door
    const tx = G.trayPos.x;
    const ty = G.trayPos.y;
    const tw = G.trayPos.w;
    const th = G.trayPos.h;
    ctx.fillStyle = '#e05a8a';
    roundRectPath(ctx, tx, ty, tw, th, 14);
    ctx.fill();
    ctx.fillStyle = '#b83c6a';
    roundRectPath(ctx, tx + tw * 0.1, ty + th * 0.18, tw * 0.8, th * 0.2, 8);
    ctx.fill();

    const flash = G.tray.candy >= 0 && !G.tray.open ? 0.5 + Math.sin(G.time * 6) * 0.5 : 0;
    if (flash > 0.05) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 + flash * 0.5) + ')';
      ctx.lineWidth = 5;
      roundRectPath(ctx, tx - 4, ty - 4, tw + 8, th + 8, 16);
      ctx.stroke();
      ctx.restore();
    }

    if (G.tray.open) {
      ctx.save();
      ctx.fillStyle = '#8f5bd6';
      ctx.beginPath();
      ctx.moveTo(tx + 4, ty - 6);
      ctx.lineTo(tx + tw - 4, ty - 6);
      ctx.lineTo(tx + tw - 4, ty + th * 0.5);
      ctx.lineTo(tx + 4, ty + th * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      roundRectPath(ctx, tx + 4, ty + th * 0.5, tw - 8, th * 0.4, 6);
      ctx.fill();
      ctx.restore();
      if (G.tray.candy >= 0) {
        const shake = G.tray.shake > 0 && !REDUCED ? Math.sin(G.time * 42) * 5 * G.tray.shake : 0;
        const cx2 = tx + tw / 2 + shake;
        const cy2 = ty + th * 0.2;
        const bob = REDUCED ? 0 : Math.sin(G.time * 3) * 3;
        drawCandyShape(ctx, cx2, cy2 + bob, th * 0.42, CANDIES[G.tray.candy], 1, false);
      }
    } else if (G.tray.candy >= 0) {
      const shake = G.tray.shake > 0 && !REDUCED ? Math.sin(G.time * 42) * 5 * G.tray.shake : 0;
      const cx2 = tx + tw / 2 + shake;
      const cy2 = ty + th * 0.5;
      drawCandyShape(ctx, cx2, cy2, th * 0.3, CANDIES[G.tray.candy], 1, false);
    }
    ctx.restore();
  }

  function drawBoy(ctx) {
    const cx = G.face.cx;
    const cy = G.face.cy;
    const r = G.face.r;
    const b = G.boy;
    const puff = b.puff;
    const puffy = b.mood === 'puffy' || puff > 0.15;

    ctx.save();

    // hair back
    ctx.fillStyle = '#5b3a24';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.15, r * 1.02, Math.PI, Math.PI * 2);
    ctx.fill();

    // cheek puff (behind face, peeking sides)
    if (puffy) {
      ctx.fillStyle = '#ffd9c0';
      ctx.beginPath();
      ctx.arc(cx - r * 0.82, cy + r * 0.32, r * 0.34 * puff, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r * 0.82, cy + r * 0.32, r * 0.34 * puff, 0, Math.PI * 2);
      ctx.fill();
    }

    // face
    ctx.fillStyle = '#ffe3c8';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // hair fringe
    ctx.fillStyle = '#5b3a24';
    ctx.beginPath();
    ctx.arc(cx - r * 0.5, cy - r * 0.55, r * 0.34, Math.PI * 0.9, Math.PI * 1.9);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.5, cy - r * 0.55, r * 0.34, Math.PI * 1.1, Math.PI * 2.1);
    ctx.fill();
    ctx.fillStyle = '#6b4a2e';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.7, r * 0.42, Math.PI, Math.PI * 2);
    ctx.fill();

    // eyes
    const blink = b.blink > 0;
    const eyeY = cy - r * 0.12;
    if (blink) {
      ctx.strokeStyle = '#3a2b1c';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.45, eyeY);
      ctx.lineTo(cx - r * 0.15, eyeY);
      ctx.moveTo(cx + r * 0.15, eyeY);
      ctx.lineTo(cx + r * 0.45, eyeY);
      ctx.stroke();
    } else if (b.mood === 'happy' || b.mood === 'open') {
      ctx.strokeStyle = '#3a2b1c';
      ctx.lineWidth = 3.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx - r * 0.3, eyeY, r * 0.16, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + r * 0.3, eyeY, r * 0.16, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    } else if (b.mood === 'wince') {
      ctx.strokeStyle = '#3a2b1c';
      ctx.lineWidth = 3.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.45, eyeY + 2);
      ctx.lineTo(cx - r * 0.15, eyeY - 2);
      ctx.moveTo(cx + r * 0.15, eyeY - 2);
      ctx.lineTo(cx + r * 0.45, eyeY + 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#3a2b1c';
      ctx.beginPath();
      ctx.arc(cx - r * 0.3, eyeY, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r * 0.3, eyeY, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - r * 0.33, eyeY - r * 0.04, r * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r * 0.27, eyeY - r * 0.04, r * 0.04, 0, Math.PI * 2);
      ctx.fill();
    }

    // blush
    ctx.fillStyle = 'rgba(255,150,170,0.5)';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.52, cy + r * 0.22, r * 0.16, r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.52, cy + r * 0.22, r * 0.16, r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // nose
    ctx.fillStyle = '#f2b98c';
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.1, r * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // mouth (closed variants)
    const mouthY = cy + r * 0.34;
    if (b.mood === 'open') {
      // handled by drawMouth below
    } else if (b.mood === 'happy') {
      ctx.fillStyle = '#e0635a';
      ctx.beginPath();
      ctx.arc(cx, mouthY, r * 0.2, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.arc(cx, mouthY + r * 0.02, r * 0.1, 0, Math.PI);
      ctx.fill();
    } else if (b.mood === 'wince') {
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 3.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.2, mouthY + r * 0.05);
      ctx.quadraticCurveTo(cx, mouthY - r * 0.16, cx + r * 0.2, mouthY + r * 0.05);
      ctx.stroke();
    } else if (puffy) {
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 3.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.16, mouthY);
      ctx.quadraticCurveTo(cx, mouthY - r * 0.14, cx + r * 0.16, mouthY);
      ctx.stroke();
      ctx.fillStyle = 'rgba(90,150,220,0.35)';
      ctx.beginPath();
      ctx.arc(cx - r * 0.55, mouthY - r * 0.05, r * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r * 0.55, mouthY - r * 0.05, r * 0.05, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, mouthY - r * 0.04, r * 0.14, Math.PI * 0.12, Math.PI * 0.88);
      ctx.stroke();
    }

    // bandaid
    if (b.bandaid) {
      ctx.save();
      ctx.translate(cx + r * 0.5, cy + r * 0.22);
      ctx.rotate(-0.3);
      ctx.fillStyle = '#ffd9a0';
      roundRectPath(ctx, -r * 0.2, -r * 0.1, r * 0.4, r * 0.2, r * 0.05);
      ctx.fill();
      ctx.fillStyle = '#f8c46a';
      ctx.fillRect(-r * 0.02, -r * 0.06, r * 0.04, r * 0.12);
      ctx.fillRect(-r * 0.06, -r * 0.02, r * 0.12, r * 0.04);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawMouthWithTeeth(ctx) {
    const cx = G.mouth.x;
    const cy = G.mouth.y;
    const w = G.mouth.w;
    const h = G.mouth.h;

    ctx.save();
    ctx.fillStyle = '#c0392b';
    roundRectPath(ctx, cx - w / 2, cy - h / 2, w, h, h * 0.4);
    ctx.fill();
    ctx.fillStyle = '#8f2b1e';
    roundRectPath(ctx, cx - w / 2, cy - h / 2, w, h * 0.5, h * 0.3);
    ctx.fill();

    // tongue
    ctx.fillStyle = '#f08a7a';
    ctx.beginPath();
    ctx.ellipse(cx, cy + h * 0.3, w * 0.3, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // teeth rows
    const tw = w * 0.86;
    const tx0 = cx - tw / 2;
    const n = 6;
    const cell = tw / n;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < n; i += 1) {
      const x = tx0 + cell * i;
      roundRectPath(ctx, x + cell * 0.08, cy - h * 0.5 + 2, cell * 0.84, h * 0.36, cell * 0.3);
      ctx.fill();
      roundRectPath(ctx, x + cell * 0.08, cy + h * 0.14, cell * 0.84, h * 0.32, cell * 0.3);
      ctx.fill();
    }
    ctx.strokeStyle = '#d8e2ee';
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= n; i += 1) {
      const x = tx0 + cell * i;
      ctx.beginPath();
      ctx.moveTo(x, cy - h * 0.5 + 2);
      ctx.lineTo(x, cy - h * 0.14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, cy + h * 0.14);
      ctx.lineTo(x, cy + h * 0.46);
      ctx.stroke();
    }

    if (G.mutans > 0) {
      for (let i = 0; i < G.mutans; i += 1) {
        const t = G.teeth[i];
        if (!t) continue;
        drawMutans(ctx, t.x, t.y - h * 0.16, w * 0.06);
      }
    }
    ctx.restore();
  }

  function drawMutans(ctx, x, y, s) {
    const wob = REDUCED ? 0 : Math.sin(G.time * 6 + x) * 1.5;
    ctx.save();
    ctx.translate(x, y + wob);
    ctx.fillStyle = '#b07cf0';
    ctx.beginPath();
    ctx.arc(0, 0, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8f5bd6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -s * 0.6);
    ctx.lineTo(-s * 0.6, -s * 1.1);
    ctx.moveTo(s * 0.4, -s * 0.6);
    ctx.lineTo(s * 0.6, -s * 1.1);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-s * 0.32, -s * 0.1, s * 0.24, 0, Math.PI * 2);
    ctx.arc(s * 0.32, -s * 0.1, s * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2b1c';
    ctx.beginPath();
    ctx.arc(-s * 0.32, -s * 0.08, s * 0.12, 0, Math.PI * 2);
    ctx.arc(s * 0.32, -s * 0.08, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8f5bd6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, s * 0.4, s * 0.5, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.restore();
  }

  function drawBrush(ctx) {
    const b = G.brush;
    const ang = b.grabbed ? 0 : Math.sin(G.time * 2) * 0.12;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(ang);
    ctx.strokeStyle = '#ff8fc4';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -70);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    roundRectPath(ctx, -16, -104, 32, 40, 10);
    ctx.fill();
    ctx.fillStyle = '#7a4a3a';
    for (let i = 0; i < 4; i += 1) {
      roundRectPath(ctx, -14 + i * 8, -100, 5, 26, 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBigButton(ctx, x, y, r, color, color2, emoji, label) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y + 4, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r - 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = Math.round(r * 0.6) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x, y - r * 0.08);
    ctx.font = 'bold ' + Math.round(r * 0.32) + 'px "Jua", "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x, y + r * 0.52);
    ctx.restore();
  }

  function drawMachineHint(ctx) {
    if (!G.coin.inserted) {
      const bob = REDUCED ? 0 : Math.sin(G.time * 3.2) * 5;
      ctx.save();
      ctx.globalAlpha = 0.75 + Math.sin(G.time * 2) * 0.2;
      ctx.font = Math.round(clamp(G.W * 0.09, 28, 40)) + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👆', G.coin.x, G.coin.y - G.coin.r - 22 + bob);
      ctx.restore();
      return;
    }
    if (G.ready && !G.drop.active && G.tray.candy < 0) {
      const bob = REDUCED ? 0 : Math.sin(G.time * 3) * 4;
      ctx.save();
      ctx.globalAlpha = 0.7 + Math.sin(G.time * 3) * 0.25;
      ctx.font = Math.round(clamp(G.W * 0.055, 16, 22)) + 'px "Jua", "Malgun Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#c2255c';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      const msg = '사탕 버튼을 눌러봐!';
      ctx.strokeText(msg, G.W / 2, G.machine.y + G.machine.h - 44 + bob);
      ctx.fillText(msg, G.W / 2, G.machine.y + G.machine.h - 44 + bob);
      ctx.restore();
    }
    if (G.tray.candy >= 0 && !G.tray.open) {
      const bob = REDUCED ? 0 : Math.sin(G.time * 3) * 4;
      ctx.save();
      ctx.globalAlpha = 0.75 + Math.sin(G.time * 3) * 0.2;
      ctx.font = Math.round(clamp(G.W * 0.05, 15, 20)) + 'px "Jua", "Malgun Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#c2255c';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      const msg = '문을 톡! 열어봐';
      ctx.strokeText(msg, G.trayPos.x + G.trayPos.w / 2, G.trayPos.y - 20 + bob);
      ctx.fillText(msg, G.trayPos.x + G.trayPos.w / 2, G.trayPos.y - 20 + bob);
      ctx.restore();
    }
    if (G.tray.open && G.tray.candy >= 0) {
      const bob = REDUCED ? 0 : Math.sin(G.time * 3) * 4;
      ctx.save();
      ctx.globalAlpha = 0.75 + Math.sin(G.time * 3) * 0.2;
      ctx.font = Math.round(clamp(G.W * 0.05, 15, 20)) + 'px "Jua", "Malgun Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#7a4a3a';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      const msg = '사탕을 꺼내자!';
      ctx.strokeText(msg, G.trayPos.x + G.trayPos.w / 2, G.trayPos.y - 26 + bob);
      ctx.fillText(msg, G.trayPos.x + G.trayPos.w / 2, G.trayPos.y - 26 + bob);
      ctx.restore();
    }
  }

  function drawParticles(ctx) {
    for (let i = 0; i < G.particles.length; i += 1) {
      const p = G.particles[i];
      const k = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = k;
      if (p.kind === 'heart') {
        drawHeart(ctx, p.x, p.y, p.size, p.color);
      } else if (p.kind === 'sparkle') {
        drawStar(ctx, p.x, p.y, p.size * (0.4 + k * 0.6), p.color);
      } else if (p.kind === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.62);
        ctx.restore();
      } else if (p.kind === 'wrapper') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
        ctx.restore();
      } else if (p.kind === 'bubble') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * k, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.4, p.size * k), 0, Math.PI * 2);
        ctx.fill();
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
      const k = clamp(f.life / f.max, 0, 1);
      ctx.globalAlpha = k;
      const size = f.size || clamp(G.W * 0.055, 18, 28);
      ctx.font = 'bold ' + Math.round(size) + 'px "Jua", "Malgun Gothic", sans-serif';
      ctx.lineWidth = Math.max(4, size * 0.24);
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawRings(ctx) {
    for (let i = 0; i < G.rings.length; i += 1) {
      const r = G.rings[i];
      const k = clamp(r.life / r.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = k;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function update(dt) {
    G.time += dt;

    if (G.phase === 'machine') {
      if (G.coin.inserted && G.coin.fly < 1) {
        G.coin.fly = Math.min(1, G.coin.fly + dt * 3);
      }
      if (G.drop.active) {
        G.drop.t += dt;
        if (G.drop.t >= 0.45) {
          G.drop.active = false;
          G.tray.candy = G.selected;
          G.tray.flash = 1;
        }
      }
      if (G.tray.flash > 0) G.tray.flash = Math.max(0, G.tray.flash - dt);
      if (G.tray.door > 0) G.tray.door = Math.max(0, G.tray.door - dt * 3);
      if (G.tray.shake > 0) G.tray.shake = Math.max(0, G.tray.shake - dt * 2.4);
    }

    if (G.phase === 'unwrap') {
      if (G.wrapperFly > 0) G.wrapperFly = Math.max(0, G.wrapperFly - dt * 2);
    }

    if (G.phase === 'eat' || G.phase === 'choice' || G.phase === 'brush') {
      G.boy.blink = Math.max(0, G.boy.blink - dt);
      if (G.boy.blink <= 0 && Math.random() < 0.003) G.boy.blink = 0.14;
    }

    if (G.sparkle > 0) G.sparkle = Math.max(0, G.sparkle - dt);

    for (let i = G.particles.length - 1; i >= 0; i -= 1) {
      const p = G.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        G.particles.splice(i, 1);
        continue;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.995;
      p.rot += p.vr * dt;
    }
    for (let i = G.floats.length - 1; i >= 0; i -= 1) {
      const f = G.floats[i];
      f.life -= dt;
      f.y -= 34 * dt;
      if (f.life <= 0) G.floats.splice(i, 1);
    }
    for (let i = G.rings.length - 1; i >= 0; i -= 1) {
      const r = G.rings[i];
      r.life -= dt;
      if (r.life <= 0) {
        G.rings.splice(i, 1);
        continue;
      }
      const k = 1 - r.life / r.max;
      r.r = 6 + (r.maxR - 6) * easeOutCubic(k);
    }
  }

  function render() {
    const ctx = G.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, G.W, G.H);
    drawBackground();

    if (G.phase === 'machine') {
      drawMachine(ctx);
      drawCoin(ctx);
      drawMachineHint(ctx);
    } else if (G.phase === 'unwrap') {
      const candy = CANDIES[G.current];
      const cxp = G.W / 2;
      const cyp = G.H * 0.44;
      const r = clamp(G.W * 0.2, 46, 74);
      if (G.wrapperFly <= 0) {
        drawWrapper(ctx, cxp, cyp, r, candy, G.unwrap / 3);
      }
      if (G.unwrap >= 3 || G.wrapperFly > 0) {
        drawCandyShape(ctx, cxp, cyp, r, candy, 1, false);
      }
      if (G.unwrap < 3) {
        const bob = REDUCED ? 0 : Math.sin(G.time * 3) * 5;
        ctx.save();
        ctx.globalAlpha = 0.7 + Math.sin(G.time * 3) * 0.25;
        ctx.font = Math.round(clamp(G.W * 0.06, 18, 26)) + 'px "Jua", "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#7a4a3a';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeText('포장지를 벗겨봐!', cxp, cyp + r * 2 + 8);
        ctx.fillText('포장지를 벗겨봐!', cxp, cyp + r * 2 + 8);
        ctx.restore();
      }
    } else if (G.phase === 'eat') {
      drawBoy(ctx);
      const candy = CANDIES[G.current];
      const cxp = G.face.cx;
      const cyp = G.face.cy + G.face.r * 0.78;
      const r = clamp(G.face.r * 0.42, 30, 50);
      if (G.remaining > 0) drawCandyShape(ctx, cxp, cyp, r, candy, G.remaining, G.biteCrack);
      drawBigButton(ctx, G.eatBtn.lick.x, G.eatBtn.lick.y, G.eatBtn.lick.r, '#5fd6c0', '#8fe6d6', '👅', '쪽쪽');
      drawBigButton(ctx, G.eatBtn.bite.x, G.eatBtn.bite.y, G.eatBtn.bite.r, '#ff9a3d', '#ffc08a', '🦷', '아작');
      if (!G.biteHurt) {
        const bob = REDUCED ? 0 : Math.sin(G.time * 3) * 5;
        ctx.save();
        ctx.globalAlpha = 0.7 + Math.sin(G.time * 3) * 0.25;
        ctx.font = Math.round(clamp(G.W * 0.055, 16, 22)) + 'px "Jua", "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#7a4a3a';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeText('쪽쪽 녹여 먹어보자!', G.W / 2, G.face.cy - G.face.r - 14 + bob);
        ctx.fillText('쪽쪽 녹여 먹어보자!', G.W / 2, G.face.cy - G.face.r - 14 + bob);
        ctx.restore();
      }
    } else if (G.phase === 'choice') {
      drawBoy(ctx);
      drawMouthWithTeeth(ctx);
      const more = G.choiceBtn.more;
      const brush = G.choiceBtn.brush;
      drawBigButton(ctx, more.x, more.y, more.r, '#ff8fc4', '#ffb3d6', '🍬', '또 먹기');
      drawBigButton(ctx, brush.x, brush.y, brush.r, '#5b9cf0', '#8fbef5', '🪥', '치카치카');
      if (G.mutans >= 6) {
        const bob = REDUCED ? 0 : Math.sin(G.time * 3) * 4;
        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.font = Math.round(clamp(G.W * 0.05, 15, 20)) + 'px "Jua", "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#c2255c';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        const msg = '이가 아야아야~ 치카치카 해줘!';
        ctx.strokeText(msg, G.W / 2, G.face.cy - G.face.r - 12 + bob);
        ctx.fillText(msg, G.W / 2, G.face.cy - G.face.r - 12 + bob);
        ctx.restore();
      }
    } else if (G.phase === 'brush') {
      drawBoy(ctx);
      drawMouthWithTeeth(ctx);
      drawBrush(ctx);
      if (G.mutans === 0) {
        const bob = REDUCED ? 0 : Math.sin(G.time * 3) * 4;
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.font = Math.round(clamp(G.W * 0.065, 19, 28)) + 'px "Jua", "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#2f9e44';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        const msg = '치링~ 반짝반짝!';
        ctx.strokeText(msg, G.W / 2, G.face.cy - G.face.r - 14 + bob);
        ctx.fillText(msg, G.W / 2, G.face.cy - G.face.r - 14 + bob);
        ctx.restore();
      } else {
        const bob = REDUCED ? 0 : Math.sin(G.time * 3) * 4;
        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.font = Math.round(clamp(G.W * 0.05, 15, 20)) + 'px "Jua", "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#7a4a3a';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        const msg = '칫솔로 슥삭슥삭!';
        ctx.strokeText(msg, G.W / 2, G.face.cy - G.face.r - 14 + bob);
        ctx.fillText(msg, G.W / 2, G.face.cy - G.face.r - 14 + bob);
        ctx.restore();
      }
    }

    drawParticles(ctx);
    drawRings(ctx);
    drawFloats(ctx);
  }

  function loop(ts) {
    requestAnimationFrame(loop);
    const dt = G.lastT ? Math.min(0.033, (ts - G.lastT) / 1000) : 0.016;
    G.lastT = ts;
    update(dt);
    render();
  }

  function bindUI() {
    els.canvas.addEventListener('pointerdown', onPointerDown);
    els.canvas.addEventListener('pointermove', onPointerMove);
    els.canvas.addEventListener('pointerup', onPointerUp);
    els.canvas.addEventListener('pointercancel', onPointerUp);
    els.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('pointerdown', () => Sound.unlock(), { passive: true });

    els.sound.addEventListener('click', () => {
      Sound.unlock();
      Sound.muted = !Sound.muted;
      els.sound.textContent = Sound.muted ? '🔇' : '🔊';
      if (!Sound.muted) Sound.tone(660, 0.07, 'sine', 0.08);
    });

    els.reset.addEventListener('click', () => {
      Sound.unlock();
      els.ending.classList.remove('is-on');
      G.mutans = 0;
      G.boy.bandaid = false;
      G.boy.puff = 0;
      G.boy.mood = 'neutral';
      goMachine();
    });

    els.again.addEventListener('click', () => {
      Sound.unlock();
      els.ending.classList.remove('is-on');
      G.mutans = 0;
      G.boy.bandaid = false;
      G.boy.puff = 0;
      G.boy.mood = 'neutral';
      goMachine();
    });

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => window.setTimeout(resize, 120));
  }

  function init() {
    bindUI();
    resize();
    requestAnimationFrame(loop);
  }

  init();
})();
