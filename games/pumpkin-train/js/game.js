// 칙칙폭폭 호박 특장차와 사탕 미로 대모험 코어 스크립트
// 2단계: 틀린 차 안내·시드 배치 변주·차고 자랑 소프트 엔딩·KidsKit

(function () {
  'use strict';

  const STORE_NS = 'pumpkin-train';
  const LEGACY_GARAGE_KEY = 'pumpkin_train_garage_v1';
  const ASSET_BASE = 'assets/';

  // 맵 스테이지 베이스 (기믹 고정 · 배치는 시드로 변주)
  // 타일: 0 | start | goal | warp | candy_* | rock | web
  const STAGE_BASES = [
    {
      id: 1,
      name: '사탕 길 산책',
      desc: '사탕을 모아 파티장으로 가요!',
      recommendedVehicle: 'bulldozer',
      rewardPart: 'crown',
      start: { x: 0, y: 0, dir: 'right' },
      goal: { x: 4, y: 4 },
      candyCount: 4,
      obstacleType: null,
      warpPair: false
    },
    {
      id: 2,
      name: '호박 바위 밀기',
      desc: '길을 막은 호박 바위를 영차 밀어요!',
      recommendedVehicle: 'bulldozer',
      rewardPart: 'wings',
      start: { x: 0, y: 2, dir: 'right' },
      goal: { x: 4, y: 2 },
      candyCount: 3,
      obstacleType: 'rock',
      obstacleName: '거대 호박 바위',
      warpPair: false
    },
    {
      id: 3,
      name: '달콤 주스 대모험',
      desc: '솜사탕을 주스로 퐁퐁 녹여요!',
      recommendedVehicle: 'sprayer',
      rewardPart: 'ribbon',
      start: { x: 0, y: 4, dir: 'up' },
      goal: { x: 4, y: 0 },
      candyCount: 3,
      obstacleType: 'web',
      obstacleName: '솜사탕 거미줄',
      warpPair: false
    },
    {
      id: 4,
      name: '마녀 모자 마법 포털',
      desc: '마녀 모자에 들어가면 반대편으로 뿅!',
      recommendedVehicle: 'bulldozer',
      rewardPart: 'star',
      start: { x: 0, y: 0, dir: 'right' },
      goal: { x: 4, y: 4 },
      candyCount: 2,
      obstacleType: 'rock',
      obstacleName: '거대 호박 바위',
      warpPair: true
    }
  ];

  const CANDY_TYPES = ['candy_cane', 'candy_wrap', 'candy_choco', 'candy_star'];

  const VEHICLES = {
    bulldozer: {
      name: '호박 불도저',
      icon: '🚜',
      actionIcon: '🚜',
      actionName: '영차 밀기',
      actionType: 'push',
      assetKey: 'car-bulldozer',
      color: '#ff8c00'
    },
    sprayer: {
      name: '호박 주스차',
      icon: '💦',
      actionIcon: '💦',
      actionName: '주스 뿜뿜',
      actionType: 'spray',
      assetKey: 'car-sprayer',
      color: '#f59e0b'
    }
  };

  const ACTION_CLEARS = {
    push: 'rock',
    spray: 'web'
  };

  const OBSTACLE_TO_VEHICLE = {
    rock: 'bulldozer',
    web: 'sprayer'
  };

  const PARTS = [
    {
      id: 'crown',
      name: '호박 황금 왕관',
      icon: '👑',
      desc: '반짝이는 황금빛 왕관',
      stageReward: '1단계 완료 보상',
      assetKey: 'part-crown',
      render(isLarge, assetHtml) {
        return `<span class="car-part-crown">${assetHtml || this.icon}</span>`;
      }
    },
    {
      id: 'wings',
      name: '깜찍 박쥐 날개',
      icon: '🦇',
      desc: '날아갈 듯 귀여운 날개',
      stageReward: '2단계 완료 보상',
      assetKey: 'part-wings',
      render(isLarge, assetHtml) {
        const mark = assetHtml || this.icon;
        return `
          <span class="car-part-wings-left">${mark}</span>
          <span class="car-part-wings-right">${mark}</span>
        `;
      }
    },
    {
      id: 'ribbon',
      name: '달콤 캔디 리본',
      icon: '🎀',
      desc: '상큼한 딸기맛 리본',
      stageReward: '3단계 완료 보상',
      assetKey: 'part-ribbon',
      render(isLarge, assetHtml) {
        return `<span class="car-part-ribbon">${assetHtml || this.icon}</span>`;
      }
    },
    {
      id: 'star',
      name: '반짝 별빛 범퍼',
      icon: '⭐',
      desc: '밤하늘 별이 콕 박힌 범퍼',
      stageReward: '4단계 완료 보상',
      assetKey: 'part-star',
      render(isLarge, assetHtml) {
        return `<span class="car-part-star">${assetHtml || this.icon}</span>`;
      }
    }
  ];

  const CANDY_ICONS = {
    candy_cane: '🍭',
    candy_wrap: '🍬',
    candy_choco: '🍫',
    candy_star: '⭐'
  };

  const CANDY_ASSET_KEYS = {
    candy_cane: 'candy-cane',
    candy_wrap: 'candy-wrap',
    candy_choco: 'candy-choco',
    candy_star: 'candy-star'
  };

  const ASSET_MANIFEST = [
    { key: 'car-bulldozer', src: ASSET_BASE + 'car-bulldozer.webp' },
    { key: 'car-sprayer', src: ASSET_BASE + 'car-sprayer.webp' },
    { key: 'candy-cane', src: ASSET_BASE + 'candy-cane.webp' },
    { key: 'candy-wrap', src: ASSET_BASE + 'candy-wrap.webp' },
    { key: 'candy-choco', src: ASSET_BASE + 'candy-choco.webp' },
    { key: 'candy-star', src: ASSET_BASE + 'candy-star.webp' },
    { key: 'obstacle-rock', src: ASSET_BASE + 'obstacle-rock.webp' },
    { key: 'obstacle-web', src: ASSET_BASE + 'obstacle-web.webp' },
    { key: 'warp-hat', src: ASSET_BASE + 'warp-hat.webp' },
    { key: 'goal-party', src: ASSET_BASE + 'goal-party.webp' },
    { key: 'part-crown', src: ASSET_BASE + 'part-crown.webp' },
    { key: 'part-wings', src: ASSET_BASE + 'part-wings.webp' },
    { key: 'part-ribbon', src: ASSET_BASE + 'part-ribbon.webp' },
    { key: 'part-star', src: ASSET_BASE + 'part-star.webp' }
  ];

  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleInPlace(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function cellKey(x, y) {
    return x + ',' + y;
  }

  /** 같은 기믹·다른 배치 (시드 0~9 변주) */
  function buildStageFromSeed(base, layoutSeed) {
    const seed = ((layoutSeed % 10) + 10) % 10;
    const rng = mulberry32(base.id * 1009 + seed * 7919 + 42);

    const grid = [];
    for (let y = 0; y < 5; y++) {
      grid[y] = [];
      for (let x = 0; x < 5; x++) grid[y][x] = 0;
    }

    const sx = base.start.x;
    const sy = base.start.y;
    const gx = base.goal.x;
    const gy = base.goal.y;
    grid[sy][sx] = 'start';
    grid[gy][gx] = 'goal';

    const reserved = new Set([cellKey(sx, sy), cellKey(gx, gy)]);
    const free = [];
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const k = cellKey(x, y);
        if (!reserved.has(k)) free.push({ x: x, y: y });
      }
    }
    shuffleInPlace(free, rng);

    const warps = [];
    let freeIdx = 0;

    if (base.warpPair) {
      const a = free[freeIdx++];
      const b = free[freeIdx++];
      grid[a.y][a.x] = 'warp';
      grid[b.y][b.x] = 'warp';
      reserved.add(cellKey(a.x, a.y));
      reserved.add(cellKey(b.x, b.y));
      warps.push(
        { in: { x: a.x, y: a.y }, out: { x: b.x, y: b.y } },
        { in: { x: b.x, y: b.y }, out: { x: a.x, y: a.y } }
      );
    }

    const obstacles = [];
    if (base.obstacleType) {
      // 출발·골인 사이 중앙대 쪽을 우선해 기믹이 눈에 띄게
      const prefer = free.filter(function (c) {
        if (reserved.has(cellKey(c.x, c.y))) return false;
        if (base.id === 2) return c.y === sy || Math.abs(c.y - sy) <= 1;
        if (base.id === 3) return c.x >= 2 || c.y <= 2;
        return true;
      });
      const pool = prefer.length ? prefer : free.filter(function (c) {
        return !reserved.has(cellKey(c.x, c.y));
      });
      shuffleInPlace(pool, rng);
      const obsCell = pool[0] || free[freeIdx];
      if (obsCell) {
        grid[obsCell.y][obsCell.x] = base.obstacleType;
        reserved.add(cellKey(obsCell.x, obsCell.y));
        obstacles.push({
          x: obsCell.x,
          y: obsCell.y,
          type: base.obstacleType,
          name: base.obstacleName
        });
      }
    }

    const candySlots = free.filter(function (c) {
      return !reserved.has(cellKey(c.x, c.y));
    });
    shuffleInPlace(candySlots, rng);
    const candyOrder = CANDY_TYPES.slice();
    shuffleInPlace(candyOrder, rng);
    const count = Math.min(base.candyCount, candySlots.length);
    for (let i = 0; i < count; i++) {
      const c = candySlots[i];
      const kind = candyOrder[i % candyOrder.length];
      grid[c.y][c.x] = kind;
    }

    return {
      id: base.id,
      name: base.name,
      desc: base.desc,
      recommendedVehicle: base.recommendedVehicle,
      rewardPart: base.rewardPart,
      start: { x: sx, y: sy, dir: base.start.dir || 'right' },
      goal: { x: gx, y: gy },
      grid: grid,
      obstacles: obstacles,
      warps: warps,
      layoutSeed: seed
    };
  }

  class PumpkinTrainGame {
    constructor() {
      this.kitStore = window.KidsKit
        ? window.KidsKit.store(STORE_NS)
        : null;
      this.assetImages = {};
      this.currentStageIdx = 0;
      this.currentVehicle = 'bulldozer';
      this.codeBlocks = [];
      this.maxBlocks = 10;
      this.isPlaying = false;
      this.stages = [];
      this.layoutSeed = 0;
      this.awaitingSoftEnding = false;

      this.carState = {
        x: 0,
        y: 0,
        dir: 'right',
        trailers: []
      };
      this.clearedObstacles = new Set();
      this.collectedCandies = new Set();

      this.garageData = this.loadGarageData();
      this.layoutSeed = this.readLayoutSeed();

      this.cacheDOMElements();
      this.bindEvents();
      this.initKidsKitChrome();
      this.rebuildStages();
      this.preloadAssets().then(() => {
        this.loadStage(0);
        this.greetReturningVisitor();
      });
    }

    readLayoutSeed() {
      if (this.kitStore) {
        const n = this.kitStore.get('layoutSeed', 0);
        return typeof n === 'number' ? n : 0;
      }
      return 0;
    }

    bumpLayoutSeed() {
      this.layoutSeed = (this.layoutSeed + 1) % 10;
      if (this.kitStore) this.kitStore.set('layoutSeed', this.layoutSeed);
    }

    rebuildStages() {
      this.stages = STAGE_BASES.map((base) =>
        buildStageFromSeed(base, this.layoutSeed)
      );
    }

    loadGarageData() {
      if (this.kitStore) {
        const saved = this.kitStore.get('garage', null);
        if (saved && saved.unlocked) {
          return {
            unlocked: new Set(saved.unlocked),
            equipped: new Set(saved.equipped || ['crown'])
          };
        }
      }
      try {
        const raw = localStorage.getItem(LEGACY_GARAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const data = {
            unlocked: new Set(parsed.unlocked || ['crown']),
            equipped: new Set(parsed.equipped || ['crown'])
          };
          this.persistGarage(data);
          return data;
        }
      } catch (e) { /* ignore */ }

      return {
        unlocked: new Set(['crown']),
        equipped: new Set(['crown'])
      };
    }

    persistGarage(data) {
      const payload = {
        unlocked: Array.from(data.unlocked),
        equipped: Array.from(data.equipped)
      };
      if (this.kitStore) this.kitStore.set('garage', payload);
      try {
        localStorage.setItem(LEGACY_GARAGE_KEY, JSON.stringify(payload));
      } catch (e) { /* ignore */ }
    }

    saveGarageData() {
      this.persistGarage(this.garageData);
    }

    initKidsKitChrome() {
      if (!window.KidsKit) return;
      window.KidsKit.restButton({
        onRest: () => {
          window.location.href = '../../index.html';
        }
      });
    }

    greetReturningVisitor() {
      if (!this.kitStore) return;
      const visits = this.kitStore.update(
        'visits',
        (v) => (typeof v === 'number' ? v + 1 : 1),
        0
      );
      if (visits <= 1) return;

      const equipped = Array.from(this.garageData.equipped)
        .map((id) => {
          const p = PARTS.find((x) => x.id === id);
          return p ? p.icon : '';
        })
        .filter(Boolean)
        .join('');
      const sparkle = equipped || '🎃';
      this.showHint('우리 호박 차가 ' + sparkle + ' 달고 빵빵! 다시 만나서 반가워!');
    }

    preloadAssets() {
      if (!window.KidsKit || !window.KidsKit.assets) {
        return Promise.resolve();
      }
      // KidsKit이 assets/ready.json에 있는 파일만 요청 (없으면 placeholder → 이모지 폴백, 404 없음)
      return window.KidsKit.assets.preload(ASSET_MANIFEST).then((result) => {
        this.assetImages = (result && result.images) || {};
      });
    }

    hasAsset(key) {
      const img = this.assetImages[key];
      return !!(img && img.dataset.kidsKitPlaceholder !== '1' && img.naturalWidth > 0);
    }

    assetMarkup(key, fallbackEmoji, className) {
      if (this.hasAsset(key)) {
        const img = this.assetImages[key];
        const cls = className ? ' class="' + className + '"' : ' class="sprite-img"';
        return '<img src="' + img.src + '" alt="" draggable="false"' + cls + '>';
      }
      return fallbackEmoji;
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
      this.hintText = document.getElementById('hintText');
      this.btnSound = document.getElementById('btnSound');
      this.btnOpenGarage = document.getElementById('btnOpenGarage');
      this.garageModal = document.getElementById('garageModal');
      this.btnCloseGarage = document.getElementById('btnCloseGarage');
      this.btnConfirmGarage = document.getElementById('btnConfirmGarage');
      this.garageCarWrap = document.getElementById('garageCarWrap');
      this.garagePartsGrid = document.getElementById('garagePartsGrid');
      this.newPartBadge = document.getElementById('newPartBadge');
      this.newPartText = document.getElementById('newPartText');
      this.garageDesc = document.getElementById('garageDesc');
    }

    bindEvents() {
      this.paletteWrap.addEventListener('click', (e) => {
        const btn = e.target.closest('.block-btn');
        if (!btn || this.isPlaying) return;
        this.addBlock(btn.dataset.block);
      });

      this.railTrack.addEventListener('click', (e) => {
        if (this.isPlaying) return;
        const item = e.target.closest('.rail-block-item');
        if (!item) return;
        this.removeBlock(parseInt(item.dataset.index, 10));
      });

      this.btnClear.addEventListener('click', () => {
        if (this.isPlaying) return;
        this.clearBlocks();
      });

      this.btnResetPosition.addEventListener('click', () => {
        if (this.isPlaying) return;
        this.resetCarToStart();
      });

      this.btnStart.addEventListener('click', () => {
        if (this.isPlaying) this.stopRunning();
        else this.startRunning();
      });

      this.stageTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.stage-tab-btn');
        if (!tab || this.isPlaying) return;
        this.loadStage(parseInt(tab.dataset.index, 10));
      });

      this.vehicleTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.vehicle-tab-btn');
        if (!btn || this.isPlaying) return;
        this.selectVehicle(btn.dataset.vehicle);
      });

      this.btnNextStage.addEventListener('click', () => {
        this.victoryModal.classList.remove('active');
        if (this.awaitingSoftEnding) {
          this.openGarageShowoffThenEnding();
          return;
        }
        const nextIdx = (this.currentStageIdx + 1) % this.stages.length;
        this.loadStage(nextIdx);
      });

      this.btnReplay.addEventListener('click', () => {
        this.victoryModal.classList.remove('active');
        this.awaitingSoftEnding = false;
        this.loadStage(this.currentStageIdx);
      });

      this.btnOpenGarage.addEventListener('click', () => {
        this.openGarageModal(false);
      });

      this.btnCloseGarage.addEventListener('click', () => {
        const wasShowoff = this.awaitingSoftEnding;
        this.closeGarageModal();
        if (wasShowoff) this.showAdventureSoftEnding();
      });

      this.btnConfirmGarage.addEventListener('click', () => {
        const wasShowoff = this.awaitingSoftEnding;
        this.closeGarageModal();
        if (wasShowoff) this.showAdventureSoftEnding();
      });

      this.garagePartsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.part-card');
        if (!card || card.classList.contains('locked')) return;
        this.toggleEquipPart(card.dataset.partId);
      });

      if (this.btnSound) {
        this.btnSound.addEventListener('click', () => {
          const isMuted = window.soundManager.toggleMute();
          this.btnSound.textContent = isMuted ? '🔇' : '🔊';
        });
      }
    }

    getStage() {
      return this.stages[this.currentStageIdx];
    }

    loadStage(idx) {
      this.currentStageIdx = idx;
      this.awaitingSoftEnding = false;
      const stage = this.getStage();

      this.selectVehicle(stage.recommendedVehicle, false);

      this.stageTitle.textContent = stage.id + '. ' + stage.name;
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
        dir: stage.start.dir || 'right',
        trailers: []
      };

      this.renderMaze();
      this.renderRail();
      this.updatePreviewFootprints();
      this.clearVehicleSparkle();

      if (stage.id === 4) {
        this.showHint('마녀 모자 타일에 들어가면 반대편으로 뿅! 순간이동해요! 🎩✨');
      } else {
        this.showHint('블록을 콕 눌러 기차 레일을 완성해봐요! 🚂');
      }
    }

    selectVehicle(vKey, render) {
      if (render === undefined) render = true;
      if (!VEHICLES[vKey]) return;
      this.currentVehicle = vKey;
      const v = VEHICLES[vKey];

      document.querySelectorAll('.vehicle-tab-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.vehicle === vKey);
      });
      this.clearVehicleSparkle();

      const actionBtn = document.querySelector('.block-btn[data-block="action"]');
      if (actionBtn) {
        actionBtn.innerHTML =
          '<span class="block-icon">' +
          v.actionIcon +
          '</span><span class="block-label">' +
          v.actionName +
          '</span>';
      }

      if (render) {
        this.renderMaze();
        this.updatePreviewFootprints();
        window.soundManager.playPop();
      }
    }

    clearVehicleSparkle() {
      document.querySelectorAll('.vehicle-tab-btn').forEach((btn) => {
        btn.classList.remove('hint-sparkle');
      });
    }

    sparkleCorrectVehicle(vehicleKey) {
      this.clearVehicleSparkle();
      const btn = document.querySelector(
        '.vehicle-tab-btn[data-vehicle="' + vehicleKey + '"]'
      );
      if (!btn) return;
      btn.classList.add('hint-sparkle');
      setTimeout(() => btn.classList.remove('hint-sparkle'), 2800);
    }

    resetCarToStart() {
      const stage = this.getStage();
      this.carState.x = stage.start.x;
      this.carState.y = stage.start.y;
      this.carState.dir = stage.start.dir || 'right';
      this.carState.trailers = [];
      this.collectedCandies.clear();
      this.clearedObstacles.clear();
      this.clearBlocks();
      this.renderMaze();
      this.updatePreviewFootprints();
      this.showHint('출발선으로 다시 왔어요! 준비 완료! 🎃');
      window.soundManager.playHorn();
    }

    addBlock(type) {
      if (this.codeBlocks.length >= this.maxBlocks) {
        this.showHint('기차 레일이 가득 찼어요! [출발 ▶️] 해볼까요?');
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
      this.showHint('레일을 깨끗이 비웠어요 ✨');
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
          item.className = 'rail-block-item block-' + block;
          item.dataset.index = String(i);

          let icon = '';
          let name = '';
          if (block === 'up') {
            icon = '⬆️';
            name = '위로';
          } else if (block === 'down') {
            icon = '⬇️';
            name = '아래로';
          } else if (block === 'left') {
            icon = '⬅️';
            name = '왼쪽';
          } else if (block === 'right') {
            icon = '➡️';
            name = '오른쪽';
          } else if (block === 'action') {
            icon = v.actionIcon;
            name = v.actionName;
          }

          item.innerHTML =
            '<span class="rail-block-icon">' +
            icon +
            '</span><span class="rail-block-sub">' +
            name +
            '</span><span class="rail-remove-tag">✕</span>';
          slot.appendChild(item);
        } else {
          slot.classList.add('empty');
          slot.innerHTML = '<span class="slot-num">' + (i + 1) + '</span>';
        }
        this.railTrack.appendChild(slot);
      }
    }

    renderMaze() {
      const stage = this.getStage();
      this.mazeBoard.innerHTML = '';

      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const tile = document.createElement('div');
          tile.className = 'maze-tile';
          tile.id = 'tile-' + x + '-' + y;
          tile.dataset.x = String(x);
          tile.dataset.y = String(y);

          const raw = stage.grid[y][x];
          const coordKey = cellKey(x, y);

          if (raw === 'start') {
            tile.classList.add('tile-start');
            tile.innerHTML +=
              '<span class="tile-badge start-badge">출발! 🏁</span>';
          }

          if (raw === 'goal') {
            tile.classList.add('tile-goal');
            tile.innerHTML +=
              '<div class="goal-decor">' +
              '<span class="goal-castle">' +
              this.assetMarkup('goal-party', '🎪', 'sprite-img sprite-goal') +
              '</span>' +
              '<span class="goal-title">달콤 파티장!</span></div>';
          }

          if (raw === 'warp') {
            tile.classList.add('tile-warp');
            tile.innerHTML +=
              '<div class="warp-hat-item">' +
              '<span class="warp-hat-icon">' +
              this.assetMarkup('warp-hat', '🎩', 'sprite-img sprite-warp') +
              '</span>' +
              '<span class="warp-hat-label">마법 모자</span></div>';
          }

          if (CANDY_ICONS[raw] && !this.collectedCandies.has(coordKey)) {
            tile.classList.add('tile-candy');
            const candyKey = CANDY_ASSET_KEYS[raw];
            tile.innerHTML +=
              '<div class="candy-item bouncing">' +
              this.assetMarkup(candyKey, CANDY_ICONS[raw], 'sprite-img sprite-candy') +
              '</div>';
          }

          const obs = stage.obstacles.find((o) => o.x === x && o.y === y);
          if (obs && !this.clearedObstacles.has(coordKey)) {
            tile.classList.add('tile-' + obs.type);
            const obsIcon =
              obs.type === 'rock'
                ? this.assetMarkup('obstacle-rock', '🎃🪨', 'sprite-img sprite-obs')
                : this.assetMarkup('obstacle-web', '🕸️🧁', 'sprite-img sprite-obs');
            tile.innerHTML +=
              '<div class="obstacle-item" id="obs-' +
              x +
              '-' +
              y +
              '"><span class="obs-icon">' +
              obsIcon +
              '</span><span class="obs-name">' +
              obs.name +
              '</span></div>';
          }

          this.mazeBoard.appendChild(tile);
        }
      }

      this.renderVehicle();
    }

    renderVehicle() {
      const oldCar = document.getElementById('pumpkinCar');
      if (oldCar) oldCar.remove();

      const curTile = document.getElementById(
        'tile-' + this.carState.x + '-' + this.carState.y
      );
      if (!curTile) return;

      const v = VEHICLES[this.currentVehicle];
      const carElem = document.createElement('div');
      carElem.id = 'pumpkinCar';
      carElem.className = 'pumpkin-car dir-' + this.carState.dir;
      const hasCarSprite = this.hasAsset(v.assetKey);

      let partsHtml = '';
      this.garageData.equipped.forEach((partId) => {
        const part = PARTS.find((p) => p.id === partId);
        if (part) {
          const mark = this.assetMarkup(
            part.assetKey,
            part.icon,
            'sprite-img sprite-part'
          );
          partsHtml += part.render(false, mark);
        }
      });

      let trailersHtml = '';
      this.carState.trailers.forEach((candy, idx) => {
        trailersHtml +=
          '<div class="candy-trailer" style="animation-delay: ' +
          idx * 0.05 +
          's"><span class="trailer-wheel">⚙️</span><span class="trailer-candy">' +
          candy +
          '</span></div>';
      });

      // 스프라이트에 얼굴·본체가 있으므로 이모지 얼굴·주황 원 배경은 끈다
      carElem.innerHTML =
        '<div class="car-engine' +
        (hasCarSprite ? ' has-car-sprite' : '') +
        '">' +
        partsHtml +
        '<span class="car-smoke">💨</span>' +
        '<span class="car-icon">' +
        this.assetMarkup(v.assetKey, v.icon, 'sprite-img sprite-car') +
        '</span>' +
        (hasCarSprite ? '' : '<span class="car-face">😊</span>') +
        '</div>' +
        '<div class="trailer-chain">' +
        trailersHtml +
        '</div>';

      curTile.appendChild(carElem);
    }

    updatePreviewFootprints() {
      document.querySelectorAll('.footprint-preview').forEach((el) => el.remove());
      if (this.isPlaying) return;

      let simX = this.carState.x;
      let simY = this.carState.y;
      const stage = this.getStage();
      const simCleared = new Set(this.clearedObstacles);

      this.codeBlocks.forEach((block, idx) => {
        let nextX = simX;
        let nextY = simY;

        if (block === 'up') nextY--;
        else if (block === 'down') nextY++;
        else if (block === 'left') nextX--;
        else if (block === 'right') nextX++;

        if (block === 'action') {
          const v = VEHICLES[this.currentVehicle];
          const neededType = ACTION_CLEARS[v.actionType];
          const adjObs = stage.obstacles.find(
            (o) =>
              !simCleared.has(cellKey(o.x, o.y)) &&
              o.type === neededType &&
              Math.abs(o.x - simX) + Math.abs(o.y - simY) <= 1
          );
          if (adjObs) simCleared.add(cellKey(adjObs.x, adjObs.y));
        } else {
          const inBounds = nextX >= 0 && nextX < 5 && nextY >= 0 && nextY < 5;
          const isBlocked = stage.obstacles.some(
            (o) =>
              o.x === nextX &&
              o.y === nextY &&
              !simCleared.has(cellKey(o.x, o.y))
          );

          if (inBounds && !isBlocked) {
            simX = nextX;
            simY = nextY;

            const isWarp = stage.grid[simY][simX] === 'warp';
            const warpConfig = stage.warps
              ? stage.warps.find((w) => w.in.x === simX && w.in.y === simY)
              : null;

            const tile = document.getElementById('tile-' + simX + '-' + simY);
            if (tile) {
              const fp = document.createElement('div');
              fp.className = 'footprint-preview';
              fp.innerHTML =
                '<span class="fp-icon">' +
                (isWarp ? '🎩' : '🎃') +
                '</span><span class="fp-num">' +
                (idx + 1) +
                '</span>';
              tile.appendChild(fp);
            }

            if (warpConfig) {
              simX = warpConfig.out.x;
              simY = warpConfig.out.y;
              const exitTile = document.getElementById(
                'tile-' + simX + '-' + simY
              );
              if (exitTile) {
                const exitFp = document.createElement('div');
                exitFp.className = 'footprint-preview';
                exitFp.innerHTML =
                  '<span class="fp-icon">🎃</span><span class="fp-num">' +
                  (idx + 1) +
                  '</span>';
                exitTile.appendChild(exitFp);
              }
            }
          } else {
            const targetTile = inBounds
              ? document.getElementById('tile-' + nextX + '-' + nextY)
              : document.getElementById('tile-' + simX + '-' + simY);
            if (targetTile) {
              const stopSign = document.createElement('div');
              stopSign.className = 'footprint-preview fp-stop';
              stopSign.innerHTML = '<span class="fp-icon">✋</span>';
              targetTile.appendChild(stopSign);
            }
          }
        }
      });
    }

    async startRunning() {
      if (this.codeBlocks.length === 0) {
        this.showHint('블록을 1개 이상 콕 눌러 넣어주세요! 🌟');
        window.soundManager.playPop();
        return;
      }

      this.isPlaying = true;
      this.btnStart.innerHTML = '<span>⏸️</span> <span>멈춤</span>';
      this.btnStart.classList.add('running');
      this.updatePreviewFootprints();
      window.soundManager.init();

      const stage = this.getStage();
      const railSlots = document.querySelectorAll('.rail-slot .rail-block-item');

      for (let i = 0; i < this.codeBlocks.length; i++) {
        if (!this.isPlaying) break;

        const block = this.codeBlocks[i];
        railSlots.forEach((slot, sIdx) => {
          slot.classList.toggle('active-running', sIdx === i);
        });

        await this.executeBlock(block, stage);
        await new Promise((r) => setTimeout(r, 450));

        if (this.carState.x === stage.goal.x && this.carState.y === stage.goal.y) {
          await this.handleVictory();
          return;
        }
      }

      railSlots.forEach((slot) => slot.classList.remove('active-running'));
      this.isPlaying = false;
      this.btnStart.innerHTML = '<span>▶️</span> <span>출발!</span>';
      this.btnStart.classList.remove('running');

      this.codeBlocks = [];
      this.renderRail();
      this.updatePreviewFootprints();
      this.showHint(
        '잘 도착했어요! 멈춘 곳에서 블록을 더 넣어 파티장으로 가볼까요? 🌟'
      );
      window.soundManager.playHorn();
    }

    async executeBlock(block, stage) {
      let targetX = this.carState.x;
      let targetY = this.carState.y;
      let targetDir = this.carState.dir;

      if (block === 'up') {
        targetY--;
        targetDir = 'up';
      } else if (block === 'down') {
        targetY++;
        targetDir = 'down';
      } else if (block === 'left') {
        targetX--;
        targetDir = 'left';
      } else if (block === 'right') {
        targetX++;
        targetDir = 'right';
      } else if (block === 'action') {
        await this.performAction(stage);
        return;
      }

      this.carState.dir = targetDir;

      if (targetX < 0 || targetX >= 5 || targetY < 0 || targetY >= 5) {
        this.bumpWall();
        return;
      }

      const coordKey = cellKey(targetX, targetY);
      const isBlocked = stage.obstacles.some(
        (o) =>
          o.x === targetX &&
          o.y === targetY &&
          !this.clearedObstacles.has(coordKey)
      );
      if (isBlocked) {
        this.bumpObstacle();
        return;
      }

      this.carState.x = targetX;
      this.carState.y = targetY;
      window.soundManager.playChug();

      const tileType = stage.grid[targetY][targetX];
      if (CANDY_ICONS[tileType] && !this.collectedCandies.has(coordKey)) {
        this.collectedCandies.add(coordKey);
        this.carState.trailers.push(CANDY_ICONS[tileType]);
        window.soundManager.playCandy();
        this.showCandyPop(targetX, targetY, CANDY_ICONS[tileType]);
        // 발견 레이어: 2회차+ 에서 가끔 박쥐가 반짝
        this.maybeShowBatSparkle(targetX, targetY);
      }

      this.renderMaze();

      if (tileType === 'warp' && stage.warps) {
        const warpRule = stage.warps.find(
          (w) => w.in.x === targetX && w.in.y === targetY
        );
        if (warpRule) {
          await new Promise((r) => setTimeout(r, 200));
          window.soundManager.playWarp();
          this.showHint('뾰로롱~! 마녀 모자 터널을 타고 뿅! 🎩✨');
          this.carState.x = warpRule.out.x;
          this.carState.y = warpRule.out.y;
          this.renderMaze();
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    }

    maybeShowBatSparkle(x, y) {
      const visits = this.kitStore ? this.kitStore.get('visits', 1) : 1;
      if (visits < 2) return;
      if (Math.random() > 0.35) return;
      const tile = document.getElementById('tile-' + x + '-' + y);
      if (!tile) return;
      const bat = document.createElement('div');
      bat.className = 'bat-sparkle';
      bat.textContent = '🦇✨';
      tile.appendChild(bat);
      setTimeout(() => bat.remove(), 900);
    }

    async performAction(stage) {
      const v = VEHICLES[this.currentVehicle];
      const curX = this.carState.x;
      const curY = this.carState.y;
      const neededType = ACTION_CLEARS[v.actionType];

      const adjObs = stage.obstacles.find(
        (o) =>
          !this.clearedObstacles.has(cellKey(o.x, o.y)) &&
          Math.abs(o.x - curX) + Math.abs(o.y - curY) <= 1
      );

      // 인접 장애물 있지만 차량 미스매치 → 짧은 안내 + 맞는 차 반짝 (실패 화면 없음)
      if (adjObs && adjObs.type !== neededType) {
        this.wiggleCar();
        const correctKey = OBSTACLE_TO_VEHICLE[adjObs.type];
        const correct = VEHICLES[correctKey];
        if (correct) {
          this.showHint(
            '다른 차로 바꿔 볼까? ' + correct.icon + ' ' + correct.name + '!'
          );
          this.sparkleCorrectVehicle(correctKey);
        } else {
          this.showHint('다른 차로 바꿔 볼까?');
        }
        if (v.actionType === 'push') window.soundManager.playPush();
        else window.soundManager.playSplash();
        return;
      }

      if (adjObs && adjObs.type === neededType) {
        this.clearedObstacles.add(cellKey(adjObs.x, adjObs.y));
        if (v.actionType === 'push') {
          window.soundManager.playPush();
          this.showHint('영차! 커다란 호박 바위를 밀어냈어요! 🚜💨');
        } else {
          window.soundManager.playSplash();
          this.showHint('슈우욱! 솜사탕 거미줄을 달콤하게 녹였어요! 💦✨');
        }
        this.renderMaze();
      } else {
        if (v.actionType === 'push') {
          window.soundManager.playPush();
          this.showHint('호박 삽을 번쩍! 튼튼하게 준비 완료! 🚜');
        } else {
          window.soundManager.playSplash();
          this.showHint('달콤한 오렌지 주스 퐁퐁 발사! 💦');
        }
      }
    }

    wiggleCar() {
      const car = document.getElementById('pumpkinCar');
      if (!car) return;
      car.classList.remove('cute-wiggle');
      void car.offsetWidth;
      car.classList.add('cute-wiggle');
      setTimeout(() => car.classList.remove('cute-wiggle'), 400);
    }

    bumpWall() {
      const car = document.getElementById('pumpkinCar');
      if (car) {
        car.classList.add('bump-bounce');
        setTimeout(() => car.classList.remove('bump-bounce'), 300);
      }
      this.showHint('벽에 콩! 다른 쪽으로 가볼까요? 🎈');
    }

    bumpObstacle() {
      const car = document.getElementById('pumpkinCar');
      if (car) {
        car.classList.add('bump-bounce');
        setTimeout(() => car.classList.remove('bump-bounce'), 300);
      }
      this.showHint('길이 막혔어요! 특수 액션 블록으로 해결해봐요! 🌟');
    }

    showCandyPop(x, y, icon) {
      const tile = document.getElementById('tile-' + x + '-' + y);
      if (!tile) return;
      const pop = document.createElement('div');
      pop.className = 'candy-fly-pop';
      pop.textContent = icon + ' 착!';
      tile.appendChild(pop);
      setTimeout(() => pop.remove(), 700);
    }

    stopRunning() {
      this.isPlaying = false;
      this.btnStart.innerHTML = '<span>▶️</span> <span>출발!</span>';
      this.btnStart.classList.remove('running');
      this.updatePreviewFootprints();
      this.showHint('잠깐 멈췄어요! 언제든 다시 출발할 수 있어요 ⏸️');
    }

    async handleVictory() {
      this.isPlaying = false;
      this.btnStart.innerHTML = '<span>▶️</span> <span>출발!</span>';
      this.btnStart.classList.remove('running');
      window.soundManager.playWin();
      this.launchConfetti();

      const stage = this.getStage();
      const trailerCount = this.carState.trailers.length;
      document.getElementById('victoryCandyCount').textContent =
        trailerCount + '칸의 사탕 기차 완성! 🚂🍬';
      document.getElementById('victoryTrailersWrap').innerHTML =
        this.carState.trailers
          .map((c) => '<span class="victory-candy-chip">' + c + '</span>')
          .join('');

      const rewardPartId = stage.rewardPart;
      const rewardPart = PARTS.find((p) => p.id === rewardPartId);
      if (rewardPart && !this.garageData.unlocked.has(rewardPartId)) {
        this.garageData.unlocked.add(rewardPartId);
        this.garageData.equipped.add(rewardPartId);
        this.saveGarageData();
        this.newPartBadge.style.display = 'inline-block';
        this.newPartText.textContent =
          '새 파츠 [' +
          rewardPart.icon +
          ' ' +
          rewardPart.name +
          '] 획득 & 장착!';
      } else {
        this.newPartBadge.style.display = 'none';
      }

      const isFinal = stage.id === 4;
      this.awaitingSoftEnding = isFinal;
      if (isFinal) {
        this.btnNextStage.textContent = '차고에서 자랑하기 🚗';
      } else {
        this.btnNextStage.textContent = '다음 모험 🚀';
      }

      setTimeout(() => {
        this.victoryModal.classList.add('active');
      }, 700);
    }

    openGarageShowoffThenEnding() {
      this.openGarageModal(true);
    }

    openGarageModal(showoff) {
      if (this.isPlaying) return;
      window.soundManager.playPop();
      if (this.garageDesc) {
        this.garageDesc.textContent = showoff
          ? '오늘 모은 파츠로 예쁜 호박 차 자랑해요!'
          : '원하는 파츠를 톡 눌러 차를 멋지게 꾸며봐요!';
      }
      if (showoff) {
        this.btnConfirmGarage.textContent = '자랑 끝! 쉬러 가요 🌙';
      } else {
        this.btnConfirmGarage.textContent = '완료! 멋져 👍';
      }
      this.renderGarageCarPreview();
      this.renderGaragePartsGrid();
      this.garageModal.classList.add('active');
    }

    closeGarageModal() {
      this.garageModal.classList.remove('active');
      this.renderVehicle();
      window.soundManager.playPop();
    }

    showAdventureSoftEnding() {
      this.awaitingSoftEnding = false;
      if (!window.KidsKit || !window.KidsKit.softEnding) {
        this.showHint(
          '오늘 모험 대성공! 예쁜 호박 차와 사탕 친구들이 편안히 쉬러 가요 🌙'
        );
        return;
      }
      window.KidsKit.softEnding({
        emoji: '🎃🌙',
        title: '오늘 모험 대성공! 예쁜 호박 차와 사탕 친구들이 편안히 쉬러 가요',
        onAgain: () => {
          this.bumpLayoutSeed();
          this.rebuildStages();
          this.loadStage(0);
          this.showHint('손 씻고 맛있는 간식 먹으러 갈까? …아니면 또 출발! 🚂');
        },
        onRest: () => {
          window.location.href = '../../index.html';
        }
      });
    }

    renderGarageCarPreview() {
      const v = VEHICLES[this.currentVehicle];
      const hasCarSprite = this.hasAsset(v.assetKey);
      let partsHtml = '';
      this.garageData.equipped.forEach((partId) => {
        const part = PARTS.find((p) => p.id === partId);
        if (part) {
          const mark = this.assetMarkup(
            part.assetKey,
            part.icon,
            'sprite-img sprite-part'
          );
          partsHtml += part.render(true, mark);
        }
      });

      this.garageCarWrap.innerHTML =
        '<div class="pumpkin-car preview-large"><div class="car-engine' +
        (hasCarSprite ? ' has-car-sprite' : '') +
        '">' +
        partsHtml +
        '<span class="car-icon">' +
        this.assetMarkup(v.assetKey, v.icon, 'sprite-img sprite-car') +
        '</span>' +
        (hasCarSprite ? '' : '<span class="car-face">😊</span>') +
        '</div></div>';
    }

    renderGaragePartsGrid() {
      this.garagePartsGrid.innerHTML = '';
      PARTS.forEach((part) => {
        const isUnlocked = this.garageData.unlocked.has(part.id);
        const isEquipped = this.garageData.equipped.has(part.id);

        const card = document.createElement('div');
        card.className =
          'part-card ' +
          (isUnlocked ? '' : 'locked ') +
          (isEquipped ? 'equipped' : '');
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

        card.innerHTML =
          '<div class="part-icon">' +
          this.assetMarkup(part.assetKey, part.icon, 'sprite-img sprite-part') +
          '</div><div class="part-name">' +
          part.name +
          '</div><div class="part-desc" style="font-size: 11px; color: #64748b;">' +
          (isUnlocked ? part.desc : part.stageReward) +
          '</div><span class="part-status ' +
          statusClass +
          '">' +
          statusText +
          '</span>';
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
        conf.style.left = Math.random() * 100 + '%';
        conf.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];
        conf.style.animationDelay = Math.random() * 0.4 + 's';
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 1800);
      }
    }

    showHint(msg) {
      if (!this.hintBubble) return;
      if (this.hintText) {
        this.hintText.textContent = msg;
      } else {
        const spans = this.hintBubble.querySelectorAll('span');
        if (spans.length >= 2) spans[spans.length - 1].textContent = msg;
        else this.hintBubble.textContent = msg;
      }
      this.hintBubble.classList.add('pop-hint');
      setTimeout(() => this.hintBubble.classList.remove('pop-hint'), 300);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.game = new PumpkinTrainGame();
  });
})();
