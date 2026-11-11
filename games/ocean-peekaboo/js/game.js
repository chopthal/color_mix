(function () {
  'use strict';

  var WHALE_GOAL = 7;
  var SHARK_GOAL = 5;
  var TELEGRAPH_MS = 3000;
  var ACTIVE_MS = 5000;
  var RESOLVE_MS = 2000;
  var IDLE_MIN_MS = 2800;
  var IDLE_MAX_MS = 4500;
  var STORE_NS = 'ocean-peekaboo';
  var FAST = /(?:^|[?&])fast=1(?:&|$)/.test(location.search);
  var WELCOME_MS = 2200;
  var REVISIT_GREET_MS = 2600;
  var REVISIT_TO_PLAY_MS = 1800;
  var HUG_HOLD_MS = 900;
  var HUG_SPECIAL_HOLD_MS = 1200;
  // 검증·개발용: ?fast=1 이면 대기만 짧게 (난이도·판정 규칙은 동일)
  if (FAST) {
    WHALE_GOAL = 2;
    SHARK_GOAL = 2;
    TELEGRAPH_MS = 250;
    ACTIVE_MS = 800;
    RESOLVE_MS = 200;
    IDLE_MIN_MS = 80;
    IDLE_MAX_MS = 120;
    WELCOME_MS = 200;
    REVISIT_GREET_MS = 300;
    REVISIT_TO_PLAY_MS = 150;
    HUG_HOLD_MS = 180;
    HUG_SPECIAL_HOLD_MS = 220;
  }

  var ASSET_LIST = [
    { src: 'assets/diver.webp', key: 'diver' },
    { src: 'assets/turtle.webp', key: 'turtle' },
    { src: 'assets/whale.webp', key: 'whale' },
    { src: 'assets/shark.webp', key: 'shark' },
    { src: 'assets/kelp.webp', key: 'kelp' },
    { src: 'assets/coral.webp', key: 'coral' },
    { src: 'assets/rock.webp', key: 'rock' },
    { src: 'assets/sea-bg.webp', key: 'sea-bg' }
  ];

  var HIDE_LAYOUTS = [
    { left: '6%', right: 'auto', bottom: '16%' },
    { left: '38%', right: 'auto', bottom: '12%' },
    { left: 'auto', right: '6%', bottom: '15%' },
    { left: '18%', right: 'auto', bottom: '14%' },
    { left: 'auto', right: '18%', bottom: '13%' },
    { left: '42%', right: 'auto', bottom: '11%' }
  ];

  var SPOT_TINTS = {
    kelp: ['#2faa78', '#3cb88a', '#57d0a0', '#45c49a', '#2d9b70'],
    coral: ['#ff7a9a', '#ff9bb4', '#ff8fab', '#ffb3c6', '#ff6f91'],
    rock: ['#9bb0c4', '#b7c7d6', '#7f93a8', '#a8b8c8', '#8aa0b4']
  };

  // 이미지(webp) 은신처는 fill을 못 바꾸니 약한 CSS 필터로 매 판 색 셔플 차이를 낸다.
  // 외곽선(진한 갈색)이 크게 변하지 않도록 hue는 ±14deg 이내, 채도·밝기 위주.
  var SPOT_IMAGE_FILTERS = {
    kelp: [
      'hue-rotate(-12deg) saturate(1.28) brightness(1.04)',
      'hue-rotate(10deg) saturate(0.84) brightness(0.97)',
      'hue-rotate(14deg) saturate(1.12) brightness(1.05)',
      'hue-rotate(-4deg) saturate(0.92) brightness(1.06)',
      'hue-rotate(-14deg) saturate(1.18) brightness(0.96)'
    ],
    coral: [
      'hue-rotate(-8deg) saturate(1.24) brightness(1.05)',
      'hue-rotate(9deg) saturate(0.86) brightness(0.98)',
      'hue-rotate(12deg) saturate(1.08) brightness(1.04)',
      'hue-rotate(-12deg) saturate(0.94) brightness(1.06)',
      'hue-rotate(3deg) saturate(1.3) brightness(0.97)'
    ],
    rock: [
      'brightness(0.92) saturate(1.2)',
      'brightness(1.08) saturate(0.86)',
      'hue-rotate(8deg) brightness(1.03) saturate(1.12)',
      'hue-rotate(-8deg) brightness(0.96) saturate(0.9)',
      'brightness(1.02) saturate(1.35)'
    ]
  };

  // .asset-img 기본 그림자(CSS)를 인라인 필터로 덮어쓸 때 함께 유지
  var SPOT_IMG_SHADOW = 'drop-shadow(0 8px 0 rgba(20, 60, 80, 0.15)) ';

  var FISH_EMOJIS = ['🐠', '🐟', '🐡', '✨', '🦐', '🐙'];
  var FISH_COLORS = ['#ff8fab', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff', '#7bdff2'];

  var SPECIAL_HEARTS = ['💖', '💛', '💚', '💙', '💜', '🧡', '✨'];
  var GOLD_HEARTS = ['💛', '✨', '🌟', '💖'];

  var LINES = {
    sharkTelegraph: '쉿! 꾸벅꾸벅 졸린 상어가 지나가네. 우리 미역 이불 속으로 쏙 숨어볼까?',
    peekSuccess: '와, 진짜 감쪽같이 숨었다! 상어가 모르고 지나갔어. 까꿍!',
    peekMiss: '앗, 상어랑 눈이 마주쳤네! 상어가 ‘안녕?’ 하고 인사하고 간다.',
    whaleTelegraph: '보글보글~ 고래 친구가 올라오나 봐! 다가오면 꼭 안아 주자!',
    hugSuccess: '고래를 꼭 잡았네! 고래가 간지러워서 까르르 웃나 봐!',
    hugSpecial: '우와! 특별한 하트가 팡팡! 고래가 신나서 빙글빙글 춤춘다!',
    hugMiss: '고래가 손 흔들며 가네. 다음에 또 안아 주자!',
    welcome: '바닷속에 온 걸 환영해! 미역은 숨는 곳, 고래가 오면 톡 눌러 안아 줘!',
    revisit: '또 왔구나! 거북이가 반짝 인사해. 저기 고래도 손 흔든다!',
    titleHint: '안녕! 나는 아기 거북이야. 같이 바닷속 까꿍 놀이할래?',
    sunset: '와, 이제 고래랑 상어도 코 자러 갈 시간이래. 우리도 물 밖으로 나가서 엄마(아빠)랑 이야기 나누자!'
  };

  var state = {
    phase: 'title',
    eventType: null,
    hidden: false,
    hideSpotId: null,
    whaleHugs: 0,
    sharkPeeks: 0,
    hugStreak: 0,
    lastEventType: null,
    sameStreak: 0,
    whaleResolved: false,
    sharkResolved: false,
    timers: [],
    firstEventDone: false,
    isReturning: false,
    assets: null
  };

  var store = null;
  var els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function clearTimers() {
    state.timers.forEach(function (id) {
      clearTimeout(id);
    });
    state.timers = [];
  }

  function later(fn, ms) {
    var id = setTimeout(fn, ms);
    state.timers.push(id);
    return id;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function shuffle(arr) {
    var a = arr.slice();
    var i;
    for (i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function setSpeech(text) {
    if (!els.speech) return;
    els.speech.textContent = text;
    els.speech.classList.add('show');
  }

  function updateProgress() {
    var i;
    var hearts = els.whaleProgress.querySelectorAll('.pip');
    for (i = 0; i < hearts.length; i++) {
      hearts[i].textContent = i < state.whaleHugs ? '💖' : '🤍';
      hearts[i].classList.toggle('filled', i < state.whaleHugs);
    }
    var bubbles = els.sharkProgress.querySelectorAll('.pip');
    for (i = 0; i < bubbles.length; i++) {
      bubbles[i].textContent = i < state.sharkPeeks ? '💙' : '🫧';
      bubbles[i].classList.toggle('filled', i < state.sharkPeeks);
    }
  }

  function setPhaseClass(phase) {
    els.sea.className = 'sea phase-' + phase;
    if (state.whaleHugs >= WHALE_GOAL && state.sharkPeeks >= SHARK_GOAL && phase === 'ending') {
      els.sea.classList.add('sunset');
    }
    if (assetOk('sea-bg')) {
      els.sea.classList.add('has-photo-bg');
    }
  }

  function placeDiverHome() {
    state.hidden = false;
    state.hideSpotId = null;
    els.diver.classList.remove('hidden-pose');
    els.diver.style.left = '50%';
    els.diver.style.bottom = '28%';
    els.diver.style.transform = 'translateX(-50%)';
    document.querySelectorAll('.hide-spot').forEach(function (spot) {
      spot.classList.remove('occupied');
    });
  }

  function hideInSpot(spotEl) {
    var id = spotEl.getAttribute('data-spot');
    var rect = spotEl.getBoundingClientRect();
    var seaRect = els.sea.getBoundingClientRect();
    var left = ((rect.left + rect.width / 2 - seaRect.left) / seaRect.width) * 100;
    var bottom = ((seaRect.bottom - rect.bottom + rect.height * 0.25) / seaRect.height) * 100;

    state.hidden = true;
    state.hideSpotId = id;
    els.diver.classList.add('hidden-pose');
    els.diver.style.left = left + '%';
    els.diver.style.bottom = bottom + '%';
    els.diver.style.transform = 'translateX(-50%) scale(0.85)';

    document.querySelectorAll('.hide-spot').forEach(function (s) {
      s.classList.toggle('occupied', s === spotEl);
    });

    els.diver.classList.remove('pop');
    void els.diver.offsetWidth;
    els.diver.classList.add('pop');
    OceanAudio.playHide();
    if (window.KidsKit) KidsKit.haptic('soft');
  }

  function chooseNextEvent() {
    if (!state.firstEventDone) {
      state.firstEventDone = true;
      return 'whale';
    }
    var pickType = Math.random() < 0.5 ? 'whale' : 'shark';
    if (state.lastEventType && pickType === state.lastEventType && state.sameStreak >= 2) {
      pickType = pickType === 'whale' ? 'shark' : 'whale';
    }
    return pickType;
  }

  function rememberEvent(type) {
    if (type === state.lastEventType) {
      state.sameStreak += 1;
    } else {
      state.sameStreak = 1;
    }
    state.lastEventType = type;
  }

  function clearActors() {
    els.whale.classList.remove(
      'show',
      'hug',
      'hug-spin',
      'wave',
      'far-wave',
      'from-left',
      'from-right'
    );
    els.shark.classList.remove('show', 'miss-hello', 'pass-by', 'from-left', 'from-right');
    els.bubbles.classList.remove('show');
    els.finHint.classList.remove('show');
    els.turtle.classList.remove('greet-wave');
    els.fxLayer.innerHTML = '';
  }

  function spawnHearts(xPct, yPct, specialLevel) {
    var palette = SPECIAL_HEARTS;
    var n = 6;
    if (specialLevel >= 3) {
      palette = GOLD_HEARTS;
      n = 9;
    } else if (specialLevel >= 2) {
      n = 8;
    }
    var i;
    for (i = 0; i < n; i++) {
      var h = document.createElement('span');
      h.className = 'fx-heart' + (specialLevel >= 2 ? ' fx-heart-special' : '');
      h.textContent = palette[i % palette.length];
      h.style.left = xPct + (Math.random() * 14 - 7) + '%';
      h.style.top = yPct + (Math.random() * 10 - 5) + '%';
      h.style.animationDelay = i * 0.05 + 's';
      if (specialLevel >= 2) {
        h.style.fontSize = 26 + Math.floor(Math.random() * 10) + 'px';
      }
      els.fxLayer.appendChild(h);
    }
  }

  function shuffleHideSpots() {
    var spots = Array.prototype.slice.call(document.querySelectorAll('.hide-spot'));
    var layouts = shuffle(HIDE_LAYOUTS).slice(0, spots.length);
    spots.forEach(function (spot, index) {
      var layout = layouts[index];
      spot.style.left = layout.left;
      spot.style.right = layout.right;
      spot.style.bottom = layout.bottom;
      tintSpot(spot);
    });
  }

  function tintSpot(spot) {
    var kind = spot.getAttribute('data-spot');
    var palette = SPOT_TINTS[kind];
    var filters = SPOT_IMAGE_FILTERS[kind];
    var img = spot.querySelector('.asset-img');
    var i;

    if (palette) {
      var fills = shuffle(palette);
      var shapes = spot.querySelectorAll('.spot-art [fill], .spot-art [stroke]');
      for (i = 0; i < shapes.length; i++) {
        var el = shapes[i];
        var color = fills[i % fills.length];
        if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') {
          el.setAttribute('fill', color);
        }
        if (el.hasAttribute('stroke')) {
          el.setAttribute('stroke', color);
        }
      }
    }

    // 이미지 은신처(assets/kelp·coral·rock.webp)도 같은 셔플 리듬으로 색이 달라 보이게
    if (img) {
      if (filters && filters.length) {
        img.style.filter = SPOT_IMG_SHADOW + pick(filters);
      } else {
        img.style.filter = '';
      }
    }
  }

  function shuffleFish() {
    var fish = Array.prototype.slice.call(document.querySelectorAll('.floaty'));
    var usedLeft = [];
    fish.forEach(function (node, index) {
      var left;
      var tries = 0;
      do {
        left = 8 + Math.random() * 80;
        tries += 1;
      } while (tries < 8 && usedLeft.some(function (v) { return Math.abs(v - left) < 12; }));
      usedLeft.push(left);
      node.style.left = left + '%';
      node.style.top = 14 + Math.random() * 28 + '%';
      node.style.fontSize = 14 + Math.floor(Math.random() * 12) + 'px';
      node.style.animationDelay = (index * 0.7 + Math.random()) + 's';
      node.style.color = pick(FISH_COLORS);
      node.textContent = pick(FISH_EMOJIS);
    });
  }

  function shuffleRoundDecor() {
    shuffleHideSpots();
    shuffleFish();
  }

  function assetOk(key) {
    if (!state.assets || !state.assets.images) return false;
    var img = state.assets.images[key];
    if (!img) return false;
    // KidsKit 실패 시 투명 placeholder — 이때는 코드 드로잉 폴백
    if (img.dataset && img.dataset.kidsKitPlaceholder === '1') return false;
    return true;
  }

  function applyAssetSlots() {
    document.querySelectorAll('[data-asset-slot]').forEach(function (host) {
      var key = host.getAttribute('data-asset-slot');
      var img = host.querySelector('.asset-img');
      var fallback = host.querySelector('.asset-fallback');
      if (!img) return;
      if (assetOk(key)) {
        img.src = state.assets.images[key].src;
        img.hidden = false;
        host.classList.add('using-asset');
        if (fallback) fallback.hidden = true;
      } else {
        img.removeAttribute('src');
        img.hidden = true;
        host.classList.remove('using-asset');
        if (fallback) fallback.hidden = false;
      }
    });

    if (assetOk('sea-bg')) {
      els.sea.style.backgroundImage = 'url("' + state.assets.images['sea-bg'].src + '")';
      els.sea.classList.add('has-photo-bg');
    }
  }

  function preloadAssets() {
    if (!window.KidsKit || !KidsKit.assets || !KidsKit.assets.preload) {
      state.assets = { images: {}, failed: ASSET_LIST.map(function (a) { return a.key; }), ready: true };
      applyAssetSlots();
      return Promise.resolve();
    }
    return KidsKit.assets.preload(ASSET_LIST).then(function (result) {
      state.assets = {
        images: result.images || {},
        failed: result.failed || [],
        ready: true
      };
      applyAssetSlots();
    });
  }

  function startIdle() {
    if (state.whaleHugs >= WHALE_GOAL && state.sharkPeeks >= SHARK_GOAL) {
      beginSunset();
      return;
    }
    state.phase = 'idle';
    setPhaseClass('idle');
    clearActors();
    placeDiverHome();
    later(beginTelegraph, rand(IDLE_MIN_MS, IDLE_MAX_MS));
  }

  function beginTelegraph() {
    if (state.phase === 'ending' || state.phase === 'title') return;
    var type = chooseNextEvent();
    state.eventType = type;
    state.phase = 'telegraph';
    state.whaleResolved = false;
    state.sharkResolved = false;
    setPhaseClass('telegraph');
    clearActors();

    if (type === 'whale') {
      els.bubbles.classList.add('show');
      OceanAudio.playWhaleTelegraph();
      setSpeech(LINES.whaleTelegraph);
    } else {
      els.finHint.classList.add('show');
      OceanAudio.playSharkTelegraph();
      setSpeech(LINES.sharkTelegraph);
    }

    later(beginActive, TELEGRAPH_MS);
  }

  function beginActive() {
    if (state.phase !== 'telegraph') return;
    state.phase = 'active';
    setPhaseClass('active');
    rememberEvent(state.eventType);

    var fromLeft = Math.random() < 0.5;
    var sideClass = fromLeft ? 'from-left' : 'from-right';

    if (state.eventType === 'whale') {
      els.bubbles.classList.remove('show');
      els.whale.classList.add('show', sideClass);
    } else {
      els.finHint.classList.remove('show');
      els.shark.classList.add('show', sideClass);
    }

    later(function () {
      if (state.phase !== 'active') return;
      resolveActive(false);
    }, ACTIVE_MS);
  }

  function resolveActive(forcedSuccess) {
    if (state.phase !== 'active') return;
    state.phase = 'resolve';
    setPhaseClass('resolve');

    if (state.eventType === 'whale') {
      if (state.whaleResolved) {
        // already hugged
      } else if (forcedSuccess) {
        // noop
      } else {
        state.hugStreak = 0;
        els.whale.classList.add('wave');
        OceanAudio.playSoftMiss();
        setSpeech(LINES.hugMiss);
      }
    } else if (state.eventType === 'shark') {
      if (!state.sharkResolved) {
        if (state.hidden) {
          state.sharkPeeks = Math.min(SHARK_GOAL, state.sharkPeeks + 1);
          state.sharkResolved = true;
          updateProgress();
          els.shark.classList.add('pass-by');
          OceanAudio.playPeekSuccess();
          setSpeech(LINES.peekSuccess);
          if (window.KidsKit) KidsKit.haptic('success');
        } else {
          els.shark.classList.add('miss-hello');
          OceanAudio.playSoftMiss();
          setSpeech(LINES.peekMiss);
        }
      }
    }

    later(function () {
      clearActors();
      startIdle();
    }, RESOLVE_MS);
  }

  function onWhaleHug() {
    if (state.phase !== 'active' || state.eventType !== 'whale') return;
    if (state.whaleResolved) return;
    state.whaleResolved = true;
    state.whaleHugs = Math.min(WHALE_GOAL, state.whaleHugs + 1);
    state.hugStreak += 1;
    updateProgress();

    var specialLevel = 0;
    if (state.hugStreak >= 3) specialLevel = 3;
    else if (state.hugStreak >= 2) specialLevel = 2;

    els.whale.classList.remove('hug', 'hug-spin');
    void els.whale.offsetWidth;
    if (specialLevel >= 2) {
      els.whale.classList.add('hug-spin');
      setSpeech(LINES.hugSpecial);
    } else {
      els.whale.classList.add('hug');
      setSpeech(LINES.hugSuccess);
    }

    spawnHearts(50, 42, specialLevel);
    OceanAudio.playHug();
    if (window.KidsKit) KidsKit.haptic(specialLevel >= 2 ? 'success' : 'medium');

    clearTimers();
    later(function () {
      state.phase = 'resolve';
      setPhaseClass('resolve');
      later(function () {
        clearActors();
        startIdle();
      }, RESOLVE_MS);
    }, specialLevel >= 2 ? HUG_SPECIAL_HOLD_MS : HUG_HOLD_MS);
  }

  function beginSunset() {
    clearTimers();
    state.phase = 'ending';
    setPhaseClass('ending');
    els.sea.classList.add('sunset');
    clearActors();
    placeDiverHome();
    OceanAudio.playSunset();
    setSpeech(LINES.sunset);

    if (store) {
      store.set('lastHugs', state.whaleHugs);
      store.set('lastPeeks', state.sharkPeeks);
      store.set('seenSpecialHug', store.get('seenSpecialHug', false) || state.hugStreak >= 2);
    }

    // 기존 노을 소프트 엔딩 패널 유지 (KidsKit.restButton이 중간 출구)
    els.endOverlay.classList.add('show');
  }

  function markVisitStart() {
    if (!store) return;
    var visits = store.get('visits', 0) || 0;
    store.set('visits', visits + 1);
    store.set('lastSeenAt', Date.now());
  }

  function playRevisitGreeting(thenStart) {
    state.phase = 'greeting';
    setPhaseClass('greeting');
    clearActors();
    placeDiverHome();
    els.turtle.classList.add('greet-wave');
    setSpeech(LINES.revisit);
    // 검증·디버그용: 인사가 한 번이라도 재생되면 남김
    if (els.sea) els.sea.setAttribute('data-revisit-greeted', '1');
    OceanAudio.playTap();

    var lastHugs = store ? store.get('lastHugs', 0) : 0;
    if (lastHugs > 0) {
      els.whale.classList.add('show', 'far-wave');
    }

    later(function () {
      els.turtle.classList.remove('greet-wave');
      els.whale.classList.remove('show', 'far-wave');
      if (typeof thenStart === 'function') thenStart();
    }, REVISIT_GREET_MS);
  }

  function startPlay(options) {
    options = options || {};
    OceanAudio.unlock();
    if (!options.silentTap) OceanAudio.playTap();
    clearTimers();
    state.phase = 'idle';
    state.whaleHugs = 0;
    state.sharkPeeks = 0;
    state.hugStreak = 0;
    state.lastEventType = null;
    state.sameStreak = 0;
    state.firstEventDone = false;
    state.eventType = null;
    updateProgress();
    els.titleScreen.classList.remove('show');
    els.endOverlay.classList.remove('show');
    els.sea.classList.remove('sunset');
    shuffleRoundDecor();
    placeDiverHome();

    if (options.fromRevisit) {
      playRevisitGreeting(function () {
        setSpeech(LINES.welcome);
        later(beginTelegraph, REVISIT_TO_PLAY_MS);
      });
    } else {
      setSpeech(LINES.welcome);
      later(beginTelegraph, WELCOME_MS);
    }
  }

  function onTitleActivate(e) {
    if (state.phase !== 'title') return;
    if (e && e.target && e.target.closest && e.target.closest('a')) return;
    if (e) e.preventDefault();
    markVisitStart();
    startPlay({ silentTap: false });
  }

  function bind() {
    els.titleScreen = $('titleScreen');
    els.endOverlay = $('endOverlay');
    els.sea = $('sea');
    els.diver = $('diver');
    els.turtle = $('turtle');
    els.speech = $('speech');
    els.whale = $('whale');
    els.shark = $('shark');
    els.bubbles = $('bubbleHint');
    els.finHint = $('finHint');
    els.fxLayer = $('fxLayer');
    els.whaleProgress = $('whaleProgress');
    els.sharkProgress = $('sharkProgress');
    els.btnStart = $('btnStart');
    els.btnAgain = $('btnAgain');
    els.btnLobby = $('btnLobby');
    els.btnLobbyEnd = $('btnLobbyEnd');
    els.btnMute = $('btnMute');

    els.btnStart.addEventListener('click', function (e) {
      e.stopPropagation();
      onTitleActivate(e);
    });

    // 타이틀 오버레이 어디든(로비 링크 제외) 탭하면 바로 시작 → 탭 1회 절약
    els.titleScreen.addEventListener('pointerdown', onTitleActivate);

    els.btnAgain.addEventListener('click', function () {
      els.endOverlay.classList.remove('show');
      startPlay();
    });
    els.btnMute.addEventListener('click', function () {
      var muted = OceanAudio.toggleMute();
      els.btnMute.textContent = muted ? '🔇' : '🔊';
      els.btnMute.setAttribute('aria-label', muted ? '소리 켜기' : '소리 끄기');
      OceanAudio.playTap();
    });

    document.querySelectorAll('.hide-spot').forEach(function (spot) {
      spot.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (state.phase === 'title' || state.phase === 'ending' || state.phase === 'greeting') return;
        if (
          state.phase === 'idle' ||
          state.phase === 'telegraph' ||
          state.phase === 'active' ||
          state.phase === 'resolve'
        ) {
          hideInSpot(spot);
        }
      });
    });

    els.whale.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      onWhaleHug();
    });

    document.body.addEventListener('pointerdown', function once() {
      OceanAudio.unlock();
      document.body.removeEventListener('pointerdown', once);
    });

    if (window.KidsKit && typeof KidsKit.restButton === 'function') {
      KidsKit.restButton({
        parent: $('app'),
        // 하단(br)은 산호·미역 은신처/말풍선과 겹쳐 상단 오른쪽으로 (음소거 버튼 아래)
        position: 'tr',
        onRest: function () {
          clearTimers();
          window.location.href = '../../index.html';
        }
      });
    }
  }

  function buildProgressPips() {
    var i;
    els.whaleProgress.innerHTML = '';
    els.sharkProgress.innerHTML = '';
    for (i = 0; i < WHALE_GOAL; i++) {
      var h = document.createElement('span');
      h.className = 'pip heart';
      h.textContent = '🤍';
      els.whaleProgress.appendChild(h);
    }
    for (i = 0; i < SHARK_GOAL; i++) {
      var b = document.createElement('span');
      b.className = 'pip bubble';
      b.textContent = '🫧';
      els.sharkProgress.appendChild(b);
    }
  }

  function boot() {
    if (window.KidsKit && typeof KidsKit.store === 'function') {
      store = KidsKit.store(STORE_NS);
    }
    bind();
    buildProgressPips();
    updateProgress();
    shuffleRoundDecor();

    var visits = store ? store.get('visits', 0) || 0 : 0;
    state.isReturning = visits > 0;

    preloadAssets().then(function () {
      if (state.isReturning) {
        // 재방문: 타이틀 스킵 → 거북이 인사 후 바로 놀이
        els.titleScreen.classList.remove('show');
        markVisitStart();
        startPlay({ fromRevisit: true, silentTap: true });
      } else {
        els.titleScreen.classList.add('show');
        state.phase = 'title';
        setSpeech(LINES.titleHint);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
