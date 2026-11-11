/**
 * KidsKit — 키즈 미니게임 공용 키트 (클래식 스크립트, 외부 의존 0)
 * 노출: window.KidsKit 하나만.
 */
(function (global) {
  'use strict';

  var MUTE_KEY = 'kidsKit.muted';
  var TRANSPARENT_PIXEL =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
  var LOBBY_HREF = '../../index.html';

  var audioCtx = null;
  var unlockBound = false;
  var muted = false;

  try {
    muted = global.localStorage && global.localStorage.getItem(MUTE_KEY) === '1';
  } catch (e) {
    muted = false;
  }

  function ensureAudioContext() {
    if (audioCtx) return audioCtx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    return audioCtx;
  }

  function unlockAudioFromGesture() {
    if (unlockBound) return;
    unlockBound = true;
    var ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(function () {});
    }
  }

  function bindUnlockListeners() {
    if (!global.document) return;
    var once = function () {
      unlockAudioFromGesture();
      global.document.removeEventListener('pointerdown', once, true);
      global.document.removeEventListener('touchstart', once, true);
      global.document.removeEventListener('keydown', once, true);
    };
    global.document.addEventListener('pointerdown', once, true);
    global.document.addEventListener('touchstart', once, true);
    global.document.addEventListener('keydown', once, true);
  }

  bindUnlockListeners();

  /* ---------- assets ---------- */

  function createPlaceholderImage() {
    var img = new Image();
    img.src = TRANSPARENT_PIXEL;
    img.dataset.kidsKitPlaceholder = '1';
    return img;
  }

  /**
   * @param {Array<string|{src:string,key?:string}>} list
   * @param {(loaded:number,total:number,item:*)=>void} [onProgress]
   * @returns {Promise<{images:Object<string,HTMLImageElement>, failed:string[]}>}
   */
  function preload(list, onProgress) {
    var items = Array.isArray(list) ? list : [];
    var total = items.length;
    var loaded = 0;
    var images = {};
    var failed = [];

    if (total === 0) {
      return Promise.resolve({ images: images, failed: failed });
    }

    function tick(item) {
      loaded += 1;
      if (typeof onProgress === 'function') {
        try {
          onProgress(loaded, total, item);
        } catch (e) {
          /* ignore progress errors */
        }
      }
    }

    var jobs = items.map(function (item, index) {
      var src = typeof item === 'string' ? item : item && item.src;
      var key =
        (item && item.key) ||
        (typeof item === 'string' ? item : null) ||
        String(index);

      if (!src) {
        console.warn('[KidsKit] asset load failed: (empty src)', key);
        images[key] = createPlaceholderImage();
        failed.push(key);
        tick(item);
        return Promise.resolve();
      }

      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () {
          images[key] = img;
          tick(item);
          resolve();
        };
        img.onerror = function () {
          console.warn('[KidsKit] asset load failed:', src);
          images[key] = createPlaceholderImage();
          failed.push(src);
          tick(item);
          resolve();
        };
        img.src = src;
      });
    });

    return Promise.all(jobs).then(function () {
      return { images: images, failed: failed };
    });
  }

  /* ---------- sound ---------- */

  var PRESETS = {
    pop: function (ctx) {
      var t0 = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, t0);
      osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.12);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.16);
    },
    chime: function (ctx) {
      var t0 = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach(function (freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        var start = t0 + i * 0.07;
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    },
    whoosh: function (ctx) {
      var t0 = ctx.currentTime;
      var duration = 0.28;
      var buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      var src = ctx.createBufferSource();
      src.buffer = buffer;
      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, t0);
      filter.frequency.exponentialRampToValueAtTime(1800, t0 + duration);
      filter.Q.value = 0.7;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.1, t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(t0);
      src.stop(t0 + duration);
    },
    boing: function (ctx) {
      var t0 = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t0);
      osc.frequency.exponentialRampToValueAtTime(320, t0 + 0.08);
      osc.frequency.exponentialRampToValueAtTime(160, t0 + 0.22);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.14, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.28);
    },
    sparkle: function (ctx) {
      var t0 = ctx.currentTime;
      [880, 1174.7, 1568].forEach(function (freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        var start = t0 + i * 0.04;
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.08, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.2);
      });
    },
  };

  function playSynth(presetName) {
    var ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(function () {});
    }
    var fn = PRESETS[presetName] || PRESETS.pop;
    try {
      fn(ctx);
    } catch (e) {
      console.warn('[KidsKit] synth play failed:', presetName, e);
    }
  }

  function playUrl(url) {
    return new Promise(function (resolve, reject) {
      try {
        var audio = new Audio();
        audio.preload = 'auto';
        audio.src = url;
        var settled = false;
        var done = function (err) {
          if (settled) return;
          settled = true;
          if (err) reject(err);
          else resolve();
        };
        audio.addEventListener('ended', function () {
          done(null);
        });
        audio.addEventListener('error', function () {
          done(new Error('audio load failed'));
        });
        var p = audio.play();
        if (p && typeof p.then === 'function') {
          p.catch(function (err) {
            done(err || new Error('audio play failed'));
          });
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  function play(urlOrPreset) {
    if (muted) return;
    unlockAudioFromGesture();
    if (!urlOrPreset) {
      playSynth('pop');
      return;
    }
    if (typeof urlOrPreset === 'string' && PRESETS[urlOrPreset]) {
      playSynth(urlOrPreset);
      return;
    }
    if (typeof urlOrPreset === 'string') {
      playUrl(urlOrPreset).catch(function () {
        console.warn('[KidsKit] sound file failed, using synth fallback:', urlOrPreset);
        playSynth('pop');
      });
      return;
    }
    playSynth('pop');
  }

  function isMuted() {
    return muted;
  }

  function setMuted(next) {
    muted = !!next;
    try {
      if (global.localStorage) {
        global.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
      }
    } catch (e) {
      /* private mode */
    }
    return muted;
  }

  function toggleMute() {
    return setMuted(!muted);
  }

  var sound = {
    play: play,
    isMuted: isMuted,
    setMuted: setMuted,
    toggleMute: toggleMute,
    presets: Object.keys(PRESETS),
  };

  /* ---------- store ---------- */

  function storageKey(ns, key) {
    return 'kidsKit.' + ns + '.' + key;
  }

  function store(namespace) {
    var ns = String(namespace || 'default');
    return {
      get: function (key, fallback) {
        try {
          if (!global.localStorage) return fallback;
          var raw = global.localStorage.getItem(storageKey(ns, key));
          if (raw == null) return fallback;
          return JSON.parse(raw);
        } catch (e) {
          return fallback;
        }
      },
      set: function (key, value) {
        try {
          if (!global.localStorage) return false;
          global.localStorage.setItem(storageKey(ns, key), JSON.stringify(value));
          return true;
        } catch (e) {
          return false;
        }
      },
      update: function (key, updater, fallback) {
        var prev = this.get(key, fallback);
        var next = typeof updater === 'function' ? updater(prev) : updater;
        this.set(key, next);
        return next;
      },
      remove: function (key) {
        try {
          if (!global.localStorage) return false;
          global.localStorage.removeItem(storageKey(ns, key));
          return true;
        } catch (e) {
          return false;
        }
      },
    };
  }

  /* ---------- UI: rest / soft ending ---------- */

  function restButton(options) {
    options = options || {};
    var onRest = options.onRest;
    var parent = options.parent || (global.document && global.document.body);
    if (!parent) return null;

    var existing = parent.querySelector('.kk-rest-btn');
    if (existing) existing.remove();

    var btn = global.document.createElement('button');
    btn.type = 'button';
    btn.className = 'kk-rest-btn';
    btn.setAttribute('aria-label', '쉬자');
    btn.textContent = '쉬자';
    btn.addEventListener('click', function () {
      haptic('light');
      if (typeof onRest === 'function') {
        onRest();
      } else {
        global.location.href = LOBBY_HREF;
      }
    });
    parent.appendChild(btn);
    return btn;
  }

  function softEnding(options) {
    options = options || {};
    var doc = global.document;
    if (!doc) return null;

    var existing = doc.querySelector('.kk-soft-ending');
    if (existing) existing.remove();

    var overlay = doc.createElement('div');
    overlay.className = 'kk-soft-ending';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var card = doc.createElement('div');
    card.className = 'kk-soft-ending__card';

    if (options.emoji) {
      var emoji = doc.createElement('div');
      emoji.className = 'kk-soft-ending__emoji';
      emoji.textContent = options.emoji;
      card.appendChild(emoji);
    }

    var title = doc.createElement('h2');
    title.className = 'kk-soft-ending__title';
    title.textContent = options.title || '잘했어';
    card.appendChild(title);

    var actions = doc.createElement('div');
    actions.className = 'kk-soft-ending__actions';

    var again = doc.createElement('button');
    again.type = 'button';
    again.className = 'kk-btn kk-btn--primary';
    again.textContent = '또 할래';
    again.addEventListener('click', function () {
      haptic('light');
      overlay.remove();
      if (typeof options.onAgain === 'function') options.onAgain();
    });

    var rest = doc.createElement('button');
    rest.type = 'button';
    rest.className = 'kk-btn kk-btn--rest';
    rest.textContent = '쉬자';
    rest.addEventListener('click', function () {
      haptic('light');
      overlay.remove();
      if (typeof options.onRest === 'function') {
        options.onRest();
      } else {
        global.location.href = LOBBY_HREF;
      }
    });

    actions.appendChild(again);
    actions.appendChild(rest);
    card.appendChild(actions);
    overlay.appendChild(card);
    doc.body.appendChild(overlay);
    return overlay;
  }

  /* ---------- haptic ---------- */

  function haptic(kind) {
    if (!global.navigator || typeof global.navigator.vibrate !== 'function') return;
    var pattern = 12;
    if (kind === 'medium') pattern = 20;
    else if (kind === 'success') pattern = [10, 40, 14];
    else if (kind === 'soft') pattern = 8;
    try {
      global.navigator.vibrate(pattern);
    } catch (e) {
      /* ignore */
    }
  }

  global.KidsKit = {
    assets: { preload: preload },
    sound: sound,
    store: store,
    restButton: restButton,
    softEnding: softEnding,
    haptic: haptic,
  };
})(typeof window !== 'undefined' ? window : globalThis);
