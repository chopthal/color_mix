(function () {
  'use strict';

  var WHALE_GOAL = 5;
  var SHARK_GOAL = 3;
  var TELEGRAPH_MS = 3000;
  var ACTIVE_MS = 4500;
  var RESOLVE_MS = 1600;
  var IDLE_MIN_MS = 1600;
  var IDLE_MAX_MS = 2800;

  var LINES = {
    sharkTelegraph: '쉿! 꾸벅꾸벅 졸린 상어가 지나가네. 우리 미역 이불 속으로 쏙 숨어볼까?',
    peekSuccess: '와, 진짜 감쪽같이 숨었다! 상어가 모르고 지나갔어. 까꿍!',
    peekMiss: '앗, 상어랑 눈이 마주쳤네! 상어가 ‘안녕?’ 하고 인사하고 간다.',
    whaleTelegraph: '보글보글~ 고래 친구가 올라오나 봐! 다가오면 꼭 안아 주자!',
    hugSuccess: '고래를 꼭 잡았네! 고래가 간지러워서 까르르 웃나 봐!',
    hugMiss: '고래가 손 흔들며 가네. 다음에 또 안아 주자!',
    welcome: '바닷속에 온 걸 환영해! 미역은 숨는 곳, 고래가 오면 톡 눌러 안아 줘!',
    sunset: '와, 이제 고래랑 상어도 코 자러 갈 시간이래. 우리도 물 밖으로 나가서 엄마(아빠)랑 이야기 나누자!'
  };

  var state = {
    phase: 'title',
    eventType: null,
    hidden: false,
    hideSpotId: null,
    whaleHugs: 0,
    sharkPeeks: 0,
    lastEventType: null,
    sameStreak: 0,
    whaleResolved: false,
    sharkResolved: false,
    timers: [],
    firstEventDone: false
  };

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
  }

  function chooseNextEvent() {
    if (!state.firstEventDone) {
      state.firstEventDone = true;
      return 'whale';
    }
    var pick = Math.random() < 0.5 ? 'whale' : 'shark';
    if (state.lastEventType && pick === state.lastEventType && state.sameStreak >= 2) {
      pick = pick === 'whale' ? 'shark' : 'whale';
    }
    return pick;
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
    els.whale.classList.remove('show', 'hug', 'wave', 'from-left', 'from-right');
    els.shark.classList.remove('show', 'miss-hello', 'pass-by', 'from-left', 'from-right');
    els.bubbles.classList.remove('show');
    els.finHint.classList.remove('show');
    els.fxLayer.innerHTML = '';
  }

  function spawnHearts(xPct, yPct) {
    var n = 6;
    var i;
    for (i = 0; i < n; i++) {
      var h = document.createElement('span');
      h.className = 'fx-heart';
      h.textContent = '💕';
      h.style.left = xPct + (Math.random() * 12 - 6) + '%';
      h.style.top = yPct + (Math.random() * 8 - 4) + '%';
      h.style.animationDelay = i * 0.06 + 's';
      els.fxLayer.appendChild(h);
    }
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
      // 상어 Active 시작 시점 은신 여부로 판정은 Resolve에서
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
        // miss: swam away
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
    updateProgress();
    els.whale.classList.add('hug');
    spawnHearts(50, 42);
    OceanAudio.playHug();
    setSpeech(LINES.hugSuccess);
    clearTimers();
    later(function () {
      state.phase = 'resolve';
      setPhaseClass('resolve');
      later(function () {
        clearActors();
        startIdle();
      }, RESOLVE_MS);
    }, 900);
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
    els.endOverlay.classList.add('show');
  }

  function startPlay() {
    OceanAudio.unlock();
    OceanAudio.playTap();
    clearTimers();
    state.phase = 'idle';
    state.whaleHugs = 0;
    state.sharkPeeks = 0;
    state.lastEventType = null;
    state.sameStreak = 0;
    state.firstEventDone = false;
    state.eventType = null;
    updateProgress();
    els.titleScreen.classList.remove('show');
    els.endOverlay.classList.remove('show');
    els.sea.classList.remove('sunset');
    setSpeech(LINES.welcome);
    placeDiverHome();
    later(beginTelegraph, 2200);
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

    els.btnStart.addEventListener('click', startPlay);
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
        if (state.phase === 'title' || state.phase === 'ending') return;
        if (state.phase === 'idle' || state.phase === 'telegraph' || state.phase === 'active' || state.phase === 'resolve') {
          hideInSpot(spot);
        }
      });
    });

    els.whale.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      onWhaleHug();
    });

    // unlock audio on first gesture
    document.body.addEventListener('pointerdown', function once() {
      OceanAudio.unlock();
      document.body.removeEventListener('pointerdown', once);
    });
  }

  function buildProgressPips() {
    var i;
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

  document.addEventListener('DOMContentLoaded', function () {
    bind();
    buildProgressPips();
    updateProgress();
    els.titleScreen.classList.add('show');
    setSpeech('안녕! 나는 아기 거북이야. 같이 바닷속 까꿍 놀이할래?');
  });
})();
