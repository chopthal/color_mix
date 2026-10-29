/**
 * 대형 차고지 (도감 및 스티커 꾸미기, 서프라이즈 언박싱)
 */
class GarageManager {
  constructor() {
    this.currentCategory = 'all';
    this.selectedVehicle = null;
    this.activeSticker = null;
  }

  init() {
    this.renderCategoryTabs();
    this.renderVehiclesGrid();
    this.checkPendingUnboxing();
  }

  // 6개 본부 탭 렌더링
  renderCategoryTabs() {
    const tabsContainer = document.getElementById('hqTabs');
    if (!tabsContainer) return;

    let html = `
      <button class="hq-tab ${this.currentCategory === 'all' ? 'active' : ''}" data-cat="all">
        <span class="tab-icon">🌟</span>
        <span class="tab-name">전체보기</span>
      </button>
    `;

    HEADQUARTERS.forEach(hq => {
      const isActive = this.currentCategory === hq.id;
      html += `
        <button class="hq-tab ${isActive ? 'active' : ''}" data-cat="${hq.id}">
          <span class="tab-icon">${hq.icon}</span>
          <span class="tab-name">${hq.name}</span>
        </button>
      `;
    });

    tabsContainer.innerHTML = html;

    // 탭 클릭 이벤트
    tabsContainer.querySelectorAll('.hq-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        window.soundManager.playPop();
        this.currentCategory = tab.dataset.cat;
        this.renderCategoryTabs();
        this.renderVehiclesGrid();
      });
    });
  }

  // 차고지 차량 카드 목록 렌더링
  renderVehiclesGrid() {
    const grid = document.getElementById('garageGrid');
    if (!grid) return;

    const filtered = this.currentCategory === 'all'
      ? VEHICLES
      : VEHICLES.filter(v => v.category === this.currentCategory);

    let html = '';
    filtered.forEach(v => {
      const isUnlocked = window.storageManager.isUnlocked(v.id);
      const stats = window.storageManager.getVehicleStats(v.id);
      const stickers = window.storageManager.getStickers(v.id);

      if (isUnlocked) {
        html += `
          <div class="vehicle-card unlocked" data-id="${v.id}">
            <div class="card-badge-row">
              <span class="hq-mini-tag">${v.icon} ${v.name}</span>
              ${stats.stars > 0 ? `<span class="star-badge">${'⭐'.repeat(stats.stars)}</span>` : ''}
            </div>
            <div class="vehicle-preview-wrap">
              ${VehicleRenderer.renderSVG(v, { width: 180, height: 110 })}
              <!-- 부착된 스티커들 -->
              <div class="stickers-layer">
                ${stickers.map(s => `<span class="placed-sticker" style="left:${s.x}%; top:${s.y}%;">${s.icon}</span>`).join('')}
              </div>
            </div>
            <div class="card-action-bar">
              <button class="btn-voice-talk" data-id="${v.id}" title="소리 듣기">🔊 이름 듣기</button>
              <button class="btn-inspect" data-id="${v.id}">꾸미기 🎨</button>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="vehicle-card locked" data-id="${v.id}">
            <div class="lock-overlay">
              <span class="lock-icon">🔒</span>
              <span class="lock-text">출동하고 잠금 해제!</span>
            </div>
            <div class="vehicle-preview-wrap locked-silhouette">
              ${VehicleRenderer.renderSVG(v, { width: 180, height: 110, sirenActive: false })}
            </div>
            <div class="card-title-locked">??? 특수차량</div>
          </div>
        `;
      }
    });

    grid.innerHTML = html;

    // 카드 및 버튼 이벤트 바인딩
    grid.querySelectorAll('.vehicle-card.unlocked').forEach(card => {
      const vehicleId = card.dataset.id;
      const vehicle = VEHICLES.find(v => v.id === vehicleId);

      // 음성 듣기 버튼
      card.querySelector('.btn-voice-talk')?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.soundManager.playVehicleSound(vehicle.soundType);
        window.soundManager.speak(vehicle.voiceDesc);
      });

      // 꾸미기 및 상세 모달 열기
      card.querySelector('.btn-inspect')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openVehicleInspectModal(vehicle);
      });

      // 카드 전체 탭 시에도 음성 재생
      card.addEventListener('click', () => {
        window.soundManager.playVehicleSound(vehicle.soundType);
        window.soundManager.speak(vehicle.voiceDesc);
      });
    });

    // 잠긴 카드 탭 시 안내
    grid.querySelectorAll('.vehicle-card.locked').forEach(card => {
      card.addEventListener('click', () => {
        window.soundManager.playPop();
        window.soundManager.speak('출동 미션을 완료하면 멋진 새 차를 선물로 받을 수 있어요!');
      });
    });
  }

  // 차량 상세 및 스티커 꾸미기 모달
  openVehicleInspectModal(vehicle) {
    this.selectedVehicle = vehicle;
    const modal = document.getElementById('inspectModal');
    if (!modal) return;

    document.getElementById('inspectTitle').textContent = vehicle.name;
    document.getElementById('inspectDesc').textContent = vehicle.voiceDesc;

    // 큰 SVG 렌더
    this.renderInspectVehicleCanvas();

    // 스티커 팔레트 렌더
    this.renderStickerPalette();

    modal.classList.add('open');
    window.soundManager.playVehicleSound(vehicle.soundType);
    window.soundManager.speak(vehicle.voiceDesc);
  }

  renderInspectVehicleCanvas() {
    const container = document.getElementById('inspectVehicleCanvas');
    if (!container || !this.selectedVehicle) return;

    const stickers = window.storageManager.getStickers(this.selectedVehicle.id);

    container.innerHTML = `
      <div class="inspect-svg-stage" id="stickerStage">
        ${VehicleRenderer.renderSVG(this.selectedVehicle, { width: 340, height: 210, interactive: true })}
        <div class="sticker-interactive-overlay" id="stickerDropZone">
          ${stickers.map(s => `<span class="placed-sticker-lg" style="left:${s.x}%; top:${s.y}%;">${s.icon}</span>`).join('')}
        </div>
      </div>
    `;

    // 스티커 터치 부착 이벤트
    const dropZone = document.getElementById('stickerDropZone');
    dropZone.addEventListener('click', (e) => {
      if (!this.activeSticker) return;
      const rect = dropZone.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

      window.storageManager.addSticker(this.selectedVehicle.id, {
        stickerId: this.activeSticker.id,
        icon: this.activeSticker.icon,
        x: Math.max(5, Math.min(90, x)),
        y: Math.max(5, Math.min(90, y)),
      });

      window.soundManager.playPop();
      this.renderInspectVehicleCanvas();
      this.renderVehiclesGrid();
    });
  }

  renderStickerPalette() {
    const palette = document.getElementById('stickerPalette');
    if (!palette) return;

    let html = '';
    STICKERS.forEach(s => {
      const isSelected = this.activeSticker?.id === s.id;
      html += `
        <button class="sticker-item-btn ${isSelected ? 'selected' : ''}" data-id="${s.id}">
          <span class="sticker-icon">${s.icon}</span>
        </button>
      `;
    });

    palette.innerHTML = html;

    palette.querySelectorAll('.sticker-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundManager.playPop();
        const id = btn.dataset.id;
        this.activeSticker = STICKERS.find(s => s.id === id);
        this.renderStickerPalette();
      });
    });

    // 기본 첫 스티커 선택
    if (!this.activeSticker) {
      this.activeSticker = STICKERS[0];
    }
  }

  closeInspectModal() {
    const modal = document.getElementById('inspectModal');
    if (modal) {
      modal.classList.remove('open');
    }
  }

  // 출동 완료 후 언박싱 상자가 대기 중인지 체크
  checkPendingUnboxing() {
    if (window.storageManager.state.pendingBoxReward) {
      const nextLocked = window.storageManager.getNextLockedVehicle();
      if (nextLocked) {
        this.showUnboxingModal(nextLocked);
      } else {
        window.storageManager.state.pendingBoxReward = false;
        window.storageManager.saveState();
      }
    }
  }

  // 서프라이즈 선물상자 언박싱 팝업
  showUnboxingModal(vehicleToUnlock) {
    const modal = document.getElementById('unboxingModal');
    if (!modal) return;

    let tapCount = 0;
    const targetTaps = 3;

    modal.innerHTML = `
      <div class="unboxing-box-container">
        <h2 class="unboxing-title">🎁 새로운 특수차량이 도착했어요!</h2>
        <p class="unboxing-desc">상자를 톡! 톡! 톡! 세 번 두드려보세요!</p>
        <div class="crate-box" id="crateBox">
          <span class="crate-emoji">📦</span>
          <div class="tap-counter-bubble" id="tapCountBubble">3번 남음</div>
        </div>
        <div class="unboxing-revealed-wrap hidden" id="unboxedVehicle">
          <div class="reveal-firework">🎉✨🎊</div>
          <div class="reveal-vehicle-svg">
            ${VehicleRenderer.renderSVG(vehicleToUnlock, { width: 320, height: 200 })}
          </div>
          <h3 class="reveal-name">${vehicleToUnlock.icon} ${vehicleToUnlock.name}!</h3>
          <p class="reveal-desc">${vehicleToUnlock.voiceDesc}</p>
          <button class="btn-confirm-unbox" id="btnConfirmUnbox">차고지에 넣기! 🚗</button>
        </div>
      </div>
    `;

    modal.classList.add('open');
    window.soundManager.playFanfare();

    const crate = document.getElementById('crateBox');
    const bubble = document.getElementById('tapCountBubble');
    const revealedWrap = document.getElementById('unboxedVehicle');

    crate.addEventListener('click', () => {
      tapCount++;
      window.soundManager.playPop();
      crate.classList.add('crate-shake');
      setTimeout(() => crate.classList.remove('crate-shake'), 300);

      const remain = targetTaps - tapCount;
      if (remain > 0) {
        bubble.textContent = `${remain}번 남음!`;
      } else {
        // 오픈 완료!
        crate.classList.add('hidden');
        revealedWrap.classList.remove('hidden');
        window.storageManager.unlockVehicle(vehicleToUnlock.id);
        window.storageManager.state.pendingBoxReward = false;
        window.storageManager.saveState();

        window.soundManager.playFanfare();
        window.soundManager.speak(`${vehicleToUnlock.name}! 멋진 새 특수차량이 차고지에 도착했어요!`);

        document.getElementById('btnConfirmUnbox').addEventListener('click', () => {
          modal.classList.remove('open');
          this.renderVehiclesGrid();
        });
      }
    });
  }
}

window.garageManager = new GarageManager();
