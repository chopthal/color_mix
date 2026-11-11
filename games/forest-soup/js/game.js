/**
 * 숲속 냄비 요리
 * 재료를 냄비에 퐁당 넣고, 뱅글뱅글·톡톡으로 저어서, 숲속 친구에게 냠냠 먹인다.
 * 정답·실패·타이머 압박 없음. 좋아하는 재료가 들어가면 친구가 더 크게 기뻐한다.
 */
(() => {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LEGACY_FED_KEY = 'forest-soup-fed';
  const RING_LENGTH = 289;
  const TURNS_TO_FINISH = 1.5;
  const BOWLS_PER_SESSION = 4;
  const ASSET_BASE = 'assets/';

  const store = window.KidsKit
    ? window.KidsKit.store('forest-soup')
    : {
        get(_k, fallback) {
          return fallback;
        },
        set() {
          return false;
        },
        update(_k, updater, fallback) {
          return typeof updater === 'function' ? updater(fallback) : updater;
        },
      };

  const els = {
    stage: document.getElementById('stage'),
    potZone: document.getElementById('potZone'),
    potWrap: document.getElementById('potWrap'),
    potFace: document.getElementById('potFace'),
    soup: document.getElementById('soup'),
    soupBits: document.getElementById('soupBits'),
    soupToppings: document.getElementById('soupToppings'),
    ringFill: document.getElementById('ringFill'),
    splashRing: document.getElementById('splashRing'),
    stirCue: document.getElementById('stirCue'),
    tray: document.getElementById('tray'),
    fxLayer: document.getElementById('fxLayer'),
    hintBubble: document.getElementById('hintBubble'),
    hintText: document.getElementById('hintText'),
    friendSpot: document.getElementById('friendSpot'),
    friendEmoji: document.getElementById('friendEmoji'),
    friendBubble: document.getElementById('friendBubble'),
    friendsTree: document.getElementById('friendsTree'),
    mealTrail: document.getElementById('mealTrail'),
    welcomeBanner: document.getElementById('welcomeBanner'),
    endingOverlay: document.getElementById('endingOverlay'),
    endingOrnament: document.getElementById('endingOrnament'),
    endingTitle: document.getElementById('endingTitle'),
    endingSub: document.getElementById('endingSub'),
    btnAgain: document.getElementById('btnAgain'),
    btnSound: document.getElementById('btnSound'),
  };

  const hexToRgb = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };

  const INGREDIENTS = [
    { id: 'carrot', emoji: '🥕', name: '당근', color: '#ff9b4a', topping: '🧡' },
    { id: 'mushroom', emoji: '🍄', name: '버섯', color: '#e07a5f', topping: '🤎' },
    { id: 'corn', emoji: '🌽', name: '옥수수', color: '#ffd166', topping: '💛' },
    { id: 'broccoli', emoji: '🥦', name: '브로콜리', color: '#7ac74f', topping: '💚' },
    { id: 'apple', emoji: '🍎', name: '사과', color: '#ff7a7a', topping: '❤️' },
  ].map((ing) => ({ ...ing, rgb: hexToRgb(ing.color) }));

  const FRIENDS = [
    {
      id: 'rabbit',
      emoji: '🐰',
      name: '토끼',
      favorite: 'carrot',
      yum: ['맛있다!', '고마워!', '쭉쭉~'],
      love: ['당근 최고!', '와아 좋아!', '당근 수프!'],
    },
    {
      id: 'bear',
      emoji: '🐻',
      name: '곰',
      favorite: 'mushroom',
      yum: ['맛있다!', '배불러!', '냠냠~'],
      love: ['버섯 최고!', '우와 맛있다!', '버섯 수프!'],
    },
    {
      id: 'fox',
      emoji: '🦊',
      name: '여우',
      favorite: 'apple',
      yum: ['맛있다!', '고마워!', '달콤해~'],
      love: ['사과 최고!', '달콤하다!', '사과 수프!'],
    },
    {
      id: 'deer',
      emoji: '🦌',
      name: '사슴',
      favorite: 'broccoli',
      yum: ['맛있다!', '고마워!', '신선해~'],
      love: ['초록 최고!', '싱싱하다!', '브로콜리!'],
    },
  ];

  const SOUP_BASE = { r: 242, g: 223, b: 176 };

  const ASSET_KEYS = [
    'pot',
    'friend-rabbit',
    'friend-bear',
    'friend-fox',
    'friend-deer',
    'ing-carrot',
    'ing-mushroom',
    'ing-corn',
    'ing-broccoli',
    'ing-apple',
    'forest-bg',
  ];

  const G = {
    state: 'cook',
    round: 0,
    sessionFriends: [],
    ingredients: [],
    soupColor: { ...SOUP_BASE },
    progress: 0,
    stirring: false,
    hasStirred: false,
    stirAngle: 0,
    lastAngle: null,
    swishAcc: 0,
    friend: FRIENDS[0],
    lastFriendId: null,
    timers: [],
    idleTimer: null,
    nudgeHintTimer: null,
    visitCount: 0,
    firstVisit: true,
    tapBoost: true,
    lovedThisBowl: false,
    pointerMoved: false,
    assets: {},
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ------------------------------------------------------------------ */
  /* 사운드 (Web Audio API) — 낮은 음량, 둥근 음색                        */
  /* ------------------------------------------------------------------ */

  const SOUND = {
    ctx: null,
    muted: false,

    unlock() {
      if (!this.ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        try {
          this.ctx = new Ctx();
        } catch (e) {
          return;
        }
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    },

    tone(freq, dur, type, vol, when, slideTo) {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime + (when || 0);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      }
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol || 0.16, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    },

    noise(dur, vol, cutoff) {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime;
      const length = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      }
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cutoff || 1000;
      const gain = this.ctx.createGain();
      gain.gain.value = vol || 0.12;
      source.connect(filter).connect(gain).connect(this.ctx.destination);
      source.start(t0);
    },

    play(name) {
      if (this.muted) return;
      this.unlock();
      if (!this.ctx) return;

      switch (name) {
        case 'tap':
          this.tone(560, 0.07, 'sine', 0.1);
          break;
        case 'pop':
          this.tone(420, 0.1, 'sine', 0.16, 0, 760);
          break;
        case 'plop':
          this.tone(300, 0.12, 'sine', 0.17, 0, 170);
          this.noise(0.1, 0.06, 700);
          break;
        case 'swish':
          this.noise(0.12, 0.05, 900);
          this.tone(330, 0.1, 'sine', 0.04, 0, 480);
          break;
        case 'ready':
          [523, 659, 784, 1046].forEach((f, i) => {
            this.tone(f, 0.2, 'triangle', 0.12, i * 0.09);
          });
          break;
        case 'chomp':
          this.tone(190, 0.12, 'sawtooth', 0.09, 0, 120);
          this.noise(0.08, 0.06, 600);
          break;
        case 'yum':
          [659, 880, 1046].forEach((f, i) => {
            this.tone(f, 0.18, 'sine', 0.12, i * 0.07);
          });
          break;
        case 'love':
          [784, 988, 1175, 1318].forEach((f, i) => {
            this.tone(f, 0.2, 'triangle', 0.13, i * 0.08);
          });
          this.noise(0.2, 0.04, 2200);
          break;
        case 'win':
          [523, 659, 784, 1046, 1318].forEach((f, i) => {
            this.tone(f, 0.24, 'triangle', 0.11, i * 0.1);
          });
          this.noise(0.3, 0.05, 2400);
          break;
        default:
          break;
      }
    },
  };

  /* ------------------------------------------------------------------ */
  /* 색·유틸                                                             */
  /* ------------------------------------------------------------------ */

  function mixColor(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
    };
  }

  const rgbCss = (c) => `rgb(${c.r}, ${c.g}, ${c.b})`;

  function soupBackground(c) {
    const light = mixColor(c, { r: 255, g: 255, b: 255 }, 0.55);
    const dark = mixColor(c, { r: 92, g: 62, b: 24 }, 0.2);
    return `radial-gradient(circle at 36% 30%, ${rgbCss(light)} 0%, ${rgbCss(c)} 50%, ${rgbCss(dark)} 100%)`;
  }

  function schedule(fn, ms) {
    const id = setTimeout(fn, ms);
    G.timers.push(id);
    return id;
  }

  function clearTimers() {
    G.timers.forEach((id) => clearTimeout(id));
    G.timers = [];
  }

  function stagePoint(rect) {
    const sr = els.stage.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - sr.left,
      y: rect.top + rect.height / 2 - sr.top,
    };
  }

  function animateEl(el, frames, opts, onDone) {
    if (typeof el.animate === 'function' && !REDUCED) {
      const anim = el.animate(frames, opts);
      anim.onfinish = onDone;
      anim.oncancel = onDone;
      return;
    }
    if (onDone) setTimeout(onDone, Math.min(opts.duration || 300, 300));
  }

  function isRealAsset(img) {
    return !!(img && img.dataset && img.dataset.kidsKitPlaceholder !== '1' && img.naturalWidth > 1);
  }

  function fillVisual(el, key, fallbackEmoji) {
    if (!el) return;
    const img = G.assets[key];
    if (isRealAsset(img)) {
      el.textContent = '';
      const node = img.cloneNode(true);
      node.className = 'slot-img';
      node.alt = '';
      node.setAttribute('draggable', 'false');
      el.appendChild(node);
      el.classList.add('has-slot-img');
    } else {
      el.textContent = fallbackEmoji;
      el.classList.remove('has-slot-img');
    }
  }

  /* ------------------------------------------------------------------ */
  /* 힌트·스캐폴딩                                                        */
  /* ------------------------------------------------------------------ */

  function setHint(text) {
    if (els.hintText.textContent === text) return;
    els.hintText.textContent = text;
    els.hintBubble.classList.remove('pop');
    void els.hintBubble.offsetWidth;
    els.hintBubble.classList.add('pop');
  }

  function clearIdle() {
    clearTimeout(G.idleTimer);
    G.idleTimer = null;
    clearTimeout(G.nudgeHintTimer);
    G.nudgeHintTimer = null;
    els.tray.classList.remove('nudge');
    els.potWrap.classList.remove('nudge');
  }

  function scheduleIdle() {
    clearIdle();
    G.idleTimer = setTimeout(() => {
      if (G.state !== 'cook' || G.stirring) return;
      if (G.ingredients.length === 0) {
        els.tray.classList.add('nudge');
      } else {
        els.potWrap.classList.add('nudge');
        refreshStirCue();
      }
    }, G.tapBoost ? 4500 : 6000);
  }

  function refreshStirCue() {
    if (!els.stirCue) return;
    if (G.tapBoost && !G.hasStirred) {
      els.stirCue.textContent = '톡톡·뱅글뱅글';
      els.potWrap.classList.add('is-tap-friendly');
    } else {
      els.stirCue.textContent = '뱅글뱅글';
      els.potWrap.classList.remove('is-tap-friendly');
    }
  }

  /* ------------------------------------------------------------------ */
  /* 재료 넣기                                                            */
  /* ------------------------------------------------------------------ */

  function syncPotClasses() {
    const has = G.ingredients.length > 0;
    els.potWrap.classList.toggle('has-ingredients', has);
    els.potWrap.classList.toggle('is-cookable', has);
    if (!G.hasStirred) {
      els.potWrap.classList.toggle('is-stir-ready', has);
    }
    refreshStirCue();
  }

  function hasFavorite() {
    return G.ingredients.some((ing) => ing.id === G.friend.favorite);
  }

  function recomputeSoupColor() {
    if (G.ingredients.length === 0) {
      G.soupColor = { ...SOUP_BASE };
      return;
    }
    let c = { ...SOUP_BASE };
    G.ingredients.forEach((ing, i) => {
      const t = 0.42 + Math.min(0.18, i * 0.04);
      c = mixColor(c, ing.rgb, t);
    });
    G.soupColor = c;
  }

  function updateSoupVisual() {
    recomputeSoupColor();
    els.soup.style.background = soupBackground(G.soupColor);
    els.soup.style.setProperty('--soup-rgb', rgbCss(G.soupColor));
    renderToppings();
  }

  function renderToppings() {
    if (!els.soupToppings) return;
    els.soupToppings.innerHTML = '';
    if (G.ingredients.length === 0) return;

    const unique = [];
    G.ingredients.forEach((ing) => {
      if (!unique.find((u) => u.id === ing.id)) unique.push(ing);
    });

    unique.slice(0, 4).forEach((ing, i) => {
      const flake = document.createElement('span');
      flake.className = `soup-topping topping-${ing.id}`;
      flake.textContent = ing.topping;
      flake.style.setProperty('--tx', `${18 + i * 18 + rand(-4, 4)}%`);
      flake.style.setProperty('--ty', `${22 + ((i * 23) % 50) + rand(-6, 6)}%`);
      flake.style.animationDelay = `${rand(0, 1.2)}s`;
      els.soupToppings.appendChild(flake);
    });

    if (unique.length >= 2) {
      const swirl = document.createElement('span');
      swirl.className = 'soup-swirl';
      swirl.style.setProperty('--swirl-a', rgbCss(mixColor(unique[0].rgb, { r: 255, g: 255, b: 255 }, 0.35)));
      swirl.style.setProperty('--swirl-b', rgbCss(mixColor(unique[1].rgb, { r: 255, g: 255, b: 255 }, 0.35)));
      els.soupToppings.appendChild(swirl);
    }

    els.soup.classList.toggle('is-rich', G.ingredients.length >= 3);
  }

  function addIngredient(ing) {
    if (G.state !== 'cook') return;
    clearIdle();
    SOUND.unlock();
    SOUND.play('pop');
    if (window.KidsKit) window.KidsKit.haptic('soft');

    G.ingredients.push(ing);
    updateSoupVisual();
    syncPotClasses();

    if (G.ingredients.length === 1) {
      setHint(G.tapBoost ? '냄비를 톡톡!' : '냄비를 뱅글뱅글!');
    }

    if (ing.id === G.friend.favorite) {
      els.friendBubble.textContent = pick(['오!', '좋아!', '와!']);
      els.friendSpot.classList.add('is-peek');
      schedule(() => els.friendSpot.classList.remove('is-peek'), 700);
    }

    const btn = els.tray.querySelector(`.ingredient[data-id="${ing.id}"]`);
    if (btn) flyIngredient(ing, btn);
    scheduleIdle();
  }

  function flyIngredient(ing, btn) {
    const br = btn.getBoundingClientRect();
    const srRect = els.soup.getBoundingClientRect();
    const start = stagePoint(br);
    const end = stagePoint(srRect);
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    const el = document.createElement('span');
    el.className = 'flying-ing';
    fillVisual(el, `ing-${ing.id}`, ing.emoji);
    if (!el.classList.contains('has-slot-img')) el.textContent = ing.emoji;
    el.style.left = `${start.x}px`;
    el.style.top = `${start.y}px`;
    els.fxLayer.appendChild(el);

    animateEl(
      el,
      [
        { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 52}px)) scale(1.22) rotate(160deg)`,
          opacity: 1,
          offset: 0.55,
        },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.4) rotate(330deg)`,
          opacity: 0.25,
        },
      ],
      { duration: REDUCED ? 1 : 500, easing: 'cubic-bezier(0.34, 0.7, 0.3, 1)' },
      () => {
        el.remove();
        landIngredient(ing);
      }
    );
  }

  function landIngredient(ing) {
    SOUND.play('plop');
    addSoupBit(ing);
    splash();
    spawnSparksAtSoup(3);
  }

  function addSoupBit(ing) {
    const bit = document.createElement('span');
    bit.className = `soup-bit bit-${ing.id}`;
    fillVisual(bit, `ing-${ing.id}`, ing.emoji);
    if (!bit.classList.contains('has-slot-img')) bit.textContent = ing.emoji;
    bit.style.left = `${rand(20, 80)}%`;
    bit.style.top = `${rand(20, 80)}%`;
    bit.style.animationDelay = `${rand(0, 1.4)}s`;
    els.soupBits.appendChild(bit);
    while (els.soupBits.children.length > 10) {
      els.soupBits.firstElementChild.remove();
    }
  }

  function splash() {
    els.splashRing.classList.remove('is-splashing');
    void els.splashRing.offsetWidth;
    els.splashRing.classList.add('is-splashing');
  }

  /* ------------------------------------------------------------------ */
  /* 젓기                                                                */
  /* ------------------------------------------------------------------ */

  function updateRing() {
    els.ringFill.style.strokeDashoffset = String(RING_LENGTH * (1 - G.progress));
  }

  function angleAt(e) {
    const r = els.potZone.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  }

  /** 첫 방문·첫 그릇은 톡톡 연타만으로도 충분히 차오르게 한다. */
  function tapStirAmount() {
    if (G.tapBoost) return 0.17;
    if (G.visitCount <= 1) return 0.11;
    return 0.08;
  }

  function nudgeIngredientsHint() {
    els.tray.classList.remove('nudge');
    void els.tray.offsetWidth;
    els.tray.classList.add('nudge');
    clearTimeout(G.nudgeHintTimer);
    G.nudgeHintTimer = setTimeout(() => {
      G.nudgeHintTimer = null;
      els.tray.classList.remove('nudge');
      if (G.state === 'cook' && !G.stirring) scheduleIdle();
    }, 1100);
  }

  function onPotDown(e) {
    if (G.state !== 'cook') return;
    e.preventDefault();
    clearIdle();
    SOUND.unlock();

    if (G.ingredients.length === 0) {
      nudgeIngredientsHint();
      return;
    }

    G.stirring = true;
    G.hasStirred = true;
    G.pointerMoved = false;
    G.lastAngle = angleAt(e);
    els.potWrap.classList.remove('is-stir-ready', 'nudge');
    els.potWrap.classList.add('is-stirring');
    refreshStirCue();

    try {
      els.potZone.setPointerCapture(e.pointerId);
    } catch (err) {
      /* Safari 구형: 캡처 실패해도 아래 move 로 처리 */
    }

    addStir(tapStirAmount());
    if (window.KidsKit) window.KidsKit.haptic('light');
  }

  function onPotMove(e) {
    if (!G.stirring || G.state !== 'cook') return;
    const a = angleAt(e);
    if (G.lastAngle !== null) {
      let d = a - G.lastAngle;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;

      if (Math.abs(d) > 0.01) {
        G.pointerMoved = true;
        addStir(Math.abs(d) / (Math.PI * 2 * TURNS_TO_FINISH));
        G.stirAngle = (a * 180) / Math.PI;
        els.potWrap.style.setProperty('--spoon-angle', `${G.stirAngle}deg`);
      }
    }
    G.lastAngle = a;
  }

  function onPotUp(e) {
    if (!G.stirring) return;
    // 짧은 톡(거의 안 움직임)이면 한 번 더 살짝 보태 연타 친숙을 돕는다
    if (!G.pointerMoved && G.state === 'cook' && G.ingredients.length > 0) {
      addStir(tapStirAmount() * 0.35);
    }
    G.stirring = false;
    G.lastAngle = null;
    els.potWrap.classList.remove('is-stirring');
    if (G.state === 'cook') {
      els.potWrap.classList.add('is-cookable');
      scheduleIdle();
    }
    try {
      els.potZone.releasePointerCapture(e.pointerId);
    } catch (err) {
      /* noop */
    }
  }

  function addStir(amount) {
    if (G.state !== 'cook' || amount <= 0) return;
    if (G.ingredients.length === 0) return;
    G.progress = Math.min(1, G.progress + amount);
    updateRing();

    G.swishAcc += amount;
    if (G.swishAcc >= 0.1) {
      G.swishAcc = 0;
      SOUND.play('swish');
    }
    if (Math.random() < 0.5) spawnSparksAtSoup(1);

    if (G.progress >= 1) finishStir();
  }

  function finishStir() {
    if (G.state !== 'cook') return;
    G.state = 'serving';
    G.stirring = false;
    G.progress = 1;
    updateRing();

    els.potWrap.classList.remove('is-stirring', 'is-stir-ready', 'is-cookable', 'nudge', 'is-tap-friendly');
    els.potWrap.classList.add('is-full', 'has-ingredients');
    els.tray.classList.add('is-dim');
    setHint('보글보글~');
    SOUND.play('ready');
    spawnSparksAtSoup(8);
    clearIdle();

    schedule(serveSoup, 650);
  }

  /* ------------------------------------------------------------------ */
  /* 시식                                                                */
  /* ------------------------------------------------------------------ */

  function serveSoup() {
    if (G.state !== 'serving') return;

    const start = stagePoint(els.soup.getBoundingClientRect());
    const end = stagePoint(els.friendEmoji.getBoundingClientRect());

    const bowl = document.createElement('span');
    bowl.className = 'flying-bowl';
    bowl.textContent = '🥣';
    bowl.style.left = `${start.x}px`;
    bowl.style.top = `${start.y}px`;
    bowl.style.setProperty('--bowl-tint', rgbCss(G.soupColor));
    els.fxLayer.appendChild(bowl);

    const dx = end.x - start.x;
    const dy = end.y - start.y;

    animateEl(
      bowl,
      [
        { transform: 'translate(-50%, -50%) scale(0.7) rotate(0deg)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 46}px)) scale(1.05) rotate(-18deg)`,
          opacity: 1,
          offset: 0.55,
        },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.85) rotate(0deg)`,
          opacity: 0.9,
        },
      ],
      { duration: REDUCED ? 1 : 620, easing: 'cubic-bezier(0.34, 0.7, 0.3, 1)' },
      () => {
        bowl.remove();
        beginBites();
      }
    );
  }

  function beginBites() {
    if (G.state === 'ending') return;
    G.state = 'tasting';
    G.lovedThisBowl = hasFavorite();
    els.friendSpot.classList.add('is-tasting');
    if (G.lovedThisBowl) els.friendSpot.classList.add('is-love-taste');
    els.friendBubble.textContent = G.lovedThisBowl ? '우와 냠냠!' : '냠냠!';

    let bites = 0;
    const bite = () => {
      if (G.state !== 'tasting') return;
      bites += 1;
      SOUND.play('chomp');
      spawnBiteCrumbs();

      const bit = els.soupBits.querySelector('.soup-bit:not(.is-eaten)');
      if (bit) {
        bit.classList.add('is-eaten');
        schedule(() => bit.remove(), 420);
      }
      els.soup.style.transform = `scale(${Math.max(0.86, 1 - bites * 0.04)})`;

      if (bites < 3) {
        schedule(bite, 430);
      } else {
        schedule(finishTaste, 480);
      }
    };

    schedule(bite, 200);
  }

  function finishTaste() {
    if (G.state !== 'tasting') return;
    G.state = 'roundEnd';
    els.friendSpot.classList.remove('is-tasting', 'is-love-taste');
    els.friendSpot.classList.add('is-happy');
    if (G.lovedThisBowl) els.friendSpot.classList.add('is-love');

    const lines = G.lovedThisBowl ? G.friend.love : G.friend.yum;
    els.friendBubble.textContent = pick(lines);

    if (G.lovedThisBowl) {
      SOUND.play('love');
      spawnHearts(14);
      if (window.KidsKit) window.KidsKit.haptic('success');
      setHint(`${G.friend.name}가 정말 좋아해!`);
    } else {
      SOUND.play('yum');
      spawnHearts(8);
      setHint('냠냠!');
    }

    recordFed(G.friend);
    G.sessionFriends.push({ friend: G.friend, loved: G.lovedThisBowl });
    G.round += 1;
    updateMealTrail();

    schedule(nextRound, G.lovedThisBowl ? 1900 : 1500);
  }

  function nextRound() {
    if (G.state !== 'roundEnd') return;
    if (G.round >= BOWLS_PER_SESSION) {
      showEnding();
      return;
    }
    G.state = 'cook';
    // 첫 방문·첫 그릇만 강한 톡톡 보정(이미 round가 올라간 뒤이므로 이후는 완화).
    G.tapBoost = false;
    els.friendSpot.classList.remove('is-happy', 'is-love');
    resetPot();
    chooseFriend();
    els.tray.classList.remove('is-dim');
    setHint('재료를 냄비에 콕!');
    scheduleIdle();
  }

  function resetPot() {
    G.ingredients = [];
    G.soupColor = { ...SOUP_BASE };
    G.progress = 0;
    G.hasStirred = false;
    G.stirring = false;
    G.lastAngle = null;
    G.stirAngle = 0;
    G.swishAcc = 0;
    G.lovedThisBowl = false;
    G.pointerMoved = false;

    els.potWrap.classList.remove(
      'has-ingredients',
      'is-full',
      'is-stirring',
      'is-stir-ready',
      'nudge',
      'is-cookable',
      'is-tap-friendly'
    );
    els.potWrap.style.setProperty('--spoon-angle', '0deg');
    els.soup.style.background = soupBackground(SOUP_BASE);
    els.soup.style.transform = 'scale(1)';
    els.soup.classList.remove('is-rich');
    els.soupBits.innerHTML = '';
    if (els.soupToppings) els.soupToppings.innerHTML = '';
    updateRing();
    refreshStirCue();
  }

  function chooseFriend() {
    let next = pick(FRIENDS);
    if (FRIENDS.length > 1) {
      while (next.id === G.lastFriendId) next = pick(FRIENDS);
    }
    G.friend = next;
    G.lastFriendId = next.id;
    fillVisual(els.friendEmoji, `friend-${next.id}`, next.emoji);
    els.friendBubble.textContent = '냠냠?';
    els.friendSpot.classList.remove('is-happy', 'is-tasting', 'is-love', 'is-love-taste', 'is-peek');
    els.friendSpot.classList.remove('is-arriving');
    void els.friendSpot.offsetWidth;
    els.friendSpot.classList.add('is-arriving');
    schedule(() => els.friendSpot.classList.remove('is-arriving'), 650);
  }

  /* ------------------------------------------------------------------ */
  /* 효과                                                                */
  /* ------------------------------------------------------------------ */

  function spawnSparksAtSoup(count) {
    const center = stagePoint(els.potZone.getBoundingClientRect());
    const radius = els.potZone.getBoundingClientRect().width * 0.34;
    for (let i = 0; i < (REDUCED ? 1 : count); i += 1) {
      const a = rand(0, Math.PI * 2);
      const d = rand(radius * 0.35, radius);
      const x = center.x + Math.cos(a) * d;
      const y = center.y + Math.sin(a) * d;
      const el = document.createElement('span');
      el.className = 'fx-spark';
      el.textContent = pick(['✨', '⭐', '💛']);
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      els.fxLayer.appendChild(el);
      animateEl(
        el,
        [
          { transform: 'translate(-50%, -50%) scale(0.6)', opacity: 0.95 },
          {
            transform: `translate(calc(-50% + ${rand(-16, 16)}px), calc(-50% - ${rand(18, 40)}px)) scale(1.1)`,
            opacity: 0,
          },
        ],
        { duration: rand(420, 700), easing: 'ease-out' },
        () => el.remove()
      );
    }
  }

  function spawnBiteCrumbs() {
    const f = stagePoint(els.friendEmoji.getBoundingClientRect());
    const colors = ['#ffcf6b', '#ff9b4a', '#ffe08a', '#cdeab8', rgbCss(G.soupColor)];
    for (let i = 0; i < (REDUCED ? 3 : 7); i += 1) {
      const el = document.createElement('span');
      el.className = 'bite-crumb';
      el.style.left = `${f.x}px`;
      el.style.top = `${f.y}px`;
      el.style.background = pick(colors);
      els.fxLayer.appendChild(el);
      animateEl(
        el,
        [
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
          {
            transform: `translate(calc(-50% + ${rand(-46, 46)}px), calc(-50% + ${rand(-10, 52)}px)) scale(0.3)`,
            opacity: 0,
          },
        ],
        { duration: rand(380, 560), easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)' },
        () => el.remove()
      );
    }
  }

  function spawnHearts(count) {
    const f = stagePoint(els.friendEmoji.getBoundingClientRect());
    const glyphs = G.lovedThisBowl ? ['💛', '💚', '💖', '✨', '⭐'] : ['💛', '💚', '💖', '✨'];
    for (let i = 0; i < (REDUCED ? Math.min(3, count) : count); i += 1) {
      const el = document.createElement('span');
      el.className = 'fx-spark';
      el.textContent = pick(glyphs);
      el.style.left = `${f.x + rand(-30, 30)}px`;
      el.style.top = `${f.y + rand(-10, 22)}px`;
      els.fxLayer.appendChild(el);
      animateEl(
        el,
        [
          { transform: 'translate(-50%, -50%) scale(0.7)', opacity: 1 },
          {
            transform: `translate(calc(-50% + ${rand(-30, 30)}px), calc(-50% - ${rand(46, 90)}px)) scale(1.25)`,
            opacity: 0,
          },
        ],
        { duration: rand(650, 1000), easing: 'ease-out' },
        () => el.remove()
      );
    }
  }

  function spawnConfetti() {
    const colors = ['#ffd166', '#ff8fab', '#8ce0c0', '#9bc6ff', '#c9f0b8'];
    for (let i = 0; i < (REDUCED ? 10 : 30); i += 1) {
      const el = document.createElement('span');
      el.style.position = 'absolute';
      el.style.left = `${rand(8, 92)}%`;
      el.style.top = '-16px';
      el.style.width = '9px';
      el.style.height = '13px';
      el.style.borderRadius = '3px';
      el.style.background = pick(colors);
      el.style.zIndex = '50';
      el.style.pointerEvents = 'none';
      els.endingOverlay.appendChild(el);
      animateEl(
        el,
        [
          { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
          {
            transform: `translateY(${els.stage.getBoundingClientRect().height + 40}px) rotate(${rand(360, 900)}deg)`,
            opacity: 0,
          },
        ],
        { duration: rand(1300, 2200), easing: 'linear' },
        () => el.remove()
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /* 친구 스티커 저장 (KidsKit.store + 레거시 마이그레이션)                 */
  /* ------------------------------------------------------------------ */

  function loadFed() {
    let data = store.get('fed', null);
    if (!data || typeof data !== 'object') {
      try {
        const raw = localStorage.getItem(LEGACY_FED_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            data = parsed;
            store.set('fed', data);
          }
        }
      } catch (err) {
        data = null;
      }
    }
    return data && typeof data === 'object' ? data : {};
  }

  function saveFed(data) {
    store.set('fed', data);
  }

  function recordFed(friend) {
    const data = loadFed();
    data[friend.id] = (data[friend.id] || 0) + 1;
    saveFed(data);
    renderFriendsTree(data);
  }

  function renderFriendsTree(data) {
    els.friendsTree.innerHTML = '';
    FRIENDS.forEach((friend) => {
      const count = data[friend.id] || 0;
      if (!count) return;
      const chip = document.createElement('span');
      chip.className = 'friend-sticker';
      fillVisual(chip, `friend-${friend.id}`, friend.emoji);
      if (!chip.classList.contains('has-slot-img')) chip.textContent = friend.emoji;
      chip.title = `${friend.name}와 ${count}번 먹었어요`;
      if (count > 1) {
        const badge = document.createElement('span');
        badge.className = 'sticker-count';
        badge.textContent = String(count);
        chip.appendChild(badge);
      }
      els.friendsTree.appendChild(chip);
    });
  }

  function showWelcomeIfReturning() {
    const data = loadFed();
    const hasStickers = FRIENDS.some((f) => (data[f.id] || 0) > 0);
    if (!G.firstVisit && hasStickers && els.welcomeBanner) {
      els.welcomeBanner.hidden = false;
      els.welcomeBanner.classList.add('is-on');
      els.friendsTree.classList.add('is-welcome');
      setHint('친구 스티커가 반겨요!');
      schedule(() => {
        els.welcomeBanner.classList.remove('is-on');
        els.welcomeBanner.hidden = true;
        els.friendsTree.classList.remove('is-welcome');
      }, 2800);
    }
  }

  /* ------------------------------------------------------------------ */
  /* 진행·엔딩                                                           */
  /* ------------------------------------------------------------------ */

  function updateMealTrail() {
    Array.from(els.mealTrail.children).forEach((el, i) => {
      el.classList.toggle('is-full', i < G.round);
    });
  }

  function startSession() {
    clearTimers();
    clearIdle();
    G.round = 0;
    G.sessionFriends = [];
    G.state = 'cook';
    G.tapBoost = G.firstVisit;
    els.endingOverlay.classList.remove('is-on');
    els.tray.classList.remove('is-dim');
    updateMealTrail();
    resetPot();
    chooseFriend();
    setHint('재료를 냄비에 콕!');
    scheduleIdle();
  }

  function showEnding() {
    G.state = 'ending';
    els.tray.classList.add('is-dim');
    const lovedCount = G.sessionFriends.filter((s) => s.loved).length;
    const faces =
      G.sessionFriends.length > 0
        ? G.sessionFriends.map((s) => s.friend.emoji).join('')
        : '🐰🐻🦊🦌';
    els.endingOrnament.textContent = faces;
    if (els.endingTitle) {
      els.endingTitle.textContent = lovedCount > 0 ? '친구가 정말 좋아했어!' : '냠냠! 잘 먹었어!';
    }
    if (els.endingSub) {
      els.endingSub.textContent =
        lovedCount > 0 ? '좋아하는 재료가 들어간 수프예요' : '숲속 친구들이 배불러요';
    }
    els.endingOverlay.classList.add('is-on');
    SOUND.play('win');
    spawnConfetti();

    if (window.KidsKit && typeof window.KidsKit.softEnding === 'function') {
      // 테마 엔딩 카드를 유지하되, 킷 소프트 엔딩 API도 동일 흐름으로 보강 가능.
      // 커스텀 오버레이를 이미 쓰므로 여기서는 호출하지 않고 rest/again만 유지.
    }
  }

  /* ------------------------------------------------------------------ */
  /* 에셋 슬롯                                                            */
  /* ------------------------------------------------------------------ */

  function applyIngredientSlots() {
    els.tray.querySelectorAll('.ingredient').forEach((btn) => {
      const id = btn.dataset.id;
      const face = btn.querySelector('.ing-emoji');
      const ing = INGREDIENTS.find((item) => item.id === id);
      if (face && ing) fillVisual(face, `ing-${id}`, ing.emoji);
    });
  }

  function applyPotSlot() {
    if (!els.potFace) return;
    fillVisual(els.potFace, 'pot', '');
    if (!els.potFace.classList.contains('has-slot-img')) {
      els.potFace.hidden = true;
    } else {
      els.potFace.hidden = false;
      els.potWrap.classList.add('has-pot-art');
    }
  }

  function applyForestBg() {
    const bg = document.querySelector('.forest-bg');
    const img = G.assets['forest-bg'];
    if (!bg || !isRealAsset(img)) return;
    bg.classList.add('has-slot-bg');
    bg.style.backgroundImage = `url("${img.src}")`;
  }

  function preloadAssets() {
    if (!window.KidsKit || !window.KidsKit.assets) {
      return Promise.resolve();
    }
    const list = ASSET_KEYS.map((key) => ({
      key,
      src: `${ASSET_BASE}${key}.webp`,
    }));
    return window.KidsKit.assets.preload(list).then((result) => {
      G.assets = result.images || {};
      applyIngredientSlots();
      applyPotSlot();
      applyForestBg();
      fillVisual(els.friendEmoji, `friend-${G.friend.id}`, G.friend.emoji);
      renderFriendsTree(loadFed());
    });
  }

  /* ------------------------------------------------------------------ */
  /* 이벤트                                                              */
  /* ------------------------------------------------------------------ */

  function bind() {
    document.addEventListener('pointerdown', () => SOUND.unlock(), { passive: true });

    els.tray.querySelectorAll('.ingredient').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ing = INGREDIENTS.find((item) => item.id === btn.dataset.id);
        if (ing) addIngredient(ing);
      });
    });

    els.potZone.addEventListener('pointerdown', onPotDown);
    els.potZone.addEventListener('pointermove', onPotMove);
    els.potZone.addEventListener('pointerup', onPotUp);
    els.potZone.addEventListener('pointercancel', onPotUp);

    els.potZone.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (G.state !== 'cook') return;
      if (G.ingredients.length === 0) {
        nudgeIngredientsHint();
        return;
      }
      SOUND.unlock();
      SOUND.play('swish');
      G.hasStirred = true;
      addStir(tapStirAmount());
    });

    els.btnAgain.addEventListener('click', () => {
      SOUND.unlock();
      SOUND.play('tap');
      startSession();
    });

    els.btnSound.addEventListener('click', () => {
      SOUND.muted = !SOUND.muted;
      if (window.KidsKit && window.KidsKit.sound) {
        window.KidsKit.sound.setMuted(SOUND.muted);
      }
      els.btnSound.textContent = SOUND.muted ? '🔇' : '🔊';
      els.btnSound.setAttribute('aria-label', SOUND.muted ? '소리 켜기' : '소리 끄기');
      if (!SOUND.muted) SOUND.play('tap');
    });

    window.addEventListener('resize', () => {
      els.soup.style.background = soupBackground(G.soupColor);
    });

    if (window.KidsKit && typeof window.KidsKit.restButton === 'function') {
      window.KidsKit.restButton({ parent: document.body });
    }
  }

  function init() {
    G.visitCount = store.get('visits', 0) || 0;
    G.firstVisit = G.visitCount === 0;
    G.tapBoost = G.firstVisit;
    store.set('visits', G.visitCount + 1);

    if (window.KidsKit && window.KidsKit.sound && window.KidsKit.sound.isMuted()) {
      SOUND.muted = true;
      els.btnSound.textContent = '🔇';
      els.btnSound.setAttribute('aria-label', '소리 켜기');
    }

    renderFriendsTree(loadFed());
    updateMealTrail();
    updateRing();
    bind();
    startSession();
    showWelcomeIfReturning();
    preloadAssets();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
