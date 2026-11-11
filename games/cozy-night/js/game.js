/**
 * 포근포근 밤밤 (Cozy Night)
 * 만 3~5세 수면 루틴 — 토닥→이불→별/자장가 의식, 재방문 기지개 반김
 */

(function () {
  'use strict';

  var store = window.KidsKit
    ? window.KidsKit.store('cozy-night')
    : {
        get: function (_k, fb) { return fb; },
        set: function () {},
        update: function (_k, _u, fb) { return fb; }
      };

  // --- 1. 오디오 합성 엔진 (Web Audio API) ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isSoundEnabled = true;
      this.isMusicEnabled = false;
      this.musicTimer = null;
      this.musicStep = 0;

      var C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23,
          G4 = 392.00, A4 = 440.00, B4 = 493.88, C5 = 523.25;

      this.lullabyNotes = [
        C4, C4, G4, G4, A4, A4, G4, null,
        F4, F4, E4, E4, D4, D4, C4, null,
        G4, G4, F4, F4, E4, E4, D4, null,
        G4, G4, F4, F4, E4, E4, D4, null,
        C4, C4, G4, G4, A4, A4, G4, null,
        F4, F4, E4, E4, D4, D4, C4, null
      ];

      this.starPitches = [523.25, 587.33, 659.25, 783.99];
    }

    ensureContext() {
      if (!this.ctx) {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    playMusicBoxTone(freq, duration, volume) {
      duration = duration == null ? 1.2 : duration;
      volume = volume == null ? 0.28 : volume;
      if (!this.isSoundEnabled || !freq) return;
      this.ensureContext();
      if (!this.ctx) return;

      var now = this.ctx.currentTime;
      var osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      var osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now);

      var gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.008);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      var gain2 = this.ctx.createGain();
      gain2.gain.setValueAtTime(volume * 0.25, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.6);

      osc1.connect(gainNode);
      osc2.connect(gain2);
      gain2.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    }

    playPatChime(step) {
      if (!this.isSoundEnabled) return;
      var baseFreqs = [329.63, 392.00, 440.00, 523.25, 659.25, 783.99];
      this.playMusicBoxTone(baseFreqs[step % baseFreqs.length], 1.4, 0.32);
    }

    playStarChime(index) {
      if (!this.isSoundEnabled) return;
      this.playMusicBoxTone(this.starPitches[index % this.starPitches.length], 1.0, 0.25);
    }

    playMoonTwinkle() {
      if (!this.isSoundEnabled) return;
      var self = this;
      [523.25, 659.25, 783.99].forEach(function (freq, idx) {
        setTimeout(function () {
          self.playMusicBoxTone(freq, 1.3, 0.22);
        }, idx * 140);
      });
    }

    playBlanketSound() {
      if (!this.isSoundEnabled) return;
      this.ensureContext();
      if (!this.ctx) return;

      var now = this.ctx.currentTime;
      var osc = this.ctx.createOscillator();
      var gain = this.ctx.createGain();
      var filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.3);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    }

    playSwitchSound() {
      if (!this.isSoundEnabled) return;
      this.playMusicBoxTone(440, 0.2, 0.15);
    }

    playComboChime(animal) {
      if (!this.isSoundEnabled) return;
      var map = {
        bear: [392.0, 523.25, 659.25],
        rabbit: [440.0, 554.37, 659.25],
        cat: [349.23, 440.0, 523.25]
      };
      var tones = map[animal] || map.bear;
      var self = this;
      tones.forEach(function (freq, idx) {
        setTimeout(function () {
          self.playMusicBoxTone(freq, 0.9, 0.2);
        }, idx * 110);
      });
    }

    toggleLullaby() {
      this.ensureContext();
      this.isMusicEnabled = !this.isMusicEnabled;
      if (this.isMusicEnabled) this.startLullaby();
      else this.stopLullaby();
      return this.isMusicEnabled;
    }

    startLullaby() {
      this.stopLullaby();
      var self = this;
      var playStep = function () {
        var note = self.lullabyNotes[self.musicStep];
        if (note) self.playMusicBoxTone(note, 1.6, 0.22);
        self.musicStep = (self.musicStep + 1) % self.lullabyNotes.length;
        self.musicTimer = setTimeout(playStep, 720);
      };
      playStep();
    }

    stopLullaby() {
      if (this.musicTimer) {
        clearTimeout(this.musicTimer);
        this.musicTimer = null;
      }
    }
  }

  // --- 2. 상태 ---
  var sound = new SoundEngine();
  var FRIENDS_FOR_SESSION_END = 2;
  var SETTLE_MS = 4200;

  var ASSET_SLOTS = [
    { key: 'bg-room', src: 'assets/bg-room.webp' },
    { key: 'bed', src: 'assets/bed.webp' },
    { key: 'moon', src: 'assets/moon.webp' },
    { key: 'animal-bear', src: 'assets/animal-bear.webp' },
    { key: 'animal-rabbit', src: 'assets/animal-rabbit.webp' },
    { key: 'animal-cat', src: 'assets/animal-cat.webp' },
    { key: 'animal-bear-sleep', src: 'assets/animal-bear-sleep.webp' },
    { key: 'animal-rabbit-sleep', src: 'assets/animal-rabbit-sleep.webp' },
    { key: 'animal-cat-sleep', src: 'assets/animal-cat-sleep.webp' },
    { key: 'blanket-yellow', src: 'assets/blanket-yellow.webp' },
    { key: 'blanket-pink', src: 'assets/blanket-pink.webp' },
    { key: 'blanket-blue', src: 'assets/blanket-blue.webp' }
  ];

  var COMBO_REACTIONS = {
    'bear:yellow': { text: '꿀잠 이불이에요', icons: ['🍯', '⭐', '✨'] },
    'bear:pink': { text: '딸기 이불이 포근해요', icons: ['🍓', '💖', '✨'] },
    'bear:blue': { text: '하늘색 이불이에요', icons: ['☁️', '💙', '✨'] },
    'rabbit:yellow': { text: '별빛 이불이 반짝', icons: ['⭐', '🌼', '✨'] },
    'rabbit:pink': { text: '꽃밭 이불이에요', icons: ['🌸', '💖', '✨'] },
    'rabbit:blue': { text: '구름 이불이 폭신', icons: ['☁️', '🐰', '✨'] },
    'cat:yellow': { text: '노란 이불이 따뜻해요', icons: ['☀️', '🐱', '✨'] },
    'cat:pink': { text: '분홍 이불에 골골', icons: ['💖', '🌸', '✨'] },
    'cat:blue': { text: '파란 이불에 골골~', icons: ['🐟', '💙', '✨'] }
  };

  var state = {
    currentAnimal: 'bear',
    sleepLevel: 0,
    isLightsOff: false,
    blanketState: 'tucked',
    blanketPattern: 'yellow',
    ritualPat: false,
    ritualBlanket: false,
    ritualNight: false,
    comboShownFor: null,
    friendsAsleep: {},
    asleepCount: 0,
    isSettling: false,
    isEndingOpen: false,
    isDreamland: false,
    assetImages: {},
    assetReady: false
  };

  var nightRoom = document.getElementById('nightRoom');
  var btnMusic = document.getElementById('btnMusic');
  var btnSound = document.getElementById('btnSound');
  var soundIcon = document.getElementById('soundIcon');
  var moonBtn = document.getElementById('moonBtn');
  var moonAsset = document.getElementById('moonAsset');
  var moonFallback = document.getElementById('moonFallback');
  var starButtons = document.querySelectorAll('.star-btn');
  var lampSwitch = document.getElementById('lampSwitch');
  var gaugeStars = document.querySelectorAll('.gauge-star');
  var gaugeHint = document.getElementById('gaugeHint');
  var ritualDots = document.getElementById('ritualDots');
  var animalStage = document.getElementById('animalStage');
  var animalSvg = document.getElementById('animalSvg');
  var animalAsset = document.getElementById('animalAsset');
  var tapHint = document.getElementById('tapHint');
  var bubbleLayer = document.getElementById('bubbleLayer');
  var blanket = document.getElementById('blanket');
  var blanketAsset = document.getElementById('blanketAsset');
  var bedAsset = document.getElementById('bedAsset');
  var animalSelectors = document.querySelectorAll('.btn-animal');
  var btnBlanketPattern = document.getElementById('btnBlanketPattern');
  var btnBedtime = document.getElementById('btnBedtime');
  var bedtimeOverlay = document.getElementById('bedtimeOverlay');
  var previewIcon = document.getElementById('previewIcon');
  var dialogTitle = document.getElementById('dialogTitle');
  var dialogText = document.getElementById('dialogText');
  var btnReplay = document.getElementById('btnReplay');
  var btnNightMode = document.getElementById('btnNightMode');
  var dreamlandScreen = document.getElementById('dreamlandScreen');
  var btnWakeUp = document.getElementById('btnWakeUp');
  var welcomeBanner = document.getElementById('welcomeBanner');
  var welcomeEmoji = document.getElementById('welcomeEmoji');
  var welcomeText = document.getElementById('welcomeText');
  var comboToast = document.getElementById('comboToast');
  var friendAsleepToast = document.getElementById('friendAsleepToast');
  var friendAsleepText = document.getElementById('friendAsleepText');

  var settleTimer = null;
  var sleepZzzTimer = null;
  var toastTimer = null;
  var earTimer = null;
  var moonWinkTimer = null;

  // --- 3. 동물 SVG ---
  var animalData = {
    bear: {
      name: '포근 곰돌이',
      short: '곰돌이',
      emoji: '🐻',
      icon: '🐻💤',
      render: function (sleepiness) {
        var eyeSvg;
        if (sleepiness < 2) {
          eyeSvg =
            '<circle cx="95" cy="115" r="7" fill="#2d3436"/>' +
            '<circle cx="93" cy="112" r="2.5" fill="#ffffff"/>' +
            '<circle cx="145" cy="115" r="7" fill="#2d3436"/>' +
            '<circle cx="143" cy="112" r="2.5" fill="#ffffff"/>';
        } else if (sleepiness < 4) {
          eyeSvg =
            '<path d="M 88 116 Q 95 124 102 116" stroke="#2d3436" stroke-width="4.5" stroke-linecap="round" fill="none"/>' +
            '<path d="M 138 116 Q 145 124 152 116" stroke="#2d3436" stroke-width="4.5" stroke-linecap="round" fill="none"/>';
        } else {
          eyeSvg =
            '<path d="M 87 118 Q 95 126 103 118" stroke="#2d3436" stroke-width="5" stroke-linecap="round" fill="none"/>' +
            '<path d="M 137 118 Q 145 126 153 118" stroke="#2d3436" stroke-width="5" stroke-linecap="round" fill="none"/>';
        }
        return (
          '<g id="bearGroup">' +
          '<g class="ear-left">' +
          '<circle cx="65" cy="80" r="28" fill="#a07255" stroke="#795548" stroke-width="4"/>' +
          '<circle cx="65" cy="80" r="16" fill="#f8c291"/>' +
          '</g>' +
          '<g class="ear-right">' +
          '<circle cx="175" cy="80" r="28" fill="#a07255" stroke="#795548" stroke-width="4"/>' +
          '<circle cx="175" cy="80" r="16" fill="#f8c291"/>' +
          '</g>' +
          '<ellipse cx="120" cy="130" rx="68" ry="62" fill="#b08364" stroke="#795548" stroke-width="4"/>' +
          '<circle cx="78" cy="136" r="12" fill="#ff7675" opacity="0.45"/>' +
          '<circle cx="162" cy="136" r="12" fill="#ff7675" opacity="0.45"/>' +
          '<ellipse cx="120" cy="138" rx="28" ry="22" fill="#ffeaa7"/>' +
          '<path d="M 112 130 Q 120 126 128 130 Q 120 138 112 130 Z" fill="#2d3436"/>' +
          '<path d="M 120 135 L 120 144" stroke="#2d3436" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M 113 144 Q 120 150 127 144" stroke="#2d3436" stroke-width="3" stroke-linecap="round" fill="none"/>' +
          eyeSvg +
          '</g>'
        );
      }
    },
    rabbit: {
      name: '잠꾸러기 토끼',
      short: '토끼',
      emoji: '🐰',
      icon: '🐰💤',
      render: function (sleepiness) {
        var eyeSvg;
        if (sleepiness < 2) {
          eyeSvg =
            '<circle cx="95" cy="120" r="6.5" fill="#2d3436"/>' +
            '<circle cx="93" cy="117" r="2.2" fill="#ffffff"/>' +
            '<circle cx="145" cy="120" r="6.5" fill="#2d3436"/>' +
            '<circle cx="143" cy="117" r="2.2" fill="#ffffff"/>';
        } else if (sleepiness < 4) {
          eyeSvg =
            '<path d="M 88 121 Q 95 128 102 121" stroke="#2d3436" stroke-width="4" stroke-linecap="round" fill="none"/>' +
            '<path d="M 138 121 Q 145 128 152 121" stroke="#2d3436" stroke-width="4" stroke-linecap="round" fill="none"/>';
        } else {
          eyeSvg =
            '<path d="M 87 122 Q 95 129 103 122" stroke="#2d3436" stroke-width="4.5" stroke-linecap="round" fill="none"/>' +
            '<path d="M 137 122 Q 145 129 153 122" stroke="#2d3436" stroke-width="4.5" stroke-linecap="round" fill="none"/>';
        }
        return (
          '<g id="rabbitGroup">' +
          '<g class="ear-left">' +
          '<ellipse cx="80" cy="55" rx="16" ry="50" fill="#f5f6fa" stroke="#dcdde1" stroke-width="3.5" transform="rotate(-10 80 55)"/>' +
          '<ellipse cx="80" cy="55" rx="9" ry="36" fill="#ffb8b8" transform="rotate(-10 80 55)"/>' +
          '</g>' +
          '<g class="ear-right">' +
          '<ellipse cx="160" cy="55" rx="16" ry="50" fill="#f5f6fa" stroke="#dcdde1" stroke-width="3.5" transform="rotate(10 160 55)"/>' +
          '<ellipse cx="160" cy="55" rx="9" ry="36" fill="#ffb8b8" transform="rotate(10 160 55)"/>' +
          '</g>' +
          '<ellipse cx="120" cy="132" rx="64" ry="58" fill="#ffffff" stroke="#dcdde1" stroke-width="3.5"/>' +
          '<circle cx="78" cy="138" r="13" fill="#ffb8b8" opacity="0.6"/>' +
          '<circle cx="162" cy="138" r="13" fill="#ffb8b8" opacity="0.6"/>' +
          '<ellipse cx="120" cy="132" rx="6" ry="5" fill="#ff7675"/>' +
          '<path d="M 120 137 L 120 143" stroke="#2d3436" stroke-width="2.5" stroke-linecap="round"/>' +
          '<path d="M 114 143 Q 120 148 126 143" stroke="#2d3436" stroke-width="2.5" stroke-linecap="round" fill="none"/>' +
          eyeSvg +
          '</g>'
        );
      }
    },
    cat: {
      name: '골골 아기 고양이',
      short: '고양이',
      emoji: '🐱',
      icon: '🐱💤',
      render: function (sleepiness) {
        var eyeSvg;
        if (sleepiness < 2) {
          eyeSvg =
            '<circle cx="95" cy="120" r="7" fill="#00b894"/>' +
            '<circle cx="95" cy="120" r="4.5" fill="#2d3436"/>' +
            '<circle cx="93" cy="117" r="2" fill="#ffffff"/>' +
            '<circle cx="145" cy="120" r="7" fill="#00b894"/>' +
            '<circle cx="145" cy="120" r="4.5" fill="#2d3436"/>' +
            '<circle cx="143" cy="117" r="2" fill="#ffffff"/>';
        } else if (sleepiness < 4) {
          eyeSvg =
            '<path d="M 88 121 Q 95 128 102 121" stroke="#2d3436" stroke-width="4.5" stroke-linecap="round" fill="none"/>' +
            '<path d="M 138 121 Q 145 128 152 121" stroke="#2d3436" stroke-width="4.5" stroke-linecap="round" fill="none"/>';
        } else {
          eyeSvg =
            '<path d="M 87 122 Q 95 129 103 122" stroke="#2d3436" stroke-width="5" stroke-linecap="round" fill="none"/>' +
            '<path d="M 137 122 Q 145 129 153 122" stroke="#2d3436" stroke-width="5" stroke-linecap="round" fill="none"/>';
        }
        return (
          '<g id="catGroup">' +
          '<g class="ear-left">' +
          '<polygon points="62,110 50,55 95,85" fill="#fab1a0" stroke="#e17055" stroke-width="3.5"/>' +
          '<polygon points="65,102 56,66 90,87" fill="#ff7675"/>' +
          '</g>' +
          '<g class="ear-right">' +
          '<polygon points="178,110 190,55 145,85" fill="#fab1a0" stroke="#e17055" stroke-width="3.5"/>' +
          '<polygon points="175,102 184,66 150,87" fill="#ff7675"/>' +
          '</g>' +
          '<ellipse cx="120" cy="132" rx="66" ry="56" fill="#ffeaa7" stroke="#e17055" stroke-width="3.5"/>' +
          '<path d="M 112 85 L 120 95 L 128 85" stroke="#e17055" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
          '<path d="M 115 95 L 120 102 L 125 95" stroke="#e17055" stroke-width="3" fill="none" stroke-linecap="round"/>' +
          '<circle cx="76" cy="138" r="12" fill="#ff7675" opacity="0.5"/>' +
          '<circle cx="164" cy="138" r="12" fill="#ff7675" opacity="0.5"/>' +
          '<line x1="60" y1="135" x2="40" y2="132" stroke="#636e72" stroke-width="2.5" stroke-linecap="round"/>' +
          '<line x1="60" y1="142" x2="42" y2="145" stroke="#636e72" stroke-width="2.5" stroke-linecap="round"/>' +
          '<line x1="180" y1="135" x2="200" y2="132" stroke="#636e72" stroke-width="2.5" stroke-linecap="round"/>' +
          '<line x1="180" y1="142" x2="198" y2="145" stroke="#636e72" stroke-width="2.5" stroke-linecap="round"/>' +
          '<polygon points="115,133 125,133 120,138" fill="#ff7675"/>' +
          '<path d="M 120 138 L 120 143" stroke="#2d3436" stroke-width="2.5" stroke-linecap="round"/>' +
          '<path d="M 114 143 Q 120 148 126 143" stroke="#2d3436" stroke-width="2.5" stroke-linecap="round" fill="none"/>' +
          eyeSvg +
          '</g>'
        );
      }
    }
  };

  // --- 4. 에셋 슬롯 ---
  function isUsableAsset(img) {
    return !!(
      img &&
      img.naturalWidth > 0 &&
      img.dataset.kidsKitPlaceholder !== '1' &&
      !(img.src || '').startsWith('data:image/gif')
    );
  }

  function applyAssetSlots() {
    // 방 배경은 DOM img 슬롯이 없어 CSS 변수로만 올린다(조명 끔 오버레이와 공존).
    var bgImg = state.assetImages['bg-room'];
    if (isUsableAsset(bgImg) && nightRoom) {
      nightRoom.style.setProperty('--room-bg', 'url("' + bgImg.src + '")');
      nightRoom.classList.add('has-bg-raster');
    }

    var moonImg = state.assetImages.moon;
    if (isUsableAsset(moonImg) && moonAsset) {
      moonAsset.src = moonImg.src;
      moonAsset.hidden = false;
      if (moonFallback) moonFallback.hidden = true;
    }

    var bedImg = state.assetImages.bed;
    if (isUsableAsset(bedImg) && bedAsset) {
      bedAsset.src = bedImg.src;
      bedAsset.hidden = false;
    }

    applyAnimalAsset();
    applyBlanketAsset();
  }

  function applyAnimalAsset() {
    if (!animalAsset || !animalStage) return;
    var sleepKey = 'animal-' + state.currentAnimal + '-sleep';
    var idleKey = 'animal-' + state.currentAnimal;
    var img =
      state.sleepLevel >= 4 && isUsableAsset(state.assetImages[sleepKey])
        ? state.assetImages[sleepKey]
        : state.assetImages[idleKey];

    if (isUsableAsset(img)) {
      animalAsset.src = img.src;
      animalAsset.hidden = false;
      animalStage.classList.add('has-raster');
    } else {
      animalAsset.hidden = true;
      animalStage.classList.remove('has-raster');
    }
  }

  function applyBlanketAsset() {
    if (!blanketAsset || !blanket) return;
    var key = 'blanket-' + state.blanketPattern;
    var img = state.assetImages[key];
    if (isUsableAsset(img)) {
      blanketAsset.src = img.src;
      blanketAsset.hidden = false;
      blanket.classList.add('has-raster');
    } else {
      blanketAsset.hidden = true;
      blanket.classList.remove('has-raster');
    }
  }

  function preloadAssets() {
    if (!window.KidsKit || !KidsKit.assets) {
      state.assetReady = true;
      return Promise.resolve();
    }
    return KidsKit.assets.preload(ASSET_SLOTS).then(function (result) {
      state.assetImages = result.images || {};
      state.assetReady = true;
      applyAssetSlots();
    });
  }

  // --- 5. UI 헬퍼 ---
  function updateAnimalSvg() {
    var current = animalData[state.currentAnimal];
    if (current && animalSvg) {
      animalSvg.innerHTML = current.render(state.sleepLevel);
    }
    applyAnimalAsset();
  }

  function updateSleepGauge() {
    gaugeStars.forEach(function (star, idx) {
      if (idx < state.sleepLevel) star.classList.add('is-earned');
      else star.classList.remove('is-earned');
    });
  }

  function updateBlanketUI() {
    blanket.classList.remove('is-tucked', 'is-lowered');
    blanket.classList.add(state.blanketState === 'tucked' ? 'is-tucked' : 'is-lowered');
    blanket.classList.remove('pattern-yellow', 'pattern-pink', 'pattern-blue');
    blanket.classList.add('pattern-' + state.blanketPattern);
    applyBlanketAsset();
  }

  function updateRitualDots() {
    if (!ritualDots) return;
    var map = {
      pat: state.ritualPat || state.sleepLevel >= 5,
      blanket: state.ritualBlanket && state.blanketState === 'tucked',
      night: state.ritualNight
    };
    ritualDots.querySelectorAll('.ritual-dot').forEach(function (dot) {
      var step = dot.getAttribute('data-step');
      if (map[step]) dot.classList.add('is-done');
      else dot.classList.remove('is-done');
    });
  }

  function updateGaugeHint() {
    if (!gaugeHint) return;
    var text = '토닥토닥 재워줘요';
    var next = false;

    if (state.friendsAsleep[state.currentAnimal]) {
      text = '이미 새근새근 자는 중이에요';
    } else if (state.isSettling) {
      text = '새근새근... 곧 잠들어요';
      next = true;
    } else if (state.sleepLevel < 5) {
      text = '토닥토닥 재워줘요';
    } else if (!(state.ritualBlanket && state.blanketState === 'tucked')) {
      text = '이불을 포근히 덮어줘요';
      next = true;
    } else if (!state.ritualNight) {
      text = '별을 켜거나 오르골을 틀어줘요';
      next = true;
    } else {
      text = '새근새근... 곧 잠들어요';
      next = true;
    }

    gaugeHint.textContent = text;
    gaugeHint.classList.toggle('is-next-step', next);
  }

  function updateAsleepBadges() {
    animalSelectors.forEach(function (btn) {
      var id = btn.getAttribute('data-animal');
      var badge = btn.querySelector('.asleep-badge');
      var asleep = !!state.friendsAsleep[id];
      btn.classList.toggle('is-asleep', asleep);
      if (badge) badge.hidden = !asleep;
    });
  }

  function spawnParticle(text, x, y) {
    if (!bubbleLayer) return;
    var p = document.createElement('div');
    p.className = 'pat-particle';
    p.textContent = text;

    var rect = animalStage.getBoundingClientRect();
    var posX = x != null ? x - rect.left : rect.width * 0.5 + (Math.random() * 40 - 20);
    var posY = y != null ? y - rect.top : rect.height * 0.4 + (Math.random() * 30 - 15);

    p.style.left = posX + 'px';
    p.style.top = posY + 'px';
    p.style.setProperty('--dx', Math.random() * 40 - 20 + 'px');
    bubbleLayer.appendChild(p);
    setTimeout(function () {
      if (p.parentNode) p.parentNode.removeChild(p);
    }, 1600);
  }

  function showToast(el, ms) {
    if (!el) return;
    el.hidden = false;
    requestAnimationFrame(function () {
      el.classList.add('is-visible');
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('is-visible');
      setTimeout(function () {
        el.hidden = true;
      }, 320);
    }, ms || 2600);
  }

  function showComboReaction() {
    var key = state.currentAnimal + ':' + state.blanketPattern;
    if (state.comboShownFor === key) return;
    var combo = COMBO_REACTIONS[key];
    if (!combo || !comboToast) return;
    state.comboShownFor = key;
    comboToast.textContent = combo.text;
    showToast(comboToast, 2200);
    sound.playComboChime(state.currentAnimal);
    combo.icons.forEach(function (icon, idx) {
      setTimeout(function () {
        spawnParticle(icon, null, null);
      }, idx * 120);
    });
    if (window.KidsKit) KidsKit.haptic('soft');
  }

  function startSleepZzz() {
    stopSleepZzz();
    sleepZzzTimer = setInterval(function () {
      if ((state.sleepLevel >= 4 || state.friendsAsleep[state.currentAnimal]) && !state.isEndingOpen) {
        spawnParticle('💤', null, null);
      }
    }, 2400);
  }

  function stopSleepZzz() {
    if (sleepZzzTimer) {
      clearInterval(sleepZzzTimer);
      sleepZzzTimer = null;
    }
  }

  function clearSettle() {
    state.isSettling = false;
    if (settleTimer) {
      clearTimeout(settleTimer);
      settleTimer = null;
    }
  }

  function ritualComplete() {
    return (
      state.sleepLevel >= 5 &&
      state.ritualBlanket &&
      state.blanketState === 'tucked' &&
      state.ritualNight &&
      !state.friendsAsleep[state.currentAnimal]
    );
  }

  function maybeStartSettle() {
    updateRitualDots();
    updateGaugeHint();
    if (!ritualComplete() || state.isSettling || state.isEndingOpen) return;

    state.isSettling = true;
    updateGaugeHint();
    startSleepZzz();
    if (window.KidsKit) KidsKit.haptic('soft');

    settleTimer = setTimeout(function () {
      settleTimer = null;
      state.isSettling = false;
      onFriendFullyAsleep();
    }, SETTLE_MS);
  }

  function persistLastFriend() {
    store.set('lastFriend', state.currentAnimal);
    store.set('lastBlanket', state.blanketPattern);
    store.set('lastVisitAt', Date.now());
    store.update('putToSleepCount', function (n) {
      return (n || 0) + 1;
    }, 0);
  }

  function onFriendFullyAsleep() {
    if (state.friendsAsleep[state.currentAnimal]) return;

    state.friendsAsleep[state.currentAnimal] = true;
    state.asleepCount += 1;
    persistLastFriend();
    updateAsleepBadges();
    updateGaugeHint();
    if (window.KidsKit) KidsKit.haptic('success');

    var cur = animalData[state.currentAnimal];
    var name = cur ? cur.short : '친구';

    if (state.asleepCount >= FRIENDS_FOR_SESSION_END) {
      showBedtimeOverlay('session');
      return;
    }

    if (friendAsleepText) {
      friendAsleepText.textContent =
        name + '가 새근새근 잠들었어요. 다른 친구도 재워줄까?';
    }
    showToast(friendAsleepToast, 3200);
  }

  // --- 6. 발견 레이어 ---
  function triggerMoonWink() {
    if (!moonBtn) return;
    moonBtn.classList.add('is-winking');
    clearTimeout(moonWinkTimer);
    moonWinkTimer = setTimeout(function () {
      moonBtn.classList.remove('is-winking');
    }, 900);
    spawnParticle('😉', null, null);
  }

  function triggerEarPerk() {
    if (!animalSvg) return;
    animalSvg.classList.add('is-ear-perk');
    if (animalStage) animalStage.classList.add('is-ear-perk');
    clearTimeout(earTimer);
    earTimer = setTimeout(function () {
      animalSvg.classList.remove('is-ear-perk');
      if (animalStage) animalStage.classList.remove('is-ear-perk');
    }, 750);
    spawnParticle('👂', null, null);
    sound.playMusicBoxTone(659.25, 0.5, 0.18);
  }

  function isEarTap(clientY) {
    if (clientY == null || !animalStage) return false;
    var rect = animalStage.getBoundingClientRect();
    var relY = (clientY - rect.top) / rect.height;
    return relY < 0.38;
  }

  // --- 7. 인터랙션 ---
  function handlePat(e) {
    if (state.isEndingOpen || state.isDreamland) return;
    if (tapHint) tapHint.style.display = 'none';

    var clientX = null;
    var clientY = null;
    if (e.clientX != null && e.clientY != null) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    if (isEarTap(clientY)) {
      triggerEarPerk();
    }

    if (state.friendsAsleep[state.currentAnimal]) {
      spawnParticle('💤', clientX, clientY);
      sound.playPatChime(4);
      return;
    }

    if (state.isSettling) {
      spawnParticle('💤', clientX, clientY);
      sound.playPatChime(4);
      return;
    }

    sound.playPatChime(state.sleepLevel);
    if (window.KidsKit) KidsKit.haptic('light');

    var icons = ['✨', '💖', '⭐', '💤', '🌸'];
    spawnParticle(icons[state.sleepLevel % icons.length], clientX, clientY);

    if (state.sleepLevel < 5) {
      state.sleepLevel += 1;
      if (state.sleepLevel >= 5) state.ritualPat = true;
      updateSleepGauge();
      updateAnimalSvg();
      updateRitualDots();
      updateGaugeHint();
      maybeStartSettle();
    } else {
      state.ritualPat = true;
      spawnParticle('💤', clientX, clientY);
      updateRitualDots();
      updateGaugeHint();
      maybeStartSettle();
    }
  }

  animalStage.addEventListener('pointerdown', function (e) {
    handlePat(e);
  });

  blanket.addEventListener('pointerdown', function (e) {
    e.stopPropagation();
    if (state.isEndingOpen) return;

    sound.playBlanketSound();
    state.blanketState = state.blanketState === 'tucked' ? 'lowered' : 'tucked';
    if (state.blanketState === 'tucked') {
      state.ritualBlanket = true;
      showComboReaction();
    }
    updateBlanketUI();
    updateRitualDots();
    updateGaugeHint();
    spawnParticle('🛌', null, null);
    maybeStartSettle();
  });

  btnBlanketPattern.addEventListener('click', function () {
    sound.playMusicBoxTone(659.25, 0.4, 0.2);
    var patterns = ['yellow', 'pink', 'blue'];
    var curIdx = patterns.indexOf(state.blanketPattern);
    state.blanketPattern = patterns[(curIdx + 1) % patterns.length];
    state.comboShownFor = null;
    updateBlanketUI();
    if (state.blanketState === 'tucked' && state.sleepLevel >= 2) {
      showComboReaction();
    }
  });

  starButtons.forEach(function (starBtn, idx) {
    starBtn.addEventListener('click', function () {
      sound.playStarChime(idx);
      starBtn.classList.toggle('is-lit');
      if (starBtn.classList.contains('is-lit')) {
        state.ritualNight = true;
        updateRitualDots();
        updateGaugeHint();
        maybeStartSettle();
      } else {
        var anyLit = Array.prototype.some.call(starButtons, function (b) {
          return b.classList.contains('is-lit');
        });
        if (!anyLit && !sound.isMusicEnabled) {
          // 별이 모두 꺼져도 이미 켠 적 있으면 의식 유지(재촉 없음)
        }
      }
      spawnParticle('⭐', null, null);
    });
  });

  moonBtn.addEventListener('click', function () {
    sound.playMoonTwinkle();
    triggerMoonWink();
  });

  lampSwitch.addEventListener('click', function () {
    sound.playSwitchSound();
    state.isLightsOff = !state.isLightsOff;
    if (state.isLightsOff) {
      nightRoom.classList.add('is-lights-off');
      lampSwitch.querySelector('.lamp-label').textContent = '불 켜기';
    } else {
      nightRoom.classList.remove('is-lights-off');
      lampSwitch.querySelector('.lamp-label').textContent = '불 끄기';
    }
  });

  function selectAnimal(chosen, opts) {
    opts = opts || {};
    if (!chosen || (!opts.force && chosen === state.currentAnimal)) return;

    clearSettle();
    state.currentAnimal = chosen;
    state.sleepLevel = state.friendsAsleep[chosen] ? 5 : 0;
    state.ritualPat = state.friendsAsleep[chosen] || false;
    state.ritualBlanket = false;
    state.ritualNight = sound.isMusicEnabled || Array.prototype.some.call(starButtons, function (b) {
      return b.classList.contains('is-lit');
    });
    state.comboShownFor = null;
    state.blanketState = 'tucked';
    stopSleepZzz();

    animalSelectors.forEach(function (b) {
      var on = b.getAttribute('data-animal') === chosen;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });

    updateSleepGauge();
    updateAnimalSvg();
    updateBlanketUI();
    updateRitualDots();
    updateGaugeHint();
    updateAsleepBadges();

    if (state.friendsAsleep[chosen]) startSleepZzz();
  }

  animalSelectors.forEach(function (btn) {
    btn.addEventListener('click', function () {
      sound.playMusicBoxTone(523.25, 0.5, 0.25);
      selectAnimal(btn.getAttribute('data-animal'));
    });
  });

  btnMusic.addEventListener('click', function () {
    var isPlaying = sound.toggleLullaby();
    btnMusic.classList.toggle('is-playing', isPlaying);
    if (isPlaying) {
      state.ritualNight = true;
      updateRitualDots();
      updateGaugeHint();
      maybeStartSettle();
    }
  });

  btnSound.addEventListener('click', function () {
    sound.ensureContext();
    sound.isSoundEnabled = !sound.isSoundEnabled;
    if (soundIcon) soundIcon.textContent = sound.isSoundEnabled ? '🔊' : '🔇';
    else btnSound.textContent = sound.isSoundEnabled ? '🔊' : '🔇';
  });

  function showBedtimeOverlay(mode) {
    clearSettle();
    state.isEndingOpen = true;
    var cur = animalData[state.currentAnimal];
    if (previewIcon) previewIcon.textContent = cur ? cur.icon : '🐻💤';

    if (mode === 'session') {
      if (dialogTitle) dialogTitle.textContent = '오늘 밤도 포근하게 재워줬어요';
      if (dialogText) {
        dialogText.innerHTML =
          '친구들이 새근새근 잠들었어요.<br><span>우리 친구도 좋은 꿈 꿔요. 쉿, 내일 또 만나요!</span>';
      }
    } else {
      if (dialogTitle) dialogTitle.textContent = '동물 친구가 새근새근 잠들었어요';
      if (dialogText) {
        dialogText.innerHTML =
          '우리 친구도 이제 눈을 감고 좋은 꿈 꿔요...<br><span>쉿, 내일 또 만나요!</span>';
      }
    }

    bedtimeOverlay.classList.add('is-open');
    bedtimeOverlay.setAttribute('aria-hidden', 'false');
    persistLastFriend();
  }

  btnBedtime.addEventListener('click', function () {
    sound.playMusicBoxTone(440, 0.8, 0.25);
    state.sleepLevel = 5;
    state.ritualPat = true;
    state.ritualBlanket = true;
    state.ritualNight = true;
    state.blanketState = 'tucked';
    updateSleepGauge();
    updateAnimalSvg();
    updateBlanketUI();
    updateRitualDots();
    showBedtimeOverlay('manual');
  });

  btnReplay.addEventListener('click', function () {
    sound.playMusicBoxTone(587.33, 0.5, 0.2);
    bedtimeOverlay.classList.remove('is-open');
    bedtimeOverlay.setAttribute('aria-hidden', 'true');
    state.isEndingOpen = false;

    // 아직 안 재운 친구로 이어 놀기
    var next = ['bear', 'rabbit', 'cat'].find(function (id) {
      return !state.friendsAsleep[id];
    });
    if (next) {
      selectAnimal(next, { force: true });
    } else {
      state.friendsAsleep = {};
      state.asleepCount = 0;
      selectAnimal(state.currentAnimal, { force: true });
      updateAsleepBadges();
    }
    stopSleepZzz();
  });

  btnNightMode.addEventListener('click', function () {
    bedtimeOverlay.classList.remove('is-open');
    bedtimeOverlay.setAttribute('aria-hidden', 'true');
    dreamlandScreen.classList.add('is-active');
    dreamlandScreen.setAttribute('aria-hidden', 'false');
    state.isDreamland = true;
    state.isEndingOpen = false;

    if (!sound.isMusicEnabled) {
      sound.toggleLullaby();
      btnMusic.classList.add('is-playing');
    }
  });

  btnWakeUp.addEventListener('click', function () {
    dreamlandScreen.classList.remove('is-active');
    dreamlandScreen.setAttribute('aria-hidden', 'true');
    state.isDreamland = false;
  });

  // --- 8. 재방문 훅 ---
  function showRevisitGreeting(friendId) {
    var data = animalData[friendId] || animalData.bear;
    if (welcomeEmoji) welcomeEmoji.textContent = data.emoji;
    if (welcomeText) {
      welcomeText.textContent =
        '어제 재워준 ' + data.short + '가 기지개~ 잘 잤어요!';
    }
    if (welcomeBanner) {
      welcomeBanner.hidden = false;
      requestAnimationFrame(function () {
        welcomeBanner.classList.add('is-visible');
      });
      setTimeout(function () {
        welcomeBanner.classList.remove('is-visible');
        setTimeout(function () {
          welcomeBanner.hidden = true;
        }, 400);
      }, 4200);
    }
    if (animalStage) {
      animalStage.classList.add('is-stretching');
      setTimeout(function () {
        animalStage.classList.remove('is-stretching');
      }, 1500);
    }
    sound.playMusicBoxTone(523.25, 0.8, 0.22);
    setTimeout(function () {
      sound.playMusicBoxTone(659.25, 0.9, 0.2);
    }, 280);
    spawnParticle('✨', null, null);
    spawnParticle('💖', null, null);
  }

  function applyRevisit() {
    var lastFriend = store.get('lastFriend', null);
    var lastBlanket = store.get('lastBlanket', null);
    if (lastBlanket && ['yellow', 'pink', 'blue'].indexOf(lastBlanket) !== -1) {
      state.blanketPattern = lastBlanket;
    }
    if (lastFriend && animalData[lastFriend]) {
      selectAnimal(lastFriend, { force: true });
      showRevisitGreeting(lastFriend);
      return true;
    }
    return false;
  }

  // --- 9. KidsKit 출구 ---
  function wireKidsKitUi() {
    if (!window.KidsKit) return;

    KidsKit.restButton({
      parent: nightRoom,
      onRest: function () {
        if (state.isEndingOpen) {
          window.location.href = '../../index.html';
          return;
        }
        KidsKit.softEnding({
          title: '오늘 밤도 포근했어요',
          emoji: '🌙',
          onAgain: function () {
            /* 계속 놀기 */
          },
          onRest: function () {
            window.location.href = '../../index.html';
          }
        });
      }
    });
  }

  // --- 10. 초기화 ---
  function init() {
    updateAnimalSvg();
    updateSleepGauge();
    updateBlanketUI();
    updateRitualDots();
    updateGaugeHint();
    updateAsleepBadges();
    wireKidsKitUi();

    preloadAssets().then(function () {
      applyRevisit();
      updateBlanketUI();
      updateAnimalSvg();
    });
  }

  init();
})();
