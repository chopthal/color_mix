/**
 * 뾰로롱! 변신 숨바꼭질 — 효과음 (Web Audio API)
 * 오디오는 첫 사용자 터치에서 활성화한다 (Safari 정책).
 */
const TH_SOUND = {
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
        this.tone(620, 0.06, 'sine', 0.13);
        break;
      case 'pop':
        this.tone(420, 0.1, 'sine', 0.18, 0, 820);
        break;
      case 'poof':
        this.tone(300, 0.16, 'sine', 0.16, 0, 900);
        this.tone(700, 0.14, 'triangle', 0.12, 0.06, 1200);
        this.noise(0.12, 0.1, 1800);
        break;
      case 'giggle':
        this.tone(880, 0.07, 'sine', 0.14);
        this.tone(1046, 0.09, 'sine', 0.12, 0.08);
        break;
      case 'giveup':
        this.tone(600, 0.14, 'triangle', 0.14, 0, 420);
        this.tone(420, 0.18, 'triangle', 0.12, 0.14, 260);
        break;
      case 'clue':
        this.tone(880, 0.08, 'sine', 0.12);
        this.tone(1320, 0.1, 'sine', 0.1, 0.08);
        break;
      case 'wrong':
        this.tone(320, 0.12, 'sine', 0.14, 0, 200);
        break;
      case 'found':
        [523, 659, 784, 1046].forEach((f, i) => {
          this.tone(f, 0.16, 'triangle', 0.14, i * 0.09);
        });
        this.noise(0.18, 0.08, 3200);
        break;
      case 'win':
        [523, 659, 784, 1046, 1318].forEach((f, i) => {
          this.tone(f, 0.22, 'triangle', 0.15, i * 0.13);
        });
        this.noise(0.3, 0.1, 3000);
        break;
      default:
        break;
    }
  },
};
