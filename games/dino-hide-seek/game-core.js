(function () {
  'use strict';

  var D = window.DINO || {};
  var SPECIES = D.SPECIES || [];
  var HABITATS = D.HABITATS || [];
  var SPOTS = D.SPOTS || {};
  var FOODS = D.FOODS || [];
  var DIET_EMOJI = D.DIET_EMOJI || {};
  var ACC_EMOJI = D.ACC_EMOJI || {};
  var ACC_LABEL = D.ACC_LABEL || {};
  var SAVE_KEY = D.SAVE_KEY || 'dino-hide-seek-v2';
  var TOTAL_SPECIES = SPECIES.length;
  var TOTAL_HEARTS = TOTAL_SPECIES * 3;
  var SCENE_ART = D.SCENE_ART || {};
  var dinoArt = D.dinoArt || function () { return ''; };
  var spotArt = D.spotArt || function () { return ''; };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  var storage = (function () {
    try {
      var k = '__dino2_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return localStorage;
    } catch (e) {
      var mem = {};
      return {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
        setItem: function (k, v) { mem[k] = String(v); },
        removeItem: function (k) { delete mem[k]; }
      };
    }
  })();

  function defaultSave() {
    var found = {}, hearts = {}, accessory = {};
    SPECIES.forEach(function (d) { found[d.id] = false; hearts[d.id] = 0; accessory[d.id] = ''; });
    return {
      version: 2,
      found: found,
      hearts: hearts,
      accessory: accessory,
      golden: { forest: false, meadow: false, lake: false },
      lastHabitat: 'forest',
      lastTime: 'day',
      sound: true,
      sessions: 0
    };
  }

  var state = {
    save: defaultSave(),
    screen: 'title',
    habitat: 'forest',
    time: 'day',
    session: null,
    token: 0,
    bookHab: 'forest',
    bookReturn: 'map',
    pgTab: 'forest',
    careReturn: 'playground',
    care: null,
    detailId: null
  };

  function countFoundIn(save, hab) {
    var n = 0;
    SPECIES.forEach(function (d) { if (d.habitat === hab && save.found[d.id]) n++; });
    return n;
  }
  function countHabitat(hab) { return countFoundIn(state.save, hab); }
  function totalFound() {
    var n = 0;
    SPECIES.forEach(function (d) { if (state.save.found[d.id]) n++; });
    return n;
  }
  function totalHearts() {
    var n = 0;
    SPECIES.forEach(function (d) { n += state.save.hearts[d.id] || 0; });
    return n;
  }
  function careNeeded() {
    var n = 0;
    SPECIES.forEach(function (d) {
      if (state.save.found[d.id] && state.save.hearts[d.id] < 3) n++;
    });
    return n;
  }

  function loadSave() {
    var base = defaultSave();
    var raw = null;
    try { raw = storage.getItem(SAVE_KEY); } catch (e) { raw = null; }
    if (!raw) return base;

    var p = null;
    try { p = JSON.parse(raw); } catch (e) { return base; }
    if (!p || p.version !== 2) return base;

    base.sound = p.sound !== false;
    base.lastHabitat = HABITATS.some(function (h) { return h.id === p.lastHabitat; }) ? p.lastHabitat : 'forest';
    base.lastTime = p.lastTime === 'night' ? 'night' : 'day';
    base.sessions = isFinite(p.sessions) ? Math.max(0, Math.floor(p.sessions)) : 0;

    SPECIES.forEach(function (d) {
      base.found[d.id] = !!(p.found && p.found[d.id]);
      var h = p.hearts && p.hearts[d.id];
      base.hearts[d.id] = isFinite(h) ? Math.max(0, Math.min(3, Math.floor(h))) : 0;
      var a = p.accessory && p.accessory[d.id];
      base.accessory[d.id] = ACC_EMOJI[a] ? a : '';
    });

    HABITATS.forEach(function (h) {
      base.golden[h.id] = !!(p.golden && p.golden[h.id]) || countFoundIn(base, h.id) >= 10;
    });
    return base;
  }

  function speciesById(id) {
    return SPECIES.filter(function (d) { return d.id === id; })[0] || null;
  }
  function speciesFor(hab, time) {
    return SPECIES.filter(function (d) { return d.habitat === hab && d.time === time; });
  }
  function habitatName(id) {
    var h = HABITATS.filter(function (x) { return x.id === id; })[0];
    return h ? h.name : '';
  }

  var saveTimer = null;
  function saveNow() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    try { storage.setItem(SAVE_KEY, JSON.stringify(state.save)); } catch (e) { /* ignore */ }
  }
  function saveSoon() {
    if (saveTimer) return;
    saveTimer = setTimeout(function () { saveTimer = null; saveNow(); }, 250);
  }

  /* ============================================================
     사운드 / 음성
     ============================================================ */
  var audioCtx = null;
  function ensureAudio() {
    if (!state.save || state.save.sound === false) return null;
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { audioCtx = new AC(); } catch (e) { return null; }
    }
    if (audioCtx.state === 'suspended') {
      try { audioCtx.resume(); } catch (e) { /* ignore */ }
    }
    return audioCtx;
  }

  function tone(freq, dur, opts) {
    opts = opts || {};
    var ctx = ensureAudio();
    if (!ctx) return;
    try {
      var t0 = ctx.currentTime + (opts.delay || 0);
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = opts.type || 'sine';
      osc.frequency.setValueAtTime(Math.max(30, freq), t0);
      if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(30, opts.to), t0 + dur);
      var vol = typeof opts.vol === 'number' ? opts.vol : 0.16;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.04);
    } catch (e) { /* ignore */ }
  }

  function playPop() { tone(520, 0.12, { to: 900, vol: 0.15 }); }
  function playReveal(base) {
    var root = base || 220;
    [0, 4, 7].forEach(function (n, i) {
      tone(root * Math.pow(2, n / 12), 0.2, { type: 'triangle', vol: 0.14, delay: i * 0.085 });
    });
    tone(root * 2, 0.32, { vol: 0.09, delay: 0.26 });
  }
  function playFanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
      tone(f, i === 3 ? 0.46 : 0.16, { type: 'triangle', vol: 0.14, delay: i * 0.12 });
    });
  }
  function playGolden() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
      tone(f, 0.36, { vol: 0.12, delay: i * 0.09 });
    });
  }
  function playSwitch(day) {
    if (day) tone(392, 0.22, { to: 784, vol: 0.12 });
    else tone(660, 0.24, { to: 330, vol: 0.12 });
  }
  function playSoftNo() { tone(330, 0.16, { to: 262, vol: 0.09 }); }
  function playChomp() {
    tone(170, 0.1, { to: 110, type: 'triangle', vol: 0.16 });
    tone(280, 0.08, { type: 'square', vol: 0.05, delay: 0.1 });
  }
  function playSplash() {
    tone(760, 0.32, { to: 240, vol: 0.12 });
    tone(980, 0.22, { to: 420, vol: 0.07, delay: 0.08 });
  }
  function playGiggle() {
    [620, 780, 940].forEach(function (f, i) {
      tone(f, 0.1, { type: 'triangle', vol: 0.11, delay: i * 0.07 });
    });
  }
  function playHeart() {
    [660, 880, 1100].forEach(function (f, i) {
      tone(f, 0.18, { vol: 0.12, delay: i * 0.07 });
    });
  }

  var koreanVoice = null;
  function pickKoreanVoice() {
    if (!('speechSynthesis' in window)) return;
    var voices = [];
    try { voices = speechSynthesis.getVoices() || []; } catch (e) { voices = []; }
    var ko = voices.filter(function (v) { return /^ko/i.test(v.lang || ''); });
    koreanVoice = ko.filter(function (v) {
      return /heami|sunhi|yuna|minji|sora|jimin|female|neural/i.test(v.name || '');
    })[0] || ko[0] || null;
  }
  if ('speechSynthesis' in window) {
    pickKoreanVoice();
    try { speechSynthesis.onvoiceschanged = pickKoreanVoice; } catch (e) { /* ignore */ }
  }

  var isAppleTouch = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function speak(text) {
    if (!text || !state.save || state.save.sound === false) return;
    if (!('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.rate = 0.88;
      u.pitch = 1.14;
      if (koreanVoice) u.voice = koreanVoice;
      if (isAppleTouch) {
        setTimeout(function () { try { speechSynthesis.speak(u); } catch (e) { } }, 60);
      } else {
        speechSynthesis.speak(u);
      }
    } catch (e) { /* ignore */ }
  }

  /* ============================================================
     공통 UI
     ============================================================ */
  function showScreen(name) {
    state.screen = name;
    $$('.screen').forEach(function (el) {
      el.classList.toggle('active', el.id === name + 'Screen');
    });
  }

  function openOverlay(html, cls) {
    var overlay = $('#overlay');
    overlay.innerHTML = '<div class="modal-card ' + (cls || '') + '">' + html + '</div>';
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add('show'); });
  }

  function closeOverlay() {
    var overlay = $('#overlay');
    overlay.classList.remove('show');
    setTimeout(function () {
      if (!overlay.classList.contains('show')) {
        overlay.hidden = true;
        overlay.innerHTML = '';
      }
    }, 220);
  }

  function showToast(text) {
    var layer = $('#toastLayer');
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    layer.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1900);
  }

  function heartsHTML(n) {
    var html = '';
    for (var i = 0; i < 3; i++) {
      html += '<span class="heart' + (i < n ? ' on' : '') + '">♥</span>';
    }
    return html;
  }

  function accEmoji(id) {
    var a = state.save.accessory[id];
    return a ? ACC_EMOJI[a] : '';
  }

  function accPos(d) {
    switch (d.kind) {
      case 'sauropod': return { top: '18%', left: '80%' };
      case 'ceratops': return { top: '28%', left: '72%' };
      case 'stego': return { top: '46%', left: '72%' };
      case 'ankylo': return { top: '50%', left: '70%' };
      case 'pachy': return { top: '18%', left: '70%' };
      case 'theri': return { top: '24%', left: '76%' };
      case 'hadrosaur': return { top: '28%', left: '72%' };
      case 'ptera': return { top: '20%', left: '50%' };
      case 'bird': return { top: '28%', left: '50%' };
      case 'marine':
        if (d.opts && d.opts.marine === 'mosa') return { top: '48%', left: '80%' };
        if (d.opts && d.opts.marine === 'ichthyo') return { top: '54%', left: '82%' };
        return { top: '20%', left: '80%' };
      default: return { top: '18%', left: '78%' };
    }
  }

  function mudPositions(d) {
    switch (d.kind) {
      case 'sauropod': return [{ x: 31, y: 50 }, { x: 62, y: 46 }, { x: 43, y: 70 }, { x: 65, y: 68 }];
      case 'stego':
      case 'ankylo':
      case 'pachy': return [{ x: 30, y: 48 }, { x: 60, y: 44 }, { x: 40, y: 70 }, { x: 62, y: 68 }];
      case 'marine': return [{ x: 30, y: 56 }, { x: 60, y: 52 }, { x: 40, y: 72 }, { x: 62, y: 70 }];
      case 'ptera':
      case 'bird': return [{ x: 34, y: 50 }, { x: 60, y: 46 }, { x: 42, y: 68 }, { x: 62, y: 66 }];
      case 'theri':
      case 'hadrosaur': return [{ x: 34, y: 48 }, { x: 62, y: 44 }, { x: 42, y: 70 }, { x: 64, y: 68 }];
      default: return [{ x: 31, y: 36 }, { x: 62, y: 32 }, { x: 42, y: 62 }, { x: 64, y: 60 }];
    }
  }

  function needFor(species) {
    var h = state.save.hearts[species.id] || 0;
    if (h >= 3) return '';
    if (h === 0) return DIET_EMOJI[species.diet] || '🥩';
    return h === 1 ? '🫧' : '🎾';
  }

  function lockedEgg() {
    return '<svg viewBox="0 0 100 100" class="locked-egg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
      + '<path d="M50 14 C72 14 84 50 84 68 C84 84 69 92 50 92 C31 92 16 84 16 68 C16 50 28 14 50 14Z" fill="#dbe7f2" stroke="#b3c7da" stroke-width="4"/>'
      + '<text x="50" y="66" text-anchor="middle" font-size="34" font-family="Jua, sans-serif" fill="#93a9be">?</text></svg>';
  }

  function updateSoundUI() {
    var on = state.save.sound !== false;
    var icon = on ? '🔊' : '🔇';
    ['#titleSound', '#gameSound', '#bookSound', '#pgSound', '#careSound'].forEach(function (sel) {
      var el = $(sel);
      if (el) {
        el.textContent = icon;
        el.setAttribute('aria-label', on ? '소리 끄기' : '소리 켜기');
      }
    });
    var mapSound = $('#mapSound');
    if (mapSound) mapSound.textContent = on ? '🔊 소리 켜짐' : '🔇 소리 꺼짐';
  }

  function toggleSound() {
    state.save.sound = !state.save.sound;
    if (!state.save.sound && 'speechSynthesis' in window) {
      try { speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    }
    saveNow();
    updateSoundUI();
    if (state.save.sound) {
      ensureAudio();
      playPop();
    }
  }

  /* ============================================================
     타이틀
     ============================================================ */
  function renderTitle() {
    var found = totalFound();
    var hearts = totalHearts();
    $('#titleProgress').textContent = '도감 ' + found + ' / ' + TOTAL_SPECIES + ' · 하트 ' + hearts + ' / ' + TOTAL_HEARTS;
    $('#startBtn').textContent = found > 0 ? '이어서 하기 🦕' : '모험 시작! 🦖';

    var pgBtn = $('#titlePlayground');
    pgBtn.hidden = found === 0;
    pgBtn.textContent = '🦕 공룡 놀이터' + (careNeeded() > 0 ? ' (' + careNeeded() + ')' : '');

    var picks = ['tri', 'tino', 'braki'].map(speciesById).filter(Boolean);
    $('#titleDinos').innerHTML = picks.map(function (d) {
      return '<div class="title-dino">' + dinoArt(d) + '</div>';
    }).join('');
    updateSoundUI();
  }

  /* ============================================================
     장소 선택
     ============================================================ */
  function renderMap() {
    var list = $('#placeList');
    list.innerHTML = '';
    HABITATS.forEach(function (h) {
      var got = countHabitat(h.id);
      var pct = Math.round((got / 10) * 100);
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'place-card';
      el.setAttribute('aria-label', h.name + ' 놀러 가기, 도감 ' + got + ' / 10');
      el.innerHTML = '<span class="preview ' + h.id + '">' + h.emoji + '</span>'
        + '<span class="place-info">'
        + '<span class="place-title">' + h.name + '</span>'
        + '<span class="sub">' + h.sub + '</span>'
        + '<span class="bar"><i style="width:' + pct + '%"></i></span>'
        + '<span class="count">도감 ' + got + ' / 10</span>'
        + '</span>'
        + (got >= 10 ? '<span class="golden-badge" aria-label="황금 알 획득">🥚</span>' : '');
      el.addEventListener('click', function () {
        playPop();
        enterGame(h.id, state.save.lastTime);
      });
      list.appendChild(el);
    });

    $('#mapProgress').textContent = '도감 ' + totalFound() + ' / ' + TOTAL_SPECIES;

    var need = careNeeded();
    var shortcut = $('#careShortcut');
    shortcut.classList.toggle('empty', totalFound() === 0);
    $('#csBadge').textContent = need;
    $('#csSub').textContent = totalFound() === 0
      ? '먼저 숨바꼭질로 친구를 만나요'
      : need === 0
        ? '모두 다 컸어요! 자유 놀이'
        : need + '마리가 기다려요';

    updateMapTime();
    updateSoundUI();
  }

  function updateMapTime() {
    var day = state.save.lastTime === 'day';
    $('#mapDay').classList.toggle('active', day);
    $('#mapNight').classList.toggle('active', !day);
    $('#mapNight').classList.add('night');
  }

  /* ============================================================
     숨바꼭질
     ============================================================ */
  function applyScene() {
    var scene = $('#scene');
    scene.dataset.scene = state.habitat;
    scene.dataset.time = state.time;
    $('#landscape').innerHTML = SCENE_ART[state.habitat] || SCENE_ART.forest;
    $('#hudSceneName').textContent = habitatName(state.habitat);
    $('#timeToggle').textContent = state.time === 'day' ? '🌙' : '☀️';
    $('#timeToggle').setAttribute('aria-label', state.time === 'day' ? '밤으로 바꾸기' : '낮으로 바꾸기');
    renderStars();
  }

  function renderStars() {
    var box = $('#stars');
    var html = '';
    for (var i = 0; i < 30; i++) {
      var left = (Math.random() * 100).toFixed(1);
      var top = (Math.random() * 62).toFixed(1);
      var delay = (Math.random() * 2.6).toFixed(2);
      var size = Math.round(Math.random() * 3 + 2);
      html += '<i style="left:' + left + '%;top:' + top + '%;width:' + size + 'px;height:' + size + 'px;animation-delay:' + delay + 's"></i>';
    }
    box.innerHTML = html;
  }

  function enterGame(habitat, time) {
    state.habitat = HABITATS.some(function (h) { return h.id === habitat; }) ? habitat : 'forest';
    state.time = time === 'night' ? 'night' : 'day';
    state.save.lastHabitat = state.habitat;
    state.save.lastTime = state.time;
    saveNow();
    applyScene();
    showScreen('game');
    startSession();
  }

  function startSession() {
    state.token++;
    var token = state.token;
    var positions = shuffle(SPOTS[state.habitat].slice()).slice(0, 5);
    var dinos = shuffle(speciesFor(state.habitat, state.time));
    state.session = {
      found: 0,
      newCount: 0,
      busy: false,
      finished: false,
      resultShown: false,
      newlyGolden: false,
      token: token,
      spots: positions.map(function (p, i) {
        return { type: p.type, x: p.x, y: p.y, dino: dinos[i], found: false };
      })
    };
    renderSpots();
    updateHud();
    setHint('흔들리는 곳을 콕! 눌러보세요');
    state.save.sessions = (state.save.sessions || 0) + 1;
    state.save.lastHabitat = state.habitat;
    state.save.lastTime = state.time;
    saveNow();
  }

  function renderSpots() {
    var layer = $('#spots');
    layer.innerHTML = '';
    state.session.spots.forEach(function (spot, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'spot';
      if (spot.x <= 14) btn.classList.add('edge-left');
      if (spot.x >= 86) btn.classList.add('edge-right');
      btn.style.left = spot.x + '%';
      btn.style.top = spot.y + '%';
      btn.style.setProperty('--delay', (Math.random() * 2.4).toFixed(2) + 's');
      btn.setAttribute('aria-label', '흔들리는 곳, 눌러서 공룡 찾기');
      btn.innerHTML = '<span class="spot-art" aria-hidden="true">' + spotArt(spot.type) + '</span>'
        + '<span class="twinkle" aria-hidden="true"></span>'
        + '<span class="reveal-dino" aria-hidden="true"></span>'
        + burstMarks();
      btn.addEventListener('click', function () { onSpotTap(i, btn); });
      layer.appendChild(btn);
    });
    layoutSpots();
  }

  function layoutSpots() {
    if (!state.session) return;
    var vh = window.innerHeight;
    var short = vh <= 520;
    $$('.spot').forEach(function (el, i) {
      var spot = state.session.spots[i];
      if (!spot) return;
      var width = el.getBoundingClientRect().width || 100;
      var half = width * 0.76;
      var minCenter = (short ? 84 : 78) + half;
      var maxCenter = vh - (short ? 74 : 96) - half;
      var raw = (vh * spot.y) / 100;
      var center = Math.min(Math.max(raw, minCenter), Math.max(minCenter, maxCenter));
      el.style.top = ((center / vh) * 100).toFixed(2) + '%';
      el.style.left = (short ? Math.min(Math.max(spot.x, 16), 84) : spot.x) + '%';
    });
  }

  function burstMarks() {
    var colors = ['#ffd93b', '#ff8fab', '#7fe0a2', '#8ecbff', '#ffffff'];
    var out = '';
    for (var i = 0; i < 8; i++) {
      var a = (Math.PI * 2 * i / 8) + Math.random() * 0.4;
      var r = 54 + Math.random() * 34;
      out += '<i class="burst" style="--tx:' + Math.round(Math.cos(a) * r) + 'px;--ty:' + Math.round(Math.sin(a) * r) + 'px;--bd:' + (i * 0.03).toFixed(2) + 's;--bc:' + colors[i % colors.length] + '"></i>';
    }
    return out;
  }

  function updateHud() {
    var s = state.session;
    $('#hudCounter').textContent = (s ? s.found : 0) + ' / 5';
  }

  var hintTimer = null;
  function setHint(text, restoreAfter) {
    var el = $('#hintText');
    el.textContent = text;
    if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
    if (restoreAfter) {
      hintTimer = setTimeout(function () {
        hintTimer = null;
        if (state.screen === 'game') setHint('흔들리는 곳을 콕! 눌러보세요');
      }, restoreAfter);
    }
  }

  function onSpotTap(i, el) {
    var s = state.session;
    if (!s || s.busy || s.finished) return;
    var spot = s.spots[i];
    if (!spot || spot.found || !spot.dino) return;

    s.busy = true;
    spot.found = true;
    var d = spot.dino;
    var token = s.token;

    el.classList.add('opening');
    playPop();

    setTimeout(function () {
      if (!state.session || state.session.token !== token) return;
      el.classList.remove('opening');
      el.classList.add('found');

      var holder = el.querySelector('.reveal-dino');
      if (holder) {
        holder.innerHTML = dinoArt(d) + '<span class="name-tag">까꿍! ' + d.name + '</span>';
        holder.classList.add('show');
      }

      var isNew = markFound(d.id);
      if (isNew) s.newCount++;
      s.found++;
      updateHud();

      if (state.screen === 'game') {
        playReveal(d.pitch);
        speak(d.name + '! 까꿍!');
        if (isNew) showToast('도감에 쏙! ' + d.name);
      }

      setTimeout(function () {
        if (!state.session || state.session.token !== token) return;
        s.busy = false;
        if (s.found >= 5) finishSession();
      }, 900);
    }, 240);
  }

  function markFound(id) {
    if (state.save.found[id]) { saveNow(); return false; }
    state.save.found[id] = true;
    saveNow();
    return true;
  }

  function finishSession() {
    var s = state.session;
    if (!s || s.finished) return;
    s.finished = true;
    s.busy = false;

    var hab = state.habitat;
    if (countHabitat(hab) >= 10 && !state.save.golden[hab]) {
      state.save.golden[hab] = true;
      s.newlyGolden = true;
    }
    saveNow();
    if (state.screen === 'game') presentResult();
  }

  function presentResult() {
    var s = state.session;
    if (!s || !s.finished || s.resultShown) return;
    s.resultShown = true;

    var found = totalFound();
    var hearts = totalHearts();
    var allFound = found >= TOTAL_SPECIES;
    var allCare = hearts >= TOTAL_HEARTS;

    var extra = '';
    if (s.newlyGolden) extra += '<div class="golden-line">🥚 황금 알을 발견했어요!</div>';
    if (allFound) extra += '<div class="golden-line">🏆 공룡 박사가 되었어요!</div>';
    if (allCare) extra += '<div class="golden-line">💛 돌봄 대장이 되었어요!</div>';

    openOverlay(
      '<div class="result-stars" aria-hidden="true">⭐️⭐️⭐️</div>'
      + '<h2>우와! 다 찾았어요!</h2>'
      + '<p>' + habitatName(state.habitat) + ' · ' + (state.time === 'day' ? '낮' : '밤') + '에서 5마리 까꿍!<br>'
      + '새 친구 ' + s.newCount + '마리 · 도감 ' + found + ' / ' + TOTAL_SPECIES + ' · 하트 ' + hearts + ' / ' + TOTAL_HEARTS + '</p>'
      + extra
      + '<div class="result-actions">'
      + '<button class="big-btn primary" data-act="again" type="button">한 번 더 🦖</button>'
      + '<button class="big-btn soft" data-act="playground" type="button">공룡 놀이터 🦕</button>'
      + '<button class="big-btn ghost" data-act="map" type="button">다른 곳 가기</button>'
      + '</div>'
    );

    playFanfare();
    speak('우와! 다 찾았어요!');
    if (s.newlyGolden) setTimeout(playGolden, 420);
  }

  function toggleTime() {
    if (state.screen !== 'game') return;
    if (state.session && (state.session.busy || state.session.finished)) return;
    state.time = state.time === 'day' ? 'night' : 'day';
    state.save.lastTime = state.time;
    saveNow();
    applyScene();
    playSwitch(state.time === 'day');
    speak(state.time === 'day' ? '해가 떠서 낮이 되었어요!' : '달이 떠서 밤이 되었어요!');
    startSession();
    setHint('시간이 바뀌어 새 친구들이 숨어 있어요!', 2800);
  }

  /* ============================================================
     놀이터
     ============================================================ */
  function openPlayground(tab) {
    state.pgTab = tab || state.pgTab || 'forest';
    showScreen('playground');
    renderPlayground();
  }

  function renderPlayground() {
    var found = totalFound();
    var hearts = totalHearts();
    $('#pgBar').style.width = Math.round((hearts / TOTAL_HEARTS) * 100) + '%';
    $('#pgHeartCount').textContent = '하트 ' + hearts + ' / ' + TOTAL_HEARTS;

    var tabs = [
      { id: 'forest', label: '🌳 숲' },
      { id: 'meadow', label: '🌾 초원' },
      { id: 'lake', label: '🌊 호수' },
      { id: 'care', label: '💛 돌봄' }
    ];
    var tabBox = $('#pgTabs');
    tabBox.innerHTML = '';
    tabs.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = state.pgTab === t.id ? 'active' : '';
      b.textContent = t.label;
      b.addEventListener('click', function () {
        state.pgTab = t.id;
        playPop();
        renderPlayground();
      });
      tabBox.appendChild(b);
    });

    var grid = $('#pgGrid');
    grid.innerHTML = '';

    if (found === 0) {
      grid.innerHTML = '<div class="pg-empty"><span class="big">🥚</span>아직 만난 공룡이 없어요.<br>숨바꼭질에서 먼저 친구를 찾아주세요!</div>';
      updateSoundUI();
      return;
    }

    var list;
    if (state.pgTab === 'care') {
      list = SPECIES.filter(function (d) {
        return state.save.found[d.id] && state.save.hearts[d.id] < 3;
      });
      if (!list.length) {
        grid.innerHTML = '<div class="pg-empty"><span class="big">💛</span>모든 공룡이 다 컸어요!<br>놀이터에서 계속 같이 놀 수 있어요.</div>';
        updateSoundUI();
        return;
      }
    } else {
      list = SPECIES.filter(function (d) { return d.habitat === state.pgTab; });
    }

    list.forEach(function (d) {
      var isFound = !!state.save.found[d.id];
      var h = state.save.hearts[d.id] || 0;
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'pg-card' + (isFound ? '' : ' locked') + (isFound && h < 3 ? ' needs-care' : '');
      card.dataset.id = d.id;
      card.setAttribute('aria-label', isFound ? d.name + ' 돌보기' : '아직 만나지 못한 공룡');
      card.innerHTML = '<span class="pg-time">' + (d.time === 'day' ? '☀️' : '🌙') + '</span>'
        + (isFound && h < 3 ? '<span class="pg-need">' + needFor(d) + '</span>' : '')
        + '<span class="pg-art">' + (isFound ? dinoArt(d) : lockedEgg()) + '</span>'
        + '<span class="pg-name">' + (isFound ? d.name : '???') + '</span>'
        + '<span class="pg-hearts">' + heartsHTML(isFound ? h : 0) + '</span>'
        + (isFound && accEmoji(d.id) ? '<span class="acc-pin">' + accEmoji(d.id) + '</span>' : '');
      grid.appendChild(card);
    });
    updateSoundUI();
  }

  function handlePgClick(e) {
    var card = e.target.closest('.pg-card');
    if (!card) return;
    var d = speciesById(card.dataset.id);
    if (!d) return;
    if (!state.save.found[d.id]) {
      playSoftNo();
      showToast('숨바꼭질에서 먼저 만나요!');
      speak('숨바꼭질에서 먼저 만나요!');
      return;
    }
    playPop();
    openCare(d.id, 'playground');
  }

  /* ============================================================
     돌봄
     ============================================================ */
  function openCare(id, from) {
    var d = speciesById(id);
    if (!d) return;
    var h = state.save.hearts[id] || 0;
    state.careReturn = from || 'playground';
    state.care = {
      id: id,
      step: h,
      busy: false,
      feedWrong: 0,
      mudLeft: 0,
      playRound: 0,
      playTarget: 0,
      playWrong: 0,
      bubbles: 0,
      completedSpoken: false
    };
    showScreen('care');
    renderCare();

    if (h === 0) speak(d.name + '! 만나서 반가워. 무엇을 먹을까요?');
    else if (h === 1) speak(d.name + '를 씻겨 줄까요?');
    else if (h === 2) speak(d.name + '와 같이 놀아요!');
    else speak(d.name + '와 다시 만나서 반가워요!');
  }

  function renderCare() {
    if (!state.care) return;
    var d = speciesById(state.care.id);
    if (!d) return;
    var h = state.save.hearts[d.id] || 0;
    state.care.step = h;

    $('#careName').textContent = d.name;
    $('#careHearts').innerHTML = heartsHTML(h);
    renderCareSteps(d, h);

    var acc = accEmoji(d.id);
    var crown = h >= 3 ? '👑' : '';
    var pos = accPos(d);
    $('#careDino').className = 'care-dino' + (h >= 3 ? ' dance' : '');
    $('#careDino').innerHTML = dinoArt(d)
      + (acc || crown ? '<span class="dino-acc" style="left:' + pos.left + ';top:' + pos.top + '">' + (acc || crown) + '</span>' : '');

    $('#careFact').textContent = h > 0 ? d.facts[Math.min(h, 3) - 1] : '만나서 반가워! 같이 놀자!';
    $('#careFx').innerHTML = '';

    if (h >= 3) {
      renderCareDone(d);
    } else if (h === 0) {
      renderFeed(d);
    } else if (h === 1) {
      renderBath(d);
    } else {
      renderPlay(d);
    }
  }

  function renderCareSteps(d, h) {
    var steps = [
      { icon: DIET_EMOJI[d.diet] || '🥩', label: '먹이' },
      { icon: '🫧', label: '씻기' },
      { icon: '🎾', label: '놀이' }
    ];
    $('#careSteps').innerHTML = steps.map(function (s, i) {
      var cls = i < h ? 'done' : i === h ? 'active' : '';
      return '<div class="care-step ' + cls + '"><span class="step-icon">' + s.icon + '</span><span class="step-label">' + s.label + '</span></div>';
    }).join('');
  }

  function renderFeed(d) {
    var foods = shuffle(FOODS.slice());
    var correct = d.diet;
    $('#carePanel').innerHTML = '<p class="care-prompt">' + d.name + '에게 무엇을 줄까요?</p>'
      + '<div class="food-row">'
      + foods.map(function (f) {
        var isOk = correct === 'omni' ? (f.id === 'meat' || f.id === 'plant') : f.id === correct;
        var hint = state.care.feedWrong >= 2 && isOk ? ' hint' : '';
        return '<button class="food-btn' + hint + '" type="button" data-food="' + f.id + '" aria-label="' + f.label + ' 주기">'
          + '<span class="food-emoji">' + f.emoji + '</span><span class="food-label">' + f.label + '</span></button>';
      }).join('')
      + '</div>';
  }

  function handleFood(foodId, btn) {
    var d = speciesById(state.care.id);
    if (!d || state.care.busy) return;
    var correct = d.diet === 'omni'
      ? (foodId === 'meat' || foodId === 'plant')
      : foodId === d.diet;

    if (!correct) {
      state.care.feedWrong++;
      playSoftNo();
      speak('이건 내 먹이가 아니야.');
      btn.classList.add('wrong');
      setTimeout(function () { btn.classList.remove('wrong'); }, 500);
      if (state.care.feedWrong >= 2) {
        var ok = $$('.food-btn').filter(function (b) {
          return d.diet === 'omni' ? (b.dataset.food === 'meat' || b.dataset.food === 'plant') : b.dataset.food === d.diet;
        })[0];
        if (ok) ok.classList.add('hint');
      }
      return;
    }

    state.care.busy = true;
    $$('.food-btn').forEach(function (b) { b.disabled = true; });
    var emoji = (FOODS.filter(function (f) { return f.id === foodId; })[0] || {}).emoji || '🥩';
    $('#careFx').innerHTML = '<span class="fx-food">' + emoji + '</span>';
    $('#careDino').classList.add('happy');
    playChomp();
    setTimeout(playHeart, 220);
    speak(d.name + ', 냠냠! 잘 먹었어요!');
    state.save.hearts[d.id] = 1;
    saveNow();

    setTimeout(function () {
      if (state.screen !== 'care' || !state.care || state.care.id !== d.id) return;
      state.care.busy = false;
      renderCare();
    }, 1150);
  }

  function renderBath(d) {
    state.care.mudLeft = 4;
    var positions = mudPositions(d);
    var mud = positions.map(function (p, i) {
      return '<button class="mud" type="button" data-mud="' + i + '" style="left:' + p.x + '%;top:' + p.y + '%" aria-label="진흙 닦기"></button>';
    }).join('');
    $('#careDino').innerHTML += mud;
    $('#carePanel').innerHTML = '<p class="care-prompt">' + d.name + '의 진흙을 닦아 주세요!</p>'
      + '<div class="bath-tools"><span class="sponge">🧽</span><span>진흙을 콕콕 눌러 주세요</span></div>';
  }

  function handleMud(btn) {
    if (!state.care || state.care.busy) return;
    if (btn.classList.contains('washed')) return;
    btn.classList.add('washed');
    state.care.mudLeft--;
    playSplash();
    var left = state.care.mudLeft;
    if (left > 0) {
      showToast((4 - left) + ' / 4 닦았어요!');
      return;
    }
    state.care.busy = true;
    var d = speciesById(state.care.id);
    $('#careFx').innerHTML = '<span class="fx-splash">💦</span>' + sparkMarks(8);
    $('#careDino').classList.add('happy');
    playHeart();
    speak('반짝반짝! 아주 깨끗해졌어요!');
    state.save.hearts[d.id] = 2;
    saveNow();
    setTimeout(function () {
      if (state.screen !== 'care' || !state.care || state.care.id !== d.id) return;
      state.care.busy = false;
      renderCare();
    }, 1250);
  }

  function renderPlay(d) {
    state.care.playRound = 0;
    state.care.playWrong = 0;
    if (d.habitat === 'forest') {
      state.care.playTarget = Math.floor(Math.random() * 3);
      renderBushGame(d);
    } else if (d.habitat === 'meadow') {
      renderBallGame(d);
    } else {
      state.care.bubbles = 5;
      renderBubbleGame(d);
    }
  }

  function renderBushGame(d) {
    $('#carePanel').innerHTML = '<p class="care-prompt">공이 어디에 숨었을까요?</p>'
      + '<div class="mini-area">'
      + '<div class="bush-row">'
      + [0, 1, 2].map(function (i) {
        return '<button class="bush-btn" type="button" data-bush="' + i + '" aria-label="나무 ' + (i + 1) + '">🌳</button>';
      }).join('')
      + '</div>'
      + '<div class="round-dots">' + [0, 1, 2].map(function (i) {
        return '<i class="' + (i < state.care.playRound ? 'on' : '') + '"></i>';
      }).join('') + '</div>'
      + '<span class="mini-count">' + state.care.playRound + ' / 3</span>'
      + '</div>';
  }

  function handleBush(i, btn) {
    if (!state.care || state.care.busy) return;
    var d = speciesById(state.care.id);
    if (i !== state.care.playTarget) {
      state.care.playWrong++;
      playSoftNo();
      btn.classList.add('wrong');
      setTimeout(function () { btn.classList.remove('wrong'); }, 450);
      if (state.care.playWrong >= 2) {
        var ok = $$('.bush-btn')[state.care.playTarget];
        if (ok) { ok.style.boxShadow = '0 0 0 5px rgba(255,200,30,.75)'; }
      }
      return;
    }

    state.care.busy = true;
    btn.classList.add('correct');
    btn.textContent = '⚽';
    playGiggle();
    state.care.playRound++;
    if (state.care.playRound >= 3) {
      setTimeout(function () {
        if (state.screen !== 'care' || !state.care || state.care.id !== d.id) return;
        state.care.busy = false;
        finishCareStep(d, 3, '우와! 공을 다 찾았어요! 신나!');
      }, 650);
      return;
    }
    setTimeout(function () {
      if (state.screen !== 'care' || !state.care || state.care.id !== d.id) return;
      state.care.busy = false;
      state.care.playTarget = Math.floor(Math.random() * 3);
      renderBushGame(d);
    }, 700);
  }

  function renderBallGame(d) {
    $('#carePanel').innerHTML = '<p class="care-prompt">공을 톡톡 굴려 주세요!</p>'
      + '<div class="mini-area">'
      + '<button class="ball-btn" type="button" data-ball aria-label="공 굴리기">⚽</button>'
      + '<div class="round-dots">' + [0, 1, 2].map(function (i) {
        return '<i class="' + (i < state.care.playRound ? 'on' : '') + '"></i>';
      }).join('') + '</div>'
      + '<span class="mini-count">' + state.care.playRound + ' / 3</span>'
      + '</div>';
  }

  function handleBall() {
    if (!state.care || state.care.busy) return;
    var d = speciesById(state.care.id);
    state.care.playRound++;
    playPop();
    if (state.care.playRound >= 3) {
      state.care.busy = true;
      playGiggle();
      setTimeout(function () {
        if (state.screen !== 'care' || !state.care || state.care.id !== d.id) return;
        state.care.busy = false;
        finishCareStep(d, 3, '공 주고받기 재미있어요!');
      }, 500);
      return;
    }
    playGiggle();
    renderBallGame(d);
  }

  function renderBubbleGame(d) {
    var glyph = d.kind === 'ptera' ? '☁️' : '🫧';
    var html = '';
    for (var i = 0; i < state.care.bubbles; i++) {
      html += '<button class="bubble-btn" type="button" data-bubble="' + i + '" aria-label="거품 터뜨리기">' + glyph + '</button>';
    }
    $('#carePanel').innerHTML = '<p class="care-prompt">' + (d.kind === 'ptera' ? '구름을 콕콕 터뜨려요!' : '거품을 콕콕 터뜨려요!') + '</p>'
      + '<div class="mini-area"><div class="bubble-wrap">' + html + '</div>'
      + '<span class="mini-count">' + state.care.bubbles + '개 남았어요</span></div>';
  }

  function handleBubble(btn) {
    if (!state.care || state.care.busy) return;
    if (btn.classList.contains('popped')) return;
    var d = speciesById(state.care.id);
    btn.classList.add('popped');
    btn.style.transform = 'scale(0.2)';
    btn.style.opacity = '0';
    btn.style.pointerEvents = 'none';
    state.care.bubbles--;
    playPop();
    if (state.care.bubbles <= 0) {
      state.care.busy = true;
      playGiggle();
      setTimeout(function () {
        if (state.screen !== 'care' || !state.care || state.care.id !== d.id) return;
        state.care.busy = false;
        finishCareStep(d, 3, '와! 시원하게 터뜨렸어요!');
      }, 550);
    } else {
      var count = $('.mini-count');
      if (count) count.textContent = state.care.bubbles + '개 남았어요';
    }
  }

  function finishCareStep(d, hearts, message) {
    state.save.hearts[d.id] = hearts;
    saveNow();
    playHeart();
    speak(message);
    if (hearts >= 3) {
      playGolden();
      $('#careFx').innerHTML = confettiMarks(14);
      $('#careDino').classList.add('dance');
    }
    state.care.busy = true;
    setTimeout(function () {
      if (state.screen !== 'care' || !state.care || state.care.id !== d.id) return;
      state.care.busy = false;
      renderCare();
      if (hearts >= 3 && !accEmoji(d.id)) {
        speak('우와! 우리 친구가 되었어요. 어떤 장식을 해 줄까요?');
      }
    }, 1350);
  }

  function renderCareDone(d) {
    var acc = accEmoji(d.id);
    var accHtml = '';
    if (acc) {
      var accKey = state.save.accessory[d.id];
      var particle = accKey === 'hat' ? '와' : '과';
      accHtml = '<div class="done-banner">' + acc + ' ' + (ACC_LABEL[accKey] || '장식') + particle + ' 함께해요!</div>';
    } else {
      accHtml = '<p class="care-prompt">어떤 장식을 해 줄까요?</p>'
        + '<div class="acc-choose">'
        + ['hat', 'ribbon', 'crown'].map(function (k) {
          return '<button class="acc-btn" type="button" data-acc="' + k + '">' + ACC_EMOJI[k] + '<span>' + ACC_LABEL[k] + '</span></button>';
        }).join('')
        + '</div>';
    }

    var facts = d.facts.map(function (f, i) {
      return '<button class="fact-item" type="button" data-fact="' + i + '" aria-label="사실 듣기">'
        + '<span class="fi-num">' + (i + 1) + '</span><span>' + f + '</span><span class="fi-sound">🔊</span></button>';
    }).join('');

    $('#carePanel').innerHTML = '<div class="done-banner">💛 친구가 되었어요!</div>'
      + accHtml
      + '<div class="fact-list">' + facts + '</div>'
      + '<div class="care-actions">'
      + '<button class="big-btn soft" data-go-pg type="button">놀이터로 🦕</button>'
      + '<button class="big-btn ghost" data-hug type="button">더 안아주기 🤗</button>'
      + '</div>';
  }

  function chooseAccessory(k) {
    if (!state.care) return;
    var id = state.care.id;
    if (!ACC_EMOJI[k]) return;
    state.save.accessory[id] = k;
    saveNow();
    playFanfare();
    speak(ACC_LABEL[k] + '! 아주 잘 어울려요!');
    renderCare();
  }

  function sparkMarks(n) {
    var out = '';
    var colors = ['#ffd93b', '#8ecbff', '#ffffff', '#7fe0a2'];
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i / n) + Math.random() * 0.5;
      var r = 50 + Math.random() * 40;
      out += '<i class="fx-spark" style="--tx:' + Math.round(Math.cos(a) * r) + 'px;--ty:' + Math.round(Math.sin(a) * r) + 'px;--c:' + colors[i % colors.length] + '"></i>';
    }
    return out;
  }

  function confettiMarks(n) {
    var out = '';
    var colors = ['#ffd93b', '#ff8fab', '#7fe0a2', '#8ecbff', '#ffffff', '#c9a7ff'];
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 * i / n) + Math.random() * 0.4;
      var r = 60 + Math.random() * 60;
      out += '<i class="fx-spark" style="--tx:' + Math.round(Math.cos(a) * r) + 'px;--ty:' + Math.round(Math.sin(a) * r) + 'px;--c:' + colors[i % colors.length] + ';animation-delay:' + (Math.random() * 0.2).toFixed(2) + 's"></i>';
    }
    return out;
  }

  /* ============================================================
     도감
     ============================================================ */
  function openBook(hab, returnTo) {
    state.bookHab = HABITATS.some(function (h) { return h.id === hab; }) ? hab : 'forest';
    state.bookReturn = returnTo || (state.screen === 'game' ? 'game' : 'map');
    showScreen('book');
    renderBook();
  }

  function renderBook() {
    var found = totalFound();
    var hearts = totalHearts();
    $('#bookBar').style.width = Math.round((found / TOTAL_SPECIES) * 100) + '%';
    $('#bookCount').textContent = found + ' / ' + TOTAL_SPECIES + ' · ♥ ' + hearts + ' / ' + TOTAL_HEARTS;

    var tabs = $('#bookTabs');
    tabs.innerHTML = '';
    HABITATS.forEach(function (h) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = state.bookHab === h.id ? 'active' : '';
      b.textContent = h.emoji + ' ' + h.name;
      b.setAttribute('aria-label', h.name + ' 도감');
      b.addEventListener('click', function () {
        state.bookHab = h.id;
        playPop();
        renderBook();
      });
      tabs.appendChild(b);
    });

    var grid = $('#bookGrid');
    grid.innerHTML = '';
    SPECIES.filter(function (d) { return d.habitat === state.bookHab; }).forEach(function (d) {
      var got = !!state.save.found[d.id];
      var h = state.save.hearts[d.id] || 0;
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'book-card' + (got ? '' : ' locked');
      card.dataset.id = d.id;
      card.setAttribute('aria-label', got ? d.name + ' 자세히 보기' : '아직 만나지 못한 공룡');
      card.innerHTML = '<span class="time-dot" aria-hidden="true">' + (d.time === 'day' ? '☀️' : '🌙') + '</span>'
        + (got && accEmoji(d.id) ? '<span class="acc-mini">' + accEmoji(d.id) + '</span>' : '')
        + '<span class="book-art">' + (got ? dinoArt(d) : lockedEgg()) + '</span>'
        + '<span class="book-name">' + (got ? d.name : '???') + '</span>'
        + '<span class="book-hearts">' + heartsHTML(got ? h : 0) + '</span>';
      grid.appendChild(card);
    });
    updateSoundUI();
  }

  function openBookDetail(id) {
    var d = speciesById(id);
    if (!d) return;
    state.detailId = id;
    var h = state.save.hearts[id] || 0;
    var acc = accEmoji(id);
    var facts = d.facts.map(function (f, i) {
      var unlocked = i < h;
      return '<button class="fact-item' + (unlocked ? '' : ' locked') + '" type="button" ' + (unlocked ? 'data-fact="' + i + '"' : 'disabled') + '>'
        + '<span class="fi-num">' + (i + 1) + '</span>'
        + '<span>' + (unlocked ? f : '아직 몰라요') + '</span>'
        + '<span class="fi-sound">' + (unlocked ? '🔊' : '🔒') + '</span></button>';
    }).join('');

    openOverlay(
      '<div class="detail-top">'
      + '<div class="detail-art">' + dinoArt(d) + '</div>'
      + '<div class="detail-meta">'
      + '<h2>' + d.name + '</h2>'
      + '<div class="full-name">' + d.full + '</div>'
      + '<div class="hearts">' + heartsHTML(h) + '</div>'
      + (acc ? '<div class="acc-line">' + acc + ' ' + (ACC_LABEL[state.save.accessory[id]] || '') + '</div>' : '')
      + '</div></div>'
      + '<div class="fact-list">' + facts + '</div>'
      + '<div class="detail-actions">'
      + (h < 3 ? '<button class="big-btn primary" data-act="care-detail" type="button">돌보기 🦕</button>' : '')
      + '<button class="big-btn soft" data-act="close" type="button">닫기</button>'
      + '</div>',
      'detail-card'
    );
    speak(d.name + '. ' + (h > 0 ? d.facts[h - 1] : '아직 만나지 못한 친구예요.'));
  }

  function readBookFact(i) {
    var d = speciesById(state.detailId);
    if (!d) return;
    var h = state.save.hearts[d.id] || 0;
    if (i >= h) return;
    playPop();
    speak(d.facts[i]);
  }

  /* ============================================================
     초기화 / 이벤트
     ============================================================ */
  function confirmReset() {
    openOverlay(
      '<div class="result-stars" aria-hidden="true">🥚</div>'
      + '<h2>기록을 지울까요?</h2>'
      + '<p>모은 도감과 돌봄 기록이 모두 사라져요.<br>보호자와 함께 정해 주세요.</p>'
      + '<div class="result-actions">'
      + '<button class="big-btn soft" data-act="close" type="button">그만두기</button>'
      + '<button class="big-btn primary" data-act="reset-yes" type="button">기록 지우기</button>'
      + '</div>'
    );
  }

  function resetProgress() {
    state.save = defaultSave();
    state.session = null;
    state.token++;
    state.bookReturn = 'map';
    saveNow();
    renderTitle();
    openMap();
    showToast('새롭게 시작해요!');
  }

  function openMap() {
    showScreen('map');
    renderMap();
  }

  function openBookFromCurrent() {
    openBook(state.bookHab, state.screen === 'playground' ? 'playground' : 'map');
  }

  function unlockAudioOnce() {
    try { ensureAudio(); } catch (e) { /* ignore */ }
    if ('speechSynthesis' in window) {
      try {
        var u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        speechSynthesis.speak(u);
        speechSynthesis.cancel();
      } catch (e) { /* ignore */ }
    }
    document.removeEventListener('pointerdown', unlockAudioOnce);
  }

  function bindEvents() {
    $('#startBtn').addEventListener('click', function () {
      ensureAudio();
      playPop();
      openMap();
    });

    $('#titleBook').addEventListener('click', function () { openBook(state.save.lastHabitat, 'title'); });
    $('#titlePlayground').addEventListener('click', function () {
      if (totalFound() === 0) {
        showToast('숨바꼭질에서 먼저 친구를 만나요!');
        speak('숨바꼭질에서 먼저 친구를 만나요!');
        return;
      }
      openPlayground(careNeeded() > 0 ? 'care' : 'forest');
    });
    $('#titleSound').addEventListener('click', toggleSound);

    $('#mapBack').addEventListener('click', function () {
      playPop();
      showScreen('title');
      renderTitle();
    });
    $('#mapDay').addEventListener('click', function () {
      if (state.save.lastTime === 'day') return;
      state.save.lastTime = 'day';
      saveNow();
      updateMapTime();
      playSwitch(true);
    });
    $('#mapNight').addEventListener('click', function () {
      if (state.save.lastTime === 'night') return;
      state.save.lastTime = 'night';
      saveNow();
      updateMapTime();
      playSwitch(false);
    });
    $('#mapBook').addEventListener('click', function () { openBook(state.save.lastHabitat, 'map'); });
    $('#mapSound').addEventListener('click', toggleSound);
    $('#careShortcut').addEventListener('click', function () {
      if (totalFound() === 0) {
        playSoftNo();
        showToast('숨바꼭질에서 먼저 친구를 만나요!');
        speak('숨바꼭질에서 먼저 친구를 만나요!');
        return;
      }
      playPop();
      openPlayground(careNeeded() > 0 ? 'care' : 'forest');
    });

    $('#gameBack').addEventListener('click', function () {
      playPop();
      openMap();
    });
    $('#gameBook').addEventListener('click', function () { openBook(state.habitat, 'game'); });
    $('#gameSound').addEventListener('click', toggleSound);
    $('#timeToggle').addEventListener('click', toggleTime);

    $('#pgBack').addEventListener('click', function () {
      playPop();
      openMap();
    });
    $('#pgSound').addEventListener('click', toggleSound);
    $('#pgBook').addEventListener('click', function () {
      openBook(state.pgTab === 'care' ? state.save.lastHabitat : state.pgTab, 'playground');
    });
    $('#pgGrid').addEventListener('click', handlePgClick);

    $('#careBack').addEventListener('click', function () {
      playPop();
      if (state.careReturn === 'book') {
        showScreen('book');
        renderBook();
      } else {
        openPlayground(state.pgTab);
      }
    });
    $('#careSound').addEventListener('click', toggleSound);
    $('#careStage').addEventListener('click', function (e) {
      var mud = e.target.closest('[data-mud]');
      if (mud) handleMud(mud);
    });
    $('#carePanel').addEventListener('click', function (e) {
      var food = e.target.closest('[data-food]');
      if (food) { handleFood(food.dataset.food, food); return; }
      var bush = e.target.closest('[data-bush]');
      if (bush) { handleBush(Number(bush.dataset.bush), bush); return; }
      var ball = e.target.closest('[data-ball]');
      if (ball) { handleBall(); return; }
      var bubble = e.target.closest('[data-bubble]');
      if (bubble) { handleBubble(bubble); return; }
      var acc = e.target.closest('[data-acc]');
      if (acc) { chooseAccessory(acc.dataset.acc); return; }
      var fact = e.target.closest('[data-fact]');
      if (fact) {
        var d = state.care && speciesById(state.care.id);
        if (d) { playPop(); speak(d.facts[Number(fact.dataset.fact)]); }
        return;
      }
      var go = e.target.closest('[data-go-pg]');
      if (go) { openPlayground(state.pgTab); return; }
      if (e.target.closest('[data-hug]')) {
        $('#careDino').classList.add('happy');
        playGiggle();
        speak('고마워! 정말 신나!');
        setTimeout(function () { $('#careDino').classList.remove('happy'); }, 900);
      }
    });

    $('#bookBack').addEventListener('click', function () {
      playPop();
      if (state.bookReturn === 'game') {
        showScreen('game');
        if (state.session && state.session.finished) presentResult();
      } else if (state.bookReturn === 'title') {
        showScreen('title');
        renderTitle();
      } else if (state.bookReturn === 'playground') {
        openPlayground(state.pgTab);
      } else {
        openMap();
      }
    });
    $('#bookSound').addEventListener('click', toggleSound);
    $('#resetBtn').addEventListener('click', confirmReset);

    $('#bookGrid').addEventListener('click', function (e) {
      var card = e.target.closest('.book-card');
      if (!card) return;
      var d = speciesById(card.dataset.id);
      if (!d) return;
      if (!state.save.found[d.id]) {
        playSoftNo();
        showToast('숨바꼭질에서 먼저 만나요!');
        speak('숨바꼭질에서 먼저 만나요!');
        return;
      }
      playPop();
      openBookDetail(d.id);
    });

    $('#overlay').addEventListener('click', function (e) {
      var fact = e.target.closest('[data-fact]');
      if (fact && state.detailId) { readBookFact(Number(fact.dataset.fact)); return; }

      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.dataset.act;
      if (act === 'again') { closeOverlay(); startSession(); }
      else if (act === 'map') { closeOverlay(); openMap(); }
      else if (act === 'playground') {
        closeOverlay();
        openPlayground(state.habitat);
      } else if (act === 'close') { closeOverlay(); }
      else if (act === 'reset-yes') { closeOverlay(); resetProgress(); }
      else if (act === 'care-detail') {
        var id = state.detailId;
        closeOverlay();
        setTimeout(function () { if (id) openCare(id, 'book'); }, 230);
      }
    });

    window.addEventListener('resize', function () {
      if (state.screen === 'game') layoutSpots();
    });
    if (window.screen && window.screen.orientation && window.screen.orientation.addEventListener) {
      try {
        window.screen.orientation.addEventListener('change', function () {
          if (state.screen === 'game') setTimeout(layoutSpots, 120);
        });
      } catch (e) { /* ignore */ }
    }

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') saveNow();
    });
    window.addEventListener('pagehide', saveNow);
    window.addEventListener('blur', saveSoon);
  }

  DINO.openPlayground = openPlayground;
  DINO.openCare = openCare;
  DINO.openMap = openMap;
  DINO.openBook = openBook;

  state.save = loadSave();
  state.time = state.save.lastTime;

  renderTitle();
  renderMap();
  renderStars();
  bindEvents();
  updateSoundUI();

  document.addEventListener('pointerdown', unlockAudioOnce);
})();
