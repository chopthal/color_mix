// 칙칙폭폭 호박 특장차와 사탕 미로 대모험 코어 스크립트 (2차 고도화: 워프 터널 & 차고 파츠)

(function () {
  'use strict';

  // 맵 스테이지 정의 (5x5)
  // 타일 종류:
  // 0: 빈 잔디/돌길
  // 'start': 시작 지점
  // 'goal': 할로윈 파티장
  // 'warp': 마녀 모자 워프 터널
  // 'candy_cane', 'candy_wrap', 'candy_choco', 'candy_star': 사탕 타일
  const STAGES = [
    {
      id: 1,
      name: "사탕 길 산책",
      desc: "사탕을 모아 파티장으로 가요!",
      recommendedVehicle: "bulldozer",
      rewardPart: "crown",
      start: { x: 0, y: 0, dir: "right" },
      goal: { x: 4, y: 4 },
      grid: [
        ['start', 'candy_cane', 0, 0, 0],
        [0, 'candy_wrap', 0, 0, 0],
        [0, 0, 'candy_choco', 0, 0],
        [0, 0, 0, 'candy_star', 0],
        [0, 0, 0, 0, 'goal']
      ],
      obstacles: [],
      warps: []
    },
    {
      id: 2,
      name: "호박 바위 밀기",
      desc: "길을 막은 호박 바위를 영차 밀어요!",
      recommendedVehicle: "bulldozer",
      rewardPart: "wings",
      start: { x: 0, y: 2, dir: "right" },
      goal: { x: 4, y: 2 },
      grid: [
        [0, 0, 0, 0, 0],
        [0, 'candy_cane', 'candy_choco', 'candy_star', 0],
        ['start', 0, 'rock', 0, 'goal'],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
      ],
      obstacles: [
        { x: 2, y: 2, type: 'rock', name: '거대 호박 바위' }
      ],
      warps: []
    },
    {
      id: 3,
      name: "달콤 주스 대모험",
      desc: "솜사탕을 주스로 퐁퐁 녹여요!",
      recommendedVehicle: "sprayer",
      rewardPart: "ribbon",
      start: { x: 0, y: 4, dir: "up" },
      goal: { x: 4, y: 0 },
      grid: [
        [0, 0, 0, 'candy_star', 'goal'],
        [0, 0, 'candy_choco', 'web', 0],
        [0, 'candy_wrap', 0, 0, 0],
        [0, 'candy_cane', 0, 0, 0],
        ['start', 0, 0, 0, 0]
      ],
      obstacles: [
        { x: 3, y: 1, type: 'web', name: '솜사탕 거미줄' }
      ],
      warps: []
    },
    {
      id: 4,
      name: "마녀 모자 마법 포털",
      desc: "마녀 모자에 들어가면 반대편으로 뿅!",
      recommendedVehicle: "bulldozer",
      rewardPart: "star",
      start: { x: 0, y: 0, dir: "right" },
      goal: { x: 4, y: 4 },
      grid: [
        ['start', 'candy_cane', 0, 0, 0],
        [0, 'warp', 0, 0, 0],
        [0, 0, 'rock', 0, 0],
        [0, 0, 0, 'warp', 'candy_choco'],
        [0, 0, 0, 0, 'goal']
      ],
      obstacles: [
        { x: 2, y: 2, type: 'rock', name: '거대 호박 바위' }
      ],
      warps: [
        { in: { x: 1, y: 1 }, out: { x: 3, y: 3 } },
        { in: { x: 3, y: 3 }, out: { x: 1, y: 1 } }
      ]
    }
  ];

  // 차량 설정
  const VEHICLES = {
    bulldozer: {
      name: "호박 불도저",
      icon: "🚜",
      actionIcon: "🚜",
      actionName: "영차 밀기",
      actionType: "push",
      color: "#ff8c00"
    },
    sprayer: {
      name: "호박 주스차",
      icon: "💦",
      actionIcon: "💦",
      actionName: "주스 뿜뿜",
      actionType: "spray",
      color: "#f59e0b"
    }
  };

  // 파츠 목록
  const PARTS = [
    {
      id: "crown",
      name: "호박 황금 왕관",
      icon: "👑",
      desc: "반짝이는 황금빛 왕관",
      stageReward: "1단계 완료 보상",
      render(isLarge = false) {
        return `<span class="car-part-crown">${this.icon}</span>`;
      }
    },
    {
      id: "wings",
      name: "깜찍 박쥐 날개",
      icon: "🦇",
      desc: "날아갈 듯 귀여운 날개",
      stageReward: "2단계 완료 보상",
      render(isLarge = false) {
        return `
          <span class="car-part-wings-left">${this.icon}</span>
          <span class="car-part-wings-right">${this.icon}</span>
        `;
      }
    },
    {
      id: "ribbon",
      name: "달콤 캔디 리본",
      icon: "🎀",
      desc: "상큼한 딸기맛 리본",
      stageReward: "3단계 완료 보상",
      render(isLarge = false) {
        return `<span class="car-part-ribbon">${this.icon}</span>`;
      }
    },
    {
      id: "star",
      name: "반짝 별빛 범퍼",
      icon: "⭐",
      desc: "밤하늘 별이 콕 박힌 범퍼",
      stageReward: "4단계 완료 보상",
      render(isLarge = false) {
        return `<span class="car-part-star">${this.icon}</span>`;
      }
    }
  ];

  const CANDY_ICONS = {
    'candy_cane': '🍭',
    'candy_wrap': '🍬',
    'candy_choco': '🍫',
    'candy_star': '⭐'
  };

  class PumpkinTrainGame {
    constructor() {
      this.currentStageIdx = 0;
      this.currentVehicle = "bulldozer";
      this.codeBlocks = [];
      this.maxBlocks = 10;
      this.isPlaying = false;

      // 주행 상태 (No Reset 이어하기 지원)
      this.carState = {
        x: 0,
        y: 0,
        dir: "right",
        trailers: []
      };
      this.clearedObstacles = new Set();
      this.collectedCandies = new Set();

      // 차고 파츠 상태 (localStorage 연동)
      this.garageData = this.loadGarageData();

      this.cacheDOMElements();
      this.bindEvents();
      this.loadStage(0);
    }

    // 로컬 스토리지 데이터 로드 (기본 1개는 해금되어 바로 꾸며볼 수 있음)
    loadGarageData() {
      const STORAGE_KEY = 'pumpkin_train_garage_v1';
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            unlocked: new Set(parsed.unlocked || ['crown']),
            equipped: new Set(parsed.equipped || ['crown'])
          };
        }
      } catch (e) {}

      return {
        unlocked: new Set(['crown']),
        equipped: new Set(['crown'])
      };
    }

    saveGarageData() {
      const STORAGE_KEY = 'pumpkin_train_garage_v1';
      try {
        const data = {
          unlocked: Array.from(this.garageData.unlocked),
          equipped: Array.from(this.garageData.equipped)
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {}
    }

    cacheDOMElements() {
      this.mazeBoard = document.getElementById('mazeBoard');
      this.railTrack = document.getElementById('railTrack');
      this.paletteWrap = document.getElementById('paletteWrap');
      this.btnStart = document.getElementById('btnStart');
      this.btnClear = document.getElementById('btnClear');
      this.btnResetPosition = document.getElementById('btnResetPosition');
      this.stageTitle = document.getElementById('stageTitle');
      this.stageDesc = document.getElementById('stageDesc');
      this.stageTabs = document.getElementById('stageTabs');
      this.vehicleTabs = document.getElementById('vehicleTabs');
      this.victoryModal = document.getElementById('victoryModal');
      this.btnNextStage = document.getElementById('btnNextStage');
      this.btnReplay = document.getElementById('btnReplay');
      this.hintBubble = document.getElementById('hintBubble');
      this.btnSound = document.getElementById('btnSound');

      // 차고 모달 엘리먼트
      this.btnOpenGarage = document.getElementById('btnOpenGarage');
      this.garageModal = document.getElementById('garageModal');
      this.btnCloseGarage = document.getElementById('btnCloseGarage');
      this.btnConfirmGarage = document.getElementById('btnConfirmGarage');
      this.garageCarWrap = document.getElementById('garageCarWrap');
      this.garagePartsGrid = document.getElementById('garagePartsGrid');
      this.newPartBadge = document.getElementById('newPartBadge');
      this.newPartText = document.getElementById('newPartText');
    }

    bindEvents() {
      // 블록 팔레트 탭
      this.paletteWrap.addEventListener('click', (e) => {
        const btn = e.target.closest('.block-btn');
        if (!btn || this.isPlaying) return;
        const blockType = btn.dataset.block;
        this.addBlock(blockType);
      });

      // 레일 블록 터치 시 삭제
      this.railTrack.addEventListener('click', (e) => {
        if (this.isPlaying) return;
        const item = e.target.closest('.rail-block-item');
        if (!item) return;
        const idx = parseInt(item.dataset.index, 10);
        this.removeBlock(idx);
      });

      // 전체 지우기
      this.btnClear.addEventListener('click', () => {
        if (this.isPlaying) return;
        this.clearBlocks();
      });

      // 처음 출발선으로 되돌리기
      this.btnResetPosition.addEventListener('click', () => {
        if (this.isPlaying) return;
        this.resetCarToStart();
      });

      // 출발 / 멈춤
      this.btnStart.addEventListener('click', () => {
        if (this.isPlaying) {
          this.stopRunning();
        } else {
          this.startRunning();
        }
      });

      // 스테이지 탭
      this.stageTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.stage-tab-btn');
        if (!tab || this.isPlaying) return;
        const idx = parseInt(tab.dataset.index, 10);
        this.loadStage(idx);
      });

      // 차량 선택 탭
      this.vehicleTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.vehicle-tab-btn');
        if (!btn || this.isPlaying) return;
        this.selectVehicle(btn.dataset.vehicle);
      });

      // 축하 모달 다음/다시
      this.btnNextStage.addEventListener('click', () => {
        this.victoryModal.classList.remove('active');
        const nextIdx = (this.currentStageIdx + 1) % STAGES.length;
        this.loadStage(nextIdx);
      });

      this.btnReplay.addEventListener('click', () => {
        this.victoryModal.classList.remove('active');
        this.loadStage(this.currentStageIdx);
      });

      // 차고 열기/닫기
      this.btnOpenGarage.addEventListener('click', () => {
        this.openGarageModal();
      });

      this.btnCloseGarage.addEventListener('click', () => {
        this.closeGarageModal();
      });

      this.btnConfirmGarage.addEventListener('click', () => {
        this.closeGarageModal();
      });

      // 차고 내 파츠 클릭 토글
      this.garagePartsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.part-card');
        if (!card || card.classList.contains('locked')) return;
        const partId = card.dataset.partId;
        this.toggleEquipPart(partId);
      });

      // 소리 토글
      if (this.btnSound) {
        this.btnSound.addEventListener('click', () => {
          const isMuted = window.soundManager.toggleMute();
          this.btnSound.textContent = isMuted ? '🔇' : '🔊';
        });
      }
    }

    loadStage(idx) {
      this.currentStageIdx = idx;
      const stage = STAGES[idx];

      this.selectVehicle(stage.recommendedVehicle, false);

      this.stageTitle.textContent = `${stage.id}. ${stage.name}`;
      this.stageDesc.textContent = stage.desc;

      document.querySelectorAll('.stage-tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === idx);
      });

      this.clearedObstacles.clear();
      this.collectedCandies.clear();
      this.codeBlocks = [];
      this.carState = {
        x: stage.start.x,
        y: stage.start.y,
        dir: stage.start.dir || "right",
        trailers: []
      };

      this.renderMaze();
      this.renderRail();
      this.updatePreviewFootprints();

      if (stage.id === 4) {
        this.showHint("마녀 모자 타일에 들어가면 반대편으로 뿅! 순간이동해요! 🎩✨");
      } else {
        this.showHint("블록을 콕 눌러 기차 레일을 완성해봐요! 🚂");
      }
    }

    selectVehicle(vKey, render = true) {
      if (!VEHICLES[vKey]) return;
      this.currentVehicle = vKey;
      const v = VEHICLES[vKey];

      document.querySelectorAll('.vehicle-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.vehicle === vKey);
      });

      const actionBtn = document.querySelector('.block-btn[data-block="action"]');
      if (actionBtn) {
        actionBtn.innerHTML = `
          <span class="block-icon">${v.actionIcon}</span>
          <span class="block-label">${v.actionName}</span>
        `;
      }

      if (render) {
        this.renderMaze();
        this.updatePreviewFootprints();
        window.soundManager.playPop();
      }
    }

    resetCarToStart() {
      const stage = STAGES[this.currentStageIdx];
      this.carState.x = stage.start.x;
      this.carState.y = stage.start.y;
      this.carState.dir = stage.start.dir || "right";
      this.carState.trailers = [];
      this.collectedCandies.clear();
      this.clearedObstacles.clear();
      this.clearBlocks();
      this.renderMaze();
      this.updatePreviewFootprints();
      this.showHint("출발선으로 다시 왔어요! 준비 완료! 🎃");
      window.soundManager.playHorn();
    }

    addBlock(type) {
      if (this.codeBlocks.length >= this.maxBlocks) {
        this.showHint("기차 레일이 가득 찼어요! [출발 ▶️] 해볼까요?");
        return;
      }
      this.codeBlocks.push(type);
      window.soundManager.playPop();
      this.renderRail();
      this.updatePreviewFootprints();
    }

    removeBlock(idx) {
      this.codeBlocks.splice(idx, 1);
      window.soundManager.playRemove();
      this.renderRail();
      this.updatePreviewFootprints();
    }

    clearBlocks() {
      this.codeBlocks = [];
      window.soundManager.playRemove();
      this.renderRail();
      this.updatePreviewFootprints();
      this.showHint("레일을 깨끗이 비웠어요 ✨");
    }

    renderRail() {
      this.railTrack.innerHTML = '';
      const v = VEHICLES[this.currentVehicle];

      for (let i = 0; i < this.maxBlocks; i++) {
        const block = this.codeBlocks[i];
        const slot = document.createElement('div');
        slot.className = 'rail-slot';

        if (block) {
          const item = document.createElement('div');
          item.className = `rail-block-item block-${block}`;
          item.dataset.index = i;

          let icon = '';
          let name = '';
          if (block === 'up') { icon = '⬆️'; name = '위로'; }
          else if (block === 'down') { icon = '⬇️'; name = '아래로'; }
          else if (block === 'left') { icon = '⬅️'; name = '왼쪽'; }
          else if (block === 'right') { icon = '➡️'; name = '오른쪽'; }
          else if (block === 'action') { icon = v.actionIcon; name = v.actionName; }

          item.innerHTML = `
            <span class="rail-block-icon">${icon}</span>
            <span class="rail-block-sub">${name}</span>
            <span class="rail-remove-tag">✕</span>
          `;
          slot.appendChild(item);
        } else {
          slot.classList.add('empty');
          slot.innerHTML = `<span class="slot-num">${i + 1}</span>`;
        }
        this.railTrack.appendChild(slot);
      }
    }

    renderMaze() {
      const stage = STAGES[this.currentStageIdx];
      this.mazeBoard.innerHTML = '';

      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const tile = document.createElement('div');
          tile.className = 'maze-tile';
          tile.id = `tile-${x}-${y}`;
          tile.dataset.x = x;
          tile.dataset.y = y;

          const raw = stage.grid[y][x];
          const coordKey = `${x},${y}`;

          // 시작점
          if (raw === 'start') {
            tile.classList.add('tile-start');
            tile.innerHTML += `<span class="tile-badge start-badge">출발! 🏁</span>`;
          }

          // 파티장 골인 지점
          if (raw === 'goal') {
            tile.classList.add('tile-goal');
            tile.innerHTML += `
              <div class="goal-decor">
                <span class="goal-castle">🎪</span>
                <span class="goal-title">달콤 파티장!</span>
              </div>
            `;
          }

          // ★ 마녀 모자 워프 타일
          if (raw === 'warp') {
            tile.classList.add('tile-warp');
            tile.innerHTML += `
              <div class="warp-hat-item">
                <span class="warp-hat-icon">🎩</span>
                <span class="warp-hat-label">마법 모자</span>
              </div>
            `;
          }

          // 사탕
          if (CANDY_ICONS[raw] && !this.collectedCandies.has(coordKey)) {
            tile.classList.add('tile-candy');
            tile.innerHTML += `<div class="candy-item bouncing">${CANDY_ICONS[raw]}</div>`;
          }

          // 장애물
          const obs = stage.obstacles.find(o => o.x === x && o.y === y);
          if (obs && !this.clearedObstacles.has(coordKey)) {
            tile.classList.add(`tile-${obs.type}`);
            const obsIcon = obs.type === 'rock' ? '🎃🪨' : '🕸️🧁';
            tile.innerHTML += `
              <div class="obstacle-item" id="obs-${x}-${y}">
                <span class="obs-icon">${obsIcon}</span>
                <span class="obs-name">${obs.name}</span>
              </div>
            `;
          }

          this.mazeBoard.appendChild(tile);
        }
      }

      this.renderVehicle();
    }

    renderVehicle() {
      const oldCar = document.getElementById('pumpkinCar');
      if (oldCar) oldCar.remove();

      const curTile = document.getElementById(`tile-${this.carState.x}-${this.carState.y}`);
      if (!curTile) return;

      const v = VEHICLES[this.currentVehicle];
      const carElem = document.createElement('div');
      carElem.id = 'pumpkinCar';
      carElem.className = `pumpkin-car dir-${this.carState.dir}`;

      // 장착된 파츠 렌더링
      let partsHtml = '';
      this.garageData.equipped.forEach(partId => {
        const part = PARTS.find(p => p.id === partId);
        if (part) {
          partsHtml += part.render(false);
        }
      });

      // 사탕 트레일러 수레들
      let trailersHtml = '';
      this.carState.trailers.forEach((candy, idx) => {
        trailersHtml += `
          <div class="candy-trailer" style="animation-delay: ${idx * 0.05}s">
            <span class="trailer-wheel">⚙️</span>
            <span class="trailer-candy">${candy}</span>
          </div>
        `;
      });

      carElem.innerHTML = `
        <div class="car-engine">
          ${partsHtml}
          <span class="car-smoke">💨</span>
          <span class="car-icon">${v.icon}</span>
          <span class="car-face">😊</span>
        </div>
        <div class="trailer-chain">${trailersHtml}</div>
      `;

      curTile.appendChild(carElem);
    }

    // ★ 반투명 발자국 프리뷰 (워프 터널 연결 포함)
    updatePreviewFootprints() {
      document.querySelectorAll('.footprint-preview').forEach(el => el.remove());
      if (this.isPlaying) return;

      let simX = this.carState.x;
      let simY = this.carState.y;
      const stage = STAGES[this.currentStageIdx];
      const simCleared = new Set(this.clearedObstacles);

      this.codeBlocks.forEach((block, idx) => {
        let nextX = simX;
        let nextY = simY;

        if (block === 'up') nextY--;
        else if (block === 'down') nextY++;
        else if (block === 'left') nextX--;
        else if (block === 'right') nextX++;

        if (block === 'action') {
          const adjObs = stage.obstacles.find(o =>
            !simCleared.has(`${o.x},${o.y}`) &&
            Math.abs(o.x - simX) + Math.abs(o.y - simY) <= 1
          );
          if (adjObs) {
            simCleared.add(`${adjObs.x},${adjObs.y}`);
          }
        } else {
          const inBounds = nextX >= 0 && nextX < 5 && nextY >= 0 && nextY < 5;
          const isBlocked = stage.obstacles.some(o => o.x === nextX && o.y === nextY && !simCleared.has(`${o.x},${o.y}`));

          if (inBounds && !isBlocked) {
            simX = nextX;
            simY = nextY;

            // 마녀 모자 워프 타일인지 확인
            const isWarp = stage.grid[simY][simX] === 'warp';
            const warpConfig = stage.warps ? stage.warps.find(w => w.in.x === simX && w.in.y === simY) : null;

            const tile = document.getElementById(`tile-${simX}-${simY}`);
            if (tile) {
              const fp = document.createElement('div');
              fp.className = 'footprint-preview';
              fp.innerHTML = `
                <span class="fp-icon">${isWarp ? '🎩' : '🎃'}</span>
                <span class="fp-num">${idx + 1}</span>
              `;
              tile.appendChild(fp);
            }

            // 워프 타일이면 시뮬레이션 좌표를 출구로 순간 이동!
            if (warpConfig) {
              simX = warpConfig.out.x;
              simY = warpConfig.out.y;
            }
          } else {
            const targetTile = inBounds ? document.getElementById(`tile-${nextX}-${nextY}`) : document.getElementById(`tile-${simX}-${simY}`);
            if (targetTile) {
              const stopSign = document.createElement('div');
              stopSign.className = 'footprint-preview fp-stop';
              stopSign.innerHTML = `<span class="fp-icon">✋</span>`;
              targetTile.appendChild(stopSign);
            }
          }
        }
      });
    }

    // 주행 실행
    async startRunning() {
      if (this.codeBlocks.length === 0) {
        this.showHint("블록을 1개 이상 콕 눌러 넣어주세요! 🌟");
        window.soundManager.playPop();
        return;
      }

      this.isPlaying = true;
      this.btnStart.innerHTML = `<span>⏸️</span> <span>멈춤</span>`;
      this.btnStart.classList.add('running');
      this.updatePreviewFootprints();
      window.soundManager.init();

      const stage = STAGES[this.currentStageIdx];
      const railSlots = document.querySelectorAll('.rail-slot .rail-block-item');

      for (let i = 0; i < this.codeBlocks.length; i++) {
        if (!this.isPlaying) break;

        const block = this.codeBlocks[i];

        railSlots.forEach((slot, sIdx) => {
          slot.classList.toggle('active-running', sIdx === i);
        });

        await this.executeBlock(block, stage);
        await new Promise(r => setTimeout(r, 450));

        // 골인 검사
        if (this.carState.x === stage.goal.x && this.carState.y === stage.goal.y) {
          await this.handleVictory();
          return;
        }
      }

      railSlots.forEach(slot => slot.classList.remove('active-running'));
      this.isPlaying = false;
      this.btnStart.innerHTML = `<span>▶️</span> <span>출발!</span>`;
      this.btnStart.classList.remove('running');

      this.codeBlocks = [];
      this.renderRail();
      this.updatePreviewFootprints();
      this.showHint("잘 도착했어요! 멈춘 곳에서 블록을 더 넣어 파티장으로 가볼까요? 🌟");
      window.soundManager.playHorn();
    }

    async executeBlock(block, stage) {
      let targetX = this.carState.x;
      let targetY = this.carState.y;
      let targetDir = this.carState.dir;

      if (block === 'up') { targetY--; targetDir = 'up'; }
      else if (block === 'down') { targetY++; targetDir = 'down'; }
      else if (block === 'left') { targetX--; targetDir = 'left'; }
      else if (block === 'right') { targetX++; targetDir = 'right'; }
      else if (block === 'action') {
        await this.performAction(stage);
        return;
      }

      this.carState.dir = targetDir;

      // 경계 검사
      if (targetX < 0 || targetX >= 5 || targetY < 0 || targetY >= 5) {
        this.bumpWall();
        return;
      }

      // 미해결 장애물 체크
      const coordKey = `${targetX},${targetY}`;
      const isBlocked = stage.obstacles.some(o => o.x === targetX && o.y === targetY && !this.clearedObstacles.has(coordKey));
      if (isBlocked) {
        this.bumpObstacle();
        return;
      }

      // 전진
      this.carState.x = targetX;
      this.carState.y = targetY;
      window.soundManager.playChug();

      // 사탕 획득 체크
      const tileType = stage.grid[targetY][targetX];
      if (CANDY_ICONS[tileType] && !this.collectedCandies.has(coordKey)) {
        this.collectedCandies.add(coordKey);
        this.carState.trailers.push(CANDY_ICONS[tileType]);
        window.soundManager.playCandy();
        this.showCandyPop(targetX, targetY, CANDY_ICONS[tileType]);
      }

      this.renderMaze();

      // ★ 마녀 모자 워프 터널 순간이동 처리
      if (tileType === 'warp' && stage.warps) {
        const warpRule = stage.warps.find(w => w.in.x === targetX && w.in.y === targetY);
        if (warpRule) {
          await new Promise(r => setTimeout(r, 200));
          window.soundManager.playWarp();
          this.showHint("뾰로롱~! 마녀 모자 터널을 타고 뿅! 🎩✨");

          // 모자 출구로 순간 이동
          this.carState.x = warpRule.out.x;
          this.carState.y = warpRule.out.y;
          this.renderMaze();
          await new Promise(r => setTimeout(r, 300));
        }
      }
    }

    async performAction(stage) {
      const v = VEHICLES[this.currentVehicle];
      const curX = this.carState.x;
      const curY = this.carState.y;

      const adjObs = stage.obstacles.find(o =>
        !this.clearedObstacles.has(`${o.x},${o.y}`) &&
        Math.abs(o.x - curX) + Math.abs(o.y - curY) <= 1
      );

      if (adjObs) {
        this.clearedObstacles.add(`${adjObs.x},${adjObs.y}`);
        if (v.actionType === 'push') {
          window.soundManager.playPush();
          this.showHint("영차! 커다란 호박 바위를 밀어냈어요! 🚜💨");
        } else {
          window.soundManager.playSplash();
          this.showHint("슈우욱! 솜사탕 거미줄을 달콤하게 녹였어요! 💦✨");
        }
        this.renderMaze();
      } else {
        if (v.actionType === 'push') {
          window.soundManager.playPush();
          this.showHint("호박 삽을 번쩍! 튼튼하게 준비 완료! 🚜");
        } else {
          window.soundManager.playSplash();
          this.showHint("달콤한 오렌지 주스 퐁퐁 발사! 💦");
        }
      }
    }

    bumpWall() {
      const car = document.getElementById('pumpkinCar');
      if (car) {
        car.classList.add('bump-bounce');
        setTimeout(() => car.classList.remove('bump-bounce'), 300);
      }
      this.showHint("벽에 콩! 다른 쪽으로 가볼까요? 🎈");
    }

    bumpObstacle() {
      const car = document.getElementById('pumpkinCar');
      if (car) {
        car.classList.add('bump-bounce');
        setTimeout(() => car.classList.remove('bump-bounce'), 300);
      }
      this.showHint("길이 막혔어요! 특수 액션 블록으로 해결해봐요! 🌟");
    }

    showCandyPop(x, y, icon) {
      const tile = document.getElementById(`tile-${x}-${y}`);
      if (!tile) return;
      const pop = document.createElement('div');
      pop.className = 'candy-fly-pop';
      pop.textContent = `${icon} 착!`;
      tile.appendChild(pop);
      setTimeout(() => pop.remove(), 700);
    }

    stopRunning() {
      this.isPlaying = false;
      this.btnStart.innerHTML = `<span>▶️</span> <span>출발!</span>`;
      this.btnStart.classList.remove('running');
      this.updatePreviewFootprints();
      this.showHint("잠깐 멈췄어요! 언제든 다시 출발할 수 있어요 ⏸️");
    }

    // 파티장 골인 승리 축하!
    async handleVictory() {
      this.isPlaying = false;
      this.btnStart.innerHTML = `<span>▶️</span> <span>출발!</span>`;
      this.btnStart.classList.remove('running');
      window.soundManager.playWin();

      this.launchConfetti();

      const stage = STAGES[this.currentStageIdx];
      const trailerCount = this.carState.trailers.length;
      document.getElementById('victoryCandyCount').textContent = `${trailerCount}칸의 사탕 기차 완성! 🚂🍬`;
      document.getElementById('victoryTrailersWrap').innerHTML = this.carState.trailers.map(c => `
        <span class="victory-candy-chip">${c}</span>
      `).join('');

      // 새 파츠 해금 확인
      const rewardPartId = stage.rewardPart;
      const rewardPart = PARTS.find(p => p.id === rewardPartId);
      if (rewardPart && !this.garageData.unlocked.has(rewardPartId)) {
        this.garageData.unlocked.add(rewardPartId);
        this.garageData.equipped.add(rewardPartId); // 바로 장착
        this.saveGarageData();

        this.newPartBadge.style.display = 'inline-block';
        this.newPartText.textContent = `새 파츠 [${rewardPart.icon} ${rewardPart.name}] 획득 & 장착!`;
      } else {
        this.newPartBadge.style.display = 'none';
      }

      setTimeout(() => {
        this.victoryModal.classList.add('active');
      }, 700);
    }

    // ★ 호박 차고 꾸미기 모달 로직
    openGarageModal() {
      if (this.isPlaying) return;
      window.soundManager.playPop();
      this.renderGarageCarPreview();
      this.renderGaragePartsGrid();
      this.garageModal.classList.add('active');
    }

    closeGarageModal() {
      this.garageModal.classList.remove('active');
      this.renderVehicle(); // 인게임에 장착 파츠 반영
      window.soundManager.playPop();
    }

    renderGarageCarPreview() {
      const v = VEHICLES[this.currentVehicle];
      let partsHtml = '';
      this.garageData.equipped.forEach(partId => {
        const part = PARTS.find(p => p.id === partId);
        if (part) {
          partsHtml += part.render(true);
        }
      });

      this.garageCarWrap.innerHTML = `
        <div class="pumpkin-car preview-large">
          <div class="car-engine">
            ${partsHtml}
            <span class="car-icon">${v.icon}</span>
            <span class="car-face">😊</span>
          </div>
        </div>
      `;
    }

    renderGaragePartsGrid() {
      this.garagePartsGrid.innerHTML = '';
      PARTS.forEach(part => {
        const isUnlocked = this.garageData.unlocked.has(part.id);
        const isEquipped = this.garageData.equipped.has(part.id);

        const card = document.createElement('div');
        card.className = `part-card ${isUnlocked ? '' : 'locked'} ${isEquipped ? 'equipped' : ''}`;
        card.dataset.partId = part.id;

        let statusText = '잠김 (모험으로 획득)';
        let statusClass = 'status-locked';

        if (isUnlocked) {
          if (isEquipped) {
            statusText = '장착 중 ✨';
            statusClass = 'status-equipped';
          } else {
            statusText = '장착하기 👆';
            statusClass = 'status-ready';
          }
        }

        card.innerHTML = `
          <div class="part-icon">${part.icon}</div>
          <div class="part-name">${part.name}</div>
          <div class="part-desc" style="font-size: 11px; color: #64748b;">${isUnlocked ? part.desc : part.stageReward}</div>
          <span class="part-status ${statusClass}">${statusText}</span>
        `;
        this.garagePartsGrid.appendChild(card);
      });
    }

    toggleEquipPart(partId) {
      if (!this.garageData.unlocked.has(partId)) return;

      if (this.garageData.equipped.has(partId)) {
        this.garageData.equipped.delete(partId);
      } else {
        this.garageData.equipped.add(partId);
      }
      this.saveGarageData();
      window.soundManager.playEquip();

      this.renderGarageCarPreview();
      this.renderGaragePartsGrid();
    }

    launchConfetti() {
      const colors = ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6'];
      for (let i = 0; i < 30; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti-piece';
        conf.style.left = `${Math.random() * 100}%`;
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animationDelay = `${Math.random() * 0.4}s`;
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 1800);
      }
    }

    showHint(msg) {
      if (!this.hintBubble) return;
      this.hintBubble.textContent = msg;
      this.hintBubble.classList.add('pop-hint');
      setTimeout(() => this.hintBubble.classList.remove('pop-hint'), 300);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.game = new PumpkinTrainGame();
  });
})();
