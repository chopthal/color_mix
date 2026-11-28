/**
 * WebAudio 합성음 (파일 없음): 엔진 · 경적(+터널 메아리) · 시동 · 깜빡이 · 날갯짓 · 발걸음
 * · 건널목 종 · 기차 · 빗소리 · 세차 · 물보라 · 와이퍼 · 라디오(오리지널 짧은 멜로디 3곡).
 * 첫 사용자 제스처에서 컨텍스트 생성. 음소거는 KidsKit.sound와 동기.
 */

function kitMuted() {
  const K = window.KidsKit;
  return !!(K && K.sound && K.sound.isMuted());
}

const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

/** 오리지널 동요풍 멜로디 — [음높이(MIDI), 박] · 베이스 [음높이, 박] */
const SONGS = [
  {
    bpm: 116,
    mel: [
      [60, 1], [64, 1], [67, 1], [64, 1], [69, 1], [67, 1], [64, 2],
      [62, 1], [64, 1], [67, 1], [69, 1], [67, 2], [64, 2],
      [60, 1], [62, 1], [64, 1], [67, 1], [64, 1], [62, 1], [60, 2],
      [62, 1], [64, 1], [62, 1], [59, 1], [60, 4],
    ],
    bass: [[48, 4], [53, 4], [48, 4], [55, 4], [48, 4], [45, 4], [43, 4], [48, 4]],
  },
  {
    bpm: 104,
    mel: [
      [67, 1], [69, 1], [71, 2], [74, 1], [71, 1], [69, 2],
      [67, 1], [64, 1], [62, 2], [64, 1], [67, 1], [69, 2],
      [71, 1], [69, 1], [67, 1], [64, 1], [62, 2], [64, 2],
      [67, 1], [69, 1], [71, 1], [69, 1], [67, 4],
    ],
    bass: [[55, 4], [52, 4], [48, 4], [50, 4], [55, 4], [48, 4], [50, 4], [55, 4]],
  },
  {
    bpm: 126,
    mel: [
      [65, 0.5], [69, 0.5], [72, 1], [72, 1], [70, 1], [69, 1], [67, 1], [65, 2],
      [67, 1], [69, 1], [70, 1], [72, 1], [74, 2], [72, 2],
      [69, 1], [67, 1], [65, 1], [62, 1], [64, 1], [65, 1], [67, 2],
      [69, 1], [67, 1], [64, 1], [67, 1], [65, 4],
    ],
    bass: [[53, 4], [58, 4], [53, 4], [60, 4], [50, 4], [58, 4], [60, 4], [53, 4]],
  },
];

