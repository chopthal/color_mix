/**
 * 세차 및 정비소 미니게임 매니저 (Wash & Maintenance)
 */
class WashManager {
  constructor() {
    this.vehicle = null;
    this.currentSubStep = 'soap'; // 'soap' ➔ 'rinse' ➔ 'air' ➔ 'done'
    this.soapProgress = 0;
    this.rinseProgress = 0;
    this.airProgress = 0;
  }

  startWash(vehicle) {
    this.vehicle = vehicle;
    this.currentSubStep = 'soap';
    this.soapProgress = 0;
    this.rinseProgress = 0;
    this.airProgress = 0;

    window.app.switchScreen('wash');
    this.renderWashScreen();
    window.soundManager.speak('차에 묻은 흙과 그을음을 깨끗하게 세차하고 정비해볼까요? 거품 솔로 문질러주세요!');
  }

  renderWashScreen() {
    const washScreen = document.getElementById('washScreen');
    if (!washScreen || !this.vehicle) return;

    let toolGuide = '';
    if (this.currentSubStep === 'soap') {
      toolGuide = '🧼 1단계: 거품 솔을 콕콕 눌러 차를 문질러요!';
    } else if (this.currentSubStep === 'rinse') {
      toolGuide = '🚿 2단계: 물총으로 거품을 시원하게 씻어내요!';
    } else if (this.currentSubStep === 'air') {
      toolGuide = '💨 3단계: 타이어 펌프를 눌러 공기를 퐁퐁 넣어요!';
    } else {
      toolGuide = '✨ 세차 완료! 차가 반짝반짝 빛나요!';
    }

    washScreen.innerHTML = `
      <div class="wash-header">
        <h2 class="wash-title">🧽 신나는 반짝반짝 정비소</h2>
        <div class="wash-guide-pill">${toolGuide}</div>
      </div>

      <div class="wash-bay-scene">
        <!-- 세차장 배경 및 차량 렌더 -->
        <div class="wash-car-platform" id="washCarPlatform">
          <div class="wash-vehicle-wrapper" id="washVehicleWrap">
            ${VehicleRenderer.renderSVG(this.vehicle, { width: 340, height: 210 })}
          </div>

          <!-- 진흙/거품 오버레이 레이어 -->
          <div class="dirt-overlay ${this.getDirtOverlayClass()}" id="dirtOverlay">
            <div class="dirt-spot spot-1">🟤</div>
            <div class="dirt-spot spot-2">⚫</div>
            <div class="dirt-spot spot-3">🟤</div>
            <div class="dirt-spot spot-4">⚫</div>
          </div>

          <!-- 비누거품 파티클 레이어 -->
          <div class="soap-bubble-layer" id="soapLayer">
            ${this.renderBubblesHTML()}
          </div>
        </div>

        <!-- 하단 도구 조작 툴바 -->
        <div class="wash-toolbox" id="washToolbox">
          ${this.renderToolboxHTML()}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  getDirtOverlayClass() {
    if (this.currentSubStep === 'soap') return 'dirt-visible';
    if (this.currentSubStep === 'rinse') return 'dirt-fading';
    return 'dirt-clean';
  }

  renderBubblesHTML() {
    if (this.soapProgress === 0) return '';
    let bubbles = '';
    for (let i = 0; i < this.soapProgress; i++) {
      const x = 20 + (i * 18) % 65;
      const y = 25 + (i * 12) % 45;
      bubbles += `<span class="soap-bubble" style="left:${x}%; top:${y}%;">🫧</span>`;
    }
    return bubbles;
  }

  renderToolboxHTML() {
    if (this.currentSubStep === 'soap') {
      return `
        <button class="wash-tool-btn btn-soap" id="btnApplySoap">
          <span class="tool-emoji">🧼</span>
          <span class="tool-name">비누거품 문지르기 (${this.soapProgress}/5)</span>
        </button>
      `;
    }
    if (this.currentSubStep === 'rinse') {
      return `
        <button class="wash-tool-btn btn-shower" id="btnApplyRinse">
          <span class="tool-emoji">🚿</span>
          <span class="tool-name">물 뿌려 씻어내기 (${this.rinseProgress}/4)</span>
        </button>
      `;
    }
    if (this.currentSubStep === 'air') {
      return `
        <button class="wash-tool-btn btn-pump" id="btnApplyAir">
          <span class="tool-emoji">💨</span>
          <span class="tool-name">타이어 바람 넣기 (${this.airProgress}/3)</span>
        </button>
      `;
    }
    return `
      <button class="wash-tool-btn btn-complete-garage" id="btnFinishWash">
        <span class="tool-emoji">🏁</span>
        <span class="tool-name">차고지로 돌아가기!</span>
      </button>
    `;
  }

  bindEvents() {
    const platform = document.getElementById('washCarPlatform');

    // 1단계: 비누 문지르기
    const btnSoap = document.getElementById('btnApplySoap');
    if (btnSoap) {
      const applySoap = () => {
        this.soapProgress++;
        window.soundManager.playSoapBubble();
        if (this.soapProgress >= 5) {
          this.currentSubStep = 'rinse';
          window.soundManager.speak('비누 거품이 뽀글뽀글! 이제 시원한 물로 씻어내볼까요?');
        }
        this.renderWashScreen();
      };
      btnSoap.addEventListener('click', applySoap);
      platform?.addEventListener('click', applySoap);
    }

    // 2단계: 물 샤워
    const btnRinse = document.getElementById('btnApplyRinse');
    if (btnRinse) {
      const applyRinse = () => {
        this.rinseProgress++;
        window.soundManager.playWaterSpray();
        if (this.rinseProgress >= 4) {
          this.currentSubStep = 'air';
          window.soundManager.speak('우와! 차가 깨끗해졌어요! 마지막으로 타이어에 공기를 채워주세요!');
        }
        this.renderWashScreen();
      };
      btnRinse.addEventListener('click', applyRinse);
      platform?.addEventListener('click', applyRinse);
    }

    // 3단계: 공기 주입
    const btnAir = document.getElementById('btnApplyAir');
    if (btnAir) {
      const applyAir = () => {
        this.airProgress++;
        window.soundManager.playAirPump();
        if (this.airProgress >= 3) {
          this.currentSubStep = 'done';
          window.soundManager.playFanfare();
          window.soundManager.speak('반짝반짝 완벽하게 정비 완료! 차고지로 출발해요!');
        }
        this.renderWashScreen();
      };
      btnAir.addEventListener('click', applyAir);
      platform?.addEventListener('click', applyAir);
    }

    // 세차 완료 후 차고지 복귀
    const btnFinish = document.getElementById('btnFinishWash');
    if (btnFinish) {
      btnFinish.addEventListener('click', () => {
        window.soundManager.playPop();
        window.app.switchScreen('garage');
        // 차고지 복귀 시 언박싱 상자가 준비되어 있는지 자동 체크!
        window.garageManager.checkPendingUnboxing();
      });
    }
  }
}

window.washManager = new WashManager();
