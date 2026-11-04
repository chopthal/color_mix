/**
 * 째깍 크아앙! 놀이 싸움 — 효과음 (Web Audio API)
 * 오디오는 첫 사용자 터치에서 활성화한다 (Safari 정책).
 * 전체 음량은 낮게, 날카로운 고음은 쓰지 않는다 (저자극).
 */
const MS_SOUND = {
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
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + (when || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  },

  noise(dur, vol, cutoff) {
    if (!this.ctx) return;
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
    filter.frequency.value = cutoff || 1200;
    const gain = this.ctx.createGain();
    gain.gain.value = vol || 0.3;
    source.connect(filter).connect(gain).connect(this.ctx.destination);
    source.start(t0);
  },

  play(name) {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;

    switch (name) {
      case 'tap':
        this.tone(600, 0.06, 'sine', 0.12);
        break;
      case 'select':
        this.tone(520, 0.1, 'triangle', 0.14, 0, 780);
        break;
      case 'growl':
        this.tone(160, 0.34, 'sawtooth', 0.1, 0, 120);
        this.tone(210, 0.3, 'triangle', 0.08, 0.05, 150);
        break;
      case 'scythe':
        this.tone(880, 0.08, 'triangle', 0.14, 0, 1320);
        this.tone(1180, 0.07, 'triangle', 0.1, 0.06, 900);
        break;
      case 'chomp':
        this.tone(220, 0.14, 'sawtooth', 0.14, 0, 120);
        this.noise(0.1, 0.12, 700);
        break;
      case 'bonk':
        this.tone(180, 0.16, 'sine', 0.2, 0, 110);
        this.tone(300, 0.08, 'triangle', 0.1, 0.02, 200);
        break;
      case 'boing':
        this.tone(320, 0.2, 'sine', 0.14, 0, 760);
        this.tone(760, 0.14, 'sine', 0.08, 0.15, 420);
        break;
      case 'trunk':
        this.tone(240, 0.26, 'triangle', 0.14, 0, 150);
        this.noise(0.14, 0.1, 600);
        break;
      case 'pop':
        this.tone(460, 0.1, 'sine', 0.16, 0, 880);
        break;
      case 'poof':
        this.tone(140, 0.18, 'sine', 0.22, 0, 80);
        this.noise(0.12, 0.1, 800);
        break;
      case 'laugh':
        this.tone(720, 0.07, 'sine', 0.1, 0);
        this.tone(900, 0.07, 'sine', 0.1, 0.08);
        this.tone(1080, 0.07, 'sine', 0.09, 0.16);
        break;
      case 'highfive':
        this.noise(0.06, 0.16, 1800);
        this.tone(660, 0.1, 'triangle', 0.14, 0.01, 990);
        break;
      case 'win':
        [523, 659, 784, 1046].forEach((f, i) => {
          this.tone(f, 0.2, 'triangle', 0.13, i * 0.12);
        });
        this.noise(0.28, 0.08, 3000);
        break;
      default:
        break;
    }
  },
};