export class DriveAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.engine = null;
    this.muted = kitMuted();
    this.paused = false;
    this.noiseBuf = null;
    this.radio = { on: false, song: -1, mi: 0, bi: 0, mt: 0, bt: 0 };
    this.loops = {};
  }

  /** 반드시 사용자 제스처 안에서 호출 */
  init() {
    if (this.ctx) {
      this.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.master.connect(comp);
    comp.connect(ctx.destination);

    const len = Math.floor(ctx.sampleRate * 2);
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    // 경적 버스 → 메아리(터널)
    this.hornBus = ctx.createGain();
    this.hornBus.connect(this.master);
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.21;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    this.echoWet = ctx.createGain();
    this.echoWet.gain.value = 0;
    this.hornBus.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(this.echoWet);
    this.echoWet.connect(this.master);

    this.radioBus = ctx.createGain();
    this.radioBus.gain.value = 0.7;
    this.radioBus.connect(this.master);

    this.buildEngine();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  buildEngine() {
    const ctx = this.ctx;
    const saw = ctx.createOscillator();
    saw.type = 'sawtooth';
    const sq = ctx.createOscillator();
    sq.type = 'square';
    sq.detune.value = 9;
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    const sawG = ctx.createGain();
    sawG.gain.value = 0.55;
    const sqG = ctx.createGain();
    sqG.gain.value = 0.22;
    const subG = ctx.createGain();
    subG.gain.value = 0.5;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.8;
    const am = ctx.createGain();
    am.gain.value = 0.75;
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.25;
    lfo.connect(lfoG);
    lfoG.connect(am.gain);
    const out = ctx.createGain();
    out.gain.value = 0;
    saw.connect(sawG);
    sq.connect(sqG);
    sub.connect(subG);
    sawG.connect(lp);
    sqG.connect(lp);
    subG.connect(lp);
    lp.connect(am);
    am.connect(out);
    out.connect(this.master);
    const t = ctx.currentTime;
    for (const o of [saw, sq, sub, lfo]) o.start(t);
    this.engine = { saw, sq, sub, lp, lfo, out, on: false };
    this.setEngine(0, 0);
  }

  engineOn(on) {
    if (!this.engine) return;
    this.engine.on = on;
    const t = this.ctx.currentTime;
    this.engine.out.gain.cancelScheduledValues(t);
    this.engine.out.gain.setTargetAtTime(on ? 0.05 : 0, t, on ? 0.25 : 0.12);
  }

  /** rpm: 0(아이들)..1(최고속), throttle: 0..1 */
  setEngine(rpm, throttle) {
    const e = this.engine;
    if (!e) return;
    const t = this.ctx.currentTime;
    const f = 50 + rpm * 80;
    e.saw.frequency.setTargetAtTime(f, t, 0.06);
    e.sq.frequency.setTargetAtTime(f, t, 0.06);
    e.sub.frequency.setTargetAtTime(f / 2, t, 0.06);
    e.lfo.frequency.setTargetAtTime(f / 4, t, 0.06);
    e.lp.frequency.setTargetAtTime(260 + rpm * 520 + throttle * 120, t, 0.08);
    if (e.on) e.out.gain.setTargetAtTime(0.045 + rpm * 0.02 + throttle * 0.012, t, 0.12);
  }

  setMuted(m) {
    this.muted = m;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(m ? 0 : 1, t, 0.05);
  }

  suspend() {
    this.paused = true;
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
  }

  resume() {
    this.paused = false;
    if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
  }

  ready() {
    return !!this.ctx && !this.muted && !this.paused;
  }

  tone(type, freq, t0, dur, gain, opts = {}) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);
    const g = ctx.createGain();
    const a = opts.attack || 0.01;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + a);
    g.gain.setValueAtTime(gain, t0 + Math.max(a, dur - (opts.release || 0.06)));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = o;
    if (opts.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = opts.lp;
      o.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(opts.bus || this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  noise(t0, dur, gain, freq, q = 1, type = 'bandpass') {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.01, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t0, Math.random() * 1.5);
    src.stop(t0 + dur + 0.02);
    return f;
  }

  /** 빵빵: 장3도 2톤 화음 × 2번 (터널 안에선 메아리) */
  horn() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.005;
    for (const [st, dur] of [
      [0, 0.15],
      [0.2, 0.2],
    ]) {
      this.tone('square', 392, t + st, dur, 0.045, { lp: 1300, attack: 0.012, release: 0.05, bus: this.hornBus });
      this.tone('square', 494, t + st, dur, 0.04, { lp: 1300, attack: 0.012, release: 0.05, bus: this.hornBus });
      this.tone('triangle', 196, t + st, dur, 0.06, { attack: 0.012, release: 0.05, bus: this.hornBus });
    }
  }

  setEcho(on) {
    if (!this.ctx) return;
    this.echoWet.gain.setTargetAtTime(on ? 0.6 : 0, this.ctx.currentTime, 0.2);
  }

  /** 열쇠 딸깍 + 시동 걸리는 소리 → 엔진 켜짐 */
  start() {
    if (!this.ready()) {
      this.engineOn(true);
      return;
    }
    const t = this.ctx.currentTime + 0.01;
    this.noise(t, 0.04, 0.12, 2600, 2);
    this.noise(t + 0.09, 0.03, 0.08, 1800, 2);
    for (let i = 0; i < 5; i++) {
      this.tone('sawtooth', 70 + i * 4, t + 0.25 + i * 0.12, 0.1, 0.05, { lp: 500, attack: 0.02, release: 0.05 });
    }
    this.tone('sawtooth', 60, t + 0.9, 0.5, 0.06, { to: 110, lp: 600, attack: 0.04, release: 0.2 });
    setTimeout(() => this.engineOn(true), 950);
  }

  tick(on) {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.005;
    this.tone('sine', on ? 1250 : 950, t, 0.04, 0.035, { attack: 0.003, release: 0.03 });
  }

  click() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.005;
    this.tone('sine', 760, t, 0.06, 0.05, { to: 520, attack: 0.004, release: 0.04 });
  }

  flap() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.01;
    for (let i = 0; i < 4; i++) this.noise(t + i * 0.075, 0.05, 0.05, 1400 + i * 120, 1.4);
  }

  step(i) {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.005;
    const base = [420, 360, 260][i % 3];
    this.tone('sine', base, t, 0.08, 0.035, { to: base * 0.5, attack: 0.005, release: 0.05 });
  }

  /** 건널목 "땡" */
  bell() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.005;
    this.tone('triangle', 1046, t, 0.38, 0.04, { attack: 0.004, release: 0.3 });
    this.tone('sine', 1568, t, 0.22, 0.018, { attack: 0.004, release: 0.18 });
  }

  whistle() {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + 0.01;
    this.tone('sine', 587, t, 0.75, 0.03, { lp: 1800, attack: 0.08, release: 0.3 });
    this.tone('sine', 740, t, 0.75, 0.025, { lp: 1800, attack: 0.08, release: 0.3 });
  }

  chug() {
    if (!this.ready()) return;
    this.noise(this.ctx.currentTime + 0.005, 0.12, 0.03, 320, 0.8);
  }

  splash(big) {
    if (!this.ready()) return;
    this.noise(this.ctx.currentTime + 0.005, big ? 0.45 : 0.25, big ? 0.06 : 0.035, 900, 0.5, 'lowpass');
    if (big) {
      const t = this.ctx.currentTime + 0.05;
      this.tone('sine', 1400, t, 0.22, 0.02, { to: 2000, attack: 0.02, release: 0.1 });
    }
  }

  wiper() {
    if (!this.ready()) return;
    const f = this.noise(this.ctx.currentTime + 0.005, 0.38, 0.018, 700, 1.2);
    f.frequency.linearRampToValueAtTime(1600, this.ctx.currentTime + 0.38);
  }

  /** 빗소리·세차 소리 (켜고 끄기) */
  loop(name, on) {
    if (!this.ctx) return;
    let L = this.loops[name];
    if (on && !L) {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const f1 = ctx.createBiquadFilter();
      const f2 = ctx.createBiquadFilter();
      const g = ctx.createGain();
      g.gain.value = 0;
      if (name === 'rain') {
        f1.type = 'highpass';
        f1.frequency.value = 900;
        f2.type = 'lowpass';
        f2.frequency.value = 6500;
      } else {
        f1.type = 'bandpass';
        f1.frequency.value = 520;
        f1.Q.value = 0.6;
        f2.type = 'lowpass';
        f2.frequency.value = 2400;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 1.6;
        const lg = ctx.createGain();
        lg.gain.value = 260;
        lfo.connect(lg);
        lg.connect(f1.frequency);
        lfo.start();
        src.addEventListener('ended', () => lfo.stop());
      }
      src.connect(f1);
      f1.connect(f2);
      f2.connect(g);
      g.connect(this.master);
      src.start();
      g.gain.setTargetAtTime(name === 'rain' ? 0.05 : 0.06, ctx.currentTime, 0.4);
      L = { src, g };
      this.loops[name] = L;
    } else if (!on && L) {
      const t = this.ctx.currentTime;
      L.g.gain.setTargetAtTime(0, t, 0.25);
      L.src.stop(t + 1.2);
      delete this.loops[name];
    }
  }

  /* ---------- 라디오 ---------- */

  /** 꺼져 있으면 다음 곡을 켜고, 켜져 있으면 끈다. 반환: 켜짐 여부 */
  toggleRadio() {
    const R = this.radio;
    if (R.on) {
      R.on = false;
      return false;
    }
    R.on = true;
    R.song = (R.song + 1) % SONGS.length;
    R.mi = 0;
    R.bi = 0;
    if (this.ctx) {
      R.mt = this.ctx.currentTime + 0.12;
      R.bt = R.mt;
    }
    return true;
  }

  stopRadio() {
    this.radio.on = false;
  }

  /** 매 프레임 호출: 앞으로 0.3초 분량의 음을 예약 */
  updateRadio() {
    const R = this.radio;
    if (!R.on || !this.ctx || this.paused) return;
    const song = SONGS[R.song];
    const beat = 60 / song.bpm;
    const horizon = this.ctx.currentTime + 0.3;
    if (R.mt < this.ctx.currentTime - 0.5) {
      R.mt = this.ctx.currentTime + 0.05;
      R.bt = R.mt;
    }
    while (R.mt < horizon) {
      const [m, b] = song.mel[R.mi];
      const d = b * beat;
      this.tone('triangle', midiHz(m), R.mt, d * 0.92, 0.045, { attack: 0.015, release: d * 0.4, bus: this.radioBus });
      this.tone('sine', midiHz(m + 12), R.mt, d * 0.5, 0.012, { attack: 0.01, release: d * 0.3, bus: this.radioBus });
      R.mt += d;
      R.mi = (R.mi + 1) % song.mel.length;
      if (R.mi === 0) R.mt += beat;
    }
    while (R.bt < horizon) {
      const [m, b] = song.bass[R.bi];
      const d = b * beat;
      for (let k = 0; k < b; k += 2) {
        this.tone('sine', midiHz(m), R.bt + k * beat, beat * 0.9, 0.055, { attack: 0.01, release: beat * 0.5, bus: this.radioBus });
      }
      R.bt += d;
      R.bi = (R.bi + 1) % song.bass.length;
      if (R.bi === 0) R.bt += beat;
    }
  }
}
