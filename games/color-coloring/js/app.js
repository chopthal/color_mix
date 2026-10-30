/**
 * 알록달록 색칠 놀이터
 * - color-mix의 RYB 물감 섞기 로직을 이식
 * - SVG 파트를 탭/드래그로 색칠
 * - 무늬, 스티커, 배경 테마, 갤러리, 도감, 색 섞기 미션
 */
(function () {
  'use strict';

  var ART = window.CC_ART;
  if (!ART || !ART.OBJECTS || !ART.OBJECTS.length) {
    return;
  }

  var OBJECTS = ART.OBJECTS;
  var CATEGORIES = ART.CATEGORIES;
  var OBJECT_MAP = {};
  OBJECTS.forEach(function (o) { OBJECT_MAP[o.id] = o; });

  var STORE = {
    completed: 'cc-completed-v1',
    gallery: 'cc-gallery-v1',
    made: 'cc-made-v1'
  };

  /* ───────── 저장소 ───────── */
  var storage = (function () {
    try {
      var k = '__cc_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return localStorage;
    } catch (e) {
      var mem = {};
      return {
        getItem: function (key) { return Object.prototype.hasOwnProperty.call(mem, key) ? mem[key] : null; },
        setItem: function (key, value) { mem[key] = String(value); },
        removeItem: function (key) { delete mem[key]; }
      };
    }
  })();

  function loadJSON(key, fallback) {
    try {
      var raw = storage.getItem(key);
      if (!raw) return fallback;
      var value = JSON.parse(raw);
      return value == null ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try { storage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  /* ───────── 색 계산 ───────── */
  var RYB_CUBE = {
    white: [255, 255, 255],
    red: [255, 59, 59],
    yellow: [255, 212, 0],
    blue: [47, 125, 255],
    orange: [255, 138, 0],
    green: [34, 197, 94],
    purple: [155, 77, 255],
    brown: [89, 56, 36]
  };
  var WHITE_RGB = [255, 255, 255];
  var BLACK_RGB = [40, 32, 28];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpRgb(a, b, t) {
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  }

  function rybToRgb(redPaint, yellowPaint, bluePaint) {
    var c00 = lerpRgb(RYB_CUBE.white, RYB_CUBE.red, redPaint);
    var c01 = lerpRgb(RYB_CUBE.blue, RYB_CUBE.purple, redPaint);
    var c10 = lerpRgb(RYB_CUBE.yellow, RYB_CUBE.orange, redPaint);
    var c11 = lerpRgb(RYB_CUBE.green, RYB_CUBE.brown, redPaint);
    var c0 = lerpRgb(c00, c10, yellowPaint);
    var c1 = lerpRgb(c01, c11, yellowPaint);
    return lerpRgb(c0, c1, bluePaint);
  }

  function paintToRgb(paint) {
    var chromaMass = paint.r + paint.y + paint.b;
    var totalMass = chromaMass + paint.w + paint.k;
    if (totalMass <= 0) return WHITE_RGB.slice();

    var hueRgb = WHITE_RGB.slice();
    if (chromaMass > 0) {
      var strongest = Math.max(paint.r, paint.y, paint.b);
      hueRgb = rybToRgb(paint.r / strongest, paint.y / strongest, paint.b / strongest);
    }

    return [
      (hueRgb[0] * chromaMass + WHITE_RGB[0] * paint.w + BLACK_RGB[0] * paint.k) / totalMass,
      (hueRgb[1] * chromaMass + WHITE_RGB[1] * paint.w + BLACK_RGB[1] * paint.k) / totalMass,
      (hueRgb[2] * chromaMass + WHITE_RGB[2] * paint.w + BLACK_RGB[2] * paint.k) / totalMass
    ];
  }

  function rgbToHex(rgb) {
    return '#' + rgb.map(function (v) {
      return Math.round(v).toString(16).padStart(2, '0');
    }).join('');
  }

  function hexToRgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    var num = parseInt(h, 16);
    if (isNaN(num)) return [0, 0, 0];
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  function colorDistance(a, b) {
    var dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  function needsDarkLabel(rgb) {
    var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
    var luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.54;
  }

  /* ───────── 물감 ───────── */
  var BASE_PAINTS = [
    { name: '빨강', r: 1, y: 0, b: 0, w: 0, k: 0 },
    { name: '주황', r: 1, y: 1, b: 0, w: 0, k: 0 },
    { name: '노랑', r: 0, y: 1, b: 0, w: 0, k: 0 },
    { name: '연두', r: 0, y: 1, b: 0.45, w: 0, k: 0 },
    { name: '초록', r: 0, y: 1, b: 1, w: 0, k: 0 },
    { name: '청록', r: 0, y: 0.45, b: 1, w: 0, k: 0 },
    { name: '파랑', r: 0, y: 0, b: 1, w: 0, k: 0 },
    { name: '남색', r: 0, y: 0, b: 1, w: 0, k: 0.85 },
    { name: '보라', r: 1, y: 0, b: 1, w: 0, k: 0 },
    { name: '자주', r: 1, y: 0, b: 0.45, w: 0, k: 0 },
    { name: '하얀색', r: 0, y: 0, b: 0, w: 1, k: 0 },
    { name: '까만색', r: 0, y: 0, b: 0, w: 0, k: 1 }
  ];
  BASE_PAINTS.forEach(function (p) {
    p.rgb = paintToRgb(p);
    p.hex = rgbToHex(p.rgb);
  });

  /* 게임용 색 이름표 (섞인 색 이름을 아이들이 이해하기 쉬운 말로) */
  var NAME_PALETTE = [
    ['빨강', '#ff3b3b'], ['주황', '#ff8a00'], ['노랑', '#ffd400'],
    ['연두', '#91cd2f'], ['초록', '#22c55e'], ['청록', '#29a1af'],
    ['파랑', '#2f7dff'], ['남색', '#2c5297'], ['보라', '#9b4dff'],
    ['자주', '#cd449d'], ['분홍', '#ff9d9d'], ['하늘색', '#97beff'],
    ['하얀색', '#ffffff'], ['까만색', '#28201c'], ['회색', '#94908e'],
    ['갈색', '#593824'], ['밤색', '#3b2a1e'], ['살구색', '#ffc9a3'],
    ['민트색', '#6cd894'], ['라벤더색', '#bc88ff'], ['개나리색', '#ffb155'],
    ['카키색', '#9e9721'], ['크림색', '#fff3d6'], ['자두색', '#c58bd8'],
    ['장미색', '#ff6f8d'], ['연회색', '#c9c9c9'], ['황토색', '#c47828'],
    ['초콜릿색', '#5a3825'], ['하늘빛', '#cfe6ff'], ['진분홍', '#ff4f8b']
  ].map(function (pair) {
    return { name: pair[0], rgb: hexToRgb(pair[1]) };
  });

  function nearestColorName(rgb) {
    var best = NAME_PALETTE[0];
    var bestDistance = Infinity;
    NAME_PALETTE.forEach(function (color) {
      var d = colorDistance(rgb, color.rgb);
      if (d < bestDistance) {
        bestDistance = d;
        best = color;
      }
    });
    return best.name;
  }

  function paintFromBase(base) {
    return {
      name: base.name,
      r: base.r, y: base.y, b: base.b, w: base.w, k: base.k,
      rgb: base.rgb.slice(),
      hex: base.hex
    };
  }

  function mixBowl() {
    var mixed = { r: 0, y: 0, b: 0, w: 0, k: 0 };
    bowlPaints.forEach(function (p) {
      mixed.r += p.r; mixed.y += p.y; mixed.b += p.b; mixed.w += p.w; mixed.k += p.k;
    });
    mixed.rgb = paintToRgb(mixed);
    mixed.hex = rgbToHex(mixed.rgb);
    mixed.name = nearestColorName(mixed.rgb);
    return mixed;
  }

  function allKnownPaints() {
    return BASE_PAINTS.map(paintFromBase).concat(madePaints);
  }

  function isSimilarToKnownPaint(rgb) {
    return allKnownPaints().some(function (p) {
      return colorDistance(p.rgb, rgb) < 20;
    });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* ───────── DOM ───────── */
  var pickerScreen = document.getElementById('pickerScreen');
  var colorScreen = document.getElementById('colorScreen');
  var progressCount = document.getElementById('progressCount');
  var catTabs = document.getElementById('catTabs');
  var objectGrid = document.getElementById('objectGrid');
  var objEmoji = document.getElementById('objEmoji');
  var objName = document.getElementById('objName');
  var stage = document.getElementById('stage');
  var objectHost = document.getElementById('objectHost');
  var stickerLayer = document.getElementById('stickerLayer');
  var celebrateLayer = document.getElementById('celebrateLayer');
  var baseColors = document.getElementById('baseColors');
  var madeWrap = document.getElementById('madeWrap');
  var madeColors = document.getElementById('madeColors');
  var brushSwatch = document.getElementById('brushSwatch');
  var brushLabel = document.getElementById('brushLabel');
  var patternRow = document.getElementById('patternRow');
  var stickerRow = document.getElementById('stickerRow');
  var paintPanel = document.getElementById('paintPanel');
  var patternPanel = document.getElementById('patternPanel');
  var stickerPanel = document.getElementById('stickerPanel');
  var toolTabs = document.getElementById('toolTabs');
  var mixArea = document.getElementById('mixArea');
  var mixIngredients = document.getElementById('mixIngredients');
  var mixLabel = document.getElementById('mixLabel');
  var mixPaintsEl = document.getElementById('mixPaints');
  var mixMadeWrap = document.getElementById('mixMadeWrap');
  var mixMade = document.getElementById('mixMade');
  var useMixed = document.getElementById('useMixed');
  var missionEl = document.getElementById('mission');
  var galleryGrid = document.getElementById('galleryGrid');
  var galleryEmpty = document.getElementById('galleryEmpty');
  var toastEl = document.getElementById('toast');

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ───────── 상태 ───────── */
  var completed = loadJSON(STORE.completed, []);
  if (!Array.isArray(completed)) completed = [];
  var gallery = loadJSON(STORE.gallery, []);
  if (!Array.isArray(gallery)) gallery = [];
  var madePaints = loadJSON(STORE.made, []);
  if (!Array.isArray(madePaints)) madePaints = [];
  madePaints = madePaints.filter(function (p) {
    return p && p.hex && p.name;
  }).map(function (p) {
    if (!p.rgb) p.rgb = hexToRgb(p.hex);
    if (typeof p.r !== 'number') {
      var base = BASE_PAINTS.filter(function (b) { return b.name === p.name; })[0];
      if (base) { p.r = base.r; p.y = base.y; p.b = base.b; p.w = base.w; p.k = base.k; }
      else { p.r = 0; p.y = 0; p.b = 0; p.w = 0; p.k = 0; }
    }
    return p;
  });

  var madeSeq = madePaints.reduce(function (max, p) {
    return Math.max(max, Number(p.id) || 0);
  }, 0) + 1;

  var brush = {
    mode: 'solid',
    color: BASE_PAINTS[0].hex,
    colorName: BASE_PAINTS[0].name,
    pattern: null,
    sticker: null
  };

  var current = null;
  var state = null;
  var history = [];
  var painting = false;
  var activeCat = 'all';
  var activeTab = 'paint';
  var celebrated = false;
  var bowlPaints = [];
  var missionIndex = 0;
  var missionDone = false;
  var stickerSeq = 1;
  var toastTimer = null;

  var THEMES = ['day', 'night', 'rainbow'];
  var STICKERS = ['⭐', '❤️', '🌸', '🦋', '🌈', '☀️', '🍭', '👀', '✨', '🎀', '🍎', '🐾'];
  var PATTERNS = [
    { id: 'solid', label: '단색' },
    { id: 'stripes', label: '줄무늬' },
    { id: 'dots', label: '물방울' },
    { id: 'stars', label: '별가루' }
  ];
  var MISSIONS = [
    { label: '주황', hex: '#ff8a00', hint: '빨강 + 노랑' },
    { label: '초록', hex: '#22c55e', hint: '노랑 + 파랑' },
    { label: '보라', hex: '#9b4dff', hint: '빨강 + 파랑' },
    { label: '분홍', hex: '#ff9d9d', hint: '빨강 + 하얀색' },
    { label: '하늘색', hex: '#97beff', hint: '파랑 + 하얀색' },
    { label: '연두', hex: '#91cd2f', hint: '노랑 + 초록' },
    { label: '갈색', hex: '#593824', hint: '빨강 + 초록' },
    { label: '회색', hex: '#94908e', hint: '까만색 + 하얀색' },
    { label: '청록', hex: '#29a1af', hint: '파랑 + 초록' },
    { label: '자주', hex: '#cd449d', hint: '빨강 + 보라' }
  ];

  /* ───────── 사운드 ───────── */
  var audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        try { audioCtx = new AC(); } catch (e) { audioCtx = null; }
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, duration, type, volume, delay, slideTo) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var start = ctx.currentTime + (delay || 0);
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume || 0.14, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  function playTap() { playTone(640, 0.06, 'sine', 0.1); }
  function playPop() { playTone(460, 0.09, 'sine', 0.16, 0, 820); }
  function playUndo() { playTone(520, 0.09, 'triangle', 0.12, 0, 360); }
  function playWhoosh() { playTone(280, 0.18, 'sine', 0.1, 0, 880); }
  function playSticker() {
    playTone(720, 0.07, 'sine', 0.14);
    playTone(980, 0.08, 'sine', 0.11, 0.07);
  }
  function playSuccess() {
    [523, 659, 784, 1047].forEach(function (f, i) {
      playTone(f, 0.16, 'triangle', 0.13, i * 0.09);
    });
  }
  function playError() { playTone(300, 0.12, 'square', 0.06); }

  function vibrate(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) {}
  }

  /* ───────── 음성 ───────── */
  function pickKoreanVoice() {
    if (!window.speechSynthesis) return null;
    var voices = speechSynthesis.getVoices().filter(function (v) {
      return v.lang && v.lang.toLowerCase().indexOf('ko') === 0;
    });
    var preferred = voices.find(function (v) {
      return /heami|sunhi|yuna|minji|sanna|hajun|유나|산나|하준|female|neural/i.test(v.name);
    });
    return preferred || voices[0] || null;
  }

  function speak(text) {
    if (!window.speechSynthesis || !text) return;
    speechSynthesis.cancel();
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;
    utterance.pitch = 1.08;
    var voice = pickKoreanVoice();
    if (voice) utterance.voice = voice;
    var isAppleTouch = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isAppleTouch) {
      window.setTimeout(function () { speechSynthesis.speak(utterance); }, 60);
    } else {
      speechSynthesis.speak(utterance);
    }
  }

  function unlockSpeech() {
    if (!window.speechSynthesis) return;
    var silent = new SpeechSynthesisUtterance(' ');
    silent.volume = 0;
    silent.lang = 'ko-KR';
    speechSynthesis.speak(silent);
    speechSynthesis.cancel();
  }

  /* ───────── 무늬 ───────── */
  function patternDef(id, type, color) {
    var light = needsDarkLabel(hexToRgb(color));
    var motifColor = light ? '#34455c' : '#ffffff';
    var motifOpacity = light ? '0.3' : '0.9';
    var motif = '';
    if (type === 'stripes') {
      motif = '<rect width="10" height="24" fill="' + motifColor + '" opacity="' + motifOpacity + '"/>';
    } else if (type === 'dots') {
      motif = '<circle cx="6" cy="6" r="3.4" fill="' + motifColor + '" opacity="' + motifOpacity + '"/>' +
        '<circle cx="18" cy="18" r="3.4" fill="' + motifColor + '" opacity="' + motifOpacity + '"/>';
    } else if (type === 'stars') {
      motif = '<path d="M6 1.5 L7.4 5 L11 5.3 L8.3 7.6 L9.1 11 L6 9.2 L2.9 11 L3.7 7.6 L1 5.3 L4.6 5 Z" fill="' + motifColor + '" opacity="' + motifOpacity + '"/>' +
        '<path d="M18 13 L19.4 16.5 L23 16.8 L20.3 19.1 L21.1 22.5 L18 20.7 L14.9 22.5 L15.7 19.1 L13 16.8 L16.6 16.5 Z" fill="' + motifColor + '" opacity="' + motifOpacity + '"/>';
    }
    return '<pattern id="' + id + '" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">' +
      '<rect width="24" height="24" fill="' + color + '"/>' + motif + '</pattern>';
  }

  function patternCss(color, type) {
    var motif = needsDarkLabel(hexToRgb(color)) ? '#34455c' : '#ffffff';
    if (type === 'stripes') {
      return 'repeating-linear-gradient(45deg, ' + color + ' 0 5px, ' + motif + ' 5px 10px)';
    }
    if (type === 'dots') {
      return 'radial-gradient(circle, ' + motif + ' 2.4px, transparent 2.8px), ' + color;
    }
    if (type === 'stars') {
      return 'radial-gradient(circle, ' + motif + ' 1.8px, transparent 2.2px), ' + color;
    }
    return color;
  }

  function patternLabel(type) {
    var found = PATTERNS.filter(function (p) { return p.id === type; })[0];
    return found ? found.label : '무늬';
  }

  /* ───────── 화면: 도감 ───────── */
  function renderCatTabs() {
    catTabs.innerHTML = '';
    var list = [{ id: 'all', label: '전체', emoji: '✨' }].concat(CATEGORIES);
    list.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-tab' + (activeCat === cat.id ? ' active' : '');
      btn.textContent = cat.emoji + ' ' + cat.label;
      btn.addEventListener('click', function () {
        activeCat = cat.id;
        playTap();
        renderCatTabs();
        renderPicker();
      });
      catTabs.appendChild(btn);
    });
  }

  function renderPicker() {
    objectGrid.innerHTML = '';
    OBJECTS.filter(function (o) {
      return activeCat === 'all' || o.category === activeCat;
    }).forEach(function (obj) {
      var done = completed.indexOf(obj.id) >= 0;
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'object-card' + (done ? ' done' : '');
      card.dataset.cat = obj.category;
      card.innerHTML = '<span class="card-emoji">' + obj.emoji + '</span>' +
        '<span class="card-name">' + obj.name + '</span>' +
        (done ? '<span class="card-stamp">⭐</span>' : '');
      card.addEventListener('click', function () { openObject(obj); });
      objectGrid.appendChild(card);
    });
  }

  function updateProgress() {
    var unique = {};
    completed.forEach(function (id) {
      if (OBJECT_MAP[id]) unique[id] = true;
    });
    progressCount.textContent = String(Object.keys(unique).length);
  }

  function showPicker() {
    colorScreen.classList.add('hidden');
    pickerScreen.classList.remove('hidden');
    renderPicker();
    updateProgress();
    playTap();
  }

  /* ───────── 화면: 색칠 ───────── */
  function openObject(obj, silent) {
    ensureAudio();
    playTap();
    current = obj;
    state = {
      objectId: obj.id,
      parts: {},
      stickers: [],
      theme: 'day'
    };
    history = [];
    celebrated = false;
    stickerSeq = 1;

    objEmoji.textContent = obj.emoji;
    objName.textContent = obj.name;
    pickerScreen.classList.add('hidden');
    colorScreen.classList.remove('hidden');

    renderObject();
    applyTheme();
    renderStickers();
    switchTab('paint');
    updateBrushPreview();

    requestAnimationFrame(function () {
      sizeStage();
      requestAnimationFrame(sizeStage);
    });
    window.setTimeout(sizeStage, 90);

    window.setTimeout(function () {
      if (!silent) speak(obj.name + ' 색칠하자!');
    }, 180);
  }

  function renderObject() {
    if (!current) return;
    objectHost.innerHTML = current.svg;
    var svg = objectHost.querySelector('svg');
    if (!svg) return;
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.insertBefore(defs, svg.firstChild);
    applyAllParts();
  }

  function applyAllParts() {
    var svg = objectHost.querySelector('svg');
    if (!svg || !state) return;

    var defs = svg.querySelector('defs');
    var defsHTML = '';
    Object.keys(state.parts).forEach(function (pid) {
      var ps = state.parts[pid];
      if (ps && ps.mode === 'pattern') {
        defsHTML += patternDef('pat-' + pid, ps.pattern, ps.color);
      }
    });
    if (defs) defs.innerHTML = defsHTML;

    $$('.part', svg).forEach(function (el) {
      var pid = el.getAttribute('data-part');
      var ps = state.parts[pid];
      if (!ps) {
        el.style.fill = '';
      } else if (ps.mode === 'pattern') {
        el.style.fill = 'url(#pat-' + pid + ')';
      } else {
        el.style.fill = ps.color;
      }
    });
  }

  function flashPart(pid) {
    var el = objectHost.querySelector('[data-part="' + pid + '"]');
    if (!el) return;
    el.classList.remove('painted-pop');
    void el.getBoundingClientRect().width;
    el.classList.add('painted-pop');
    window.setTimeout(function () {
      el.classList.remove('painted-pop');
    }, 340);
  }

  function closestPart(el) {
    while (el && el !== document) {
      if (el.classList && el.classList.contains('part')) return el;
      el = el.parentNode;
    }
    return null;
  }

  function paintPart(partEl) {
    if (!state) return;
    var pid = partEl.getAttribute('data-part');
    if (!pid) return;

    var next = brush.mode === 'pattern'
      ? { mode: 'pattern', pattern: brush.pattern, color: brush.color }
      : { mode: 'solid', color: brush.color };

    var prev = state.parts[pid] ? clone(state.parts[pid]) : null;
    if (prev && prev.mode === next.mode && prev.color === next.color && prev.pattern === next.pattern) {
      return;
    }

    state.parts[pid] = next;
    history.push({ type: 'paint', partId: pid, prev: prev });
    trimHistory();

    applyAllParts();
    flashPart(pid);
    playPop();
    vibrate(8);
    checkComplete();
  }

  function trimHistory() {
    if (history.length > 120) history.shift();
  }

  function onStageDown(e) {
    if (!current || !state) return;
    if (painting) return;
    ensureAudio();

    if (brush.mode === 'sticker') {
      e.preventDefault();
      placeStickerAt(e.clientX, e.clientY);
      return;
    }

    var part = closestPart(e.target);
    if (!part) return;

    e.preventDefault();
    painting = true;
    paintPart(part);

    window.addEventListener('pointermove', onStageMove, { passive: false });
    window.addEventListener('pointerup', endPaint, { once: true });
    window.addEventListener('pointercancel', endPaint, { once: true });
  }

  function onStageMove(e) {
    if (!painting) return;
    e.preventDefault();
    var el = document.elementFromPoint(e.clientX, e.clientY);
    var part = closestPart(el);
    if (part) paintPart(part);
  }

  function endPaint() {
    painting = false;
    window.removeEventListener('pointermove', onStageMove);
  }

  /* ───────── 스티커 ───────── */
  function renderStickers() {
    if (!stickerLayer) return;
    stickerLayer.innerHTML = '';
    if (!state) return;
    state.stickers.forEach(function (s) {
      var span = document.createElement('span');
      span.className = 'sticker';
      span.textContent = s.emoji;
      span.style.left = s.x + '%';
      span.style.top = s.y + '%';
      span.style.setProperty('--rot', (s.rot || 0) + 'deg');
      stickerLayer.appendChild(span);
    });
  }

  function placeStickerAt(clientX, clientY) {
    var rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var x = ((clientX - rect.left) / rect.width) * 100;
    var y = ((clientY - rect.top) / rect.height) * 100;
    if (x < 2 || x > 98 || y < 2 || y > 98) return;

    var sticker = {
      id: stickerSeq++,
      emoji: brush.sticker || STICKERS[0],
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      rot: Math.round(Math.random() * 30 - 15)
    };
    state.stickers.push(sticker);
    history.push({ type: 'sticker', id: sticker.id });
    trimHistory();
    renderStickers();
    playSticker();
    vibrate(10);
  }

  /* ───────── 완성 ───────── */
  function allPartIds() {
    var seen = {};
    var ids = [];
    $$('.part', objectHost).forEach(function (el) {
      var pid = el.getAttribute('data-part');
      if (pid && !seen[pid]) {
        seen[pid] = true;
        ids.push(pid);
      }
    });
    return ids;
  }

  function isComplete() {
    if (!state) return false;
    var ids = allPartIds();
    if (!ids.length) return false;
    return ids.every(function (pid) { return !!state.parts[pid]; });
  }

  function checkComplete() {
    if (!current || !state) return;
    if (!isComplete()) return;
    if (celebrated) return;
    celebrated = true;
    celebrate();
  }

  function celebrate() {
    if (completed.indexOf(current.id) < 0) {
      completed.push(current.id);
      saveJSON(STORE.completed, completed);
      updateProgress();
    }

    stage.classList.add('celebrate');
    window.setTimeout(function () { stage.classList.remove('celebrate'); }, 800);

    spawnConfetti();
    playSuccess();
    vibrate([20, 60, 20, 60, 30]);

    var phrase = (current.sound ? current.sound + ' ' : '') + current.name + ' 완성!';
    speak(phrase);
    toast('🎉 완성! 정말 멋져요!');
    saveArtwork(true);
  }

  function spawnConfetti() {
    celebrateLayer.innerHTML = '';
    var colors = ['#ff5d7a', '#ffd400', '#22c55e', '#2f7dff', '#9b4dff', '#ff8a00', '#ff9d9d'];
    for (var i = 0; i < 36; i++) {
      var piece = document.createElement('span');
      piece.className = 'confetti';
      piece.style.left = (Math.random() * 100) + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = (6 + Math.random() * 8) + 'px';
      piece.style.height = (10 + Math.random() * 10) + 'px';
      piece.style.animationDelay = (Math.random() * 0.45) + 's';
      piece.style.animationDuration = (1.4 + Math.random() * 0.9) + 's';
      celebrateLayer.appendChild(piece);
    }
    window.setTimeout(function () {
      celebrateLayer.innerHTML = '';
    }, 2800);
  }

  /* ───────── 배경 테마 ───────── */
  function applyTheme() {
    stage.classList.remove('theme-day', 'theme-night', 'theme-rainbow');
    stage.classList.add('theme-' + ((state && state.theme) || 'day'));
  }

  function cycleTheme() {
    if (!state) return;
    var index = THEMES.indexOf(state.theme);
    var next = THEMES[(index + 1) % THEMES.length];
    history.push({ type: 'theme', prev: state.theme });
    trimHistory();
    state.theme = next;
    applyTheme();
    playWhoosh();
    toast(next === 'day' ? '☀️ 낮이 되었어요!' : next === 'night' ? '🌙 밤이 되었어요!' : '🌈 무지개 세상!');
  }

  /* ───────── 되돌리기 / 지우기 ───────── */
  function undo() {
    var action = history.pop();
    if (!action) {
      playError();
      return;
    }

    if (action.type === 'paint') {
      if (action.prev) {
        state.parts[action.partId] = action.prev;
      } else {
        delete state.parts[action.partId];
      }
      applyAllParts();
    } else if (action.type === 'sticker') {
      state.stickers = state.stickers.filter(function (s) { return s.id !== action.id; });
      renderStickers();
    } else if (action.type === 'theme') {
      state.theme = action.prev;
      applyTheme();
    } else if (action.type === 'reset') {
      state = action.prev;
      celebrated = action.prevCelebrated;
      renderObject();
      applyTheme();
      renderStickers();
    }

    playUndo();
    vibrate(6);
  }

  function resetAll() {
    if (!state) return;
    history.push({ type: 'reset', prev: clone(state), prevCelebrated: celebrated });
    trimHistory();
    state.parts = {};
    state.stickers = [];
    celebrated = false;
    applyAllParts();
    renderStickers();
    playWhoosh();
    toast('새로 칠해 볼까요?');
  }

  function magicFill() {
    if (!state) return;
    var ids = allPartIds();
    var unpainted = ids.filter(function (pid) { return !state.parts[pid]; });
    if (!unpainted.length) {
      playError();
      toast('이미 다 칠했어요!');
      return;
    }

    history.push({ type: 'reset', prev: clone(state), prevCelebrated: celebrated });
    trimHistory();

    var colors = ['#ff3b3b', '#ff8a00', '#ffd400', '#22c55e', '#299db7', '#2f7dff', '#9b4dff', '#d24393', '#ff9d9d', '#91cd2f'];
    var start = Math.floor(Math.random() * colors.length);
    unpainted.forEach(function (pid, i) {
      state.parts[pid] = { mode: 'solid', color: colors[(start + i) % colors.length] };
    });

    applyAllParts();
    playSuccess();
    vibrate([10, 40, 10]);
    toast('🪄 마법의 붓!');
    checkComplete();
  }

  /* ───────── 팔레트 ───────── */
  function setSolidBrush(paint) {
    brush.mode = 'solid';
    brush.color = paint.hex;
    brush.colorName = paint.name;
    brush.pattern = null;
    brush.sticker = null;
    updateBrushPreview();
    markStickerChips();
    markPatternChips();
  }

  function setPattern(pattern) {
    brush.mode = 'pattern';
    brush.pattern = pattern;
    brush.sticker = null;
    updateBrushPreview();
    markPatternChips();
    markStickerChips();
  }

  function setSticker(emoji) {
    brush.mode = 'sticker';
    brush.sticker = emoji;
    brush.pattern = null;
    updateBrushPreview();
    markStickerChips();
    markPatternChips();
  }

  function buildBaseColors() {
    baseColors.innerHTML = '';
    BASE_PAINTS.forEach(function (base) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch' + (needsDarkLabel(base.rgb) ? ' dark' : '') +
        (base.name === '하얀색' ? ' white-swatch' : '');
      btn.style.background = base.hex;
      btn.dataset.color = base.hex;
      btn.dataset.name = base.name;
      btn.innerHTML = '<span>' + base.name + '</span>';
      btn.setAttribute('aria-label', base.name);
      btn.addEventListener('click', function () {
        ensureAudio();
        setSolidBrush(paintFromBase(base));
        playTap();
      });
      baseColors.appendChild(btn);
    });
  }

  function renderMadeColors() {
    madeWrap.classList.toggle('hidden', madePaints.length === 0);
    madeColors.innerHTML = '';
    madePaints.forEach(function (paint) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch' + (needsDarkLabel(paint.rgb) ? ' dark' : '');
      btn.style.background = paint.hex;
      btn.dataset.color = paint.hex;
      btn.dataset.name = paint.name;
      btn.innerHTML = '<span>' + paint.name + '</span>';
      btn.setAttribute('aria-label', paint.name);
      btn.addEventListener('click', function () {
        ensureAudio();
        setSolidBrush(paint);
        playTap();
      });
      madeColors.appendChild(btn);
    });
    renderMixMade();
    updateBrushPreview();
  }

  function markBaseActive() {
    $$('.swatch', baseColors).forEach(function (el) {
      el.classList.toggle('active', brush.mode === 'solid' && el.dataset.color === brush.color);
    });
    $$('.swatch', madeColors).forEach(function (el) {
      el.classList.toggle('active', brush.mode === 'solid' && el.dataset.color === brush.color);
    });
  }

  function updateBrushPreview() {
    if (brush.mode === 'pattern') {
      brushSwatch.style.background = patternCss(brush.color, brush.pattern);
      brushSwatch.style.backgroundSize = '10px 10px';
      brushLabel.textContent = patternLabel(brush.pattern);
    } else if (brush.mode === 'sticker') {
      brushSwatch.style.background = '#fff';
      brushSwatch.style.backgroundSize = '';
      brushSwatch.textContent = brush.sticker || '⭐';
      brushLabel.textContent = '스티커';
      return;
    } else {
      brushSwatch.style.background = brush.color;
      brushSwatch.style.backgroundSize = '';
      brushSwatch.textContent = '';
      brushLabel.textContent = brush.colorName;
    }
    markBaseActive();
    markPatternChips();
  }

  /* ───────── 무늬 칩 ───────── */
  function buildPatterns() {
    patternRow.innerHTML = '';
    PATTERNS.forEach(function (pattern) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'pattern-chip';
      chip.dataset.pattern = pattern.id;
      chip.innerHTML = '<span class="pattern-dot"></span><span>' + pattern.label + '</span>';
      chip.addEventListener('click', function () {
        ensureAudio();
        if (pattern.id === 'solid') {
          brush.mode = 'solid';
          brush.pattern = null;
          updateBrushPreview();
        } else {
          setPattern(pattern.id);
        }
        playTap();
      });
      patternRow.appendChild(chip);
    });
    markPatternChips();
  }

  function markPatternChips() {
    $$('.pattern-chip', patternRow).forEach(function (chip) {
      var type = chip.dataset.pattern;
      var dot = chip.querySelector('.pattern-dot');
      if (dot) {
        dot.style.background = type === 'solid'
          ? brush.color
          : patternCss(brush.color, type);
      }
      var active = (type === 'solid' && brush.mode === 'solid') ||
        (type !== 'solid' && brush.mode === 'pattern' && brush.pattern === type);
      chip.classList.toggle('active', active);
    });
  }

  /* ───────── 스티커 칩 ───────── */
  function buildStickers() {
    stickerRow.innerHTML = '';
    STICKERS.forEach(function (emoji) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'sticker-chip';
      chip.textContent = emoji;
      chip.dataset.emoji = emoji;
      chip.setAttribute('aria-label', '스티커 ' + emoji);
      chip.addEventListener('click', function () {
        ensureAudio();
        setSticker(emoji);
        playTap();
      });
      stickerRow.appendChild(chip);
    });
    markStickerChips();
  }

  function markStickerChips() {
    $$('.sticker-chip', stickerRow).forEach(function (chip) {
      chip.classList.toggle('active', brush.mode === 'sticker' && chip.dataset.emoji === brush.sticker);
    });
  }

  /* ───────── 탭 ───────── */
  function switchTab(tab) {
    activeTab = tab;
    $$('button', toolTabs).forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    paintPanel.classList.toggle('hidden', tab !== 'paint');
    patternPanel.classList.toggle('hidden', tab !== 'pattern');
    stickerPanel.classList.toggle('hidden', tab !== 'sticker');

    if (tab === 'paint') {
      if (brush.mode !== 'solid') {
        brush.mode = 'solid';
        brush.pattern = null;
        brush.sticker = null;
        updateBrushPreview();
      }
    } else if (tab === 'pattern') {
      if (brush.mode !== 'pattern') {
        brush.mode = 'pattern';
        brush.pattern = brush.pattern || 'stripes';
        updateBrushPreview();
      }
      markPatternChips();
    } else if (tab === 'sticker') {
      if (brush.mode !== 'sticker') {
        brush.mode = 'sticker';
        brush.sticker = brush.sticker || STICKERS[0];
        updateBrushPreview();
      }
      markStickerChips();
    }

    requestAnimationFrame(sizeStage);
    window.setTimeout(sizeStage, 60);
  }

  /* ───────── 색 섞기 모달 ───────── */
  function renderMixPaints() {
    mixPaintsEl.innerHTML = '';
    BASE_PAINTS.forEach(function (base) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch' + (needsDarkLabel(base.rgb) ? ' dark' : '') +
        (base.name === '하얀색' ? ' white-swatch' : '');
      btn.style.background = base.hex;
      btn.innerHTML = '<span>' + base.name + '</span>';
      btn.setAttribute('aria-label', base.name);
      btn.addEventListener('click', function () {
        ensureAudio();
        bowlPaints.push(paintFromBase(base));
        updateMixView();
        saveMixedPaintIfNew();
        playPop();
      });
      mixPaintsEl.appendChild(btn);
    });
  }

  function renderMixMade() {
    if (!mixMade) return;
    mixMadeWrap.classList.toggle('hidden', madePaints.length === 0);
    mixMade.innerHTML = '';
    madePaints.forEach(function (paint) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch' + (needsDarkLabel(paint.rgb) ? ' dark' : '');
      btn.style.background = paint.hex;
      btn.innerHTML = '<span>' + paint.name + '</span>';
      btn.setAttribute('aria-label', paint.name);
      btn.addEventListener('click', function () {
        ensureAudio();
        setSolidBrush(paint);
        closeModal('mixModal');
        switchTab('paint');
        playTap();
        toast('🎨 ' + paint.name + ' 색으로 칠해요!');
      });
      mixMade.appendChild(btn);
    });
  }

  function updateMixView() {
    mixIngredients.innerHTML = '';

    if (!bowlPaints.length) {
      mixArea.classList.add('empty');
      mixArea.classList.remove('filled');
      mixArea.style.background = '';
      mixLabel.style.color = '';
      mixLabel.innerHTML = '색깔을 눌러<br>섞어 보세요!';
      useMixed.disabled = true;
      return;
    }

    bowlPaints.forEach(function (paint) {
      var dot = document.createElement('span');
      dot.className = 'ingredient-dot';
      dot.style.background = paint.hex;
      mixIngredients.appendChild(dot);
    });

    var mixed = mixBowl();
    mixArea.classList.remove('empty');
    mixArea.classList.add('filled');
    mixArea.style.background = mixed.hex;
    mixLabel.style.color = needsDarkLabel(mixed.rgb) ? '#5a4300' : '#ffffff';

    if (bowlPaints.length === 1) {
      mixLabel.innerHTML = bowlPaints[0].name + '<br>또 눌러서 섞어요!';
    } else {
      var names = bowlPaints.map(function (p) { return p.name; });
      var recipe = names.length <= 4 ? names.join(' + ') : names.length + '가지 색깔';
      mixLabel.textContent = recipe + ' = ' + mixed.name;
    }

    useMixed.disabled = false;

    if (bowlPaints.length >= 2) {
      checkMission(mixed);
    }
  }

  function saveMixedPaintIfNew() {
    if (bowlPaints.length < 2) return;
    var mixed = mixBowl();
    if (isSimilarToKnownPaint(mixed.rgb)) return;

    var paint = {
      id: madeSeq++,
      name: mixed.name,
      hex: mixed.hex,
      rgb: mixed.rgb,
      r: mixed.r, y: mixed.y, b: mixed.b, w: mixed.w, k: mixed.k
    };
    madePaints.push(paint);
    if (madePaints.length > 48) madePaints.shift();
    saveJSON(STORE.made, madePaints);
    renderMadeColors();
  }

  function clearBowl() {
    bowlPaints = [];
    updateMixView();
    playWhoosh();
  }

  function applyMixedColor() {
    if (!bowlPaints.length) return;
    var mixed = mixBowl();
    setSolidBrush({ name: mixed.name, hex: mixed.hex, rgb: mixed.rgb });
    closeModal('mixModal');
    switchTab('paint');
    playSuccess();
    toast('🎨 ' + mixed.name + ' 색으로 칠해요!');
    speak(mixed.name + ' 색!');
  }

  function openMix() {
    ensureAudio();
    renderMixPaints();
    renderMixMade();
    updateMixView();
    renderMission();
    openModal('mixModal');
    playTap();
  }

  /* ───────── 미션 ───────── */
  function renderMission() {
    var m = MISSIONS[missionIndex];
    if (missionDone) {
      renderMissionSuccess(m);
      return;
    }
    missionEl.classList.remove('success');
    missionEl.innerHTML = '<span class="target" style="background:' + m.hex + '"></span>' +
      '<span class="mission-text">' + m.hint + '을 섞어서 <b>' + m.label + '</b>을 만들어 봐요!</span>';
  }

  function renderMissionSuccess(m) {
    missionEl.classList.add('success');
    missionEl.innerHTML = '<span class="target" style="background:' + m.hex + '"></span>' +
      '<span class="mission-text">정답이야! 🎉 <b>' + m.label + '</b> 완성!</span>' +
      '<button class="next-mission" type="button">다음</button>';
    var nextBtn = missionEl.querySelector('.next-mission');
    if (nextBtn) {
      nextBtn.addEventListener('click', nextMission);
    }
  }

  function nextMission() {
    missionIndex = (missionIndex + 1) % MISSIONS.length;
    missionDone = false;
    renderMission();
    playTap();
  }

  function checkMission(mixed) {
    if (missionDone) return;
    var m = MISSIONS[missionIndex];
    var targetRgb = hexToRgb(m.hex);
    if (colorDistance(mixed.rgb, targetRgb) > 55) return;

    missionDone = true;
    renderMissionSuccess(m);
    playSuccess();
    vibrate([15, 50, 15]);
    speak('정답이야! ' + m.label + ' 색을 만들었어요!');
  }

  /* ───────── 갤러리 ───────── */
  function saveArtwork(auto) {
    if (!current || !state) return;
    var entry = {
      key: 'g' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      objectId: current.id,
      state: clone(state),
      savedAt: Date.now()
    };
    gallery.unshift(entry);
    if (gallery.length > 40) gallery = gallery.slice(0, 40);
    saveJSON(STORE.gallery, gallery);
    if (!auto) {
      toast('💾 내 작품에 저장했어요!');
      playSuccess();
    }
    if (!$('#galleryModal').classList.contains('hidden')) {
      renderGallery();
    }
  }

  function buildMini(obj, st) {
    var wrap = document.createElement('div');
    wrap.className = 'mini-stage theme-' + ((st && st.theme) || 'day');
    wrap.innerHTML = obj.svg;

    var svg = wrap.querySelector('svg');
    if (svg && st && st.parts) {
      Object.keys(st.parts).forEach(function (pid) {
        var ps = st.parts[pid];
        var el = svg.querySelector('[data-part="' + pid + '"]');
        if (el && ps) el.style.fill = ps.color;
      });
    }

    if (st && st.stickers) {
      st.stickers.forEach(function (s) {
        var span = document.createElement('span');
        span.className = 'mini-sticker';
        span.textContent = s.emoji;
        span.style.left = s.x + '%';
        span.style.top = s.y + '%';
        span.style.transform = 'translate(-50%, -50%) rotate(' + (s.rot || 0) + 'deg)';
        wrap.appendChild(span);
      });
    }
    return wrap;
  }

  function renderGallery() {
    galleryGrid.innerHTML = '';
    galleryEmpty.classList.toggle('hidden', gallery.length > 0);

    gallery.forEach(function (entry) {
      var obj = OBJECT_MAP[entry.objectId];
      if (!obj || !entry.state) return;

      var item = document.createElement('div');
      item.className = 'gallery-item';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');

      item.appendChild(buildMini(obj, entry.state));

      var name = document.createElement('span');
      name.className = 'mini-name';
      name.textContent = obj.emoji + ' ' + obj.name;
      item.appendChild(name);

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'gallery-del';
      del.textContent = '✕';
      del.setAttribute('aria-label', '작품 지우기');
      del.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteGallery(entry.key);
      });
      item.appendChild(del);

      item.addEventListener('click', function () { loadArtwork(entry); });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          loadArtwork(entry);
        }
      });

      galleryGrid.appendChild(item);
    });
  }

  function deleteGallery(key) {
    gallery = gallery.filter(function (entry) { return entry.key !== key; });
    saveJSON(STORE.gallery, gallery);
    renderGallery();
    playWhoosh();
  }

  function loadArtwork(entry) {
    var obj = OBJECT_MAP[entry.objectId];
    if (!obj || !entry.state) return;
    closeModal('galleryModal');
    openObject(obj, true);
    state = clone(entry.state);
    if (!state.parts) state.parts = {};
    if (!state.stickers) state.stickers = [];
    if (THEMES.indexOf(state.theme) < 0) state.theme = 'day';
    celebrated = isComplete();
    history = [];
    renderObject();
    applyTheme();
    renderStickers();
    playSuccess();
    toast('🖼️ 작품을 불러왔어요!');
  }

  function openGallery() {
    ensureAudio();
    renderGallery();
    openModal('galleryModal');
    playTap();
  }

  /* ───────── 모달 공통 ───────── */
  function openModal(id) {
    var modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden');
  }

  function closeModal(id) {
    var modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
  }

  /* ───────── 토스트 / 크기 ───────── */
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove('show');
    }, 1900);
  }

  function sizeStage() {
    if (!stage) return;
    var wrap = stage.parentElement;
    if (!wrap) return;
    var rect = wrap.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var style = window.getComputedStyle(wrap);
    var padX = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    var padY = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    var size = Math.floor(Math.min(rect.width - padX, rect.height - padY));
    if (size < 120) return;
    stage.style.width = size + 'px';
    stage.style.height = size + 'px';
    stage.style.setProperty('--sticker-size', Math.round(size * 0.11) + 'px');
  }

  /* ───────── 이벤트 ───────── */
  function bindEvents() {
    document.getElementById('backBtn').addEventListener('click', showPicker);
    document.getElementById('undoBtn').addEventListener('click', function () { ensureAudio(); undo(); });
    document.getElementById('themeBtn').addEventListener('click', function () { ensureAudio(); cycleTheme(); });
    document.getElementById('saveBtn').addEventListener('click', function () { ensureAudio(); saveArtwork(false); });
    document.getElementById('galleryBtn').addEventListener('click', openGallery);
    document.getElementById('resetBtn').addEventListener('click', function () { ensureAudio(); resetAll(); });
    document.getElementById('mixBtn').addEventListener('click', openMix);
    document.getElementById('magicBtn').addEventListener('click', function () {
      ensureAudio();
      magicFill();
    });
    document.getElementById('mixAgain').addEventListener('click', clearBowl);
    useMixed.addEventListener('click', applyMixedColor);

    stage.addEventListener('pointerdown', onStageDown);

    $$('button', toolTabs).forEach(function (btn) {
      btn.addEventListener('click', function () {
        ensureAudio();
        switchTab(btn.dataset.tab);
        playTap();
      });
    });

    $$('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeModal(btn.dataset.close);
        playTap();
      });
    });

    $$('.modal').forEach(function (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.classList.add('hidden');
      });
    });

    window.addEventListener('resize', function () { requestAnimationFrame(sizeStage); });
    window.addEventListener('orientationchange', function () {
      window.setTimeout(sizeStage, 220);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () {
        requestAnimationFrame(sizeStage);
      });
    }

    document.addEventListener('pointerdown', function () {
      ensureAudio();
      unlockSpeech();
    }, { once: true });

    if (window.speechSynthesis) {
      speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = pickKoreanVoice;
    }

    if (window.ResizeObserver) {
      var stageWrap = document.querySelector('.stage-wrap');
      if (stageWrap) {
        var stageObserver = new ResizeObserver(function () { sizeStage(); });
        stageObserver.observe(stageWrap);
      }
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { requestAnimationFrame(sizeStage); });
    }
  }

  /* ───────── 시작 ───────── */
  function init() {
    buildBaseColors();
    renderMadeColors();
    buildPatterns();
    buildStickers();
    renderCatTabs();
    renderPicker();
    updateProgress();
    updateBrushPreview();
    renderMission();
    bindEvents();
    sizeStage();
  }

  init();
})();
