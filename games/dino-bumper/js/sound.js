/**
 * 쿵쿵! 공룡 범퍼섬 효과음 (Web Audio API)
 * 오디오는 첫 사용자 터치에서 활성화한다 (Safari 정책).
 */
const DB_SOUND = {
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
        this.tone(640, 0.06, 'sine', 0.14);
        break;
      case 'pop':
        this.tone(420, 0.1, 'sine', 0.2, 0, 860);
        break;
      case 'bump':
        this.tone(150, 0.14, 'sine', 0.3, 0, 80);
        this.tone(320, 0.08, 'triangle', 0.14, 0.01, 180);
        this.noise(0.08, 0.14, 900);
        break;
      case 'collect':
        this.tone(660, 0.08, 'sine', 0.16);
        this.tone(990, 0.1, 'sine', 0.14, 0.07);
        break;
      case 'golden':
        [523, 659, 784, 1046].forEach((f, i) => {
          this.tone(f, 0.18, 'triangle', 0.14, i * 0.08);
        });
        break;
      case 'win':
        [523, 659, 784, 1046, 1318].forEach((f, i) => {
          this.tone(f, 0.22, 'triangle', 0.16, i * 0.13);
        });
        this.noise(0.3, 0.1, 3000);
        break;
      default:
        break;
    }
  },
};
