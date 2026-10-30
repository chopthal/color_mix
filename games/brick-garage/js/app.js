/**
 * 브릭 특장차 차고 — 메인 로직
 * 흐름: 설계도 선택 → 탭 조립 → 완성 → 출동(차량별 미션) → 선반 저장
 */
(function () {
  'use strict';

  const BOARD_RATIO = 16 / 10;
  const BUILD_HINT_DELAY = 5000;
  const DRIVE_HINT_DELAY = 5000;

  const state = {
    screen: 'picker',
    category: 'fire',
    vehicle: null,
    partIndex: 0,
    wheels: 'normal',
    filled: {},
    buildLocked: false,
    buildToken: 0,
    drive: null,
    free: null,
    freeSaving: false,
    pendingUnlock: null,
    save: BrickStorage.load(),
  };

  const timers = {
    buildHint: null,
    driveHint: null,
    freeHint: null,
    drive: null,
    mission: null,
    unlock: null,
    toast: null,
  };

  const el = {};

  function cacheElements() {
    el.catTabs = document.getElementById('catTabs');
    el.vehicleGrid = document.getElementById('vehicleGrid');
    el.shelfCount = document.getElementById('shelfCount');
    el.btnFree = document.getElementById('btnFree');
    el.btnShelf = document.getElementById('btnShelf');
    el.btnSound = document.getElementById('btnSound');

    el.buildTitle = document.getElementById('buildTitle');
    el.progressDots = document.getElementById('progressDots');
    el.buildBoard = document.getElementById('buildBoard');
    el.tray = document.getElementById('tray');
    el.conveyor = document.getElementById('conveyor');
    el.buildHint = document.getElementById('buildHint');
    el.btnDispatch = document.getElementById('btnDispatch');
    el.btnBuildBack = document.getElementById('btnBuildBack');

    el.freeBoard = document.getElementById('freeBoard');
    el.freeHint = document.getElementById('freeHint');
    el.btnFreeBack = document.getElementById('btnFreeBack');
    el.btnShuffle = document.getElementById('btnShuffle');
    el.btnFreeDispatch = document.getElementById('btnFreeDispatch');
    el.btnSaveFree = document.getElementById('btnSaveFree');
    el.paintStrip = document.getElementById('paintStrip');

    el.city = document.getElementById('city');
    el.cityBuildings = document.getElementById('cityBuildings');
    el.driveCar = document.getElementById('driveCar');
    el.rock = document.getElementById('rock');
    el.missionLayer = document.getElementById('missionLayer');
    el.driveHint = document.getElementById('driveHint');
    el.driveActions = document.getElementById('driveActions');
    el.btnDriveAgain = document.getElementById('btnDriveAgain');
    el.btnDriveHome = document.getElementById('btnDriveHome');
    el.unlockCard = document.getElementById('unlockCard');

    el.shelfGrid = document.getElementById('shelfGrid');
    el.shelfEmpty = document.getElementById('shelfEmpty');
    el.btnShelfBack = document.getElementById('btnShelfBack');

    el.toast = document.getElementById('toast');
  }

  /* ─── 화면 ─── */
  function switchScreen(name) {
    state.screen = name;
    document.querySelectorAll('.screen').forEach((section) => {
      section.classList.toggle('is-active', section.id === 'screen' + capitalize(name));
    });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function showToast(text, duration) {
    el.toast.textContent = text;
    el.toast.classList.add('is-on');
    clearTimeout(timers.toast);
    timers.toast = setTimeout(() => el.toast.classList.remove('is-on'), duration || 1800);
  }

  /* ─── 브릭 만들기 ─── */
  function createBrick(part) {
    const brick = document.createElement('div');
    brick.className = 'brick brick--' + part.shape;
    brick.style.setProperty('--brick-color', part.color);
    if (part.pattern) brick.dataset.pattern = part.pattern;
    if (part.rotate) brick.style.setProperty('--rot', part.rotate + 'deg');
    if (part.glow) {
      brick.classList.add('is-glow');
      brick.style.setProperty('--glow-color', part.color);
    }

    if (part.studs > 0) {
      const studs = document.createElement('div');
      studs.className = 'brick__studs';
      for (let i = 0; i < part.studs; i += 1) {
        const stud = document.createElement('span');
        stud.className = 'brick__stud';
        studs.appendChild(stud);
      }
      brick.appendChild(studs);
    }

    if (part.shape === 'wheel' || part.shape === 'track') {
      const count = part.shape === 'wheel' ? 3 : 4;
      const lefts = part.shape === 'wheel' ? [8, 39, 70] : [5, 25, 45, 65];
      for (let i = 0; i < count; i += 1) {
        const unit = document.createElement('span');
        unit.className = 'wheel-unit';
        unit.style.left = lefts[i] + '%';
        brick.appendChild(unit);
      }
    }

    if (part.shape === 'cab') {
      const win = document.createElement('span');
      win.className = 'cab-window';
      win.textContent = part.driver || '🙂';
      brick.appendChild(win);
    }

    if (part.shape === 'gimmick') {
      const emoji = document.createElement('span');
      emoji.className = 'gimmick-emoji';
      emoji.textContent = part.emoji || '';
      brick.appendChild(emoji);
    }

    if (part.shape === 'siren') {
      const lightA = document.createElement('span');
      lightA.className = 'siren-light siren-light--a';
      const lightB = document.createElement('span');
      lightB.className = 'siren-light siren-light--b';
      brick.appendChild(lightA);
      brick.appendChild(lightB);
    }

    return brick;
  }

  function createSlot(part, isGuide) {
    const slot = document.createElement('div');
    slot.className = 'slot' + (isGuide ? ' is-guide' : '');
    slot.dataset.part = part.id;
    slot.style.left = part.slot.x + '%';
    slot.style.top = part.slot.y + '%';
    slot.style.width = part.slot.w + '%';
    slot.style.height = part.slot.h + '%';
    return slot;
  }

  function makeVehicleCombo(vehicle, wheels) {
    return {
      baseId: vehicle.id,
      gimmickId: vehicle.id,
      sirenColor: vehicle.sirenColor,
      wheels: wheels || 'normal',
      driver: vehicle.driver,
    };
  }

  function renderCombo(container, combo) {
    container.innerHTML = '';
    BG_PART_ORDER.forEach((partId) => {
      const part = bgResolveComboPart(combo, partId);
      const slot = createSlot(part, false);
      slot.appendChild(createBrick(part));
      container.appendChild(slot);
    });
  }

  /* ─── 1. 설계도 ─── */
  function renderCategoryTabs() {
    el.catTabs.innerHTML = '';

    BG_CATEGORIES.forEach((category) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'cat-tab' + (state.category === category.id ? ' is-active' : '');
      tab.style.setProperty('--cat-color', category.color);

      const icon = document.createElement('span');
      icon.className = 'cat-tab__icon';
      icon.textContent = category.icon;

      const label = document.createElement('span');
      label.textContent = category.label;

      tab.appendChild(icon);
      tab.appendChild(label);

      tab.addEventListener('click', () => {
        BrickSound.play('tap');
        state.category = category.id;
        renderCategoryTabs();
        renderPicker();
      });

      el.catTabs.appendChild(tab);
    });
  }

  function renderPicker() {
    el.vehicleGrid.innerHTML = '';

    bgRoster()
      .filter((vehicle) => (vehicle.category || 'fire') === state.category)
      .forEach((vehicle) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'vehicle-card';
      card.style.setProperty('--card-color', vehicle.color);

      if (BrickStorage.isBuilt(state.save, vehicle.id)) {
        card.classList.add('is-built');
      }

      const star = document.createElement('span');
      star.className = 'vehicle-card__built';
      star.textContent = '⭐';

      const icon = document.createElement('span');
      icon.className = 'vehicle-card__icon';
      icon.textContent = vehicle.icon;

      const name = document.createElement('span');
      name.className = 'vehicle-card__name';
      name.textContent = vehicle.name;

      card.appendChild(star);
      card.appendChild(icon);
      card.appendChild(name);

      card.addEventListener('click', () => {
        BrickSound.play('tap');
        startBuild(vehicle);
      });

      el.vehicleGrid.appendChild(card);
    });

    el.shelfCount.textContent = String(BrickStorage.countAll(state.save));
  }

  /* ─── 2. 조립 ─── */
  function startBuild(vehicle) {
    state.vehicle = vehicle;
    state.partIndex = 0;
    state.wheels = 'normal';
    state.filled = {};
    state.buildLocked = false;
    state.buildToken += 1;

    el.buildTitle.textContent = vehicle.icon + ' ' + vehicle.name;
    el.buildBoard.innerHTML = '';
    el.buildBoard.classList.remove('is-complete');
    el.btnDispatch.hidden = true;
    el.conveyor.style.display = '';

    BG_PART_ORDER.forEach((partId, index) => {
      const part = bgResolvePart(vehicle, partId, state.wheels);
      const slot = createSlot(part, true);
      if (index === 0) slot.classList.add('is-target');
      el.buildBoard.appendChild(slot);
    });

    el.progressDots.innerHTML = '';
    BG_PART_ORDER.forEach(() => {
      const dot = document.createElement('span');
      dot.className = 'dots__dot';
      el.progressDots.appendChild(dot);
    });

    clearBuildHint();
    renderTray();
    switchScreen('build');
  }

  function currentPart() {
    if (state.partIndex >= BG_PART_ORDER.length) return null;
    return bgResolvePart(state.vehicle, BG_PART_ORDER[state.partIndex], state.wheels);
  }

  function traySize(slot, limit) {
    const aspect = (slot.w / slot.h) * BOARD_RATIO;
    const maxWidth = limit || 210;
    let height = 82;
    let width = height * aspect;
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspect;
    }
    if (height > 96) {
      height = 96;
      width = height * aspect;
    }
    return { width: Math.round(width), height: Math.round(height) };
  }

  function makeTrayBrick(part, choiceId, limit) {
    const wrap = document.createElement('div');
    wrap.className = 'tray-brick';
    const size = traySize(part.slot, limit);
    wrap.style.width = size.width + 'px';
    wrap.style.height = size.height + 'px';

    wrap.appendChild(createBrick(part));

    wrap.addEventListener('click', () => {
      if (state.buildLocked) return;
      clearBuildHint();
      placePart(part, choiceId);
    });

    return wrap;
  }

  function renderTray() {
    const part = currentPart();
    el.tray.innerHTML = '';

    document.querySelectorAll('.slot.is-target').forEach((s) => {
      s.classList.remove('is-target');
    });

    if (!part) return;

    const targetSlot = el.buildBoard.querySelector('[data-part="' + part.id + '"]');
    if (targetSlot) targetSlot.classList.add('is-target');

    if (part.choices) {
      part.choices.forEach((choice) => {
        const resolved = bgResolvePart(state.vehicle, part.id, choice.id);
        el.tray.appendChild(makeTrayBrick(resolved, choice.id, 132));
      });
    } else {
      el.tray.appendChild(makeTrayBrick(part, null));
    }

    scheduleBuildHint();
  }

  function placePart(part, choiceId) {
    if (state.buildLocked) return;
    state.buildLocked = true;
    BrickSound.play('tap');
    if (choiceId) part = bgResolvePart(state.vehicle, part.id, choiceId);
    state.wheels = choiceId || state.wheels;

    const token = state.buildToken;
    const targetSlot = el.buildBoard.querySelector('[data-part="' + part.id + '"]');
    const wrap = el.tray.querySelector('.tray-brick');
    if (!targetSlot || !wrap) {
      state.buildLocked = false;
      return;
    }

    const from = wrap.getBoundingClientRect();
    const to = targetSlot.getBoundingClientRect();
    const brick = wrap.querySelector('.brick');

    const clone = brick.cloneNode(true);
    clone.classList.add('brick--flying');
    clone.style.left = from.left + 'px';
    clone.style.top = from.top + 'px';
    clone.style.width = from.width + 'px';
    clone.style.height = from.height + 'px';
    document.body.appendChild(clone);

    wrap.style.visibility = 'hidden';

    let revealed = false;
    let fallbackId = null;

    // 상태 진행은 애니메이션 완료에 의존하지 않는다.
    // (백그라운드 탭·모션 감소 환경에서도 조립이 막히지 않도록)
    function reveal() {
      if (revealed) return;
      revealed = true;
      clearTimeout(fallbackId);
      clone.remove();
      if (token !== state.buildToken) return;
      targetSlot.classList.remove('is-guide', 'is-target');
      targetSlot.innerHTML = '';
      const placed = createBrick(part);
      placed.classList.add('is-new');
      if (part.id === 'siren') placed.classList.add('is-alive');
      targetSlot.appendChild(placed);
      BrickSound.play('snap');
    }

    const dx = to.left - from.left;
    const dy = to.top - from.top;
    const sx = Math.max(0.05, to.width / from.width);
    const sy = Math.max(0.05, to.height / from.height);

    const anim = clone.animate(
      [
        { transform: 'translate(0, 0) scale(1, 1) rotate(0deg)' },
        {
          transform:
            'translate(' + dx * 0.5 + 'px, ' + (dy - 34) + 'px) scale(' +
            (1 + sx) / 2 + ', ' + (1 + sy) / 2 + ') rotate(-10deg)',
          offset: 0.55,
        },
        {
          transform:
            'translate(' + dx + 'px, ' + dy + 'px) scale(' + sx + ', ' + sy + ') rotate(0deg)',
        },
      ],
      { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
    );
    anim.onfinish = reveal;
    fallbackId = setTimeout(reveal, 420);

    state.filled[part.id] = true;
    state.partIndex += 1;

    const dots = el.progressDots.querySelectorAll('.dots__dot');
    if (dots[state.partIndex - 1]) dots[state.partIndex - 1].classList.add('is-on');

    if (state.partIndex >= BG_PART_ORDER.length) {
      clearBuildHint();
      el.tray.innerHTML = '';
      el.conveyor.style.display = 'none';
      setTimeout(() => {
        if (token !== state.buildToken) return;
        state.buildLocked = false;
        completeBuild();
      }, 430);
    } else {
      renderTray();
      state.buildLocked = false;
    }
  }

  function completeBuild() {
    clearBuildHint();
    state.buildLocked = true;

    el.tray.innerHTML = '';
    el.conveyor.style.display = 'none';
    el.buildBoard.classList.add('is-complete');

    const siren = el.buildBoard.querySelector('.brick--siren');
    if (siren) siren.classList.add('is-alive');

    BrickSound.play('fanfare');
    setTimeout(() => BrickSound.play('siren'), 450);

    BrickStorage.markBuilt(state.save, state.vehicle.id, state.wheels);
    el.shelfCount.textContent = String(BrickStorage.countAll(state.save));

    showToast('철컥! 완성! 🧱', 1600);

    setTimeout(() => {
      el.btnDispatch.hidden = false;
      state.buildLocked = false;
    }, 500);
  }

  function scheduleBuildHint() {
    clearBuildHint();
    timers.buildHint = setTimeout(() => {
      el.buildHint.classList.add('is-on');
      el.conveyor.classList.add('is-hint');
    }, BUILD_HINT_DELAY);
  }

  function clearBuildHint() {
    clearTimeout(timers.buildHint);
    el.buildHint.classList.remove('is-on');
    el.conveyor.classList.remove('is-hint');
  }

  /* ─── 2-B. 자유 조립 ─── */
  const FREE_SIREN_COLORS = ['#ff5252', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];
  const FREE_PAINT_COLORS = ['#e63946', '#2563eb', '#f9c74f', '#4ade80', '#a855f7', '#f97316'];

  function isSpecialUnlocked(id) {
    return Array.isArray(state.save.specials) && state.save.specials.includes(id);
  }

  function freeSirenColors() {
    const list = FREE_SIREN_COLORS.slice();
    if (isSpecialUnlocked('neon_siren')) list.push(BG_NEON_SIREN_COLOR);
    return list;
  }

  function freeGimmickIds() {
    const list = BG_FREE_GIMMICK_IDS.slice();
    if (isSpecialUnlocked('gold_hook')) list.push('special_gold_hook');
    return list;
  }

  function freeWheelIds() {
    const list = ['normal', 'monster'];
    if (isSpecialUnlocked('jet_engine')) list.push('jet');
    return list;
  }

  function startFree() {
    state.free = {
      baseId: 'fire_ladder',
      gimmickId: 'excavator',
      sirenColor: '#ff5252',
      wheels: 'normal',
      driver: '🧑‍🚒',
      paint: '#e63946',
    };
    state.freeSaving = false;
    renderFreeBoard();
    renderPaintStrip();
    clearFreeHint();
    switchScreen('free');
    scheduleFreeHint();
  }

  function renderPaintStrip() {
    el.paintStrip.innerHTML = '';

    FREE_PAINT_COLORS.forEach((color) => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'paint-swatch';
      swatch.style.setProperty('--paint-color', color);
      swatch.setAttribute('aria-label', '색 바꾸기');
      if (color === state.free.paint) swatch.classList.add('is-selected');
      swatch.addEventListener('click', () => selectPaint(color));
      el.paintStrip.appendChild(swatch);
    });
  }

  function updatePaintSelection() {
    if (!el.paintStrip) return;
    el.paintStrip.querySelectorAll('.paint-swatch').forEach((swatch) => {
      swatch.classList.toggle(
        'is-selected',
        swatch.style.getPropertyValue('--paint-color') === state.free.paint
      );
    });
  }

  function selectPaint(color) {
    if (state.freeSaving) return;
    state.free.paint = color;
    BrickSound.play('pop');
    renderFreeBoard('base');
  }

  function renderFreeBoard(popPartId) {
    el.freeBoard.innerHTML = '';

    BG_PART_ORDER.forEach((partId) => {
      const part = bgResolveComboPart(state.free, partId);
      const slot = createSlot(part, false);
      const brick = createBrick(part);
      if (partId === popPartId) brick.classList.add('is-new');
      slot.appendChild(brick);

      if (
        partId === 'base' ||
        partId === 'wheels' ||
        partId === 'cab' ||
        partId === 'gimmick' ||
        partId === 'siren'
      ) {
        slot.classList.add('is-swappable');
        slot.addEventListener('click', () => {
          clearFreeHint();
          cycleFree(partId);
          scheduleFreeHint();
        });
      }

      el.freeBoard.appendChild(slot);
    });

    updatePaintSelection();
  }

  function nextIn(list, current) {
    const index = list.indexOf(current);
    return list[(index + 1) % list.length];
  }

  function cycleFree(partId) {
    if (partId === 'base') {
      state.free.baseId = nextIn(BG_FREE_BASE_IDS, state.free.baseId);
    }
    if (partId === 'gimmick') {
      state.free.gimmickId = nextIn(freeGimmickIds(), state.free.gimmickId);
    }
    if (partId === 'cab') state.free.driver = nextIn(BG_DRIVERS, state.free.driver);
    if (partId === 'siren') {
      state.free.sirenColor = nextIn(freeSirenColors(), state.free.sirenColor);
    }
    if (partId === 'wheels') {
      state.free.wheels = nextIn(freeWheelIds(), state.free.wheels);
    }

    BrickSound.play('snap');
    renderFreeBoard(partId);
  }

  function shuffleFree() {
    const pick = (list) => list[Math.floor(Math.random() * list.length)];

    state.free = {
      baseId: pick(BG_FREE_BASE_IDS),
      gimmickId: pick(freeGimmickIds()),
      sirenColor: pick(freeSirenColors()),
      wheels: pick(freeWheelIds()),
      driver: pick(BG_DRIVERS),
      paint: pick(FREE_PAINT_COLORS),
    };

    BrickSound.play('pop');
    renderFreeBoard('gimmick');
  }

  function currentFreeCombo() {
    return {
      baseId: state.free.baseId,
      gimmickId: state.free.gimmickId,
      sirenColor: state.free.sirenColor,
      wheels: state.free.wheels,
      driver: state.free.driver,
      paint: state.free.paint,
    };
  }

  function dispatchFree() {
    if (state.freeSaving) return;
    BrickSound.play('siren');
    startDrive(currentFreeCombo());
  }

  function saveFree() {
    if (state.freeSaving) return;
    state.freeSaving = true;

    BrickSound.play('fanfare');
    BrickStorage.markFree(state.save, currentFreeCombo());
    el.shelfCount.textContent = String(BrickStorage.countAll(state.save));
    showToast('저장! 🏅', 1400);
    clearFreeHint();

    setTimeout(() => {
      state.freeSaving = false;
      renderShelf();
      switchScreen('shelf');
    }, 700);
  }

  function scheduleFreeHint() {
    clearFreeHint();
    timers.freeHint = setTimeout(() => {
      el.freeHint.classList.add('is-on');
    }, BUILD_HINT_DELAY);
  }

  function clearFreeHint() {
    clearTimeout(timers.freeHint);
    el.freeHint.classList.remove('is-on');
  }

  /* ─── 3. 출동 ─── */
  function missionFor(combo) {
    const gimmick = bgComboGimmickType(combo);
    if (gimmick === 'ladder' || gimmick === 'cannon') return 'water';
    if (gimmick === 'arm' || gimmick === 'boom') return 'crane';
    if (gimmick === 'drum') return 'pour';
    if (gimmick === 'carrier') return 'load';
    return 'rock';
  }

  function startDrive(combo) {
    const mission = missionFor(combo);
    state.drive = {
      combo,
      mission,
      done: false,
      remaining: 0,
      hintEl: null,
      slots: null,
      bridge: null,
    };

    clearTimeout(timers.drive);
    clearTimeout(timers.driveHint);
    clearTimeout(timers.mission);
    clearTimeout(timers.unlock);
    el.unlockCard.hidden = true;
    el.unlockCard.innerHTML = '';
    state.pendingUnlock = null;
    el.driveHint.classList.remove('is-on');
    el.driveActions.hidden = true;
    el.driveCar.classList.remove('is-driving');

    el.rock.classList.remove('is-hint', 'is-breaking', 'is-broken');
    el.rock.style.display = mission === 'rock' ? '' : 'none';
    el.missionLayer.innerHTML = '';

    renderCombo(el.driveCar, combo);

    if (mission === 'rock') {
      renderRock();
      state.drive.hintEl = el.rock;
    } else if (mission === 'water') {
      renderWaterMission();
    } else if (mission === 'crane') {
      renderCraneMission();
    } else if (mission === 'pour') {
      renderPourMission();
    } else {
      renderLoadMission();
    }

    el.driveCar.style.transition = 'none';
    void el.driveCar.offsetWidth;
    el.driveCar.style.transition = '';

    switchScreen('drive');

    timers.driveHint = setTimeout(() => {
      if (!state.drive || state.drive.done) return;
      el.driveHint.classList.add('is-on');
      if (state.drive.hintEl) state.drive.hintEl.classList.add('is-hint');
    }, DRIVE_HINT_DELAY);
  }

  function completeMission() {
    if (!state.drive || state.drive.done) return;
    state.drive.done = true;
    recordMission();

    clearTimeout(timers.driveHint);
    el.driveHint.classList.remove('is-on');
    if (state.drive.hintEl) state.drive.hintEl.classList.remove('is-hint');

    timers.drive = setTimeout(() => {
      el.driveCar.classList.add('is-driving');
      BrickSound.play('drive');

      timers.drive = setTimeout(() => {
        el.driveActions.hidden = false;
        showToast('출동 성공! 🎉', 1800);
        if (state.pendingUnlock) {
          showUnlock(state.pendingUnlock);
          state.pendingUnlock = null;
        }
      }, 1500);
    }, 420);
  }

  function recordMission() {
    state.save.missions = (state.save.missions || 0) + 1;

    const newly = BG_SPECIAL_ORDER.filter((id) => {
      return state.save.missions >= BG_SPECIALS[id].threshold && !isSpecialUnlocked(id);
    });

    if (newly.length) {
      newly.forEach((id) => state.save.specials.push(id));
      state.pendingUnlock = BG_SPECIALS[newly[newly.length - 1]];
    }

    BrickStorage.save(state.save);
  }

  function showUnlock(special) {
    el.unlockCard.innerHTML = '';

    const icon = document.createElement('span');
    icon.className = 'unlock-card__icon';
    icon.textContent = special.emoji;

    const text = document.createElement('span');
    text.className = 'unlock-card__text';

    const label = document.createElement('span');
    label.className = 'unlock-card__label';
    label.textContent = '새 부품!';

    const name = document.createElement('span');
    name.className = 'unlock-card__name';
    name.textContent = special.name;

    text.appendChild(label);
    text.appendChild(name);
    el.unlockCard.appendChild(icon);
    el.unlockCard.appendChild(text);
    el.unlockCard.hidden = false;

    BrickSound.play('fanfare');
    clearTimeout(timers.unlock);
    timers.unlock = setTimeout(() => {
      el.unlockCard.hidden = true;
    }, 3400);
  }

  function renderCity() {
    const palette = ['#93c5fd', '#f9a8d4', '#fcd34d', '#86efac', '#c4b5fd', '#fdba74', '#a5b4fc'];
    const heights = [52, 74, 44, 88, 60, 70, 48];
    el.cityBuildings.innerHTML = '';
    heights.forEach((height, i) => {
      const block = document.createElement('span');
      block.className = 'city-block';
      block.style.height = height + '%';
      block.style.setProperty('--block-color', palette[i % palette.length]);
      el.cityBuildings.appendChild(block);
    });
  }

  function renderRock() {
    const layout = [
      [16, 52], [42, 50], [68, 54], [86, 56],
      [10, 30], [36, 26], [62, 30], [82, 32],
      [22, 8], [48, 9], [72, 11],
      [32, 72], [58, 73], [12, 70], [84, 72],
    ];
    const palette = ['#cbd5e1', '#94a3b8', '#a8b3c2', '#f9a826', '#60a5fa', '#ef4444', '#4ade80'];

    el.rock.innerHTML = '';
    el.rock.classList.remove('is-broken', 'is-breaking', 'is-hint');

    layout.forEach((pos, i) => {
      const piece = document.createElement('span');
      piece.className = 'rock__piece';
      const w = 22 + (i % 3) * 3;
      const h = 19 + (i % 2) * 4;
      piece.style.left = pos[0] + '%';
      piece.style.top = pos[1] + '%';
      piece.style.width = w + '%';
      piece.style.height = h + '%';
      piece.style.setProperty('--brick-color', palette[i % palette.length]);
      el.rock.appendChild(piece);
    });
  }

  function breakRock() {
    if (!state.drive || state.drive.mission !== 'rock' || state.drive.done) return;

    clearTimeout(timers.driveHint);
    el.driveHint.classList.remove('is-on');
    el.rock.classList.remove('is-hint');
    el.rock.classList.add('is-breaking');

    BrickSound.play('smash');

    const pieces = el.rock.querySelectorAll('.rock__piece');
    pieces.forEach((piece) => {
      const tx = (Math.random() * 2 - 1) * 150;
      const ty = -40 - Math.random() * 130;
      const rot = (Math.random() * 2 - 1) * 200;
      piece.animate(
        [
          { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
          {
            transform: 'translate(' + tx + 'px, ' + ty + 'px) rotate(' + rot + 'deg)',
            opacity: 0.95,
            offset: 0.7,
          },
          {
            transform:
              'translate(' + tx * 1.15 + 'px, ' + (ty + 150) + 'px) rotate(' +
              rot * 1.3 + 'deg)',
            opacity: 0,
          },
        ],
        {
          duration: 850 + Math.random() * 350,
          easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)',
          fill: 'forwards',
        }
      );
    });

    timers.drive = setTimeout(() => {
      el.rock.classList.add('is-broken');
      completeMission();
    }, 420);
  }

  /* ─── 출동 A: 소방 물 발사 ─── */
  function renderWaterMission() {
    const building = document.createElement('div');
    building.className = 'fire-building';

    [
      [14, 16],
      [52, 20],
      [30, 52],
      [66, 56],
    ].forEach((pos) => {
      const win = document.createElement('span');
      win.className = 'fire-window';
      win.style.left = pos[0] + '%';
      win.style.top = pos[1] + '%';
      building.appendChild(win);
    });

    const layer = document.createElement('div');
    layer.className = 'flame-layer';

    const flames = [
      [24, 12],
      [60, 16],
      [40, 42],
      [70, 46],
      [18, 62],
    ];
    flames.forEach((pos) => {
      const flame = document.createElement('button');
      flame.type = 'button';
      flame.className = 'flame';
      flame.style.left = pos[0] + '%';
      flame.style.top = pos[1] + '%';

      const emoji = document.createElement('span');
      emoji.className = 'flame__emoji';
      emoji.textContent = '🔥';
      flame.appendChild(emoji);
      flame.addEventListener('click', () => extinguishFlame(flame));
      layer.appendChild(flame);
    });

    building.appendChild(layer);
    el.missionLayer.appendChild(building);

    const nozzle = document.createElement('span');
    nozzle.className = 'fire-nozzle';
    nozzle.textContent = '💦';
    el.driveCar.appendChild(nozzle);

    state.drive.remaining = flames.length;
    state.drive.hintEl = layer.querySelector('.flame');
  }

  function extinguishFlame(flame) {
    if (!state.drive || state.drive.mission !== 'water' || state.drive.done) return;
    if (flame.classList.contains('is-out')) return;

    flame.classList.add('is-out');
    BrickSound.play('water');
    spawnWater(flame);

    if (state.drive.hintEl === flame) {
      state.drive.hintEl = el.missionLayer.querySelector('.flame:not(.is-out)');
      if (state.drive.hintEl) state.drive.hintEl.classList.add('is-hint');
    }

    state.drive.remaining -= 1;
    if (state.drive.remaining <= 0) {
      timers.mission = setTimeout(completeMission, 520);
    }
  }

  function spawnWater(flame) {
    const nozzle = el.driveCar.querySelector('.fire-nozzle') || el.driveCar;
    const from = nozzle.getBoundingClientRect();
    const to = flame.getBoundingClientRect();
    const startX = from.left + from.width * 0.5;
    const startY = from.top + from.height * 0.4;
    const dx = to.left + to.width * 0.5 - startX;
    const dy = to.top + to.height * 0.5 - startY;

    for (let i = 0; i < 5; i += 1) {
      const drop = document.createElement('span');
      drop.className = 'water-drop';
      drop.style.left = startX + 'px';
      drop.style.top = startY + 'px';
      document.body.appendChild(drop);
      drop
        .animate(
          [
            { transform: 'translate(0, 0) scale(0.5)' },
            {
              transform:
                'translate(' + (dx * 0.5 + (i - 2) * 22) + 'px, ' +
                (dy * 0.5 - 46) + 'px) scale(1)',
              offset: 0.55,
            },
            { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(0.4)', opacity: 0 },
          ],
          { duration: 420 + i * 35, easing: 'ease-out', fill: 'forwards' }
        )
        .finished.then(() => drop.remove())
        .catch(() => drop.remove());
    }
  }

  /* ─── 출동 B: 크레인 다리 놓기 ─── */
  function renderCraneMission() {
    const bridge = document.createElement('div');
    bridge.className = 'crane-bridge';

    const left = document.createElement('div');
    left.className = 'bridge-deck';
    const right = document.createElement('div');
    right.className = 'bridge-deck';
    const gap = document.createElement('div');
    gap.className = 'bridge-gap';

    const colors = ['#60a5fa', '#f9a826', '#4ade80'];
    const slots = [];
    for (let i = 0; i < 3; i += 1) {
      const slot = document.createElement('div');
      slot.className = 'bridge-slot';
      slot.style.setProperty('--brick-color', colors[i]);
      gap.appendChild(slot);
      slots.push(slot);
    }

    bridge.appendChild(left);
    bridge.appendChild(gap);
    bridge.appendChild(right);
    el.missionLayer.appendChild(bridge);

    const positions = [
      { left: 58, bottom: 54, color: colors[0] },
      { left: 70, bottom: 60, color: colors[1] },
      { left: 63, bottom: 70, color: colors[2] },
    ];

    const blocks = [];
    positions.forEach((pos) => {
      const block = document.createElement('button');
      block.type = 'button';
      block.className = 'loose-block';
      block.style.left = pos.left + '%';
      block.style.bottom = pos.bottom + '%';
      block.style.setProperty('--brick-color', pos.color);
      block.addEventListener('click', () => placeBridgeBlock(block, slots));
      el.missionLayer.appendChild(block);
      blocks.push(block);
    });

    const hook = document.createElement('span');
    hook.className = 'crane-hook';
    hook.textContent = '🪝';
    el.driveCar.appendChild(hook);

    state.drive.remaining = 3;
    state.drive.slots = slots;
    state.drive.bridge = bridge;
    state.drive.hintEl = blocks[0];
  }

  function placeBridgeBlock(block, slots) {
    if (!state.drive || state.drive.mission !== 'crane' || state.drive.done) return;
    if (block.classList.contains('is-used')) return;

    const slot = slots.find(
      (s) => !s.classList.contains('is-filled') && !s.classList.contains('is-reserved')
    );
    if (!slot) return;
    slot.classList.add('is-reserved');

    const from = block.getBoundingClientRect();
    const to = slot.getBoundingClientRect();
    const color = block.style.getPropertyValue('--brick-color');

    block.classList.add('is-used');
    BrickSound.play('tap');

    const clone = document.createElement('span');
    clone.className = 'brick loose-block brick--flying';
    clone.style.setProperty('--brick-color', color);
    clone.style.left = from.left + 'px';
    clone.style.top = from.top + 'px';
    clone.style.bottom = 'auto';
    clone.style.width = from.width + 'px';
    clone.style.height = from.height + 'px';
    document.body.appendChild(clone);

    const drive = state.drive;
    let revealed = false;
    let fallbackId = null;

    function reveal() {
      if (revealed) return;
      revealed = true;
      clearTimeout(fallbackId);
      clone.remove();
      if (state.drive !== drive) return;
      slot.classList.remove('is-reserved');
      slot.classList.add('is-filled');
      slot.style.setProperty('--brick-color', color);
      BrickSound.play('snap');
    }

    const dx = to.left - from.left;
    const dy = to.top - from.top;
    const sx = Math.max(0.05, to.width / from.width);
    const sy = Math.max(0.05, to.height / from.height);

    const anim = clone.animate(
      [
        { transform: 'translate(0, 0) scale(1, 1) rotate(0deg)' },
        {
          transform:
            'translate(' + dx * 0.5 + 'px, ' + (dy - 60) + 'px) scale(' +
            (1 + sx) / 2 + ', ' + (1 + sy) / 2 + ') rotate(12deg)',
          offset: 0.55,
        },
        {
          transform:
            'translate(' + dx + 'px, ' + dy + 'px) scale(' + sx + ', ' + sy + ') rotate(0deg)',
        },
      ],
      { duration: 380, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
    );
    anim.onfinish = reveal;
    fallbackId = setTimeout(reveal, 460);

    if (state.drive.hintEl === block) {
      state.drive.hintEl = el.missionLayer.querySelector('.loose-block:not(.is-used)');
      if (state.drive.hintEl) state.drive.hintEl.classList.add('is-hint');
    }

    state.drive.remaining -= 1;
    if (state.drive.remaining <= 0) {
      timers.mission = setTimeout(completeMission, 520);
    }
  }

  /* ─── 출동 C: 레미콘 길 메우기 ─── */
  function renderPourMission() {
    const hole = document.createElement('div');
    hole.className = 'pour-hole';
    hole.addEventListener('click', () => pourIntoHole(hole));

    const slots = [];
    for (let i = 0; i < 3; i += 1) {
      const slot = document.createElement('span');
      slot.className = 'pour-slot';
      hole.appendChild(slot);
      slots.push(slot);
    }
    el.missionLayer.appendChild(hole);

    state.drive.hole = hole;
    state.drive.slots = slots;
    state.drive.remaining = 3;
    state.drive.hintEl = hole;
  }

  function pourIntoHole(hole) {
    if (!state.drive || state.drive.mission !== 'pour' || state.drive.done) return;

    const slots = state.drive.slots;
    const slot = slots.find(
      (s) => !s.classList.contains('is-filled') && !s.classList.contains('is-reserved')
    );
    if (!slot) return;
    slot.classList.add('is-reserved');

    const fromEl = el.driveCar.querySelector('[data-part="gimmick"]') || el.driveCar;
    const from = fromEl.getBoundingClientRect();
    const to = slot.getBoundingClientRect();

    BrickSound.play('pour');

    const blob = document.createElement('span');
    blob.className = 'cement-blob';
    blob.style.left = from.left + from.width * 0.5 + 'px';
    blob.style.top = from.top + from.height * 0.6 + 'px';
    document.body.appendChild(blob);

    const drive = state.drive;
    let revealed = false;
    let fallbackId = null;

    function reveal() {
      if (revealed) return;
      revealed = true;
      clearTimeout(fallbackId);
      blob.remove();
      if (state.drive !== drive) return;
      slot.classList.remove('is-reserved');
      slot.classList.add('is-filled');
      BrickSound.play('snap');
    }

    const startX = from.left + from.width * 0.5;
    const startY = from.top + from.height * 0.6;
    const dx = to.left + to.width * 0.5 - startX;
    const dy = to.top + to.height * 0.5 - startY;

    blob
      .animate(
        [
          { transform: 'translate(0, 0) scale(0.6)' },
          {
            transform:
              'translate(' + dx * 0.5 + 'px, ' + dy * 0.4 + 'px) scale(1)',
            offset: 0.55,
          },
          { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(0.8)', opacity: 0.95 },
        ],
        { duration: 380, easing: 'ease-in', fill: 'forwards' }
      )
      .finished.then(reveal)
      .catch(reveal);
    fallbackId = setTimeout(reveal, 460);

    state.drive.remaining -= 1;
    if (state.drive.remaining <= 0) {
      setTimeout(() => hole.classList.add('is-full'), 420);
      timers.mission = setTimeout(completeMission, 640);
    }
  }

  /* ─── 출동 D: 카캐리어 미니카 싣기 ─── */
  function renderLoadMission() {
    const positions = [
      { left: 53, top: 29 },
      { left: 71, top: 29 },
      { left: 62, top: 44 },
    ];

    const slots = positions.map((pos) => {
      const slot = document.createElement('span');
      slot.className = 'load-slot';
      slot.style.left = pos.left + '%';
      slot.style.top = pos.top + '%';
      slot.style.width = '16%';
      slot.style.height = '12%';
      el.driveCar.appendChild(slot);
      return slot;
    });

    const colors = ['#60a5fa', '#f9a826', '#4ade80'];
    const floats = [
      { left: 62, bottom: 58 },
      { left: 74, bottom: 66 },
      { left: 66, bottom: 74 },
    ];

    const cars = [];
    floats.forEach((pos, i) => {
      const car = document.createElement('button');
      car.type = 'button';
      car.className = 'mini-car';
      car.style.left = pos.left + '%';
      car.style.bottom = pos.bottom + '%';
      car.style.setProperty('--car-color', colors[i]);
      car.addEventListener('click', () => loadMiniCar(car, slots));
      el.missionLayer.appendChild(car);
      cars.push(car);
    });

    state.drive.slots = slots;
    state.drive.remaining = 3;
    state.drive.hintEl = cars[0];
  }

  function loadMiniCar(car, slots) {
    if (!state.drive || state.drive.mission !== 'load' || state.drive.done) return;
    if (car.classList.contains('is-used')) return;

    const slot = slots.find(
      (s) => !s.classList.contains('is-filled') && !s.classList.contains('is-reserved')
    );
    if (!slot) return;
    slot.classList.add('is-reserved');

    const from = car.getBoundingClientRect();
    const to = slot.getBoundingClientRect();
    const color = car.style.getPropertyValue('--car-color');

    car.classList.add('is-used');
    BrickSound.play('tap');

    const clone = document.createElement('span');
    clone.className = 'mini-car brick--flying';
    clone.style.setProperty('--car-color', color);
    clone.style.left = from.left + 'px';
    clone.style.top = from.top + 'px';
    clone.style.bottom = 'auto';
    clone.style.width = from.width + 'px';
    clone.style.height = from.height + 'px';
    document.body.appendChild(clone);

    const drive = state.drive;
    let revealed = false;
    let fallbackId = null;

    function reveal() {
      if (revealed) return;
      revealed = true;
      clearTimeout(fallbackId);
      clone.remove();
      if (state.drive !== drive) return;
      slot.classList.remove('is-reserved');
      slot.classList.add('is-filled');
      slot.style.background = color;
      BrickSound.play('snap');
    }

    const dx = to.left - from.left;
    const dy = to.top - from.top;
    const sx = Math.max(0.05, to.width / from.width);
    const sy = Math.max(0.05, to.height / from.height);

    const anim = clone.animate(
      [
        { transform: 'translate(0, 0) scale(1, 1) rotate(0deg)' },
        {
          transform:
            'translate(' + dx * 0.5 + 'px, ' + (dy - 50) + 'px) scale(' +
            (1 + sx) / 2 + ', ' + (1 + sy) / 2 + ') rotate(-12deg)',
          offset: 0.55,
        },
        {
          transform:
            'translate(' + dx + 'px, ' + dy + 'px) scale(' + sx + ', ' + sy + ') rotate(0deg)',
        },
      ],
      { duration: 380, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
    );
    anim.onfinish = reveal;
    fallbackId = setTimeout(reveal, 460);

    if (state.drive.hintEl === car) {
      state.drive.hintEl = el.missionLayer.querySelector('.mini-car:not(.is-used)');
      if (state.drive.hintEl) state.drive.hintEl.classList.add('is-hint');
    }

    state.drive.remaining -= 1;
    if (state.drive.remaining <= 0) {
      timers.mission = setTimeout(completeMission, 520);
    }
  }

  /* ─── 4. 선반 ─── */
  function buildShelfEntries() {
    const entries = [];

    state.save.built.forEach((item) => {
      const vehicle = bgRoster().find((v) => v.id === item.id);
      if (!vehicle) return;
      entries.push({
        at: item.at || 0,
        combo: makeVehicleCombo(vehicle, item.wheels),
        label: vehicle.icon + ' ' + vehicle.name,
      });
    });

    state.save.free.forEach((item) => {
      const base = bgGetVehicle(item.baseId);
      const combo = {
        baseId: item.baseId,
        gimmickId: item.gimmickId,
        sirenColor: item.sirenColor,
        wheels: item.wheels,
        driver: item.driver,
        paint: item.paint,
      };
      const gimmickPart = bgResolveComboPart(combo, 'gimmick');
      entries.push({
        at: item.at || 0,
        combo,
        label: base.icon + ' ' + base.name + ' ' + (gimmickPart.emoji || ''),
      });
    });

    return entries.sort((a, b) => b.at - a.at);
  }

  function renderShelf() {
    const entries = buildShelfEntries();
    el.shelfGrid.innerHTML = '';
    el.shelfEmpty.classList.toggle('is-on', entries.length === 0);

    entries.forEach((entry) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'shelf-card';

      const mini = document.createElement('div');
      mini.className = 'mini-board';
      renderCombo(mini, entry.combo);

      const name = document.createElement('span');
      name.className = 'shelf-card__name';
      name.textContent = entry.label;

      card.appendChild(mini);
      card.appendChild(name);

      card.addEventListener('click', () => {
        BrickSound.play('tap');
        startDrive(entry.combo);
      });

      el.shelfGrid.appendChild(card);
    });
  }

  /* ─── 사운드 토글 ─── */
  function updateSoundButton() {
    BrickSound.muted = !state.save.sound;
    el.btnSound.textContent = state.save.sound ? '🔊' : '🔇';
  }

  function toggleSound() {
    state.save.sound = !state.save.sound;
    BrickStorage.save(state.save);
    updateSoundButton();
    if (state.save.sound) BrickSound.play('pop');
  }

  /* ─── 이벤트 ─── */
  function bindEvents() {
    el.btnSound.addEventListener('click', toggleSound);

    el.btnFree.addEventListener('click', () => {
      BrickSound.play('tap');
      startFree();
    });

    el.btnShelf.addEventListener('click', () => {
      BrickSound.play('tap');
      renderShelf();
      switchScreen('shelf');
    });

    el.btnFreeBack.addEventListener('click', () => {
      BrickSound.play('pop');
      clearFreeHint();
      state.freeSaving = false;
      renderPicker();
      switchScreen('picker');
    });

    el.btnShuffle.addEventListener('click', () => {
      if (state.freeSaving) return;
      clearFreeHint();
      shuffleFree();
      scheduleFreeHint();
    });

    el.btnFreeDispatch.addEventListener('click', dispatchFree);

    el.btnSaveFree.addEventListener('click', saveFree);

    el.btnShelfBack.addEventListener('click', () => {
      BrickSound.play('tap');
      renderPicker();
      switchScreen('picker');
    });

    el.btnBuildBack.addEventListener('click', () => {
      BrickSound.play('pop');
      clearBuildHint();
      state.buildToken += 1;
      state.buildLocked = false;
      renderPicker();
      switchScreen('picker');
    });

    el.btnDispatch.addEventListener('click', () => {
      if (!state.vehicle) return;
      BrickSound.play('siren');
      startDrive(makeVehicleCombo(state.vehicle, state.wheels));
    });

    el.rock.addEventListener('click', breakRock);

    el.btnDriveAgain.addEventListener('click', () => {
      if (!state.drive) return;
      BrickSound.play('tap');
      startDrive(state.drive.combo);
    });

    el.btnDriveHome.addEventListener('click', () => {
      BrickSound.play('pop');
      clearTimeout(timers.drive);
      clearTimeout(timers.driveHint);
      clearTimeout(timers.mission);
      clearTimeout(timers.unlock);
      el.unlockCard.hidden = true;
      renderPicker();
      switchScreen('picker');
    });

    const unlock = () => BrickSound.unlock();
    document.addEventListener('pointerdown', unlock, { once: true });
  }

  function init() {
    cacheElements();
    updateSoundButton();
    renderCategoryTabs();
    renderPicker();
    renderCity();
    bindEvents();
    switchScreen('picker');
  }

  init();
})();
