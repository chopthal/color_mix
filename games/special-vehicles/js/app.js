/**
 * 애플리케이션 메인 컨트롤러 및 화면 라우팅
 */
class SpecialVehiclesApp {
  constructor() {
    this.currentScreen = 'garage'; // 'garage' | 'mission' | 'wash'
  }

  init() {
    // 최초 유저 터치 시 오디오 컨텍스트 언락
    const unlockAudio = () => {
      window.soundManager.initAudio();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    this.bindGlobalEvents();
    this.switchScreen('garage');
    window.garageManager.init();
  }

  bindGlobalEvents() {
    // 상단 출동 버튼
    document.getElementById('btnOpenDispatch')?.addEventListener('click', () => {
      window.soundManager.playPop();
      window.missionManager.openDispatchCenter();
    });

    // 음소거 토글
    const muteBtn = document.getElementById('btnToggleMute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        window.soundManager.isMuted = !window.soundManager.isMuted;
        muteBtn.textContent = window.soundManager.isMuted ? '🔇' : '🔊';
        window.soundManager.playPop();
      });
    }

    // 차량 꾸미기 모달 닫기
    document.getElementById('btnCloseInspect')?.addEventListener('click', () => {
      window.soundManager.playPop();
      window.garageManager.closeInspectModal();
    });

    // 스티커 지우기
    document.getElementById('btnClearStickers')?.addEventListener('click', () => {
      if (window.garageManager.selectedVehicle) {
        window.soundManager.playPop();
        window.storageManager.clearStickers(window.garageManager.selectedVehicle.id);
        window.garageManager.renderInspectVehicleCanvas();
        window.garageManager.renderVehiclesGrid();
      }
    });
  }

  switchScreen(screenName) {
    this.currentScreen = screenName;

    const garageView = document.getElementById('garageView');
    const missionView = document.getElementById('missionScreen');
    const washView = document.getElementById('washScreen');

    garageView?.classList.toggle('active', screenName === 'garage');
    missionView?.classList.toggle('active', screenName === 'mission');
    washView?.classList.toggle('active', screenName === 'wash');

    if (screenName === 'garage') {
      window.garageManager.renderVehiclesGrid();
    }
  }
}

window.app = new SpecialVehiclesApp();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
