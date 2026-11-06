(() => {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STORAGE_KEY = 'music-garden-v1';

  const NOTES = [
    { freq: 523.25, petal: '#ff9db3', petal2: '#ffc2d1', center: '#ffd43b', stem: '#4f9e48', leaf: '#6cc25f' },
    { freq: 587.33, petal: '#ffb38a', petal2: '#ffd0b8', center: '#ffd43b', stem: '#58a54c', leaf: '#77c968' },
    { freq: 659.25, petal: '#ffe066', petal2: '#fff0a8', center: '#ffb347', stem: '#4a9844', leaf: '#65bb58' },
    { freq: 783.99, petal: '#8fe3b8', petal2: '#c5f5d9', center: '#ffd43b', stem: '#55a44b', leaf: '#73c465' },
    { freq: 880.0, petal: '#b8a6ff', petal2: '#dcd4ff', center: '#ffd43b', stem: '#4c9a46', leaf: '#69bd5d' },
  ];

  const els = {
    canvas: document.getElementById('gameCanvas'),
    stage: document.getElementById('stage'),
    sound: document.getElementById('btnSound'),
    reset: document.getElementById('btnReset'),
    ending: document.getElementById('endingOverlay'),
    again: document.getElementById('btnAgain'),
    play: document.getElementById('btnPlay'),
  };

  const G = {
    state: 'play',
    W: 0,
    H: 0,
    dpr: 1,
    ctx: null,
    bg: null,
    groundY: 0,
    maxH: 0,
    cloudY: 0,
    plants: [],
    clouds: [],
    drops: [],
    particles: [],
    floats: [],
    rings: [],
    time: 0,
    lastT: 0,
    winTimer: 0,
    celebrated: false,
    hintDone: false,
    playedFlower: false,
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
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      }
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
      for (let i = 0; i < length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      }
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

    note(freq, vol) {
      const v = vol || 0.2;
      this.tone(freq, 0.55, 'triangle', v);
      this.tone(freq * 2, 0.3, 'sine', v * 0.32, 0.02);
      this.tone(freq * 3, 0.18, 'sine', v * 0.1, 0.04);
    },

    plink(freq) {
      this.tone(freq * 2, 0.1, 'sine', 0.05, 0, freq * 1.4);
    },

    rain() {
      this.noise(0.5, 0.08, 2600);
      for (let i = 0; i < 5; i += 1) {
        this.tone(1500 + Math.random() * 700, 0.06, 'sine', 0.025, i * 0.07);
      }
    },

    sprout() {
      this.tone(420, 0.16, 'sine', 0.15, 0, 760);
    },

    stem() {
      this.tone(480, 0.16, 'triangle', 0.12, 0, 660);
      this.noise(0.14, 0.04, 1300);
    },

    bud() {
      this.tone(610, 0.14, 'triangle', 0.11, 0, 760);
    },

    bloom(freq) {
      this.tone(freq * 0.5, 0.4, 'sine', 0.1);
      [1, 1.25, 1.5].forEach((m, i) => {
        this.tone(freq * m, 0.4, 'triangle', 0.11, i * 0.08);
      });
      this.noise(0.24, 0.04, 3000);
    },

    win() {
      [523.25, 587.33, 659.25, 783.99, 880, 1046.5].forEach((f, i) => {
        this.tone(f, 0.32, 'triangle', 0.14, i * 0.14);
      });
    },

    tap() {
      this.tone(660, 0.07, 'sine', 0.08);
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

  function drawNoteShape(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, s * 0.22);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(-s * 0.3, s * 0.55, s * 0.42, s * 0.32, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0.08, s * 0.5);
    ctx.lineTo(s * 0.08, -s * 0.82);
    ctx.lineTo(s * 0.72, -s * 0.62);
    ctx.stroke();
    ctx.restore();
  }

  function quadPoint(x0, y0, x1, y1, x2, y2, t) {
    const u = 1 - t;
    return {
      x: u * u * x0 + 2 * u * t * x1 + t * t * x2,
      y: u * u * y0 + 2 * u * t * y1 + t * t * y2,
    };
  }

  function heightFor(p, growth) {
    return 6 + growth * p.maxH;
  }

  function plantTopAt(p, growth) {
    const swayAmp = 3 + p.maxH * 0.025;
    const sway = REDUCED ? 0 : Math.sin(G.time * 1.5 + p.phase) * swayAmp * growth;
    return {
      x: p.x + sway,
      y: p.baseY - heightFor(p, growth),
      h: heightFor(p, growth),
      sway,
    };
  }

  function plantTop(p) {
    return plantTopAt(p, p.growth);
  }

  function layoutPlants() {
    const fx = [0.12, 0.31, 0.5, 0.69, 0.88];
    const hs = [1.0, 0.9, 1.06, 0.94, 1.02];
    const bs = [0, 5, -3, 4, 0];
    const old = G.plants;
    G.plants = fx.map((f, i) => {
      const prev = old[i] || {};
      return {
        index: i,
        x: G.W * f,
        baseY: G.groundY + bs[i],
        maxH: G.maxH * hs[i],
        water: prev.water || 0,
        growth: prev.growth || 0,
        bloom: prev.bloom || 0,
        bounce: prev.bounce || 0,
        flash: prev.flash || 0,
        phase: prev.phase !== undefined ? prev.phase : rand(0, Math.PI * 2),
        note: NOTES[i],
        hitR: clamp(G.W * 0.1, 42, 60),
      };
    });
  }

  function layoutClouds() {
    const cx = [0.215, 0.5, 0.785];
    const cy = [-6, 8, -2];
    const defs = [
      { targets: [0, 1] },
      { targets: [2] },
      { targets: [3, 4] },
    ];
    const old = G.clouds;
    G.clouds = defs.map((d, i) => {
      const prev = old[i] || {};
      return {
        x: G.W * cx[i],
        y: G.cloudY + cy[i],
        targets: d.targets,
        scale: clamp(G.W / 390, 0.82, 1.25),
        hitR: clamp(G.W * 0.13, 50, 72),
        phase: prev.phase !== undefined ? prev.phase : rand(0, Math.PI * 2),
        puff: prev.puff || 0,
        pulse: prev.pulse || 0,
        queue: prev.queue || [],
        rainT: prev.rainT || 0,
      };
    });
  }

  function resize() {
    const rect = els.stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    G.W = rect.width;
    G.H = rect.height;
    G.dpr = dpr;
    G.groundY = G.H * 0.845;
    G.maxH = clamp(Math.min(G.H * 0.32, G.W * 0.35), 64, 172);
    G.cloudY = clamp(G.H * 0.19, 64, 150);

    els.canvas.width = Math.round(G.W * dpr);
    els.canvas.height = Math.round(G.H * dpr);
    els.canvas.style.width = G.W + 'px';
    els.canvas.style.height = G.H + 'px';
    G.ctx = els.canvas.getContext('2d');
    G.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    layoutPlants();
    layoutClouds();
    buildBackground();
  }

  function buildBackground() {
    if (!G.W || !G.H) return;
    const c = document.createElement('canvas');
    c.width = Math.round(G.W * G.dpr);
    c.height = Math.round(G.H * G.dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);

    const W = G.W;
    const H = G.H;

    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.68);
    sky.addColorStop(0, '#c7ebff');
    sky.addColorStop(0.55, '#e6f7ff');
    sky.addColorStop(1, '#f7fbe4');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const sx = W * 0.88;
    const sy = H * 0.11;
    const sr = clamp(Math.min(W, H) * 0.055, 15, 38);
    const glow = ctx.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 3.4);
    glow.addColorStop(0, 'rgba(255, 236, 150, 0.75)');
    glow.addColorStop(0.5, 'rgba(255, 236, 150, 0.22)');
    glow.addColorStop(1, 'rgba(255, 236, 150, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, sr * 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.arc(sx - sr * 0.3, sy - sr * 0.32, sr * 0.32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cdecc4';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.74);
    ctx.quadraticCurveTo(W * 0.18, H * 0.55, W * 0.4, H * 0.66);
    ctx.quadraticCurveTo(W * 0.62, H * 0.76, W * 0.82, H * 0.61);
    ctx.quadraticCurveTo(W * 0.94, H * 0.54, W, H * 0.6);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#b2e2a6';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.8);
    ctx.quadraticCurveTo(W * 0.22, H * 0.64, W * 0.48, H * 0.75);
    ctx.quadraticCurveTo(W * 0.7, H * 0.84, W, H * 0.7);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    const field = ctx.createLinearGradient(0, H * 0.7, 0, H);
    field.addColorStop(0, '#a8dc98');
    field.addColorStop(1, '#7ec46f');
    ctx.fillStyle = field;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.8);
    ctx.quadraticCurveTo(W * 0.3, H * 0.73, W * 0.6, H * 0.8);
    ctx.quadraticCurveTo(W * 0.82, H * 0.85, W, H * 0.77);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 10; i += 1) {
      const x = (i + 0.5) * (W / 10) + Math.sin(i * 3.7) * 10;
      const y = H * 0.84 + (i % 2 ? 6 : -4);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 3, y - 8, x + 6, y - 12);
      ctx.stroke();
    }

    const bedTop = G.groundY - 16;
    const bedH = H - bedTop + 18;
    ctx.fillStyle = '#c79a6f';
    roundRectPath(ctx, W * 0.025, bedTop, W * 0.95, bedH, 26);
    ctx.fill();
    ctx.fillStyle = '#b08256';
    roundRectPath(ctx, W * 0.025, bedTop + 8, W * 0.95, bedH - 8, 26);
    ctx.fill();
    ctx.fillStyle = '#d3a97e';
    roundRectPath(ctx, W * 0.025, bedTop, W * 0.95, 10, 8);
    ctx.fill();

    ctx.fillStyle = 'rgba(110, 70, 40, 0.16)';
    for (let i = 0; i < 28; i += 1) {
      const x = W * 0.06 + ((i * 97) % (W * 0.88));
      const y = bedTop + 24 + ((i * 53) % Math.max(20, bedH * 0.6));
      ctx.beginPath();
      ctx.ellipse(x, y, 2 + (i % 3), 1.3 + (i % 2), 0, 0, Math.PI * 2);
      ctx.fill();
    }

    G.bg = c;
  }

  function saveNow() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ water: G.plants.map((p) => Math.round(p.water)) }));
    } catch (err) {
      return;
    }
  }

  function loadSaved() {
    let data = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (err) {
      data = null;
    }
    if (!data || !Array.isArray(data.water)) return;
    G.plants.forEach((p, i) => {
      const w = clamp(Math.round(Number(data.water[i]) || 0), 0, 8);
      p.water = w;
      p.growth = w / 8;
      p.bloom = w >= 8 ? 1 : 0;
    });
    if (G.plants.length && G.plants.every((p) => p.water >= 8)) {
      G.celebrated = true;
      G.hintDone = true;
    }
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

  function splash(x, y) {
    for (let i = 0; i < 4; i += 1) {
      const ang = rand(-Math.PI * 0.85, -Math.PI * 0.15);
      const sp = rand(30, 100);
      G.particles.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        g: 620,
        life: rand(0.25, 0.45),
        max: 0.45,
        size: rand(2, 4),
        color: ['#9bd8f5', '#cbefff', '#ffffff'][Math.floor(rand(0, 3))],
        kind: 'splash',
        rot: 0,
        vr: 0,
      });
    }
  }

  function confettiBurst() {
    const colors = ['#ff9db3', '#ffb38a', '#ffe066', '#8fe3b8', '#b8a6ff', '#ffffff'];
    for (let i = 0; i < 54; i += 1) {
      G.particles.push({
        x: rand(0, G.W),
        y: rand(-40, -6),
        vx: rand(-30, 30),
        vy: rand(40, 110),
        g: 55,
        life: rand(1.6, 2.8),
        max: 2.8,
        size: rand(5, 9),
        color: colors[Math.floor(rand(0, colors.length))],
        kind: 'confetti',
        rot: rand(0, Math.PI * 2),
        vr: rand(-4, 4),
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

  function cloudAt(point) {
    let best = null;
    let bestD = Infinity;
    for (let i = 0; i < G.clouds.length; i += 1) {
      const c = G.clouds[i];
      const d = Math.hypot(point.x - c.x, point.y - c.y);
      if (d < c.hitR && d < bestD) {
        best = c;
        bestD = d;
      }
    }
    return best;
  }

  function flowerAt(point) {
    let best = null;
    let bestD = Infinity;
    for (let i = 0; i < G.plants.length; i += 1) {
      const p = G.plants[i];
      if (p.water < 8) continue;
      const top = plantTop(p);
      const d = Math.hypot(point.x - top.x, point.y - top.y);
      if (d < p.hitR && d < bestD) {
        best = p;
        bestD = d;
      }
    }
    return best;
  }

  function triggerRain(cloud) {
    cloud.puff = 1;
    cloud.pulse = 1;
    G.hintDone = true;

    const queue = [];
    cloud.targets.forEach((idx) => {
      for (let i = 0; i < 4; i += 1) queue.push(idx);
    });
    for (let i = queue.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = queue[i];
      queue[i] = queue[j];
      queue[j] = tmp;
    }
    if (cloud.queue.length < 32) {
      cloud.queue = cloud.queue.concat(queue).slice(0, 32);
    }
    cloud.rainT = 0;

    Sound.rain();
    spawnRing(cloud.x, cloud.y + 8, 66, 'rgba(150, 214, 255, 0.7)', 4, 0.65);
    floatText(cloud.x, cloud.y - 28, '톡!', '#4dabf7', clamp(G.W * 0.05, 16, 24));
  }

  function spawnDrop(cloud) {
    const idx = cloud.queue.shift();
    if (idx === undefined) return;
    const plant = G.plants[idx];
    if (!plant) return;
    const top = plantTop(plant);
    G.drops.push({
      x: cloud.x + rand(-14, 14),
      y: cloud.y + rand(8, 20),
      vx: 0,
      vy: rand(30, 70),
      r: rand(3.4, 5.4),
      plantIndex: idx,
      targetX: plant.x + rand(-8, 8),
      targetY: top.y + 6,
    });
  }

  function stageToast(p, text, color) {
    const top = plantTopAt(p, p.water / 8);
    floatText(top.x, top.y - 14, text, color, clamp(G.W * 0.055, 17, 26));
    burst(top.x, top.y, 6, 'sparkle', ['#ffffff', '#d3f9d8', '#b2f2bb'], {
      minSpeed: 30,
      maxSpeed: 110,
      minLife: 0.4,
      maxLife: 0.8,
      minSize: 3,
      maxSize: 6,
      g: 140,
    });
  }

  function landDrop(drop) {
    const p = G.plants[drop.plantIndex];
    if (!p) return;
    splash(drop.x, drop.y);
    Sound.plink(p.note.freq);
    p.flash = Math.max(p.flash, 0.35);
    p.bounce = Math.max(p.bounce, 0.3);

    if (p.water < 8) {
      const old = p.water;
      p.water = Math.min(8, p.water + 1);
      saveNow();
      if (old < 2 && p.water >= 2) {
        p.bounce = 1;
        Sound.sprout();
        stageToast(p, '퐁!', '#40c057');
      } else if (old < 4 && p.water >= 4) {
        Sound.stem();
        stageToast(p, '쑥!', '#2f9e44');
      } else if (old < 6 && p.water >= 6) {
        Sound.bud();
        stageToast(p, '봉긋!', '#e67700');
      } else if (old < 8 && p.water >= 8) {
        bloomPlant(p);
      }
    } else {
      const top = plantTop(p);
      spawnRing(top.x, top.y, 20, 'rgba(255, 255, 255, 0.8)', 2, 0.4);
    }
  }

  function bloomPlant(p) {
    p.bounce = 1;
    p.flash = 1;
    const top = plantTopAt(p, 1);
    floatText(top.x + 10, top.y - 42, '팡!', p.note.petal, clamp(G.W * 0.065, 20, 30));
    burst(top.x, top.y, 12, 'petal', [p.note.petal, p.note.petal2, '#ffffff'], {
      minSpeed: 50,
      maxSpeed: 190,
      up: 70,
      g: 180,
      minLife: 0.7,
      maxLife: 1.3,
      minSize: 4,
      maxSize: 8,
    });
    burst(top.x, top.y, 8, 'sparkle', ['#fff3bf', '#ffffff', '#ffe066'], {
      minSpeed: 40,
      maxSpeed: 160,
      g: 140,
      minLife: 0.5,
      maxLife: 1,
      minSize: 3,
      maxSize: 6,
    });
    burst(top.x, top.y, 4, 'note', [p.note.petal, p.note.center], {
      minSpeed: 20,
      maxSpeed: 70,
      up: 80,
      g: -20,
      minLife: 1,
      maxLife: 1.6,
      minSize: 7,
      maxSize: 11,
    });
    spawnRing(top.x, top.y, clamp(G.W * 0.17, 46, 80), 'rgba(255, 255, 255, 0.85)', 4, 0.6);
    Sound.bloom(p.note.freq);
    checkWin();
  }

  function checkWin() {
    if (G.celebrated) return;
    if (!G.plants.length) return;
    if (G.plants.every((p) => p.water >= 8)) {
      G.celebrated = true;
      G.winTimer = 2.6;
      Sound.win();
      confettiBurst();
    }
  }

  function showEnding() {
    if (G.state === 'ending') return;
    G.state = 'ending';
    G.winTimer = 0;
    els.ending.classList.add('is-on');
    confettiBurst();
  }

  function hideEnding() {
    G.state = 'play';
    els.ending.classList.remove('is-on');
  }

  function resetGarden() {
    els.ending.classList.remove('is-on');
    G.state = 'play';
    G.celebrated = false;
    G.winTimer = 0;
    G.hintDone = false;
    G.playedFlower = false;
    G.drops = [];
    G.particles = [];
    G.floats = [];
    G.rings = [];
    G.plants.forEach((p) => {
      p.water = 0;
      p.bounce = 0;
      p.flash = 0;
      p.phase = rand(0, Math.PI * 2);
    });
    G.clouds.forEach((c) => {
      c.queue = [];
      c.puff = 0;
      c.pulse = 0;
      c.rainT = 0;
    });
    saveNow();
    Sound.sprout();
    G.plants.forEach((p) => {
      const top = plantTopAt(p, Math.max(0.15, p.growth));
      spawnRing(top.x, top.y, 24, 'rgba(255, 255, 255, 0.55)', 2, 0.5);
    });
  }

  function playFlower(p, withRing) {
    if (!p || p.water < 8) return;
    p.flash = 1;
    p.bounce = 1;
    Sound.note(p.note.freq, 0.2);
    const top = plantTop(p);
    if (withRing) {
      spawnRing(top.x, top.y, clamp(G.W * 0.13, 34, 64), 'rgba(255, 255, 255, 0.8)', 3, 0.5);
    }
    burst(top.x, top.y, 5, 'note', [p.note.petal, p.note.center, '#ffffff'], {
      minSpeed: 20,
      maxSpeed: 70,
      up: 70,
      g: -20,
      minLife: 0.9,
      maxLife: 1.4,
      minSize: 6,
      maxSize: 10,
    });
    burst(top.x, top.y, 4, 'sparkle', ['#ffffff', '#fff3bf'], {
      minSpeed: 30,
      maxSpeed: 100,
      g: 160,
      minLife: 0.3,
      maxLife: 0.6,
      minSize: 2,
      maxSize: 4,
    });
  }

  function playGarden() {
    G.plants.forEach((p, i) => {
      if (p.water < 8) return;
      const delay = i * 120;
      Sound.tone(p.note.freq, 0.4, 'triangle', 0.14, delay / 1000);
      Sound.tone(p.note.freq * 2, 0.22, 'sine', 0.045, delay / 1000 + 0.02);
      window.setTimeout(() => {
        p.flash = 1;
        p.bounce = 1;
        const top = plantTop(p);
        spawnRing(top.x, top.y, 28, 'rgba(255, 255, 255, 0.7)', 2, 0.45);
        burst(top.x, top.y, 3, 'note', [p.note.petal, '#ffffff'], {
          minSpeed: 20,
          maxSpeed: 60,
          up: 60,
          g: -20,
          minLife: 0.8,
          maxLife: 1.3,
          minSize: 6,
          maxSize: 9,
        });
      }, delay);
    });
  }

  function updateClouds(dt) {
    for (let i = 0; i < G.clouds.length; i += 1) {
      const c = G.clouds[i];
      c.puff = Math.max(0, c.puff - dt * 3);
      c.pulse = Math.max(0, c.pulse - dt * 1.4);
      if (c.queue.length) {
        c.rainT -= dt;
        if (c.rainT <= 0) {
          spawnDrop(c);
          c.rainT = 0.11;
        }
      }
    }
  }

  function updateDrops(dt) {
    for (let i = G.drops.length - 1; i >= 0; i -= 1) {
      const d = G.drops[i];
      const p = G.plants[d.plantIndex];
      if (!p) {
        G.drops.splice(i, 1);
        continue;
      }
      const top = plantTop(p);
      d.targetY = top.y + 6;
      d.vy += 520 * dt;
      d.y += d.vy * dt;
      d.x += (d.targetX - d.x) * Math.min(1, dt * 2.4);
      if (d.y >= d.targetY || d.y > G.H + 20) {
        if (d.y >= d.targetY) landDrop(d);
        G.drops.splice(i, 1);
      }
    }
  }

  function updatePlants(dt) {
    for (let i = 0; i < G.plants.length; i += 1) {
      const p = G.plants[i];
      const target = p.water / 8;
      p.growth += (target - p.growth) * Math.min(1, dt * 4);
      if (Math.abs(target - p.growth) < 0.002) p.growth = target;
      const bloomTarget = p.water >= 8 ? 1 : 0;
      p.bloom += (bloomTarget - p.bloom) * Math.min(1, dt * 3.2);
      if (Math.abs(bloomTarget - p.bloom) < 0.003) p.bloom = bloomTarget;
      p.bounce = Math.max(0, p.bounce - dt * 2.4);
      p.flash = Math.max(0, p.flash - dt * 1.8);
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
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.995;
      p.rot += p.vr * dt;
    }
  }

  function updateFloats(dt) {
    for (let i = G.floats.length - 1; i >= 0; i -= 1) {
      const f = G.floats[i];
      f.life -= dt;
      f.y -= 34 * dt;
      if (f.life <= 0) G.floats.splice(i, 1);
    }
  }

  function updateRings(dt) {
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

  function update(dt) {
    G.time += dt;
    updateClouds(dt);
    updateDrops(dt);
    updatePlants(dt);
    updateParticles(dt);
    updateFloats(dt);
    updateRings(dt);
    if (G.winTimer > 0) {
      G.winTimer -= dt;
      if (G.winTimer <= 0) showEnding();
    }
  }

  function drawLeaf(ctx, x, y, angle, size, color) {
    if (size <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(size * 0.55, 0, size, size * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = Math.max(1, size * 0.08);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size * 1.1, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawBud(ctx, x, y, r, note) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = note.stem;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.22, r * 0.6, r * 0.76, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = note.petal;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.3, r * 0.46, r * 0.56, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.16, -r * 0.46, r * 0.15, r * 0.22, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFlower(ctx, x, y, size, open, note, flash) {
    ctx.save();
    ctx.translate(x, y);
    const o = clamp(open, 0, 1);
    const scale = 0.62 + o * 0.38 + flash * 0.1;
    ctx.scale(scale, scale);

    if (o > 0.45) {
      const glow = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, size * 2.1);
      glow.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, size * 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    const petals = 6;
    const spread = size * (0.36 + 0.34 * o);
    for (let i = 0; i < petals; i += 1) {
      const ang = (i * Math.PI * 2) / petals + (REDUCED ? 0 : Math.sin(G.time * 1.4 + i) * 0.02);
      ctx.save();
      ctx.rotate(ang);
      ctx.fillStyle = i % 2 === 0 ? note.petal : note.petal2;
      ctx.beginPath();
      ctx.ellipse(0, -spread, size * 0.46, size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = note.center;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(190, 130, 20, 0.45)';
    for (let i = 0; i < 5; i += 1) {
      const a = (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * size * 0.18, Math.sin(a) * size * 0.18, size * 0.055, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(-size * 0.12, -size * 0.12, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPlant(ctx, p) {
    const top = plantTop(p);
    const g = p.growth;
    const s = clamp(G.W / 390, 0.8, 1.2);

    ctx.save();
    ctx.fillStyle = 'rgba(70, 90, 50, 0.14)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.baseY + 7, 24 * s * (0.7 + 0.3 * g), 7 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a97950';
    ctx.beginPath();
    ctx.ellipse(p.x, p.baseY + 2, 21 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8f6540';
    ctx.beginPath();
    ctx.ellipse(p.x, p.baseY - 1, 15 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (g < 0.015) {
      ctx.save();
      ctx.fillStyle = '#7a5a3a';
      ctx.beginPath();
      ctx.arc(p.x, p.baseY - 2, 3 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(p.x - s, p.baseY - 3, s, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    const midX = p.x + top.sway * 0.35;
    const midY = p.baseY - top.h * 0.55;

    ctx.save();
    ctx.strokeStyle = p.note.stem;
    ctx.lineWidth = lerp(3.4 * s, 7 * s, g);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.baseY);
    ctx.quadraticCurveTo(midX, midY, top.x, top.y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = Math.max(1, lerp(1, 2.4, g) * s);
    ctx.beginPath();
    ctx.moveTo(p.x - 1.5 * s, p.baseY - 2);
    ctx.quadraticCurveTo(midX - 1.5 * s, midY, top.x - 1.5 * s, top.y);
    ctx.stroke();
    ctx.restore();

    const leafK = clamp((g - 0.22) / 0.4, 0, 1);
    if (leafK > 0) {
      const p1 = quadPoint(p.x, p.baseY, midX, midY, top.x, top.y, 0.42);
      const p2 = quadPoint(p.x, p.baseY, midX, midY, top.x, top.y, 0.66);
      const leafSize = (9 + p.maxH * 0.075) * (0.35 + 0.65 * leafK) * s;
      drawLeaf(ctx, p1.x, p1.y, Math.PI + 0.55, leafSize, p.note.leaf);
      drawLeaf(ctx, p2.x, p2.y, -0.55, leafSize * 0.85, p.note.stem);
    }

    if (p.bloom > 0.02) {
      const size = clamp(p.maxH * 0.16, 14, 26) * s;
      drawFlower(ctx, top.x, top.y, size, p.bloom, p.note, p.flash);
    } else {
      const budK = clamp((g - 0.55) / 0.45, 0, 1);
      if (budK > 0) {
        drawBud(ctx, top.x, top.y + 4 * s, (7 + 10 * budK) * s, p.note);
      }
    }
  }

  function drawCloud(ctx, c) {
    const s = c.scale * (1 + c.puff * 0.12);
    const bob = REDUCED ? 0 : Math.sin(G.time * 1.2 + c.phase) * 3;
    const y = c.y + bob;

    ctx.save();
    ctx.translate(c.x, y);
    ctx.scale(s, s);

    ctx.fillStyle = 'rgba(120, 170, 200, 0.16)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 42, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e7f6ff';
    ctx.beginPath();
    ctx.ellipse(0, 10, 38, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    const lobes = [
      [-27, 4, 18],
      [-13, -7, 21],
      [8, -10, 24],
      [28, 2, 17],
      [4, 8, 23],
    ];
    lobes.forEach((l) => {
      ctx.beginPath();
      ctx.arc(l[0], l[1], l[2], 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#cbe9fb';
    ctx.beginPath();
    ctx.ellipse(0, 12, 32, 7, 0, 0, Math.PI);
    ctx.fill();

    ctx.strokeStyle = '#6c8fa8';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-11, -1, 5, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(11, -1, 5, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 4, 7, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 160, 180, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-20, 6, 5, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(20, 6, 5, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (c.pulse > 0) {
      ctx.save();
      ctx.globalAlpha = c.pulse * 0.55;
      ctx.strokeStyle = '#bfe6ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(c.x, y, 48 * s + (1 - c.pulse) * 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawDrop(ctx, d) {
    ctx.save();
    ctx.fillStyle = 'rgba(126, 200, 240, 0.92)';
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.r * 0.72, d.r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(d.x - d.r * 0.2, d.y - d.r * 0.32, d.r * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles(ctx) {
    for (let i = 0; i < G.particles.length; i += 1) {
      const p = G.particles[i];
      const k = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = k;
      if (p.kind === 'note') {
        drawNoteShape(ctx, p.x, p.y, p.size, p.color);
      } else if (p.kind === 'petal') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === 'sparkle') {
        drawStar(ctx, p.x, p.y, p.size * (0.4 + k * 0.6), p.color);
      } else if (p.kind === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.62);
        ctx.restore();
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
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
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

  function drawHints(ctx) {
    if (!G.plants.length) return;
    const allBloom = G.plants.every((p) => p.water >= 8);
    if (allBloom) {
      if (G.playedFlower) return;
      const idx = Math.floor(G.time / 1.8) % G.plants.length;
      const p = G.plants[idx];
      if (!p || p.water < 8) return;
      const top = plantTop(p);
      const bob = REDUCED ? 0 : Math.sin(G.time * 3) * 4;
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.font = Math.round(clamp(G.W * 0.06, 20, 30)) + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(90, 140, 110, 0.5)';
      ctx.lineWidth = 3;
      ctx.strokeText('♪', top.x + 18, top.y - 20 + bob);
      ctx.fillText('♪', top.x + 18, top.y - 20 + bob);
      ctx.restore();
      return;
    }

    if (G.hintDone) return;
    const c = G.clouds[1];
    if (!c) return;
    const bob = REDUCED ? 0 : Math.sin(G.time * 3.2) * 5;
    ctx.save();
    ctx.globalAlpha = 0.75 + Math.sin(G.time * 2) * 0.2;
    ctx.font = Math.round(clamp(G.W * 0.09, 28, 40)) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👆', c.x, c.y + 52 + bob);
    ctx.restore();
  }

  function render() {
    const ctx = G.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, G.W, G.H);

    if (G.bg) ctx.drawImage(G.bg, 0, 0, G.W, G.H);
    else {
      ctx.fillStyle = '#e8f7ff';
      ctx.fillRect(0, 0, G.W, G.H);
    }

    for (let i = 0; i < G.clouds.length; i += 1) drawCloud(ctx, G.clouds[i]);
    for (let i = 0; i < G.plants.length; i += 1) drawPlant(ctx, G.plants[i]);
    for (let i = 0; i < G.drops.length; i += 1) drawDrop(ctx, G.drops[i]);

    drawParticles(ctx);
    drawRings(ctx);
    drawFloats(ctx);
    drawHints(ctx);
  }

  function loop(ts) {
    requestAnimationFrame(loop);
    const dt = G.lastT ? Math.min(0.033, (ts - G.lastT) / 1000) : 0.016;
    G.lastT = ts;
    update(dt);
    render();
  }

  function toStage(e) {
    const rect = els.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e) {
    if (G.state !== 'play') return;
    e.preventDefault();
    Sound.unlock();
    const point = toStage(e);

    const cloud = cloudAt(point);
    if (cloud) {
      triggerRain(cloud);
      return;
    }

    const flower = flowerAt(point);
    if (flower) {
      G.playedFlower = true;
      playFlower(flower, true);
      return;
    }

    spawnRing(point.x, point.y, 18, 'rgba(255, 255, 255, 0.55)', 2, 0.45);
  }

  function bindUI() {
    els.canvas.addEventListener('pointerdown', onPointerDown);
    els.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('pointerdown', () => Sound.unlock(), { passive: true });

    els.sound.addEventListener('click', () => {
      Sound.unlock();
      Sound.muted = !Sound.muted;
      els.sound.textContent = Sound.muted ? '🔇' : '🔊';
      if (!Sound.muted) Sound.tap();
    });

    els.reset.addEventListener('click', () => {
      Sound.unlock();
      resetGarden();
    });

    els.again.addEventListener('click', () => {
      Sound.unlock();
      resetGarden();
    });

    els.play.addEventListener('click', () => {
      Sound.unlock();
      hideEnding();
      playGarden();
    });

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => window.setTimeout(resize, 120));
  }

  function init() {
    bindUI();
    resize();
    loadSaved();
    requestAnimationFrame(loop);
  }

  init();
})();
