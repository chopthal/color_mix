/**
 * LocalStorage 무결성 자동 저장 및 데이터 관리 매니저
 */
class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'kids_special_vehicles_v1';
    this.state = this.loadState();
  }

  getDefaultState() {
    return {
      unlockedVehicles: [...INITIAL_UNLOCKED_VEHICLES],
      missionCompletedCount: 0,
      stampsCount: 0,
      vehicleStats: {},     // { [vehicleId]: { missionCount: 0, stars: 0 } }
      vehicleStickers: {},  // { [vehicleId]: [ { stickerId, icon, x, y } ] }
      lastPlayedVehicleId: 'pump_fire',
      soundEnabled: true,
      pendingBoxReward: false, // 새 차량 언박싱 대기 여부
    };
  }

  loadState() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // 기본값과 머지하여 신규 필드 누락 방지
        const defaultState = this.getDefaultState();
        return {
          ...defaultState,
          ...parsed,
          unlockedVehicles: Array.from(new Set([...defaultState.unlockedVehicles, ...(parsed.unlockedVehicles || [])])),
        };
      }
    } catch (e) {
      console.warn('Failed to load saved state from localStorage:', e);
    }
    return this.getDefaultState();
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }

  isUnlocked(vehicleId) {
    return this.state.unlockedVehicles.includes(vehicleId);
  }

  unlockVehicle(vehicleId) {
    if (!this.state.unlockedVehicles.includes(vehicleId)) {
      this.state.unlockedVehicles.push(vehicleId);
      this.saveState();
      return true;
    }
    return false;
  }

  // 아직 안 열린 잠긴 차량 중 랜덤 1대 가져오기
  getNextLockedVehicle() {
    const locked = VEHICLES.filter(v => !this.isUnlocked(v.id));
    if (locked.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * locked.length);
    return locked[randomIndex];
  }

  // 출동 완료 기록 & 도장 추가
  recordMissionComplete(vehicleId) {
    this.state.missionCompletedCount++;
    this.state.stampsCount++;

    if (!this.state.vehicleStats[vehicleId]) {
      this.state.vehicleStats[vehicleId] = { missionCount: 0, stars: 0 };
    }
    this.state.vehicleStats[vehicleId].missionCount++;
    // 3회 출동마다 별 1개 추가 (최대 3개)
    const count = this.state.vehicleStats[vehicleId].missionCount;
    this.state.vehicleStats[vehicleId].stars = Math.min(3, Math.floor(count / 2) + 1);

    // 도장 1개 이상이고 아직 미해금 차량이 있으면 언박싱 상자 배달!
    if (this.getNextLockedVehicle()) {
      this.state.pendingBoxReward = true;
    }

    this.saveState();
  }

  // 차량에 스티커 추가
  addSticker(vehicleId, stickerData) {
    if (!this.state.vehicleStickers[vehicleId]) {
      this.state.vehicleStickers[vehicleId] = [];
    }
    this.state.vehicleStickers[vehicleId].push(stickerData);
    this.saveState();
  }

  // 차량 스티커 초기화
  clearStickers(vehicleId) {
    if (this.state.vehicleStickers[vehicleId]) {
      this.state.vehicleStickers[vehicleId] = [];
      this.saveState();
    }
  }

  getStickers(vehicleId) {
    return this.state.vehicleStickers[vehicleId] || [];
  }

  getVehicleStats(vehicleId) {
    return this.state.vehicleStats[vehicleId] || { missionCount: 0, stars: 0 };
  }
}

// 전역 싱글턴 인스턴스
window.storageManager = new StorageManager();
