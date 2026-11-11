/**
 * 째깍 크아앙! 놀이 싸움
 * 사마귀/스피노 중 한쪽을 골라 버튼을 누르면, 둘이 장난으로 겨룬다.
 * HP·KO·승패 없음. 무기는 무해화(마시멜로·솜·거품), 맞아도 웃는다.
 */
(() => {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const els = {
    canvas: document.getElementById('gameCanvas'),
    stage: document.getElementById('stage'),
    select: document.getElementById('selectScreen'),
    myRow: document.getElementById('myRow'),
    enemyRow: document.getElementById('enemyRow'),
    startBtn: document.getElementById('btnStart'),
    attackBar: document.getElementById('attackBar'),
    ending: document.getElementById('endingOverlay'),
    btnAgain: document.getElementById('btnAgain'),
    btnChange: document.getElementById('btnChange'),
    sound: document.getElementById('btnSound'),
  };

  const G = {
    state: 'select',
    playerId: 'mantis',
    enemyId: 'spino',
    player: MS_CHARS[0],
    enemy: MS_CHARS[1],
    W: 0,
    H: 0,
    dpr: 1,
    ctx: null,
    time: 0,
    last: 0,
    stateT: 0,
    rounds: 0,
    canAttack: false,
    playerAttack: null,
    enemyAttack: null,
    particles: [],
    confetti: [],
    floaters: [],
    events: {},
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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

  function drawHeart(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.85);
    ctx.bezierCurveTo(-s * 1.15, s * 0.1, -s * 0.55, -s * 0.85, 0, -s * 0.12);
    ctx.bezierCurveTo(s * 0.55, -s * 0.85, s * 1.15, s * 0.1, 0, s * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function roundHorn(ctx, x, y, w, h) {
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w * 0.15, y - h);
    ctx.stroke();
  }

  function drawLeg(ctx, x, y, r, ch, art) {
    ctx.fillStyle = ch.color;
    roundRectPath(ctx, x - r * 0.15, y, r * 0.3, r * 0.46, r * 0.14);
    ctx.fill();
    ctx.fillStyle = ch.accent;
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.46, r * (art.webbed ? 0.24 : 0.19), r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 사마귀 앞다리 낫: 팔꿈치(ex,ey)에서 뾰족한 끝(tx,ty)으로 좁아지는 곡선 날
  function drawSickle(ctx, ex, ey, tx, ty, w, color) {
    const dx = tx - ex;
    const dy = ty - ey;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ex + nx * w, ey + ny * w);
    ctx.quadraticCurveTo(ex + dx * 0.55 + nx * w * 1.25, ey + dy * 0.55 + ny * w * 1.25, tx, ty);
    ctx.quadraticCurveTo(ex + dx * 0.45 - nx * w * 0.25, ey + dy * 0.45 - ny * w * 0.25, ex - nx * w, ey - ny * w);
    ctx.closePath();
    ctx.fill();

    // 안쪽 날의 작은 가시
    ctx.strokeStyle = color;
    ctx.lineWidth = w * 0.42;
    ctx.lineCap = 'round';
    for (let i = 1; i <= 2; i += 1) {
      const t = 0.32 + i * 0.2;
      const bx = ex + dx * t;
      const by = ey + dy * t;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - nx * w * 1.05 + ux * w * 0.1, by - ny * w * 1.05 + uy * w * 0.1);
      ctx.stroke();
    }
  }

  /* ------------------------------------------------------------------ */
  /* 캐릭터 그리기 (무해화: 둥근 곡선, 웃는 얼굴)                          */
  /* ------------------------------------------------------------------ */

  function drawCritter(ctx, ch, x, y, r, o) {
    o = o || {};
    const art = ch.art || {};
    const facing = o.facing || 1;
    const time = o.time || 0;
    const squash = o.squash || 0;
    const lunge = o.lunge || 0;
    const giggle = o.giggle || 0;
    const tilt = o.tilt || 0;
    const phase = o.phase || 0;

    const sx = (1 + squash * 0.2) * (1 + lunge * 0.12);
    const sy = 1 - squash * 0.18;
    const bob = Math.sin(time * 3 + phase) * r * 0.02;
    const wiggle = giggle > 0 ? Math.sin(time * 42) * r * 0.03 : 0;

    ctx.save();
    ctx.fillStyle = 'rgba(60, 80, 60, 0.13)';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.92, r * 0.82 * (1 + squash * 0.1), r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(x + wiggle, y + bob);
    ctx.rotate(tilt);
    ctx.scale(facing * sx, sy);

    const isDino = ch.kind === '공룡';

    // 등 돛 (스피노)
    if (art.sail) {
      ctx.fillStyle = ch.accent;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.1);
      ctx.quadraticCurveTo(-r * 0.48, -r * 1.0, r * 0.02, -r * 0.4);
      ctx.quadraticCurveTo(-r * 0.24, -r * 0.2, -r * 0.7, -r * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = r * 0.04;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.5 + i * r * 0.16, -r * 0.2 - i * r * 0.14);
        ctx.lineTo(-r * 0.42 + i * r * 0.16, -r * 0.55 - i * r * 0.1);
        ctx.stroke();
      }
    }

    // 꼬리 (공룡)
    if (isDino) {
      const tl = art.longTail ? 1.5 : 1.1;
      ctx.fillStyle = ch.color;
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, r * 0.02);
      ctx.quadraticCurveTo(-r * tl, -r * 0.05, -r * (tl * 0.92), r * 0.34);
      ctx.quadraticCurveTo(-r * 0.9, r * 0.48, -r * 0.35, r * 0.42);
      ctx.closePath();
      ctx.fill();
    }

    // 다리
    drawLeg(ctx, -r * 0.26, r * 0.42, r, ch, art);
    drawLeg(ctx, r * 0.24, r * 0.42, r, ch, art);

    // 몸통
    const bodyRy = art.mantisBody ? r * 0.5 : r * 0.64;
    ctx.fillStyle = ch.color;
    ctx.beginPath();
    ctx.ellipse(-r * 0.02, r * 0.06, r * 0.78, bodyRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // 배
    ctx.fillStyle = ch.belly;
    ctx.beginPath();
    ctx.ellipse(r * 0.1, r * 0.3, r * 0.5, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 등 점 (무당벌레)
    if (art.spots) {
      ctx.fillStyle = ch.accent;
      [
        [-0.3, -0.26, 0.13],
        [0.02, -0.1, 0.15],
        [-0.14, 0.08, 0.11],
        [0.26, -0.32, 0.1],
      ].forEach(([sx2, sy2, sr]) => {
        ctx.beginPath();
        ctx.arc(sx2 * r, sy2 * r, sr * r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 프릴 (트리케라)
    if (art.frill) {
      const fx = r * 0.48;
      const fy = -r * 0.36;
      ctx.fillStyle = ch.accent;
      ctx.beginPath();
      ctx.ellipse(fx - r * 0.18, fy + r * 0.02, r * 0.9, r * 0.8, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.ellipse(fx - r * 0.22, fy - r * 0.05, r * 0.58, r * 0.5, -0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    const longNeck = !!art.longNeck;
    const bigHead = !!art.bigHead;
    const hx = longNeck ? r * 0.5 : r * 0.42;
    const hy = longNeck ? -r * 1.0 : art.mantisBody ? -r * 0.52 : -r * 0.44;
    const hr = bigHead ? r * 0.5 : r * 0.42;

    // 갈기 (사자)
    if (art.mane) {
      ctx.fillStyle = ch.accent;
      for (let i = 0; i < 10; i += 1) {
        const a = (i / 10) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(hx + Math.cos(a) * hr * 1.15, hy + Math.sin(a) * hr * 1.15, hr * 0.36, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(hx, hy, hr * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 목
    ctx.strokeStyle = ch.color;
    ctx.lineWidth = r * (longNeck ? 0.3 : 0.46);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.05, -r * 0.05);
    ctx.quadraticCurveTo(hx * 0.8, hy * 0.5, hx, hy + hr * 0.5);
    ctx.stroke();

    // 머리
    ctx.fillStyle = ch.color;
    ctx.beginPath();
    ctx.ellipse(hx, hy, hr, hr * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();

    // 주둥이
    const snoutLen = art.longSnout ? 0.7 : 0.48;
    ctx.beginPath();
    ctx.ellipse(hx + hr * snoutLen * 0.9, hy + hr * 0.18, hr * snoutLen, hr * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();

    // 큰 귀 (코끼리)
    if (art.bigEars) {
      ctx.fillStyle = ch.color;
      ctx.beginPath();
      ctx.ellipse(hx - hr * 0.55, hy - hr * 0.1, hr * 0.62, hr * 0.72, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(hx + hr * 0.5, hy - hr * 0.05, hr * 0.5, hr * 0.6, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ch.belly;
      ctx.beginPath();
      ctx.ellipse(hx - hr * 0.55, hy - hr * 0.1, hr * 0.34, hr * 0.44, -0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // 긴 귀 (토끼)
    if (art.longEars) {
      ctx.fillStyle = ch.color;
      ctx.beginPath();
      ctx.ellipse(hx - hr * 0.28, hy - hr * 1.2, hr * 0.26, hr * 0.78, -0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(hx + hr * 0.28, hy - hr * 1.25, hr * 0.26, hr * 0.8, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ch.belly;
      ctx.beginPath();
      ctx.ellipse(hx - hr * 0.28, hy - hr * 1.2, hr * 0.12, hr * 0.58, -0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(hx + hr * 0.28, hy - hr * 1.25, hr * 0.12, hr * 0.58, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // 뿔 하나 (장수풍뎅이) — 둥글게
    if (art.horn) {
      ctx.strokeStyle = ch.accent;
      ctx.lineWidth = r * 0.14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx, hy - hr * 0.55);
      ctx.quadraticCurveTo(hx + hr * 0.2, hy - hr * 1.35, hx + hr * 0.7, hy - hr * 1.25);
      ctx.stroke();
    }

    // 뿔 셋 (트리케라) — 둥글게
    if (art.horns) {
      ctx.strokeStyle = ch.accent;
      roundHorn(ctx, hx + hr * 0.1, hy - hr * 0.7, hr * 0.3, hr * 0.5);
      roundHorn(ctx, hx + hr * 0.7, hy - hr * 0.3, hr * 0.26, hr * 0.38);
      roundHorn(ctx, hx + hr * 0.92, hy + hr * 0.05, hr * 0.22, hr * 0.28);
    }

    // 코 (코끼리)
    if (art.trunk) {
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = r * 0.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx + hr * 0.45, hy + hr * 0.3);
      ctx.quadraticCurveTo(hx + hr * 0.95, hy + hr * 0.4, hx + hr * 0.85, hy + hr * 1.1);
      ctx.stroke();
    }

    // 더듬이 (사마귀)
    if (art.antennae) {
      ctx.strokeStyle = ch.accent;
      ctx.lineWidth = r * 0.035;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx - hr * 0.15, hy - hr * 0.7);
      ctx.quadraticCurveTo(hx - hr * 0.5, hy - hr * 1.5, hx - hr * 0.75, hy - hr * 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx + hr * 0.05, hy - hr * 0.75);
      ctx.quadraticCurveTo(hx + hr * 0.1, hy - hr * 1.6, hx + hr * 0.45, hy - hr * 1.55);
      ctx.stroke();
      ctx.fillStyle = ch.accent;
      ctx.beginPath();
      ctx.arc(hx - hr * 0.75, hy - hr * 1.4, r * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx + hr * 0.45, hy - hr * 1.55, r * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }

    // 둥근 큰턱 (사슴벌레) — 앞으로 뻗은 두 집게
    if (art.bigPincers) {
      ctx.strokeStyle = ch.accent;
      ctx.lineWidth = r * 0.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx + hr * 0.5, hy - hr * 0.05);
      ctx.quadraticCurveTo(hx + hr * 1.2, hy - hr * 0.15, hx + hr * 1.05, hy - hr * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx + hr * 0.5, hy + hr * 0.28);
      ctx.quadraticCurveTo(hx + hr * 1.2, hy + hr * 0.4, hx + hr * 1.05, hy - hr * 0.02);
      ctx.stroke();
    }

    // 사마귀 앞다리 — 낫 모양(뾰족)
    if (art.scythes) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 먼 쪽(뒤) 앞다리
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = r * 0.12;
      ctx.beginPath();
      ctx.moveTo(r * 0.12, r * 0.02);
      ctx.quadraticCurveTo(r * 0.42, -r * 0.32, r * 0.64, -r * 0.6);
      ctx.stroke();
      drawSickle(ctx, r * 0.64, -r * 0.6, r * 0.9, -r * 0.14, r * 0.095, ch.accent);

      // 가까운 쪽(앞) 앞다리
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = r * 0.14;
      ctx.beginPath();
      ctx.moveTo(r * 0.16, r * 0.16);
      ctx.quadraticCurveTo(r * 0.52, -r * 0.18, r * 0.86, -r * 0.44);
      ctx.stroke();
      drawSickle(ctx, r * 0.86, -r * 0.44, r * 1.1, r * 0.08, r * 0.12, ch.accent);
    }

    // 눈
    const ex = hx + hr * 0.22;
    const ey = hy - hr * 0.12;
    const eyeR = hr * 0.28;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#33313f';
    ctx.beginPath();
    ctx.arc(ex + hr * 0.06, ey + hr * 0.02, eyeR * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex + hr * 0.06, ey - hr * 0.03, eyeR * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 볼터치
    ctx.fillStyle = 'rgba(255,150,175,0.5)';
    ctx.beginPath();
    ctx.ellipse(hx + hr * 0.02, hy + hr * 0.34, hr * 0.18, hr * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 입
    if (giggle > 0) {
      ctx.fillStyle = '#7a3b45';
      ctx.beginPath();
      ctx.ellipse(hx + hr * 0.8, hy + hr * 0.34, hr * 0.2, hr * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(70,55,50,0.7)';
      ctx.lineWidth = r * 0.04;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(hx + hr * 0.76, hy + hr * 0.24, hr * 0.16, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // 작은 팔
    if (!art.scythes && !art.trunk) {
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = r * 0.14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(r * 0.3, r * 0.1);
      ctx.lineTo(r * 0.45, r * 0.28);
      ctx.stroke();
    }

    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* 배경                                                                */
  /* ------------------------------------------------------------------ */

  function drawCloud(ctx, x, y, r) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.arc(x + r * 0.9, y + r * 0.2, r * 0.8, 0, Math.PI * 2);
    ctx.arc(x - r * 0.9, y + r * 0.2, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBg(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, G.H);
    g.addColorStop(0, '#eaf7ff');
    g.addColorStop(0.55, '#eafbf0');
    g.addColorStop(1, '#fff7ec');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, G.W, G.H);

    const u = Math.min(G.W, G.H);
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(G.W * 0.82, G.H * 0.16, u * 0.07, 0, Math.PI * 2);
    ctx.fill();

    drawCloud(ctx, G.W * 0.22, G.H * 0.15, u * 0.08);
    drawCloud(ctx, G.W * 0.6, G.H * 0.1, u * 0.06);

    const gy = G.H * 0.72;
    ctx.fillStyle = '#dff3d0';
    ctx.beginPath();
    ctx.ellipse(G.W * 0.5, gy + G.H * 0.22, G.W * 0.78, G.H * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cdeab8';
    ctx.beginPath();
    ctx.ellipse(G.W * 0.24, gy + G.H * 0.2, G.W * 0.5, G.H * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ------------------------------------------------------------------ */
  /* 파티클·글자                                                         */
  /* ------------------------------------------------------------------ */

  function spawnHit(x, y, count) {
    const n = REDUCED ? Math.ceil(count * 0.4) : count;
    for (let i = 0; i < n; i += 1) {
      const roll = Math.random();
      const type = roll < 0.45 ? 'star' : roll < 0.78 ? 'heart' : 'puff';
      G.particles.push({
        x,
        y,
        vx: rand(-130, 130),
        vy: rand(-240, -60),
        life: 0,
        max: rand(0.5, 0.95),
        type,
        color: pick(['#ffd43b', '#ff9ec4', '#9be3ff', '#ffe6a1', '#b6f0c4']),
        size: rand(5, 10),
      });
    }
  }

  function spawnPuff(x, y) {
    for (let i = 0; i < (REDUCED ? 4 : 8); i += 1) {
      G.particles.push({
        x,
        y,
        vx: rand(-80, 80),
        vy: rand(-70, 20),
        life: 0,
        max: rand(0.4, 0.8),
        type: 'puff',
        color: '#ffffff',
        size: rand(8, 15),
      });
    }
  }

  function spawnRing(x, y, color, maxR) {
    G.particles.push({ x, y, vx: 0, vy: 0, life: 0, max: 0.55, type: 'ring', color, size: maxR });
  }

  function spawnDust(x, y) {
    for (let i = 0; i < (REDUCED ? 5 : 10); i += 1) {
      G.particles.push({
        x,
        y,
        vx: rand(-120, 120),
        vy: rand(-70, 10),
        life: 0,
        max: rand(0.4, 0.8),
        type: 'dust',
        color: '#efe3c8',
        size: rand(8, 16),
      });
    }
  }

  function spawnLeafBurst(x, y, color) {
    for (let i = 0; i < (REDUCED ? 4 : 9); i += 1) {
      G.particles.push({
        x,
        y,
        vx: rand(-110, 110),
        vy: rand(-190, -50),
        life: 0,
        max: rand(0.5, 0.95),
        type: 'leaf',
        color,
        size: rand(5, 9),
        rot: rand(0, 6),
      });
    }
  }

  function spawnBubbleBurst(x, y) {
    for (let i = 0; i < (REDUCED ? 5 : 10); i += 1) {
      G.particles.push({
        x,
        y,
        vx: rand(-70, 70),
        vy: rand(-200, -70),
        life: 0,
        max: rand(0.45, 0.85),
        type: 'bubble',
        color: '#bfe9ff',
        size: rand(5, 10),
      });
    }
  }

  function spawnBubblesFrom(x, y, dir) {
    for (let i = 0; i < (REDUCED ? 4 : 8); i += 1) {
      G.particles.push({
        x: x + rand(-8, 8),
        y: y + rand(-10, 10),
        vx: dir * rand(200, 340),
        vy: rand(-80, 10),
        life: 0,
        max: rand(0.3, 0.55),
        type: 'bubble',
        color: '#bfe9ff',
        size: rand(4, 9),
      });
    }
  }

  function spawnAttackEffect(effect, x, y) {
    if (effect === 'dust') {
      spawnDust(x, y);
      spawnHit(x, y, 7);
    } else if (effect === 'leaf') {
      spawnLeafBurst(x, y, '#8fce6a');
      spawnHit(x, y, 6);
    } else if (effect === 'bubble') {
      spawnBubbleBurst(x, y);
      spawnHit(x, y, 6);
    } else {
      spawnHit(x, y, 14);
    }
  }

  function spawnConfetti() {
    const n = REDUCED ? 16 : 44;
    for (let i = 0; i < n; i += 1) {
      G.confetti.push({
        x: rand(G.W * 0.25, G.W * 0.75),
        y: rand(G.H * 0.08, G.H * 0.4),
        vx: rand(-80, 80),
        vy: rand(-50, 80),
        life: 0,
        max: rand(1.2, 2.2),
        size: rand(6, 12),
        color: pick(['#ff8fc4', '#ffd43b', '#8ce0c0', '#9bc6ff', '#ffb08a']),
        rot: rand(0, 6),
        vr: rand(-7, 7),
      });
    }
  }

  function spawnFloater(text, x, y, color, size) {
    G.floaters.push({ text, x, y, vy: -46, life: 0, max: 0.95, color: color || '#7a4a2a', size: size || 30 });
  }

  function updateFx(dt) {
    for (let i = G.particles.length - 1; i >= 0; i -= 1) {
      const p = G.particles[i];
      p.life += dt;
      if (p.type !== 'ring') {
        p.vy += 560 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      if (p.life >= p.max) G.particles.splice(i, 1);
    }
    for (let i = G.confetti.length - 1; i >= 0; i -= 1) {
      const c = G.confetti[i];
      c.life += dt;
      c.vy += 320 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rot += c.vr * dt;
      if (c.life >= c.max) G.confetti.splice(i, 1);
    }
    for (let i = G.floaters.length - 1; i >= 0; i -= 1) {
      const f = G.floaters[i];
      f.life += dt;
      f.y += f.vy * dt;
      if (f.life >= f.max) G.floaters.splice(i, 1);
    }
  }

  function drawFx(ctx) {
    G.particles.forEach((p) => {
      const a = clamp(1 - p.life / p.max, 0, 1);
      ctx.globalAlpha = a;
      if (p.type === 'star') {
        drawStar(ctx, p.x, p.y, p.size, p.color);
      } else if (p.type === 'heart') {
        drawHeart(ctx, p.x, p.y, p.size * 0.8, p.color);
      } else if (p.type === 'ring') {
        const k = clamp(p.life / p.max, 0, 1);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.25 + 0.75 * easeOutCubic(k)), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'leaf') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot || 0) + p.life * 4);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'bubble') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });

    G.confetti.forEach((c) => {
      const a = clamp(1 - c.life / c.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 3, c.size, c.size * 0.66);
      ctx.restore();
      ctx.globalAlpha = 1;
    });

    G.floaters.forEach((f) => {
      const a = clamp(1 - f.life / f.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = `bold ${f.size}px "Jua", "Malgun Gothic", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
      ctx.globalAlpha = 1;
    });
  }

  /* ------------------------------------------------------------------ */
  /* 상태 흐름                                                           */
  /* ------------------------------------------------------------------ */

  function setState(s) {
    G.state = s;
    G.stateT = 0;
    G.events = {};
    if (s === 'faceOff') G.canAttack = false;
  }

  function findChar(id) {
    return MS_CHARS.find((c) => c.id === id) || MS_CHARS[0];
  }

  function resetFx() {
    G.particles.length = 0;
    G.confetti.length = 0;
    G.floaters.length = 0;
  }

  function startGame() {
    G.player = findChar(G.playerId);
    G.enemy = findChar(G.enemyId);
    G.rounds = 0;
    G.playerAttack = null;
    G.enemyAttack = null;
    resetFx();
    els.select.classList.remove('is-on');
    els.ending.classList.remove('is-on');
    buildAttackBar(G.player);
    setState('faceOff');
  }

  function startAttack(id) {
    if (!G.canAttack) return;
    const list = G.player.attacks;
    G.playerAttack = list.find((a) => a.id === id) || list[0];
    G.canAttack = false;
    setState('playerAttack');
  }

  function again() {
    // 내 친구는 유지, 상대만 현재와 다른 종으로 랜덤 교체
    const others = MS_CHARS.filter((c) => c.id !== G.enemyId);
    const next = pick(others);
    G.enemyId = next.id;
    G.enemy = next;
    markSelected(els.enemyRow, G.enemyId);

    G.rounds = 0;
    G.playerAttack = null;
    G.enemyAttack = null;
    resetFx();
    els.ending.classList.remove('is-on');
    setState('faceOff');
  }

  function backToSelect() {
    els.ending.classList.remove('is-on');
    els.select.classList.add('is-on');
    setState('select');
    G.canAttack = false;
  }

  function showEnding() {
    G.state = 'ending';
    G.canAttack = false;
    els.ending.classList.add('is-on');
  }

  function hitAtFor(atk) {
    if (!atk) return 0.42;
    if (atk.motion === 'dash' || atk.motion === 'hop') return 0.42;
    if (atk.motion === 'splash') return 0.4;
    return 0.3;
  }

  // 공격 1회 연출 (공격자 기준). contact(dash/hop)는 돌진, shout/splash은 제자리.
  function resolveAttackSide(isPlayer, atk, t) {
    if (!atk) return;
    const geo = stageGeo();
    const me = isPlayer ? G.player : G.enemy;
    const aRest = isPlayer ? geo.playerX : geo.enemyX;
    const dRest = isPlayer ? geo.enemyX : geo.playerX;
    const dir = isPlayer ? 1 : -1;
    const hitAt = hitAtFor(atk);
    const fs = Math.min(G.W, G.H);

    if (!G.events.cry && t > 0.05) {
      MS_SOUND.play(atk.sfx);
      spawnFloater(atk.label, aRest + dir * geo.r * 0.35, G.H * 0.3, me.accent, fs * 0.065);
      G.events.cry = true;
    }
    if (!G.events.hit && t > hitAt) {
      if (atk.motion === 'shout') {
        spawnRing(aRest + dir * geo.r * 0.5, G.H * 0.5, me.accent, geo.r * 2.2);
        spawnRing(aRest + dir * geo.r * 0.5, G.H * 0.5, me.accent, geo.r * 1.4);
        spawnHit(dRest, G.H * 0.5, 5);
        spawnFloater('부르르~', dRest, G.H * 0.34, '#e8590c', fs * 0.055);
      } else if (atk.motion === 'splash') {
        spawnBubblesFrom(aRest + dir * geo.r * 0.4, G.H * 0.48, dir);
        spawnBubbleBurst(dRest, G.H * 0.5);
        spawnFloater('폭신!', dRest, G.H * 0.34, '#e8590c', fs * 0.07);
      } else {
        const hx = dRest - dir * geo.gap * 0.4;
        spawnAttackEffect(atk.effect, hx, G.H * 0.5);
        spawnFloater('폭신!', hx, G.H * 0.32, '#e8590c', fs * 0.075);
        if (atk.motion === 'hop') spawnDust(dRest, G.H * 0.6);
      }
      MS_SOUND.play('poof');
      MS_SOUND.play('laugh');
      G.events.hit = true;
    }
  }

  function update(dt) {
    G.stateT += dt;
    const t = G.stateT;

    if (G.state === 'faceOff') {
      if (!G.events.growl && t > 0.12) {
        MS_SOUND.play('growl');
        spawnFloater('으르렁~', G.W * 0.5, G.H * 0.26, '#8a6a2a', Math.min(G.W, G.H) * 0.07);
        G.events.growl = true;
      }
      if (t > 0.85) G.canAttack = true;
    } else if (G.state === 'playerAttack') {
      resolveAttackSide(true, G.playerAttack, t);
      if (t > 1.15) {
        G.enemyAttack = pick(G.enemy.attacks);
        setState('enemyAttack');
      }
    } else if (G.state === 'enemyAttack') {
      resolveAttackSide(false, G.enemyAttack, t);
      if (t > 1.15) {
        G.rounds += 1;
        if (G.rounds >= 3) setState('highFive');
        else setState('faceOff');
      }
    } else if (G.state === 'highFive') {
      if (!G.events.hf && t > 0.05) {
        MS_SOUND.play('highfive');
        MS_SOUND.play('win');
        spawnConfetti();
        spawnFloater('짝!', G.W * 0.5, G.H * 0.28, '#d6336c', Math.min(G.W, G.H) * 0.09);
        G.events.hf = true;
      }
      if (t > 1.6) showEnding();
    }

    updateFx(dt);

    els.attackBar.classList.toggle('is-on', G.state === 'faceOff' && G.canAttack);
  }

  /* ------------------------------------------------------------------ */
  /* 렌더                                                                */
  /* ------------------------------------------------------------------ */

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  // 공격 시 상대 앞까지 달려갔다가 돌아오는 진행도 (0~1)
  function attackCharge(t) {
    const dashEnd = 0.34;
    const holdEnd = 0.64;
    const backEnd = 1.12;
    if (t <= 0) return 0;
    if (t < dashEnd) return easeOutCubic(t / dashEnd);
    if (t < holdEnd) return 1;
    if (t < backEnd) return 1 - easeInOutCubic((t - holdEnd) / (backEnd - holdEnd));
    return 0;
  }

  const hitVal = (t) => (t < 0 || t > 0.5 ? 0 : Math.sin((t / 0.5) * Math.PI));

  function stageGeo() {
    const u = Math.min(G.W, G.H);
    const r = clamp(u * 0.135, 30, 78);
    return {
      r,
      gap: r * 1.35,
      playerX: G.W * 0.3,
      enemyX: G.W * 0.7,
      cy: G.H * 0.52,
    };
  }

  function render() {
    const ctx = G.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, G.W, G.H);
    drawBg(ctx);

    if (G.state === 'select') {
      drawFx(ctx);
      return;
    }

    const t = G.stateT;
    const geo = stageGeo();
    const r = geo.r;
    const cy = geo.cy;

    const pAtk = G.state === 'playerAttack' ? G.playerAttack : null;
    const eAtk = G.state === 'enemyAttack' ? G.enemyAttack : null;
    const isContact = (atk) => !!atk && (atk.motion === 'dash' || atk.motion === 'hop');

    let pCharge = isContact(pAtk) ? attackCharge(t) : 0;
    let mCharge = isContact(eAtk) ? attackCharge(t) : 0;
    let pHop = pAtk && pAtk.motion === 'hop' && t < 0.5 ? Math.sin(Math.PI * (t / 0.5)) * r * 1.1 : 0;
    let mHop = eAtk && eAtk.motion === 'hop' && t < 0.5 ? Math.sin(Math.PI * (t / 0.5)) * r * 1.1 : 0;

    let pSquash = 0;
    let mSquash = 0;
    let pGig = 0;
    let mGig = 0;
    let pTilt = 0;
    let mTilt = 0;

    let px = geo.playerX;
    let mx = geo.enemyX;

    if (G.state === 'highFive') {
      const k = Math.min(1, t / 0.5);
      px += (G.W * 0.43 - px) * k;
      mx += (G.W * 0.57 - mx) * k;
      pGig = 1;
      mGig = 1;
    }

    // contact 계열만 상대 앞까지 돌진
    px += (geo.enemyX - geo.gap - geo.playerX) * pCharge;
    mx -= (geo.enemyX - (geo.playerX + geo.gap)) * mCharge;

    if (pAtk) {
      const it = hitAtFor(pAtk);
      if (t > it) mSquash = Math.max(mSquash, hitVal(t - it) * 0.9);
      if (t > it + 0.02 && t < 1.05) mGig = 1;
      const kb = pAtk.motion === 'shout' ? 0.08 : pAtk.motion === 'splash' ? 0.1 : pAtk.motion === 'hop' ? 0.25 : 0.2;
      if (t > it && t < it + 0.32) mx += Math.sin(((t - it) / 0.32) * Math.PI) * r * kb;
      if (pAtk.motion === 'shout' && t > 0.08 && t < 0.6) {
        pTilt = Math.sin(((t - 0.08) / 0.52) * Math.PI) * 0.16;
        pGig = 1;
      }
    }
    if (eAtk) {
      const it = hitAtFor(eAtk);
      if (t > it) pSquash = Math.max(pSquash, hitVal(t - it) * 0.9);
      if (t > it + 0.02 && t < 1.05) pGig = 1;
      const kb = eAtk.motion === 'shout' ? 0.08 : eAtk.motion === 'splash' ? 0.1 : eAtk.motion === 'hop' ? 0.25 : 0.2;
      if (t > it && t < it + 0.32) px -= Math.sin(((t - it) / 0.32) * Math.PI) * r * kb;
      if (eAtk.motion === 'shout' && t > 0.08 && t < 0.6) {
        mTilt = -Math.sin(((t - 0.08) / 0.52) * Math.PI) * 0.16;
        mGig = 1;
      }
    }

    const time = G.time;
    drawCritter(ctx, G.enemy, mx, cy - mHop, r, {
      facing: -1,
      time,
      phase: 1.7,
      lunge: mCharge,
      squash: mSquash,
      giggle: mGig,
      tilt: mTilt,
    });
    drawCritter(ctx, G.player, px, cy - pHop, r, {
      facing: 1,
      time,
      phase: 0,
      lunge: pCharge,
      squash: pSquash,
      giggle: pGig,
      tilt: pTilt,
    });

    drawFx(ctx);
  }

  /* ------------------------------------------------------------------ */
  /* 초기화                                                              */
  /* ------------------------------------------------------------------ */

  function resize() {
    const rect = els.stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    G.W = Math.max(1, rect.width);
    G.H = Math.max(1, rect.height);
    G.dpr = dpr;
    els.canvas.width = Math.round(G.W * dpr);
    els.canvas.height = Math.round(G.H * dpr);
    G.ctx = els.canvas.getContext('2d');
    G.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawThumb(canvas, ch) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCritter(ctx, ch, canvas.width * 0.46, canvas.height * 0.54, canvas.width * 0.26, {
      facing: 1,
      time: 0.6,
    });
  }

  function buildAttackBar(ch) {
    els.attackBar.innerHTML = '';
    ch.attacks.forEach((atk) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'atk-btn';
      btn.dataset.attack = atk.id;

      const emo = document.createElement('span');
      emo.className = 'atk-emoji';
      emo.textContent = atk.emoji;

      const lab = document.createElement('span');
      lab.className = 'atk-label';
      lab.textContent = atk.label;

      btn.appendChild(emo);
      btn.appendChild(lab);
      btn.addEventListener('click', () => {
        if (G.state === 'faceOff' && G.canAttack) startAttack(atk.id);
      });
      els.attackBar.appendChild(btn);
    });
  }

  function markSelected(rowEl, id) {
    Array.from(rowEl.children).forEach((el) => {
      el.classList.toggle('is-selected', el.dataset.id === id);
    });
  }

  function makePickRow(rowEl, onPick) {
    rowEl.innerHTML = '';
    MS_CHARS.forEach((ch) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'pick-card';
      card.dataset.id = ch.id;
      card.style.setProperty('--sel', ch.color);

      const cv = document.createElement('canvas');
      cv.className = 'pick-thumb';
      cv.width = 96;
      cv.height = 96;

      const name = document.createElement('span');
      name.className = 'pick-name';
      name.textContent = ch.name;

      card.appendChild(cv);
      card.appendChild(name);
      card.addEventListener('click', () => {
        onPick(ch.id);
        MS_SOUND.play('select');
      });

      rowEl.appendChild(card);
      drawThumb(cv, ch);
    });
  }

  function buildSelect() {
    makePickRow(els.myRow, (id) => {
      G.playerId = id;
      markSelected(els.myRow, id);
    });
    makePickRow(els.enemyRow, (id) => {
      G.enemyId = id;
      markSelected(els.enemyRow, id);
    });
    markSelected(els.myRow, G.playerId);
    markSelected(els.enemyRow, G.enemyId);
  }

  function loop(ts) {
    const lastT = G.last || ts;
    let dt = (ts - lastT) / 1000;
    G.last = ts;
    if (dt > 0.05) dt = 0.05;
    G.time = ts / 1000;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function bind() {
    document.addEventListener('pointerdown', () => MS_SOUND.unlock(), { passive: true });

    els.startBtn.addEventListener('click', () => {
      MS_SOUND.play('select');
      startGame();
    });

    els.btnAgain.addEventListener('click', () => {
      MS_SOUND.play('tap');
      again();
    });

    els.btnChange.addEventListener('click', () => {
      MS_SOUND.play('tap');
      backToSelect();
    });

    els.sound.addEventListener('click', () => {
      MS_SOUND.muted = !MS_SOUND.muted;
      els.sound.textContent = MS_SOUND.muted ? '🔇' : '🔊';
      if (!MS_SOUND.muted) MS_SOUND.play('tap');
    });

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 120));
  }

  function init() {
    resize();
    buildSelect();
    bind();
    setState('select');
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
