/**
 * 브릭 차고 효과음 (Web Audio API)
 * 오디오는 첫 사용자 터치에서 활성화한다 (Safari 정책).
 */
const BrickSound = {
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
        this.tone(680, 0.06, 'sine', 0.16);
        break;
      case 'snap':
        this.tone(520, 0.06, 'square', 0.18);
        this.tone(880, 0.05, 'square', 0.12, 0.05);
        this.noise(0.05, 0.12, 3200);
        break;
      case 'pop':
        this.tone(420, 0.1, 'sine', 0.22, 0, 860);
        break;
      case 'fanfare':
        [523, 659, 784, 1046].forEach((f, i) => {
          this.tone(f, 0.16, 'triangle', 0.16, i * 0.11);
        });
        break;
      case 'siren':
        this.tone(720, 0.16, 'square', 0.12);
        this.tone(960, 0.16, 'square', 0.12, 0.18);
        this.tone(720, 0.16, 'square', 0.12, 0.36);
        this.tone(960, 0.16, 'square', 0.12, 0.54);
        break;
      case 'water':
        this.noise(0.24, 0.16, 2800);
        this.tone(900, 0.18, 'sine', 0.1, 0, 320);
        break;
      case 'pour':
        this.noise(0.3, 0.2, 700);
        this.tone(180, 0.24, 'triangle', 0.14, 0, 90);
        break;
      case 'smash':
        this.noise(0.45, 0.42, 1800);
        this.tone(140, 0.28, 'sawtooth', 0.18, 0, 55);
        break;
      case 'drive':
        this.tone(95, 0.5, 'sawtooth', 0.1, 0, 150);
        break;
      default:
        break;
    }
  },
};
