/**
 * Web Audio API 효과음 합성 및 Web Speech API (TTS) 음성 지원 매니저
 */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.ttsAvailable = 'speechSynthesis' in window;
    this.selectedVoice = null;

    // TTS 보이스 로드
    if (this.ttsAvailable) {
      this.initVoices();
      window.speechSynthesis.onvoiceschanged = () => this.initVoices();
    }
  }

  initAudio() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  initVoices() {
    if (!this.ttsAvailable) return;
    const voices = window.speechSynthesis.getVoices();
    // 한국어 목소리 우선 선택 (여성/밝은 목소리 선호)
    this.selectedVoice = voices.find(v => v.lang.startsWith('ko') && (v.name.includes('Yuna') || v.name.includes('SunHi') || v.name.includes('Google') || v.name.includes('Korean')))
      || voices.find(v => v.lang.startsWith('ko'))
      || null;
  }

  speak(text) {
    if (this.isMuted || !this.ttsAvailable || !text) return;
    try {
      window.speechSynthesis.cancel(); // 이전 음성 중단
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ko-KR';
      utter.rate = 0.95; // 아이들에게 명확하게 들리도록 약간 여유 있는 속도
      utter.pitch = 1.2; // 밝고 친근한 톤
      if (this.selectedVoice) {
        utter.voice = this.selectedVoice;
      }
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('TTS playback error:', e);
    }
  }

  stopSpeech() {
    if (this.ttsAvailable) {
      window.speechSynthesis.cancel();
    }
  }

  // --- 합성 효과음 (Web Audio API) ---

  // 1. 소방 사이렌 (Wail / Yelp)
  playFireSiren() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.linearRampToValueAtTime(1050, now + 0.35);
    osc.frequency.linearRampToValueAtTime(650, now + 0.7);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.75);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.75);
  }

  // 2. 경찰 사이렌 (삐뽀삐뽀 Hi-Lo)
  playPoliceSiren() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(660, now + 0.25);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  // 3. 구급차 사이렌 (부드러운 화음 삐뽀)
  playAmbulanceSiren() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.setValueAtTime(920, now + 0.3);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  // 4. 자동차 경적 (빵빵!)
  playHorn() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [350, 440].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  // 5. 물 분사 소리 (슈우우우)
  playWaterSpray() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.4);
  }

  // 6. 거품 문지르기 뽀득뽀득
  playSoapBubble() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    const startF = 300 + Math.random() * 400;
    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.exponentialRampToValueAtTime(startF * 1.8, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 7. 타이어 공기 쉭쉭 / 펌프
  playAirPump() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 8. 쿵/바위 깨기/망치 소리
  playHammerSmash() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // 9. 크레인/사다리 징~ 윈치 소리
  playMechanicalWhir() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(260, now + 0.3);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // 10. 성공 팡파레 / 반짝 미션 완료
  playFanfare() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.18, start);
      gain.gain.linearRampToValueAtTime(0.01, start + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.45);
    });
  }

  // 11. 스티커 톡 / 버튼 탭
  playPop() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // 차량 사운드 타입별 매핑 재생
  playVehicleSound(soundType) {
    switch (soundType) {
      case 'siren_fire':
        this.playFireSiren();
        break;
      case 'siren_police':
        this.playPoliceSiren();
        break;
      case 'siren_medic':
        this.playAmbulanceSiren();
        break;
      case 'crane_whir':
      case 'drum_spin':
      case 'pump_flow':
        this.playMechanicalWhir();
        break;
      case 'water_splash':
        this.playWaterSpray();
        break;
      case 'drill_sound':
      case 'hammer':
        this.playHammerSmash();
        break;
      default:
        this.playHorn();
    }
  }
}

// 전역 싱글턴 인스턴스
window.soundManager = new SoundManager();
