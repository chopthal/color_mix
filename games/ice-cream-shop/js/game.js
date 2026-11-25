/**
 * 하나둘셋 아이스크림 가게
 * 손님이 말한 개수만큼 스쿱을 쌓아 건넨다. 실패 화면·타이머 압박 없음.
 */
(() => {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GUESTS_PER_SESSION = 5;
  const COUNT_WORDS = ['하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
  const ORDER_COUNT_WORDS = ['하나', '두 개', '세 개', '네 개', '다섯 개'];

  const store = window.KidsKit
    ? window.KidsKit.store('iceCreamShop')
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
    guestFigure: document.getElementById('guestFigure'),
    speechBubble: document.getElementById('speechBubble'),
    bubbleIcons: document.getElementById('bubbleIcons'),
    bubbleText: document.getElementById('bubbleText'),
    guestTrail: document.getElementById('guestTrail'),
    coneStack: document.getElementById('coneStack'),
    scoops: document.getElementById('scoops'),
    countDots: document.getElementById('countDots'),
    btnServe: document.getElementById('btnServe'),
    tubs: document.getElementById('tubs'),
    shutter: document.getElementById('shutter'),
    windowGuests: document.getElementById('windowGuests'),
    fxLayer: document.getElementById('fxLayer'),
    btnSound: document.getElementById('btnSound'),
  };

  const FLAVORS = [
    { id: 'strawberry', name: '딸기', color: '#ff6b8a' },
    { id: 'chocolate', name: '초코', color: '#8b5a3c' },
    { id: 'vanilla', name: '바닐라', color: '#fff1b8' },
    { id: 'mint', name: '민트', color: '#7ed9b8' },
    { id: 'blueberry', name: '블루베리', color: '#7b8cff' },
    { id: 'rainbow', name: '무지개', color: null, rainbow: true },
  ];

  const GUESTS = [
    { id: 'penguin', name: '펭귄', emoji: '🐧' },
    { id: 'bear', name: '곰', emoji: '🐻' },
    { id: 'rabbit', name: '토끼', emoji: '🐰' },
    { id: 'cat', name: '고양이', emoji: '🐱' },
  ];

  const G = {
    state: 'order',
    guestIndex: 0,
    sessionGuests: [],
    servedGuests: [],
    order: [],
    scoops: [],
    freeOrder: false,
    idleTimer: null,
    scaffoldStep: 0,
    swipe: { active: false, startY: 0, id: null },
    muted: false,
    koreanVoice: null,
    save: { lastFlavorByGuest: {}, visits: 0 },
    endingOpen: false,
  };

  const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  };

  function flavorById(id) {
    return FLAVORS.find((f) => f.id === id);
  }

  function baseFlavors() {
    return FLAVORS.filter((f) => f.id !== 'rainbow');
  }

  /* ------------------------------------------------------------------ */
  /* TTS                                                                  */
  /* ------------------------------------------------------------------ */

  function pickKoreanVoice() {
    if (!window.speechSynthesis) return null;
    const voices = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().indexOf('ko') === 0);
    const preferred = voices.find((v) =>
      /heami|sunhi|yuna|minji|sanna|hajun|유나|산나|하준|female|neural/i.test(v.name)
    );
    return preferred || voices[0] || null;
  }

  function speak(text) {
    if (G.muted || !window.speechSynthesis || !text) return;
    try {
      speechSynthesis.cancel();
    } catch (e) {
      /* ignore */
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ko-KR';
    utter.rate = 0.92;
    utter.pitch = 1.08;
    if (!G.koreanVoice) G.koreanVoice = pickKoreanVoice();
    if (G.koreanVoice) utter.voice = G.koreanVoice;
    const isAppleTouch =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isAppleTouch) {
      window.setTimeout(() => {
        try {
          speechSynthesis.speak(utter);
        } catch (e) {
          /* ignore */
        }
      }, 60);
    } else {
      try {
        speechSynthesis.speak(utter);
      } catch (e) {
        /* ignore */
      }
    }
  }

  function unlockSpeech() {
    if (!window.speechSynthesis) return;
    try {
      const silent = new SpeechSynthesisUtterance(' ');
      silent.volume = 0;
      silent.lang = 'ko-KR';
      speechSynthesis.speak(silent);
      speechSynthesis.cancel();
    } catch (e) {
      /* ignore */
    }
  }

  function playKit(preset) {
    if (G.muted) return;
    if (window.KidsKit && window.KidsKit.sound) {
      window.KidsKit.sound.play(preset);
    }
  }

  function haptic(kind) {
    if (window.KidsKit && window.KidsKit.haptic) {
      window.KidsKit.haptic(kind || 'light');
    }
  }

  /* ------------------------------------------------------------------ */
  /* SVG guests                                                           */
  /* ------------------------------------------------------------------ */

  function guestSvg(guestId) {
    const bodies = {
      penguin:
        '<ellipse cx="50" cy="62" rx="28" ry="32" fill="#3d4a5c"/>' +
        '<ellipse cx="50" cy="68" rx="18" ry="22" fill="#fff6e8"/>' +
        '<circle cx="50" cy="32" r="20" fill="#3d4a5c"/>' +
        '<ellipse cx="50" cy="36" rx="12" ry="10" fill="#fff6e8"/>' +
        '<circle cx="42" cy="30" r="3.2" fill="#2a3140"/>' +
        '<circle cx="58" cy="30" r="3.2" fill="#2a3140"/>' +
        '<ellipse class="guest-mouth" cx="50" cy="40" rx="7" ry="3.5" fill="#ffb070"/>' +
        '<ellipse cx="28" cy="62" rx="8" ry="14" fill="#3d4a5c" transform="rotate(-20 28 62)"/>' +
        '<ellipse cx="72" cy="62" rx="8" ry="14" fill="#3d4a5c" transform="rotate(20 72 62)"/>',
      bear:
        '<circle cx="28" cy="28" r="12" fill="#c48a5a"/>' +
        '<circle cx="72" cy="28" r="12" fill="#c48a5a"/>' +
        '<circle cx="28" cy="28" r="6" fill="#e8b892"/>' +
        '<circle cx="72" cy="28" r="6" fill="#e8b892"/>' +
        '<ellipse cx="50" cy="58" rx="30" ry="28" fill="#c48a5a"/>' +
        '<circle cx="50" cy="42" r="24" fill="#c48a5a"/>' +
        '<circle cx="40" cy="40" r="3.5" fill="#3a2a20"/>' +
        '<circle cx="60" cy="40" r="3.5" fill="#3a2a20"/>' +
        '<ellipse cx="50" cy="50" rx="8" ry="6" fill="#e8b892"/>' +
        '<ellipse class="guest-mouth" cx="50" cy="56" rx="5" ry="2.5" fill="#a86a45"/>',
      rabbit:
        '<ellipse cx="34" cy="18" rx="8" ry="22" fill="#f2e6ef"/>' +
        '<ellipse cx="66" cy="18" rx="8" ry="22" fill="#f2e6ef"/>' +
        '<ellipse cx="34" cy="18" rx="3.5" ry="12" fill="#ffb0c8"/>' +
        '<ellipse cx="66" cy="18" rx="3.5" ry="12" fill="#ffb0c8"/>' +
        '<ellipse cx="50" cy="60" rx="26" ry="28" fill="#f2e6ef"/>' +
        '<circle cx="50" cy="42" r="22" fill="#f2e6ef"/>' +
        '<circle cx="41" cy="40" r="3.2" fill="#4a3f55"/>' +
        '<circle cx="59" cy="40" r="3.2" fill="#4a3f55"/>' +
        '<ellipse cx="50" cy="50" rx="5" ry="3.5" fill="#ff9ebd"/>' +
        '<ellipse class="guest-mouth" cx="50" cy="56" rx="4" ry="2" fill="#c45a7a"/>',
      cat:
        '<path d="M22 34 L30 12 L42 30 Z" fill="#f0c27a"/>' +
        '<path d="M78 34 L70 12 L58 30 Z" fill="#f0c27a"/>' +
        '<ellipse cx="50" cy="60" rx="28" ry="28" fill="#f0c27a"/>' +
        '<circle cx="50" cy="42" r="23" fill="#f0c27a"/>' +
        '<circle cx="40" cy="40" r="3.4" fill="#3a2a20"/>' +
        '<circle cx="60" cy="40" r="3.4" fill="#3a2a20"/>' +
        '<path d="M46 50 Q50 54 54 50" stroke="#c48a5a" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<ellipse class="guest-mouth" cx="50" cy="56" rx="4" ry="2.2" fill="#e8789a"/>' +
        '<path d="M18 48 Q8 50 16 56" stroke="#f0c27a" stroke-width="3" fill="none"/>' +
        '<path d="M82 48 Q92 50 84 56" stroke="#f0c27a" stroke-width="3" fill="none"/>',
    };
    const inner = bodies[guestId] || bodies.rabbit;
    return (
      '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      inner +
      '</svg>'
    );
  }

  /* ------------------------------------------------------------------ */
  /* Save                                                                 */
  /* ------------------------------------------------------------------ */

  function loadSave() {
    const raw = store.get('v1', null);
    if (raw && typeof raw === 'object') {
      G.save = {
        lastFlavorByGuest: raw.lastFlavorByGuest || {},
        visits: typeof raw.visits === 'number' ? raw.visits : 0,
      };
    } else {
      G.save = { lastFlavorByGuest: {}, visits: 0 };
    }
  }

  function writeSave() {
    store.set('v1', {
      lastFlavorByGuest: G.save.lastFlavorByGuest,
      visits: G.save.visits,
    });
  }

  function rememberFlavor(guestId, flavorId) {
    if (!guestId || !flavorId || flavorId === 'rainbow') return;
    G.save.lastFlavorByGuest[guestId] = flavorId;
    writeSave();
  }

  /* ------------------------------------------------------------------ */
  /* Orders                                                               */
  /* ------------------------------------------------------------------ */

  function orderTotal(order) {
    return order.reduce((sum, part) => sum + part.count, 0);
  }

  function buildOrderPhrase(order, free) {
    if (free) return '아무거나 좋아!';
    const parts = order.map((part) => {
      const f = flavorById(part.flavor);
      const word = ORDER_COUNT_WORDS[part.count - 1] || String(part.count);
      return (f ? f.name : '') + ' ' + word;
    });
    return parts.join(', ') + ' 주세요!';
  }

  function makeStage1Order(forcedFlavor) {
    const flavor = forcedFlavor || pick(baseFlavors()).id;
    return [{ flavor, count: randInt(1, 3) }];
  }

  function makeStage2Order() {
    const flavors = shuffle(baseFlavors());
    const a = flavors[0].id;
    const b = flavors[1].id;
    const total = randInt(2, 5);
    const first = randInt(1, total - 1);
    const second = total - first;
    return [
      { flavor: a, count: first },
      { flavor: b, count: second },
    ];
  }

  function pickSessionGuests() {
    const base = shuffle(GUESTS);
    const list = base.slice();
    while (list.length < GUESTS_PER_SESSION) {
      list.push(pick(GUESTS));
    }
    return shuffle(list).slice(0, GUESTS_PER_SESSION);
  }

  function orderForGuest(guest, index) {
    const isLast = index === GUESTS_PER_SESSION - 1;
    if (isLast) {
      return { order: [], free: true };
    }

    const remembered = G.save.lastFlavorByGuest[guest.id];
    const hasRegulars = Object.keys(G.save.lastFlavorByGuest || {}).length > 0;
    const isReturn = hasRegulars && remembered && Math.random() < 0.55;

    // 첫 방문 첫 손님만 바닐라 1개 + 통 반짝 유도
    if (G.save.visits <= 1 && index === 0) {
      return { order: [{ flavor: 'vanilla', count: 1 }], free: false, tutorial: true, greeting: null };
    }

    if (isReturn) {
      const count = index < 2 ? randInt(1, 3) : randInt(1, 2);
      return {
        order: [{ flavor: remembered, count }],
        free: false,
        greeting: '또 왔어!',
      };
    }

    if (index < 2) {
      return { order: makeStage1Order(), free: false };
    }
    return { order: makeStage2Order(), free: false };
  }

  /* ------------------------------------------------------------------ */
  /* UI render                                                            */
  /* ------------------------------------------------------------------ */

  function clearIdleTimers() {
    if (G.idleTimer) {
      clearTimeout(G.idleTimer);
      G.idleTimer = null;
    }
    G.scaffoldStep = 0;
  }

  function clearScaffoldHints() {
    els.tubs.querySelectorAll('.tub').forEach((t) => {
      t.classList.remove('is-hint', 'is-need');
    });
    els.bubbleIcons.querySelectorAll('.flavor-dot').forEach((d) => d.classList.remove('is-bounce'));
  }

  function clearIdle() {
    clearIdleTimers();
    clearScaffoldHints();
  }

  function scheduleIdle() {
    clearIdleTimers();
    if (G.state !== 'scoop' && G.state !== 'order') return;
    G.idleTimer = window.setTimeout(() => {
      G.scaffoldStep = 1;
      bounceBubbleIcons();
      G.idleTimer = window.setTimeout(() => {
        G.scaffoldStep = 2;
        hintNeededTubs();
      }, 7000);
    }, 8000);
  }

  function bounceBubbleIcons() {
    const dots = els.bubbleIcons.querySelectorAll('.flavor-dot');
    dots.forEach((dot, i) => {
      window.setTimeout(() => {
        if (REDUCED) return;
        dot.classList.remove('is-bounce');
        void dot.offsetWidth;
        dot.classList.add('is-bounce');
      }, i * 280);
    });
  }

  function neededFlavorIds() {
    if (G.freeOrder) return [];
    const have = {};
    G.scoops.forEach((id) => {
      have[id] = (have[id] || 0) + 1;
    });
    const need = [];
    G.order.forEach((part) => {
      const haveCount = have[part.flavor] || 0;
      if (haveCount < part.count) need.push(part.flavor);
    });
    if (need.length === 0 && G.scoops.length < orderTotal(G.order)) {
      return G.order.map((p) => p.flavor);
    }
    return need;
  }

  function hintNeededTubs() {
    const need = neededFlavorIds();
    els.tubs.querySelectorAll('.tub').forEach((tub) => {
      if (need.indexOf(tub.dataset.flavor) !== -1) {
        tub.classList.add('is-need');
      }
    });
  }

  function renderTrail() {
    els.guestTrail.innerHTML = '';
    for (let i = 0; i < GUESTS_PER_SESSION; i += 1) {
      const chip = document.createElement('div');
      chip.className = 'trail-chip' + (i < G.guestIndex ? ' is-done' : '');
      if (i < G.servedGuests.length) {
        chip.textContent = G.servedGuests[i].emoji;
      } else if (i === G.guestIndex && G.sessionGuests[i]) {
        chip.textContent = G.sessionGuests[i].emoji;
        chip.style.opacity = '0.7';
      } else {
        chip.textContent = '🍦';
      }
      els.guestTrail.appendChild(chip);
    }
  }

  function renderBubble() {
    els.bubbleIcons.innerHTML = '';
    if (G.freeOrder) {
      els.bubbleText.textContent = '아무거나 좋아!';
    } else {
      G.order.forEach((part) => {
        const f = flavorById(part.flavor);
        for (let i = 0; i < part.count; i += 1) {
          const dot = document.createElement('span');
          dot.className = 'flavor-dot' + (f && f.rainbow ? ' is-rainbow' : '');
          if (f && f.color) dot.style.background = f.color;
          els.bubbleIcons.appendChild(dot);
        }
      });
      els.bubbleText.textContent = buildOrderPhrase(G.order, false);
    }
    els.speechBubble.hidden = false;
  }

  function renderScoops() {
    els.scoops.innerHTML = '';
    G.scoops.forEach((id) => {
      const f = flavorById(id);
      const el = document.createElement('div');
      el.className = 'scoop' + (f && f.rainbow ? ' is-rainbow' : '');
      if (f && f.color) el.style.background = f.color;
      els.scoops.appendChild(el);
    });
    els.coneStack.classList.toggle('is-wobble', G.scoops.length >= 7 && !REDUCED);

    const target = G.freeOrder ? Math.max(G.scoops.length, 1) : orderTotal(G.order);
    els.countDots.innerHTML = '';
    const dots = Math.max(target, G.scoops.length, 1);
    for (let i = 0; i < Math.min(dots, 8); i += 1) {
      const d = document.createElement('span');
      d.className = 'count-dot' + (i < G.scoops.length ? ' is-filled' : '');
      els.countDots.appendChild(d);
    }

    updateServeButton();
  }

  function flavorsExact() {
    if (G.freeOrder) return true;
    const need = {};
    G.order.forEach((p) => {
      need[p.flavor] = (need[p.flavor] || 0) + p.count;
    });
    const have = {};
    G.scoops.forEach((id) => {
      have[id] = (have[id] || 0) + 1;
    });
    const keys = Object.keys(need);
    if (Object.keys(have).length !== keys.length) return false;
    return keys.every((k) => have[k] === need[k]);
  }

  function updateServeButton() {
    const inPlay = G.state === 'scoop' || G.state === 'serve';
    const ready =
      G.state === 'scoop' &&
      (G.freeOrder ? G.scoops.length >= 1 : G.scoops.length >= orderTotal(G.order));
    els.btnServe.hidden = !inPlay;
    els.btnServe.classList.toggle('is-ready', !!ready);
  }

  function renderTubs(showRainbow) {
    els.tubs.innerHTML = '';
    const list = baseFlavors().slice();
    if (showRainbow) {
      list.push(flavorById('rainbow'));
    }
    list.forEach((f) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tub' + (f.rainbow ? ' is-rainbow' : '');
      btn.dataset.flavor = f.id;
      btn.setAttribute('aria-label', f.name);
      const bowl = document.createElement('span');
      bowl.className = 'tub-bowl';
      if (f.color) bowl.style.background = f.color;
      const name = document.createElement('span');
      name.className = 'tub-name';
      name.textContent = f.name;
      btn.appendChild(bowl);
      btn.appendChild(name);
      btn.addEventListener('click', () => onTubTap(f.id));
      els.tubs.appendChild(btn);
    });
  }

  function spawnFx(kind, x, y) {
    const el = document.createElement('div');
    el.className = kind === 'star' ? 'fx-star' : 'fx-heart';
    el.textContent = kind === 'star' ? '⭐' : '❤️';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    els.fxLayer.appendChild(el);
    window.setTimeout(() => el.remove(), 950);
  }

  function burstHearts() {
    const rect = els.guestFigure.getBoundingClientRect();
    const stageRect = els.fxLayer.getBoundingClientRect();
    for (let i = 0; i < 4; i += 1) {
      const x = rect.left - stageRect.left + rect.width * (0.2 + Math.random() * 0.6);
      const y = rect.top - stageRect.top + rect.height * 0.3;
      window.setTimeout(() => spawnFx('heart', x, y), i * 90);
    }
  }

  function burstStars() {
    const rect = els.coneStack.getBoundingClientRect();
    const stageRect = els.fxLayer.getBoundingClientRect();
    for (let i = 0; i < 5; i += 1) {
      const x = rect.left - stageRect.left + rect.width * Math.random();
      const y = rect.top - stageRect.top + 10;
      window.setTimeout(() => spawnFx('star', x, y), i * 70);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Flow                                                                 */
  /* ------------------------------------------------------------------ */

  function startSession() {
    G.endingOpen = false;
    els.shutter.classList.remove('is-on');
    els.windowGuests.innerHTML = '';
    G.guestIndex = 0;
    G.servedGuests = [];
    G.sessionGuests = pickSessionGuests();
    startGuest();
  }

  function startGuest() {
    clearIdle();
    G.state = 'order';
    G.scoops = [];
    const guest = G.sessionGuests[G.guestIndex];
    const built = orderForGuest(guest, G.guestIndex);
    G.order = built.order;
    G.freeOrder = !!built.free;
    const showRainbow = Math.random() < 0.1;

    els.guestFigure.innerHTML = guestSvg(guest.id);
    els.guestFigure.classList.remove('is-happy', 'is-eat', 'is-enter');
    void els.guestFigure.offsetWidth;
    if (!REDUCED) els.guestFigure.classList.add('is-enter');

    renderTrail();
    renderBubble();
    renderScoops();
    renderTubs(showRainbow);
    els.btnServe.hidden = false;

    if (built.greeting) {
      els.bubbleText.textContent = built.greeting;
      speak(built.greeting);
      window.setTimeout(() => {
        renderBubble();
        speakOrder(built);
        enterScoop(built);
      }, 1200);
    } else {
      speakOrder(built);
      enterScoop(built);
    }
  }

  function speakOrder(built) {
    if (built.free) {
      speak('아무거나 좋아!');
    } else {
      speak(buildOrderPhrase(built.order, false));
    }
  }

  function enterScoop(built) {
    G.state = 'scoop';
    updateServeButton();
    if (built && built.tutorial) {
      const vanillaTub = els.tubs.querySelector('[data-flavor="vanilla"]');
      if (vanillaTub) vanillaTub.classList.add('is-hint');
      window.setTimeout(() => {
        if (vanillaTub) vanillaTub.classList.remove('is-hint');
      }, 2800);
    }
    scheduleIdle();
  }

  function onTubTap(flavorId) {
    if (G.state !== 'scoop') return;
    unlockSpeech();
    clearIdle();

    if (G.scoops.length >= 8) {
      if (!REDUCED) {
        els.coneStack.classList.remove('is-wobble');
        void els.coneStack.offsetWidth;
        els.coneStack.classList.add('is-wobble');
      }
      playKit('boing');
      scheduleIdle();
      return;
    }

    G.scoops.push(flavorId);
    playKit('pop');
    haptic('light');

    const n = G.scoops.length;
    const word = COUNT_WORDS[n - 1];
    if (word) speak(word + '!');

    renderScoops();
    scheduleIdle();
  }

  function removeTopScoop() {
    if (G.state !== 'scoop' || G.scoops.length === 0) return;
    G.scoops.pop();
    playKit('whoosh');
    haptic('soft');
    speak('하나 빼기');
    renderScoops();
    clearIdle();
    scheduleIdle();
  }

  function evaluateServe() {
    if (G.freeOrder) {
      if (G.scoops.length < 1) return { result: 'short' };
      return { result: 'exact' };
    }
    const need = orderTotal(G.order);
    const have = G.scoops.length;
    if (have < need) return { result: 'short' };
    if (have > need) return { result: 'extra' };
    if (flavorsExact()) return { result: 'exact' };
    return { result: 'diffFlavor' };
  }

  function onServe() {
    if (G.state !== 'scoop') return;
    unlockSpeech();
    clearIdle();
    const verdict = evaluateServe();

    if (verdict.result === 'short') {
      els.bubbleText.textContent = '음, 하나 더 먹고 싶어!';
      speak('음, 하나 더 먹고 싶어!');
      playKit('boing');
      hintNeededTubs();
      scheduleIdle();
      return;
    }

    G.state = 'serve';
    updateServeButton();
    els.btnServe.classList.remove('is-ready');

    if (verdict.result === 'extra') {
      els.bubbleText.textContent = '와, 덤이다! 고마워!';
      speak('와, 덤이다! 고마워!');
    } else if (verdict.result === 'diffFlavor') {
      els.bubbleText.textContent = '오, 이 맛도 좋아!';
      speak('오, 이 맛도 좋아!');
    } else {
      els.bubbleText.textContent = '';
      burstStars();
    }

    playKit('chime');
    haptic('success');

    const guest = G.sessionGuests[G.guestIndex];
    const topFlavor = G.scoops[G.scoops.length - 1] || (G.order[0] && G.order[0].flavor);
    rememberFlavor(guest.id, topFlavor);

    window.setTimeout(() => beginEat(), 700);
  }

  function beginEat() {
    G.state = 'eat';
    els.btnServe.hidden = true;
    els.guestFigure.classList.add('is-eat', 'is-happy');
    playKit('sparkle');
    burstHearts();

    const guest = G.sessionGuests[G.guestIndex];
    G.servedGuests.push(guest);
    G.guestIndex += 1;
    renderTrail();

    window.setTimeout(() => {
      els.guestFigure.classList.remove('is-eat', 'is-happy');
      G.scoops = [];
      renderScoops();
      if (G.guestIndex >= GUESTS_PER_SESSION) {
        beginEnding();
      } else {
        startGuest();
      }
    }, 1600);
  }

  function beginEnding() {
    G.state = 'ending';
    G.endingOpen = true;
    clearIdle();
    updateServeButton();
    els.speechBubble.hidden = true;

    els.windowGuests.innerHTML = '';
    G.servedGuests.forEach((g) => {
      const wrap = document.createElement('div');
      wrap.className = 'window-guest';
      wrap.innerHTML = guestSvg(g.id);
      els.windowGuests.appendChild(wrap);
    });

    els.shutter.classList.add('is-on');
    playKit('whoosh');
    speak('오늘 장사 끝! 다음에 또 와!');

    window.setTimeout(() => {
      showSoftEnding('오늘 장사 끝! 다음에 또 와!');
    }, 1600);
  }

  function showSoftEnding(title) {
    if (!window.KidsKit || typeof window.KidsKit.softEnding !== 'function') {
      return;
    }
    window.KidsKit.softEnding({
      title: title,
      emoji: '🍦',
      onAgain: () => {
        G.endingOpen = false;
        startSession();
      },
      onRest: () => {
        window.location.href = '../../index.html';
      },
    });
  }

  function showRestEnding() {
    clearIdle();
    speak('우리도 시원한 물 한 잔 마시고 쉬자');
    showSoftEnding('우리도 시원한 물 한 잔 마시고 쉬자');
  }

  /* ------------------------------------------------------------------ */
  /* Swipe to undo                                                        */
  /* ------------------------------------------------------------------ */

  function onConePointerDown(e) {
    if (G.state !== 'scoop' || G.scoops.length === 0) return;
    G.swipe.active = true;
    G.swipe.startY = e.clientY;
    G.swipe.id = e.pointerId;
    try {
      els.coneStack.setPointerCapture(e.pointerId);
    } catch (err) {
      /* ignore */
    }
  }

  function onConePointerMove(e) {
    if (!G.swipe.active || e.pointerId !== G.swipe.id) return;
    const dy = G.swipe.startY - e.clientY;
    if (dy > 40) {
      G.swipe.active = false;
      removeTopScoop();
    }
  }

  function onConePointerUp(e) {
    if (e.pointerId !== G.swipe.id) return;
    G.swipe.active = false;
    G.swipe.id = null;
  }

  /* ------------------------------------------------------------------ */
  /* Bind / init                                                          */
  /* ------------------------------------------------------------------ */

  function bind() {
    document.addEventListener(
      'pointerdown',
      () => {
        unlockSpeech();
      },
      { passive: true }
    );

    els.btnServe.addEventListener('click', onServe);

    els.coneStack.addEventListener('pointerdown', onConePointerDown);
    els.coneStack.addEventListener('pointermove', onConePointerMove);
    els.coneStack.addEventListener('pointerup', onConePointerUp);
    els.coneStack.addEventListener('pointercancel', onConePointerUp);

    els.btnSound.addEventListener('click', () => {
      if (window.KidsKit && window.KidsKit.sound) {
        const muted = window.KidsKit.sound.toggleMute();
        G.muted = muted;
      } else {
        G.muted = !G.muted;
      }
      els.btnSound.textContent = G.muted ? '🔇' : '🔊';
      els.btnSound.setAttribute('aria-label', G.muted ? '소리 켜기' : '소리 끄기');
      if (!G.muted) playKit('pop');
    });

    if (window.KidsKit && typeof window.KidsKit.restButton === 'function') {
      window.KidsKit.restButton({
        parent: document.body,
        onRest: () => {
          if (G.endingOpen) {
            window.location.href = '../../index.html';
            return;
          }
          showRestEnding();
        },
      });
    }
  }

  function init() {
    loadSave();
    G.save.visits = (G.save.visits || 0) + 1;
    writeSave();

    if (window.KidsKit && window.KidsKit.sound && window.KidsKit.sound.isMuted()) {
      G.muted = true;
      els.btnSound.textContent = '🔇';
    }

    if (window.speechSynthesis) {
      G.koreanVoice = pickKoreanVoice();
      speechSynthesis.onvoiceschanged = () => {
        G.koreanVoice = pickKoreanVoice();
      };
    }

    bind();
    startSession();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
