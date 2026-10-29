/**
 * 출동 미션 매니저 (상황실 지령 ➔ 릴레이 출동 액션 인터랙션)
 */
class MissionManager {
  constructor() {
    this.currentScenario = null;
    this.currentStepIndex = 0;
    this.interactiveTargets = [];
  }

  // 상황실 지령 선택 팝업 열기
  openDispatchCenter() {
    const modal = document.getElementById('dispatchModal');
    if (!modal) return;

    let html = `
      <div class="dispatch-container">
        <div class="dispatch-header">
          <span class="dispatch-badge">🚨 긴급 상황실 지령</span>
          <h2 class="dispatch-title">도움이 필요한 곳으로 출동해요!</h2>
          <p class="dispatch-sub">어떤 사건이 일어났을까요? 출동할 미션을 골라주세요!</p>
        </div>
        <div class="mission-scenario-list">
    `;

    MISSION_SCENARIOS.forEach(sc => {
      html += `
        <div class="scenario-card" data-id="${sc.id}">
          <div class="scenario-icon">${sc.icon}</div>
          <div class="scenario-info">
            <h3 class="scenario-title">${sc.title}</h3>
            <p class="scenario-desc">${sc.desc}</p>
            <div class="relay-vehicle-tags">
              ${sc.steps.map((st, i) => {
                const v = VEHICLES.find(item => item.id === st.vehicleId);
                return `<span class="tag-vehicle">${i + 1}단계: ${v ? v.icon + ' ' + v.name : '특수차'}</span>`;
              }).join('')}
            </div>
          </div>
          <button class="btn-dispatch-go">출동! 🚀</button>
        </div>
      `;
    });

    html += `
        </div>
        <button class="btn-close-dispatch" id="btnCloseDispatch">차고지로 돌아가기</button>
      </div>
    `;

    modal.innerHTML = html;
    modal.classList.add('open');

    window.soundManager.playFireSiren();
    window.soundManager.speak('긴급 상황실입니다! 도움이 필요한 곳으로 멋진 특수차량을 출동시켜 주세요!');

    modal.querySelectorAll('.scenario-card').forEach(card => {
      card.addEventListener('click', () => {
        const scId = card.dataset.id;
        const scenario = MISSION_SCENARIOS.find(s => s.id === scId);
        modal.classList.remove('open');
        this.startMission(scenario);
      });
    });

    document.getElementById('btnCloseDispatch')?.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  // 미션 시작
  startMission(scenario) {
    this.currentScenario = scenario;
    this.currentStepIndex = 0;
    window.app.switchScreen('mission');
    this.renderCurrentStep();
  }

  // 현재 릴레이 단계 렌더링
  renderCurrentStep() {
    const step = this.currentScenario.steps[this.currentStepIndex];
    const vehicle = VEHICLES.find(v => v.id === step.vehicleId);
    const totalSteps = this.currentScenario.steps.length;

    const missionScreen = document.getElementById('missionScreen');
    if (!missionScreen) return;

    // 안내 음성 출력
    window.soundManager.playVehicleSound(vehicle.soundType);
    window.soundManager.speak(`${vehicle.name} 출동! ${step.instruction}`);

    missionScreen.innerHTML = `
      <div class="mission-hud">
        <button class="btn-hud-back" id="btnMissionBack">◀ 차고지</button>
        <div class="hud-relay-step">
          <span class="step-badge">${this.currentStepIndex + 1} / ${totalSteps} 단계</span>
          <span class="hud-vehicle-name">${vehicle.icon} ${vehicle.name}</span>
        </div>
        <button class="btn-hud-sound" id="btnHudSound">🔊 다시 듣기</button>
      </div>

      <div class="mission-stage-area">
        <!-- 배경 상황 일러스트 / 타겟 영역 -->
        <div class="mission-scene-backdrop" id="missionSceneBackdrop">
          <div class="mission-instruction-pill">
            <span class="inst-icon">${step.targetIcon}</span>
            <span class="inst-text">${step.instruction}</span>
          </div>

          <!-- 인터랙션 타겟 존 (불꽃, 바위, 환자 등) -->
          <div class="interactive-target-zone" id="targetZone">
            <!-- 동적 생성 타겟 -->
          </div>
        </div>

        <!-- 하단 출동 차량 액션 영역 -->
        <div class="mission-vehicle-action-bay">
          <div class="action-vehicle-wrap" id="actionVehicleWrap">
            ${VehicleRenderer.renderSVG(vehicle, { width: 340, height: 210, interactive: true })}
          </div>
          <!-- 조작 컨트롤 버튼들 -->
          <div class="vehicle-action-controls" id="actionControls">
            <!-- 인터랙션별 특화 컨트롤 -->
          </div>
        </div>
      </div>
    `;

    // HUD 이벤트
    document.getElementById('btnMissionBack').addEventListener('click', () => {
      window.soundManager.playPop();
      window.app.switchScreen('garage');
    });

    document.getElementById('btnHudSound').addEventListener('click', () => {
      window.soundManager.playVehicleSound(vehicle.soundType);
      window.soundManager.speak(step.instruction);
    });

    // 단계별 인터랙션 설정
    this.setupStepInteraction(step, vehicle);
  }

  // 인터랙션 로직 구성 (물 분사, 사다리 구출, 바위 깨기, 반창고 치료 등)
  setupStepInteraction(step, vehicle) {
    const targetZone = document.getElementById('targetZone');
    const controls = document.getElementById('actionControls');
    if (!targetZone || !controls) return;

    if (step.action === 'water') {
      // 불 끄기 미션 (3개의 불꽃 터치)
      let remainTargets = 3;
      targetZone.innerHTML = `
        <div class="targets-container flex-row">
          <div class="target-item fire-target" data-hp="2">🔥</div>
          <div class="target-item fire-target" data-hp="2">🔥</div>
          <div class="target-item fire-target" data-hp="2">🔥</div>
        </div>
      `;

      controls.innerHTML = `
        <button class="action-big-btn btn-water-spray" id="btnWaterAct">
          <span>💧 물 발사하기!</span>
        </button>
      `;

      const fireItems = targetZone.querySelectorAll('.fire-target');
      const sprayWater = (targetEl) => {
        window.soundManager.playWaterSpray();
        targetEl.classList.add('hit-water');

        let hp = parseInt(targetEl.dataset.hp || '1', 10) - 1;
        targetEl.dataset.hp = hp;

        if (hp <= 0) {
          targetEl.textContent = '✨';
          targetEl.classList.add('extinguished');
          remainTargets--;
          window.soundManager.playPop();

          if (remainTargets === 0) {
            setTimeout(() => this.finishCurrentStep(vehicle), 800);
          }
        }
      };

      fireItems.forEach(item => {
        item.addEventListener('click', () => sprayWater(item));
      });

      document.getElementById('btnWaterAct').addEventListener('click', () => {
        const activeItem = Array.from(fireItems).find(i => !i.classList.contains('extinguished'));
        if (activeItem) sprayWater(activeItem);
      });
    } else if (step.action === 'ladder') {
      // 사다리/바가지 올리기 (슬라이더 및 구출 버튼)
      targetZone.innerHTML = `
        <div class="rescue-tree-tower">
          <div class="tree-top-victim" id="treeVictim">${step.targetIcon}</div>
          <div class="tree-trunk">🌲</div>
        </div>
      `;

      controls.innerHTML = `
        <button class="action-big-btn btn-ladder-extend" id="btnLadderAct">
          <span>🪜 사다리 쭈욱 올리기!</span>
        </button>
      `;

      let extended = false;
      document.getElementById('btnLadderAct').addEventListener('click', () => {
        if (extended) return;
        extended = true;
        window.soundManager.playMechanicalWhir();

        const vehicleWrap = document.getElementById('actionVehicleWrap');
        vehicleWrap.innerHTML = VehicleRenderer.renderSVG(vehicle, {
          width: 340,
          height: 210,
          armAngle: -45,
          ladderExtension: 75,
        });

        const victim = document.getElementById('treeVictim');
        victim.classList.add('rescued-anim');
        window.soundManager.playPop();
        window.soundManager.speak('친구를 안전하게 구조했어요! 만세!');

        setTimeout(() => this.finishCurrentStep(vehicle), 1200);
      });
    } else if (step.action === 'dig_smash') {
      // 포클레인 바위 부수기 / 흙 퍼기
      targetZone.innerHTML = `
        <div class="rock-container">
          <div class="target-item big-rock" id="bigRock">🪨</div>
          <div class="rock-hint">바위를 콕콕 눌러 치워요!</div>
        </div>
      `;

      controls.innerHTML = `
        <button class="action-big-btn btn-excavate" id="btnDigAct">
          <span>🚜 포클레인으로 푹 파기!</span>
        </button>
      `;

      let hits = 3;
      const smashRock = () => {
        hits--;
        window.soundManager.playHammerSmash();
        const rock = document.getElementById('bigRock');
        rock.classList.add('rock-hit');
        setTimeout(() => rock.classList.remove('rock-hit'), 200);

        if (hits === 2) rock.textContent = '🧱';
        else if (hits === 1) rock.textContent = '✨';
        else if (hits <= 0) {
          rock.textContent = '🌟';
          window.soundManager.speak('큰 바위를 깨끗하게 치웠어요!');
          setTimeout(() => this.finishCurrentStep(vehicle), 800);
        }
      };

      document.getElementById('bigRock').addEventListener('click', smashRock);
      document.getElementById('btnDigAct').addEventListener('click', smashRock);
    } else {
      // 기본 드라이브 / 청소 / 치료 액션
      targetZone.innerHTML = `
        <div class="general-action-scene">
          <div class="target-item general-target" id="genTarget">${step.targetIcon}</div>
          <div class="action-hint-text">터치해서 미션을 해결하세요!</div>
        </div>
      `;

      controls.innerHTML = `
        <button class="action-big-btn btn-general-act" id="btnGenAct">
          <span>✨ 해결하기!</span>
        </button>
      `;

      const solveAction = () => {
        window.soundManager.playPop();
        const target = document.getElementById('genTarget');
        target.classList.add('success-spin');
        window.soundManager.speak('미션 완벽 해결!');
        setTimeout(() => this.finishCurrentStep(vehicle), 900);
      };

      document.getElementById('genTarget').addEventListener('click', solveAction);
      document.getElementById('btnGenAct').addEventListener('click', solveAction);
    }
  }

  // 단계 완료 및 다음 단계 / 세차장 전환
  finishCurrentStep(vehicle) {
    this.currentStepIndex++;

    if (this.currentStepIndex < this.currentScenario.steps.length) {
      // 다음 릴레이 단계로
      window.soundManager.playFanfare();
      this.renderCurrentStep();
    } else {
      // 모든 릴레이 미션 완료! ➔ 세차 및 정비소로 이동
      this.showMissionVictoryModal(vehicle);
    }
  }

  // 출동 성공 축하 팝업
  showMissionVictoryModal(lastVehicle) {
    const modal = document.getElementById('victoryModal');
    if (!modal) return;

    // 도장 및 완료 기록
    window.storageManager.recordMissionComplete(lastVehicle.id);

    modal.innerHTML = `
      <div class="victory-box">
        <div class="victory-fireworks">🎆🎉🎊</div>
        <h2 class="victory-title">출동 성공! 정말 멋져요!</h2>
        <p class="victory-desc">모든 사건을 안전하게 해결했어요!<br>이제 흙과 그을음이 묻은 차를 깨끗이 씻어줄까요?</p>
        <div class="stamp-received">
          <span class="stamp-icon">💮</span>
          <span class="stamp-text">출동 완료 참 잘했어요 도장 획득!</span>
        </div>
        <div class="victory-vehicle-preview">
          ${VehicleRenderer.renderSVG(lastVehicle, { width: 240, height: 150 })}
        </div>
        <button class="btn-go-wash" id="btnGoWash">세차 및 정비소로 출발! 🧼</button>
      </div>
    `;

    modal.classList.add('open');
    window.soundManager.playFanfare();
    window.soundManager.speak('출동 성공! 참 잘했어요! 이제 깨끗하게 세차하러 가볼까요?');

    document.getElementById('btnGoWash').addEventListener('click', () => {
      modal.classList.remove('open');
      window.washManager.startWash(lastVehicle);
    });
  }
}

window.missionManager = new MissionManager();
