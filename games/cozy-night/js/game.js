/**
 * 포근포근 밤밤 (Cozy Night)
 * 만 3~5세를 위한 수면 루틴 및 감정 진정 인터랙티브 게임
 */

(function () {
  'use strict';

  // --- 1. 오디오 합성 엔진 (Web Audio API) ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isSoundEnabled = true;
      this.isMusicEnabled = false;
      this.musicTimer = null;
      this.musicStep = 0;

      // 반짝반짝 작은별 (Twinkle Twinkle Little Star) 멜로디 음계 (Hz)
      const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23,
            G4 = 392.00, A4 = 440.00, B4 = 493.88, C5 = 523.25;

      this.lullabyNotes = [
        C4, C4, G4, G4, A4, A4, G4, null,
        F4, F4, E4, E4, D4, D4, C4, null,
        G4, G4, F4, F4, E4, E4, D4, null,
        G4, G4, F4, F4, E4, E4, D4, null,
        C4, C4, G4, G4, A4, A4, G4, null,
        F4, F4, E4, E4, D4, D4, C4, null
      ];

      // 별 펜타토닉 음계 (C5, D5, E5, G5)
      this.starPitches = [523.25, 587.33, 659.25, 783.99];
    }

    ensureContext() {
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

    // 맑고 몽환적인 오르골(Music Box) 단음 재생
    playMusicBoxTone(freq, duration = 1.2, volume = 0.28) {
      if (!this.isSoundEnabled || !freq) return;
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 기본 사인파 (기음)
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // 은은한 배음 (삼각파로 맑은 종소리 느낌 추가)
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now);

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, now);
      // 부드러운 어택
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.008);
      // 자연스러운 오르골 릴리즈 감쇄
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const gain2 = this.ctx.createGain();
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

    // 토닥토닥 포근한 사운드 ("퐁~")
    playPatChime(step = 0) {
      if (!this.isSoundEnabled) return;
      const baseFreqs = [329.63, 392.00, 440.00, 523.25, 659.25, 783.99];
      const freq = baseFreqs[step % baseFreqs.length];
      this.playMusicBoxTone(freq, 1.4, 0.32);
    }

    // 별 탭 맑은 차임
    playStarChime(index) {
      if (!this.isSoundEnabled) return;
      const freq = this.starPitches[index % this.starPitches.length];
      this.playMusicBoxTone(freq, 1.0, 0.25);
    }

    // 달님 터치 아르페지오
    playMoonTwinkle() {
      if (!this.isSoundEnabled) return;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        setTimeout(() => {
          this.playMusicBoxTone(freq, 1.3, 0.22);
        }, idx * 140);
      });
    }

    // 이불 스르륵 사운드
    playBlanketSound() {
      if (!this.isSoundEnabled) return;
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

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

    // 스위치 찰칵
    playSwitchSound() {
      if (!this.isSoundEnabled) return;
      this.playMusicBoxTone(440, 0.2, 0.15);
    }

    // 오르골 자장가 연속 재생 토글
    toggleLullaby() {
      this.ensureContext();
      this.isMusicEnabled = !this.isMusicEnabled;

      if (this.isMusicEnabled) {
        this.startLullaby();
      } else {
        this.stopLullaby();
      }
      return this.isMusicEnabled;
    }

    startLullaby() {
      this.stopLullaby();
      const playStep = () => {
        const note = this.lullabyNotes[this.musicStep];
        if (note) {
          this.playMusicBoxTone(note, 1.6, 0.22);
        }
        this.musicStep = (this.musicStep + 1) % this.lullabyNotes.length;
        this.musicTimer = setTimeout(playStep, 720);
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

  // --- 2. 게임 상태 관리 & 동물 그래픽 ---
  const sound = new SoundEngine();

  const state = {
    currentAnimal: 'bear', // bear | rabbit | cat
    sleepLevel: 0,         // 0 ~ 5 (5 = 깊은 잠)
    isLightsOff: false,
    blanketState: 'tucked', // tucked | lowered
    blanketPattern: 'yellow', // yellow | pink | blue
    isEndingOpen: false,
    isDreamland: false
  };

  // DOM 캐싱
  const nightRoom = document.getElementById('nightRoom');
  const btnMusic = document.getElementById('btnMusic');
  const btnSound = document.getElementById('btnSound');
  const moonBtn = document.getElementById('moonBtn');
  const starButtons = document.querySelectorAll('.star-btn');
  const lampSwitch = document.getElementById('lampSwitch');
  const gaugeStars = document.querySelectorAll('.gauge-star');
  const animalStage = document.getElementById('animalStage');
  const animalSvg = document.getElementById('animalSvg');
  const tapHint = document.getElementById('tapHint');
  const bubbleLayer = document.getElementById('bubbleLayer');
  const blanket = document.getElementById('blanket');
  const animalSelectors = document.querySelectorAll('.btn-animal');
  const btnBlanketPattern = document.getElementById('btnBlanketPattern');
  const btnBedtime = document.getElementById('btnBedtime');
  const bedtimeOverlay = document.getElementById('bedtimeOverlay');
  const previewIcon = document.getElementById('previewIcon');
  const btnReplay = document.getElementById('btnReplay');
  const btnNightMode = document.getElementById('btnNightMode');
  const dreamlandScreen = document.getElementById('dreamlandScreen');
  const btnWakeUp = document.getElementById('btnWakeUp');

  // --- 3. 동물 SVG 동적 렌더링 ---
  const animalData = {
    bear: {
      name: '포근 곰돌이',
      icon: '🐻💤',
      render: function (sleepiness) {
        // 눈 모양 결정 (눈뜸 -> 졸림 -> 감음)
        let eyeSvg = '';
        if (sleepiness < 2) {
          // 말똥말똥
          eyeSvg = `
            <circle cx="95" cy="115" r="7" fill="#2d3436"/>
            <circle cx="93" cy="112" r="2.5" fill="#ffffff"/>
            <circle cx="145" cy="115" r="7" fill="#2d3436"/>
            <circle cx="143" cy="112" r="2.5" fill="#ffffff"/>
          `;
        } else if (sleepiness < 4) {
          // 스르륵 졸림 (반달눈)
          eyeSvg = `
            <path d="M 88 116 Q 95 124 102 116" stroke="#2d3436" stroke-width="4.5" stroke-linecap="round" fill="none"/>
            <path d="M 138 116 Q 145 124 152 116" stroke="#2d3436" stroke-width="4.5" stroke-linecap="round" fill="none"/>
          `;
        } else {
          // 포근하게 코~ 감은 눈 (ᴗ ᴗ)
          eyeSvg = `
            <path d="M 87 118 Q 95 126 103 118" stroke="#2d3436" stroke-width="5" stroke-linecap="round" fill="none"/>
            <path d="M 137 118 Q 145 126 153 118" stroke="#2d3436" stroke-width="5" stroke-linecap="round" fill="none"/>
          `;
        }

        return `
          <g id="bearGroup">
            <!-- 둥근 귀 -->
            <circle cx="65" cy="80" r="28" fill="#a07255" stroke="#795548" stroke-width="4"/>
            <circle cx="65" cy="80" r="16" fill="#f8c291"/>
            <circle cx="175" cy="80" r="28" fill="#a07255" stroke="#795548" stroke-width="4"/>
            <circle cx="175" cy="80" r="16" fill="#f8c291"/>

            <!-- 통통한 얼굴 -->
            <ellipse cx="120" cy="130" rx="68" ry="62" fill="#b08364" stroke="#795548" stroke-width="4"/>

            <!-- 볼터치 -->
            <circle cx="78" cy="136" r="12" fill="#ff7675" opacity="0.45"/>
            <circle cx="162" cy="136" r="12" fill="#ff7675" opacity="0.45"/>

            <!-- 주둥이 구역 -->
            <ellipse cx="120" cy="138" rx="28" ry="22" fill="#ffeaa7"/>

            <!-- 귀여운 코와 입 -->
            <path d="M 112 130 Q 120 126 128 130 Q 120 138 112 130 Z" fill="#2d3436"/>
            <path d="M 120 135 L 120 144" stroke="#2d3436" stroke-width="3" stroke-linecap="round"/>
            <path d="M 113 144 Q 120 150 127 144" stroke="#2d3436" stroke-width="3" stroke-linecap="round" fill="none"/>

            <!-- 눈 -->
            ${eyeSvg}
          </g>
        `;
      }
    },

    rabbit: {
      name: '잠꾸러기 토끼',
      icon: '🐰💤',
      render: function (sleepiness) {
        let eyeSvg = '';
        if (sleepiness < 2) {
          eyeSvg = `
            <circle cx="95" cy="120" r="6.5" fill="#2d3436"/>
            <circle cx="93" cy="117" r="2.2" fill="#ffffff"/>
            <circle cx="145" cy="120" r="6.5" fill="#2d3436"/>
            <circle cx="143" cy="117" r="2.2" fill="#ffffff"/>
          `;
        } else if (sleepiness < 4) {
          eyeSvg = `
            <path d="M 88 121 Q 95 128 102 121" stroke="#2d3436" stroke-width="4" stroke-linecap="round" fill="none"/>
            <path d="M 138 121 Q 145 128 152 121" stroke="#2d3436" stroke-width="4" stroke-linecap="round" fill="none"/>
          `;
        } else {
          eyeSvg = `
            <path d="M 87 122 Q 95 129 103 122" stroke="#2d3436" stroke-width="4.5" stroke-linecap="round" fill="none"/>
            <path d="M 137 122 Q 145 129 153 122" stroke="#2d3436" stroke-width="4.5" stroke-linecap="round" fill="none"/>
          `;
        }

        return `
          <g id="rabbitGroup">
            <!-- 길쭉하고 포근한 토끼 귀 -->
            <ellipse cx="80" cy="55" rx="16" ry="50" fill="#f5f6fa" stroke="#dcdde1" stroke-width="3.5" transform="rotate(-10 80 55)"/>
            <ellipse cx="80" cy="55" rx="9" ry="36" fill="#ffb8b8" transform="rotate(-10 80 55)"/>

            <ellipse cx="160" cy="55" rx="16" ry="50" fill="#f5f6fa" stroke="#dcdde1" stroke-width="3.5" transform="rotate(10 160 55)"/>
            <ellipse cx="160" cy="55" rx="9" ry="36" fill="#ffb8b8" transform="rotate(10 160 55)"/>

            <!-- 토끼 얼굴 -->
            <ellipse cx="120" cy="132" rx="64" ry="58" fill="#ffffff" stroke="#dcdde1" stroke-width="3.5"/>

            <!-- 볼터치 -->
            <circle cx="78" cy="138" r="13" fill="#ffb8b8" opacity="0.6"/>
            <circle cx="162" cy="138" r="13" fill="#ffb8b8" opacity="0.6"/>

            <!-- 작은 분홍 코 & 입 -->
            <ellipse cx="120" cy="132" rx="6" ry="5" fill="#ff7675"/>
            <path d="M 120 137 L 120 143" stroke="#2d3436" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M 114 143 Q 120 148 126 143" stroke="#2d3436" stroke-width="2.5" stroke-linecap="round" fill="none"/>

            <!-- 눈 -->
            ${eyeSvg}
          </g>
        `;
      }
    },

    cat: {
      name: '골골 아기 고양이',
      icon: '🐱💤',
      render: function (sleepiness) {
        let eyeSvg = '';
        if (sleepiness < 2) {
          eyeSvg = `
            <circle cx="95" cy="120" r="7" fill="#00b894"/>
            <circle cx="95" cy="120" r="4.5" fill="#2d3436"/>
            <circle cx="93" cy="117" r="2" fill="#ffffff"/>

            <circle cx="145" cy="120" r="7" fill="#00b894"/>
            <circle cx="145" cy="120" r="4.5" fill="#2d3436"/>
            <circle cx="143" cy="117" r="2" fill="#ffffff"/>
          `;
        } else if (sleepiness < 4) {
          eyeSvg = `
            <path d="M 88 121 Q 95 128 102 121" stroke="#2d3436" stroke-width="4.5" stroke-linecap="round" fill="none"/>
            <path d="M 138 121 Q 145 128 152 121" stroke="#2d3436" stroke-width="4.5" stroke-linecap="round" fill="none"/>
          `;
        } else {
          eyeSvg = `
            <path d="M 87 122 Q 95 129 103 122" stroke="#2d3436" stroke-width="5" stroke-linecap="round" fill="none"/>
            <path d="M 137 122 Q 145 129 153 122" stroke="#2d3436" stroke-width="5" stroke-linecap="round" fill="none"/>
          `;
        }

        return `
          <g id="catGroup">
            <!-- 뾰족한 고양이 귀 -->
            <polygon points="62,110 50,55 95,85" fill="#fab1a0" stroke="#e17055" stroke-width="3.5"/>
            <polygon points="65,102 56,66 90,87" fill="#ff7675"/>

            <polygon points="178,110 190,55 145,85" fill="#fab1a0" stroke="#e17055" stroke-width="3.5"/>
            <polygon points="175,102 184,66 150,87" fill="#ff7675"/>

            <!-- 치즈 태비 고양이 얼굴 -->
            <ellipse cx="120" cy="132" rx="66" ry="56" fill="#ffeaa7" stroke="#e17055" stroke-width="3.5"/>

            <!-- 이마 무늬 -->
            <path d="M 112 85 L 120 95 L 128 85" stroke="#e17055" stroke-width="3.5" fill="none" stroke-linecap="round"/>
            <path d="M 115 95 L 120 102 L 125 95" stroke="#e17055" stroke-width="3" fill="none" stroke-linecap="round"/>

            <!-- 볼터치 -->
            <circle cx="76" cy="138" r="12" fill="#ff7675" opacity="0.5"/>
            <circle cx="164" cy="138" r="12" fill="#ff7675" opacity="0.5"/>

            <!-- 수염 -->
            <line x1="60" y1="135" x2="40" y2="132" stroke="#636e72" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="60" y1="142" x2="42" y2="145" stroke="#636e72" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="180" y1="135" x2="200" y2="132" stroke="#636e72" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="180" y1="142" x2="198" y2="145" stroke="#636e72" stroke-width="2.5" stroke-linecap="round"/>

            <!-- 작은 삼각 코 & 입 -->
            <polygon points="115,133 125,133 120,138" fill="#ff7675"/>
            <path d="M 120 138 L 120 143" stroke="#2d3436" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M 114 143 Q 120 148 126 143" stroke="#2d3436" stroke-width="2.5" stroke-linecap="round" fill="none"/>

            <!-- 눈 -->
            ${eyeSvg}
          </g>
        `;
      }
    }
  };

  // --- 4. 화면 업데이트 헬퍼 ---
  function updateAnimalSvg() {
    const current = animalData[state.currentAnimal];
    if (current && animalSvg) {
      animalSvg.innerHTML = current.render(state.sleepLevel);
    }
  }

  function updateSleepGauge() {
    gaugeStars.forEach((star, idx) => {
      if (idx < state.sleepLevel) {
        star.classList.add('is-earned');
      } else {
        star.classList.remove('is-earned');
      }
    });
  }

  function updateBlanketUI() {
    blanket.classList.remove('is-tucked', 'is-lowered');
    if (state.blanketState === 'tucked') {
      blanket.classList.add('is-tucked');
    } else {
      blanket.classList.add('is-lowered');
    }

    blanket.classList.remove('pattern-yellow', 'pattern-pink', 'pattern-blue');
    blanket.classList.add('pattern-' + state.blanketPattern);
  }

  // 부유 파티클 (하트, 별, Zzz)
  function spawnParticle(text, x, y) {
    if (!bubbleLayer) return;
    const p = document.createElement('div');
    p.className = 'pat-particle';
    p.textContent = text;

    const rect = animalStage.getBoundingClientRect();
    const posX = x ? (x - rect.left) : (rect.width * 0.5 + (Math.random() * 40 - 20));
    const posY = y ? (y - rect.top) : (rect.height * 0.4 + (Math.random() * 30 - 15));

    p.style.left = posX + 'px';
    p.style.top = posY + 'px';
    p.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px');

    bubbleLayer.appendChild(p);

    setTimeout(() => {
      if (p.parentNode) {
        p.parentNode.removeChild(p);
      }
    }, 1600);
  }

  // 주기적 Zzz 숨쉬기 연출 (잠들었을 때)
  let sleepZzzTimer = null;
  function startSleepZzz() {
    stopSleepZzz();
    sleepZzzTimer = setInterval(() => {
      if (state.sleepLevel >= 4 && !state.isEndingOpen) {
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

  // --- 5. 인터랙션 이벤트 바인딩 ---

  // 동물 토닥토닥 재우기
  function handlePat(e) {
    if (tapHint) {
      tapHint.style.display = 'none';
    }

    let clientX = null, clientY = null;
    if (e.clientX && e.clientY) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    // 소리 재생
    sound.playPatChime(state.sleepLevel);

    // 파티클 생성
    const icons = ['✨', '💖', '⭐', '💤', '🌸'];
    const pick = icons[state.sleepLevel % icons.length];
    spawnParticle(pick, clientX, clientY);

    // 수면도 상승
    if (state.sleepLevel < 5) {
      state.sleepLevel += 1;
      updateSleepGauge();
      updateAnimalSvg();

      // 5단계 도달 시
      if (state.sleepLevel >= 5) {
        startSleepZzz();
        setTimeout(() => {
          showBedtimeOverlay();
        }, 1300);
      }
    } else {
      // 이미 5단계면 Zzz 연속 퐁퐁
      spawnParticle('💤', clientX, clientY);
    }
  }

  animalStage.addEventListener('pointerdown', (e) => {
    handlePat(e);
  });

  // 이불 토글: 접힘·아랫단 히트만 수신(몸통은 CSS로 animalStage에 통과 → 토닥)
  blanket.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    sound.playBlanketSound();
    state.blanketState = (state.blanketState === 'tucked') ? 'lowered' : 'tucked';
    updateBlanketUI();
    spawnParticle('🛌', null, null);
  });

  // 이불 무늬 변경 버튼
  btnBlanketPattern.addEventListener('click', () => {
    sound.playMusicBoxTone(659.25, 0.4, 0.2);
    const patterns = ['yellow', 'pink', 'blue'];
    const curIdx = patterns.indexOf(state.blanketPattern);
    state.blanketPattern = patterns[(curIdx + 1) % patterns.length];
    updateBlanketUI();
  });

  // 별 켜기 인터랙션
  starButtons.forEach((starBtn, idx) => {
    starBtn.addEventListener('click', () => {
      sound.playStarChime(idx);
      starBtn.classList.toggle('is-lit');
      spawnParticle('⭐', null, null);
    });
  });

  // 달님 터치 인터랙션
  moonBtn.addEventListener('click', () => {
    sound.playMoonTwinkle();
    spawnParticle('🌙', null, null);
  });

  // 조명 스위치 버튼
  lampSwitch.addEventListener('click', () => {
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

  // 동물 친구 선택 라디오 버튼
  animalSelectors.forEach((btn) => {
    btn.addEventListener('click', () => {
      sound.playMusicBoxTone(523.25, 0.5, 0.25);
      const chosen = btn.getAttribute('data-animal');
      if (chosen && chosen !== state.currentAnimal) {
        state.currentAnimal = chosen;
        state.sleepLevel = 0; // 새 친구는 잠들지 않은 상태에서 시작
        stopSleepZzz();

        animalSelectors.forEach(b => {
          b.classList.remove('is-active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-checked', 'true');

        updateSleepGauge();
        updateAnimalSvg();
      }
    });
  });

  // 상단 오르골 토글
  btnMusic.addEventListener('click', () => {
    const isPlaying = sound.toggleLullaby();
    if (isPlaying) {
      btnMusic.classList.add('is-playing');
    } else {
      btnMusic.classList.remove('is-playing');
    }
  });

  // 상단 사운드 음소거 토글
  btnSound.addEventListener('click', () => {
    sound.ensureContext();
    sound.isSoundEnabled = !sound.isSoundEnabled;
    btnSound.textContent = sound.isSoundEnabled ? '🔊' : '🔇';
  });

  // 코 잘 시간이야 버튼 (취침 엔딩 바로 열기)
  btnBedtime.addEventListener('click', () => {
    sound.playMusicBoxTone(440, 0.8, 0.25);
    state.sleepLevel = 5;
    updateSleepGauge();
    updateAnimalSvg();
    showBedtimeOverlay();
  });

  // 엔딩 오버레이 열기
  function showBedtimeOverlay() {
    state.isEndingOpen = true;
    const cur = animalData[state.currentAnimal];
    if (previewIcon) {
      previewIcon.textContent = cur ? cur.icon : '🐻💤';
    }
    bedtimeOverlay.classList.add('is-open');
    bedtimeOverlay.setAttribute('aria-hidden', 'false');
  }

  // 다시 토닥이기 버튼
  btnReplay.addEventListener('click', () => {
    sound.playMusicBoxTone(587.33, 0.5, 0.2);
    bedtimeOverlay.classList.remove('is-open');
    bedtimeOverlay.setAttribute('aria-hidden', 'true');
    state.isEndingOpen = false;
    state.sleepLevel = 0;
    updateSleepGauge();
    updateAnimalSvg();
    stopSleepZzz();
  });

  // 꿈나라 화면 켜기 (초저자극 모드)
  btnNightMode.addEventListener('click', () => {
    bedtimeOverlay.classList.remove('is-open');
    bedtimeOverlay.setAttribute('aria-hidden', 'true');
    dreamlandScreen.classList.add('is-active');
    dreamlandScreen.setAttribute('aria-hidden', 'false');
    state.isDreamland = true;

    // 은은하게 오르골 자장가 자동 재생
    if (!sound.isMusicEnabled) {
      sound.toggleLullaby();
      btnMusic.classList.add('is-playing');
    }
  });

  // 꿈나라 화면 깨우기
  btnWakeUp.addEventListener('click', () => {
    dreamlandScreen.classList.remove('is-active');
    dreamlandScreen.setAttribute('aria-hidden', 'true');
    state.isDreamland = false;
  });

  // --- 6. 초기화 ---
  function init() {
    updateAnimalSvg();
    updateSleepGauge();
    updateBlanketUI();
  }

  init();

})();
