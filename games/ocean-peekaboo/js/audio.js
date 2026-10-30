(function () {
  'use strict';

  var OceanAudio = {
    ctx: null,
    muted: false
  };

  function ensureCtx() {
    if (!OceanAudio.ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      OceanAudio.ctx = new AC();
    }
    if (OceanAudio.ctx.state === 'suspended') {
      OceanAudio.ctx.resume();
    }
    return OceanAudio.ctx;
  }

  OceanAudio.unlock = function () {
    ensureCtx();
  };

  OceanAudio.toggleMute = function () {
    OceanAudio.muted = !OceanAudio.muted;
    return OceanAudio.muted;
  };

  function tone(type, freqStart, freqEnd, dur, vol, when) {
    if (OceanAudio.muted) return;
    var ctx = ensureCtx();
    if (!ctx) return;
    var t = (when != null ? when : 0) + ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t);
    if (freqEnd != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 40), t + dur);
    }
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  /** 은신처 쏙! */
  OceanAudio.playHide = function () {
    tone('sine', 520, 280, 0.14, 0.22);
    tone('triangle', 380, 180, 0.18, 0.12, 0.03);
  };

  /** 고래 예고: 보글보글 푸우 */
  OceanAudio.playWhaleTelegraph = function () {
    var i;
    for (i = 0; i < 5; i++) {
      tone('sine', 360 + i * 40, 520 + i * 30, 0.12, 0.1, i * 0.14);
    }
    tone('sine', 220, 480, 0.35, 0.16, 0.7);
  };

  /** 상어 예고: 두둥~ 쿨쿨 */
  OceanAudio.playSharkTelegraph = function () {
    tone('triangle', 110, 90, 0.45, 0.18);
    tone('sine', 140, 100, 0.5, 0.1, 0.15);
    tone('sine', 180, 140, 0.35, 0.08, 0.7);
    tone('sine', 160, 120, 0.4, 0.07, 1.1);
  };

  /** 고래 허그 성공 */
  OceanAudio.playHug = function () {
    tone('sine', 523, 784, 0.2, 0.2);
    tone('sine', 659, 988, 0.22, 0.16, 0.08);
    tone('triangle', 784, 1046, 0.28, 0.12, 0.16);
  };

  /** 까꿍 성공 */
  OceanAudio.playPeekSuccess = function () {
    tone('sine', 440, 660, 0.18, 0.18);
    tone('triangle', 660, 880, 0.2, 0.12, 0.1);
  };

  /** 따뜻한 미스 (안심) */
  OceanAudio.playSoftMiss = function () {
    tone('sine', 330, 280, 0.28, 0.12);
    tone('sine', 280, 240, 0.32, 0.08, 0.12);
  };

  /** 노을 종료 */
  OceanAudio.playSunset = function () {
    tone('sine', 392, 523, 0.5, 0.14);
    tone('sine', 494, 659, 0.55, 0.11, 0.25);
    tone('triangle', 587, 784, 0.7, 0.09, 0.5);
  };

  /** UI 탭 */
  OceanAudio.playTap = function () {
    tone('sine', 480, 720, 0.1, 0.15);
  };

  window.OceanAudio = OceanAudio;
})();
