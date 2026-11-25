/**
 * 꼬물꼬물 텃밭 (veggie-garden)
 * 심기 → 물 → 수확 → 창고 → 믹서/샐러드 → 냠냠 → 소프트 엔딩
 * No Penalty · 타이머 압박 없음 · 시들기 없음
 */
(() => {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RING_LEN = 289;
  const COOKS_TO_END = 3;
  const MAX_SHELF_SHOW = 10;
  const STORE_KEY = 'v1';
  const store = window.KidsKit
    ? window.KidsKit.store('veggieGarden')
    : {
        get(_k, fb) {
          return fb;
        },
        set() {
          return false;
        },
      };

  const CROPS = {
    carrot: { id: 'carrot', color: '#ff9b4a', rgb: { r: 255, g: 155, b: 74 }, label: '당근' },
    tomato: { id: 'tomato', color: '#e85d5d', rgb: { r: 232, g: 93, b: 93 }, label: '토마토' },
    corn: { id: 'corn', color: '#ffd166', rgb: { r: 255, g: 209, b: 102 }, label: '옥수수' },
  };
  const CROP_IDS = ['carrot', 'tomato', 'corn'];

  const FRIENDS = [
    { id: 'rabbit', label: '토끼' },
    { id: 'squirrel', label: '다람쥐' },
    { id: 'bear', label: '곰' },
  ];

  const els = {
    stage: document.getElementById('stage'),
    sceneField: document.getElementById('sceneField'),
    sceneWarehouse: document.getElementById('sceneWarehouse'),
    sceneKitchen: document.getElementById('sceneKitchen'),
    plots: document.getElementById('plots'),
    waterCan: document.getElementById('waterCan'),
    seedPouch: document.getElementById('seedPouch'),
    fieldHint: document.getElementById('fieldHint'),
    shelves: document.getElementById('shelves'),
    fullFlash: document.getElementById('fullFlash'),
    friendBubble: document.getElementById('friendBubble'),
    friendSpot: document.getElementById('friendSpot'),
    friendFace: document.getElementById('friendFace'),
    hearts: document.getElementById('hearts'),
    kitchenEmpty: document.getElementById('kitchenEmpty'),
    kitchenWork: document.getElementById('kitchenWork'),
    pantry: document.getElementById('pantry'),
    cookSlots: document.getElementById('cookSlots'),
    mixerStation: document.getElementById('mixerStation'),
    saladStation: document.getElementById('saladStation'),
    mixerJar: document.getElementById('mixerJar'),
    juice: document.getElementById('juice'),
    blendBtn: document.getElementById('blendBtn'),
    saladBowl: document.getElementById('saladBowl'),
    saladMix: document.getElementById('saladMix'),
    ringFill: document.getElementById('ringFill'),
    recipeToast: document.getElementById('recipeToast'),
    recipeCard: document.getElementById('recipeCard'),
    fxLayer: document.getElementById('fxLayer'),
    sceneTabs: document.getElementById('sceneTabs'),
    btnSound: document.getElementById('btnSound'),
  };

  const G = {
    scene: 'field',
    plots: [],
    inventory: { carrot: 0, tomato: 0, corn: 0 },
    recipes: [],
    selectedSeed: 'carrot',
    waterMode: false,
    tool: 'mixer',
    slots: [],
    blendProgress: 0,
    stirProgress: 0,
    stirring: false,
    lastAngle: null,
    cookCount: 0,
    friendIndex: 0,
    firstHarvestTap: true,
    harvestedOnce: false,
    visitedWarehouse: false,
    kitchenNudgeDone: false,
    endingShown: false,
    busy: false,
    timers: [],
  };

  /* ------------------------------------------------------------------ */
  /* SVG helpers                                                         */
  /* ------------------------------------------------------------------ */

  function cropSvg(id, stage, king) {
    const c = CROPS[id] || CROPS.carrot;
    if (stage <= 0) return '';
    if (stage === 1) {
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="40" rx="10" ry="6" fill="#5a4020" opacity=".35"/><circle cx="32" cy="36" r="6" fill="#6b4e2a"/><circle cx="32" cy="36" r="3" fill="${c.color}"/></svg>`;
    }
    if (stage === 2) {
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="48" rx="12" ry="5" fill="#5a4020" opacity=".3"/><path d="M32 44 C30 34 26 28 28 22" stroke="#5a9a3a" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="24" cy="22" rx="8" ry="5" fill="#7ac74f" transform="rotate(-30 24 22)"/><ellipse cx="36" cy="20" rx="8" ry="5" fill="#8ed45a" transform="rotate(25 36 20)"/></svg>`;
    }
    if (stage === 3) {
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="50" rx="14" ry="5" fill="#5a4020" opacity=".3"/><path d="M32 48 V28" stroke="#5a9a3a" stroke-width="5" stroke-linecap="round"/><ellipse cx="22" cy="26" rx="11" ry="7" fill="#7ac74f"/><ellipse cx="42" cy="24" rx="11" ry="7" fill="#8ed45a"/><ellipse cx="32" cy="18" rx="9" ry="6" fill="#6bb04a"/></svg>`;
    }
    // stage 4 harvestable
    if (id === 'carrot') {
      const scale = king ? 1.25 : 1;
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><g transform="translate(32 34) scale(${scale}) translate(-32 -34)"><path d="M32 18 C28 28 24 40 28 52 C30 56 34 56 36 52 C40 40 36 28 32 18Z" fill="${c.color}"/><ellipse cx="26" cy="14" rx="7" ry="4" fill="#7ac74f" transform="rotate(-35 26 14)"/><ellipse cx="38" cy="14" rx="7" ry="4" fill="#8ed45a" transform="rotate(35 38 14)"/><ellipse cx="32" cy="10" rx="5" ry="4" fill="#6bb04a"/></g></svg>`;
    }
    if (id === 'tomato') {
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="36" r="16" fill="${c.color}"/><circle cx="26" cy="30" r="4" fill="#fff" opacity=".35"/><ellipse cx="28" cy="18" rx="6" ry="3" fill="#7ac74f" transform="rotate(-20 28 18)"/><ellipse cx="36" cy="18" rx="6" ry="3" fill="#8ed45a" transform="rotate(20 36 18)"/><rect x="30" y="14" width="4" height="8" rx="2" fill="#5a9a3a"/></svg>`;
    }
    // corn
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="36" rx="10" ry="18" fill="${c.color}"/><circle cx="28" cy="28" r="2" fill="#e8b840"/><circle cx="36" cy="32" r="2" fill="#e8b840"/><circle cx="30" cy="38" r="2" fill="#e8b840"/><circle cx="34" cy="44" r="2" fill="#e8b840"/><path d="M22 24 Q18 36 24 48" stroke="#7ac74f" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M42 24 Q46 36 40 48" stroke="#8ed45a" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="16" rx="6" ry="4" fill="#6bb04a"/></svg>`;
  }

  function friendSvg(id) {
    if (id === 'bear') {
      return `<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="18" cy="20" r="10" fill="#c4956a"/><circle cx="54" cy="20" r="10" fill="#c4956a"/><circle cx="36" cy="38" r="24" fill="#d4a574"/><circle cx="28" cy="34" r="3.5" fill="#3f4a52"/><circle cx="44" cy="34" r="3.5" fill="#3f4a52"/><ellipse cx="36" cy="44" rx="6" ry="4" fill="#b07850"/><circle cx="18" cy="20" r="4" fill="#b07850"/><circle cx="54" cy="20" r="4" fill="#b07850"/></svg>`;
    }
    if (id === 'squirrel') {
      return `<svg viewBox="0 0 72 72" aria-hidden="true"><ellipse cx="52" cy="40" rx="12" ry="18" fill="#e8a060" transform="rotate(20 52 40)"/><circle cx="34" cy="36" r="20" fill="#f0b070"/><ellipse cx="22" cy="22" rx="8" ry="10" fill="#f0b070"/><ellipse cx="46" cy="22" rx="8" ry="10" fill="#f0b070"/><circle cx="28" cy="34" r="3" fill="#3f4a52"/><circle cx="40" cy="34" r="3" fill="#3f4a52"/><ellipse cx="34" cy="42" rx="5" ry="3" fill="#d48850"/><circle cx="48" cy="48" r="6" fill="#c07040"/></svg>`;
    }
    // rabbit
    return `<svg viewBox="0 0 72 72" aria-hidden="true"><ellipse cx="22" cy="16" rx="8" ry="18" fill="#f2e8dc"/><ellipse cx="50" cy="16" rx="8" ry="18" fill="#f2e8dc"/><ellipse cx="22" cy="16" rx="4" ry="12" fill="#f5c0c8"/><ellipse cx="50" cy="16" rx="4" ry="12" fill="#f5c0c8"/><circle cx="36" cy="40" r="22" fill="#f8f0e8"/><circle cx="28" cy="38" r="3.5" fill="#3f4a52"/><circle cx="44" cy="38" r="3.5" fill="#3f4a52"/><ellipse cx="36" cy="46" rx="5" ry="3" fill="#f0a8b0"/><circle cx="56" cy="48" r="5" fill="#f8f0e8"/></svg>`;
  }

  function juiceSvg(color) {
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="18" y="12" width="28" height="40" rx="8" fill="#d0dce8" stroke="#9aadc0" stroke-width="3"/><rect x="22" y="28" width="20" height="20" rx="6" fill="${color}"/><ellipse cx="32" cy="18" rx="10" ry="4" fill="#b0c4d8"/></svg>`;
  }

  function saladSvg() {
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="40" rx="24" ry="12" fill="#e8dcc0"/><ellipse cx="32" cy="34" rx="20" ry="10" fill="#a8d86e"/><circle cx="24" cy="34" r="5" fill="#e85d5d"/><circle cx="36" cy="30" r="5" fill="#ff9b4a"/><circle cx="40" cy="38" r="4" fill="#ffd166"/></svg>`;
  }

  /* ------------------------------------------------------------------ */
  /* sound / haptic                                                      */
  /* ------------------------------------------------------------------ */

  function sfx(name) {
    if (window.KidsKit && KidsKit.sound) KidsKit.sound.play(name);
  }

  function buzz(kind) {
    if (window.KidsKit && KidsKit.haptic) KidsKit.haptic(kind || 'light');
  }

  function later(fn, ms) {
    const t = setTimeout(fn, ms);
    G.timers.push(t);
    return t;
  }

  /* ------------------------------------------------------------------ */
  /* persistence                                                         */
  /* ------------------------------------------------------------------ */

  function defaultPlots() {
    // first visit: one sprout already growing (index 1)
    return [
      { crop: null, stage: 0 },
      { crop: 'carrot', stage: 2 },
      { crop: null, stage: 0 },
      { crop: null, stage: 0 },
      { crop: null, stage: 0 },
      { crop: null, stage: 0 },
    ];
  }

  function loadState() {
    const raw = store.get(STORE_KEY, null);
    const now = Date.now();
    if (!raw || !Array.isArray(raw.plots)) {
      G.plots = defaultPlots();
      G.inventory = { carrot: 0, tomato: 0, corn: 0 };
      G.recipes = [];
      saveState();
      return { isReturn: false };
    }

    const plots = raw.plots.slice(0, 6).map((p) => {
      const crop = p && CROP_IDS.indexOf(p.crop) >= 0 ? p.crop : null;
      let stage = Math.max(0, Math.min(4, Number(p && p.stage) || 0));
      // revisit growth: stage ≥ 1 → +1 (max 4), no wilting
      if (stage >= 1) stage = Math.min(4, stage + 1);
      if (!crop) stage = 0;
      return { crop: stage > 0 ? crop : null, stage };
    });
    while (plots.length < 6) plots.push({ crop: null, stage: 0 });

    G.plots = plots;
    G.inventory = {
      carrot: Math.max(0, Number(raw.inventory && raw.inventory.carrot) || 0),
      tomato: Math.max(0, Number(raw.inventory && raw.inventory.tomato) || 0),
      corn: Math.max(0, Number(raw.inventory && raw.inventory.corn) || 0),
    };
    G.recipes = Array.isArray(raw.recipes) ? raw.recipes.slice() : [];
    saveState(now);
    return { isReturn: true };
  }

  function saveState(lastVisit) {
    store.set(STORE_KEY, {
      plots: G.plots.map((p) => ({ crop: p.crop, stage: p.stage })),
      inventory: { ...G.inventory },
      recipes: G.recipes.slice(),
      lastVisit: lastVisit || Date.now(),
    });
  }

  /* ------------------------------------------------------------------ */
  /* scenes                                                              */
  /* ------------------------------------------------------------------ */

  function showScene(name) {
    G.scene = name;
    ['field', 'warehouse', 'kitchen'].forEach((s) => {
      const el = els['scene' + s.charAt(0).toUpperCase() + s.slice(1)];
      if (!el) return;
      const on = s === name;
      el.classList.toggle('is-active', on);
      el.hidden = !on;
    });
    els.sceneTabs.querySelectorAll('.scene-tab').forEach((btn) => {
      const on = btn.dataset.scene === name;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) btn.classList.remove('is-pulse');
    });

    if (name === 'warehouse') {
      G.visitedWarehouse = true;
      renderShelves();
      if (G.harvestedOnce && !G.kitchenNudgeDone) {
        pulseTab('kitchen');
      }
    }
    if (name === 'kitchen') {
      G.kitchenNudgeDone = true;
      renderKitchen();
    }
    if (name === 'field') {
      renderPlots();
    }
  }

  function pulseTab(scene) {
    els.sceneTabs.querySelectorAll('.scene-tab').forEach((btn) => {
      btn.classList.toggle('is-pulse', btn.dataset.scene === scene);
    });
  }

  /* ------------------------------------------------------------------ */
  /* field                                                               */
  /* ------------------------------------------------------------------ */

  function renderPlots() {
    els.plots.innerHTML = '';
    G.plots.forEach((plot, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'plot' + (plot.stage >= 4 ? ' is-ready' : '');
      btn.dataset.index = String(i);
      btn.setAttribute(
        'aria-label',
        plot.stage >= 4
          ? CROPS[plot.crop].label
          : plot.stage > 0
            ? CROPS[plot.crop].label
            : '밭'
      );
      const wrap = document.createElement('div');
      wrap.className = 'plot-crop';
      wrap.innerHTML = cropSvg(plot.crop, plot.stage, plot.king);
      btn.appendChild(wrap);
      bindPlotGestures(btn, i);
      els.plots.appendChild(btn);
    });
  }

  function setSeed(crop) {
    G.selectedSeed = crop;
    els.seedPouch.querySelectorAll('.seed-btn').forEach((b) => {
      const on = b.dataset.crop === crop;
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    G.waterMode = false;
    els.waterCan.classList.remove('is-on');
    els.waterCan.setAttribute('aria-pressed', 'false');
  }

  function toggleWaterMode(on) {
    G.waterMode = on != null ? on : !G.waterMode;
    els.waterCan.classList.toggle('is-on', G.waterMode);
    els.waterCan.setAttribute('aria-pressed', G.waterMode ? 'true' : 'false');
    if (G.waterMode) els.waterCan.classList.remove('is-pulse');
  }

  function plantAt(i) {
    const plot = G.plots[i];
    if (!plot || plot.stage > 0 || G.busy) return;
    plot.crop = G.selectedSeed;
    plot.stage = 1;
    plot.king = false;
    sfx('pop');
    buzz('soft');
    saveState();
    renderPlots();
    sparkAtPlot(i);
  }

  function waterAt(i, clientX, clientY) {
    const plot = G.plots[i];
    if (!plot || plot.stage <= 0 || plot.stage >= 4 || G.busy) return;
    plot.stage = Math.min(4, plot.stage + 1);
    sfx('whoosh');
    buzz('light');
    dropWater(clientX, clientY);
    const el = els.plots.children[i];
    if (el) {
      el.classList.add('is-watered');
      later(() => el.classList.remove('is-watered'), 450);
    }
    // occasional worm peek
    if (Math.random() < 0.12) showWorm(i);
    saveState();
    renderPlots();
    if (plot.stage >= 4) {
      showHint('👆');
      later(() => hideHint(), 2200);
    }
  }

  function showWorm(i) {
    const el = els.plots.children[i];
    if (!el) return;
    const w = document.createElement('div');
    w.className = 'worm';
    w.textContent = '🪱';
    el.appendChild(w);
    later(() => w.remove(), 1600);
  }

  function harvestAt(i) {
    const plot = G.plots[i];
    if (!plot || plot.stage < 4 || G.busy) return;
    G.busy = true;

    const crop = plot.crop;
    const isKing = crop === 'carrot' && Math.random() < 0.03;
    const amount = isKing ? 3 : 2 + Math.floor(Math.random() * 2); // 2~3

    const el = els.plots.children[i];
    if (el) el.classList.add('is-harvesting');

    if (isKing) {
      const tug = document.createElement('div');
      tug.className = 'king-tug';
      tug.textContent = '쑥!';
      if (el) el.appendChild(tug);
      later(() => tug.remove(), 700);
    }

    showHint('쑥!');
    sfx('boing');
    buzz('success');
    dirtBurst(i);

    later(() => {
      G.inventory[crop] = (G.inventory[crop] || 0) + amount;
      plot.crop = null;
      plot.stage = 0;
      plot.king = false;
      G.busy = false;
      G.firstHarvestTap = false;
      if (!G.harvestedOnce) {
        G.harvestedOnce = true;
        pulseTab('warehouse');
      }
      hideHint();
      checkFullFlash(crop);
      saveState();
      renderPlots();
      if (G.scene === 'warehouse') renderShelves();
    }, REDUCED ? 120 : 420);
  }

  function checkFullFlash(crop) {
    if ((G.inventory[crop] || 0) > MAX_SHELF_SHOW) {
      els.fullFlash.hidden = false;
      later(() => {
        els.fullFlash.hidden = true;
      }, 1200);
    }
  }

  function showHint(text) {
    els.fieldHint.hidden = false;
    els.fieldHint.textContent = text;
  }

  function hideHint() {
    els.fieldHint.hidden = true;
  }

  function bindPlotGestures(btn, i) {
    let startY = 0;
    let startX = 0;
    let startT = 0;
    let longTimer = null;
    let moved = false;

    const clearLong = () => {
      if (longTimer) {
        clearTimeout(longTimer);
        longTimer = null;
      }
    };

    btn.addEventListener('pointerdown', (e) => {
      if (G.busy) return;
      startY = e.clientY;
      startX = e.clientX;
      startT = Date.now();
      moved = false;
      btn.setPointerCapture(e.pointerId);
      const plot = G.plots[i];
      if (plot && plot.stage >= 4) {
        longTimer = setTimeout(() => {
          longTimer = null;
          harvestAt(i);
        }, 480);
      }
    });

    btn.addEventListener('pointermove', (e) => {
      const dy = startY - e.clientY;
      const dx = Math.abs(e.clientX - startX);
      if (dy > 12 || dx > 12) moved = true;
      if (moved) clearLong();
      const plot = G.plots[i];
      if (plot && plot.stage >= 4 && dy > 36 && dy > dx) {
        clearLong();
        try {
          btn.releasePointerCapture(e.pointerId);
        } catch (_) {
          /* ignore */
        }
        harvestAt(i);
      }
    });

    btn.addEventListener('pointerup', (e) => {
      clearLong();
      const plot = G.plots[i];
      const dt = Date.now() - startT;
      if (!moved && dt < 450) {
        if (G.waterMode && plot && plot.stage > 0 && plot.stage < 4) {
          waterAt(i, e.clientX, e.clientY);
        } else if (plot && plot.stage >= 4 && G.firstHarvestTap) {
          // 1회차: 콕만 해도 뽑힘
          harvestAt(i);
        } else if (plot && plot.stage === 0) {
          plantAt(i);
        } else if (plot && plot.stage > 0 && plot.stage < 4 && G.waterMode) {
          waterAt(i, e.clientX, e.clientY);
        }
      }
    });

    btn.addEventListener('pointercancel', clearLong);
  }

  /* water can drag + tap mode */
  function bindWaterCan() {
    let dragging = false;
    let ghost = null;
    let startX = 0;
    let startY = 0;
    let didDrag = false;

    const removeGhost = () => {
      if (ghost) {
        ghost.remove();
        ghost = null;
      }
      els.waterCan.classList.remove('is-dragging');
    };

    els.waterCan.addEventListener('pointerdown', (e) => {
      dragging = true;
      didDrag = false;
      startX = e.clientX;
      startY = e.clientY;
      els.waterCan.setPointerCapture(e.pointerId);
    });

    els.waterCan.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!didDrag && dx * dx + dy * dy > 64) {
        didDrag = true;
        ghost = document.createElement('div');
        ghost.className = 'ghost-can';
        ghost.innerHTML = els.waterCan.innerHTML;
        document.body.appendChild(ghost);
        els.waterCan.classList.add('is-dragging');
      }
      if (ghost) {
        ghost.style.left = e.clientX - 28 + 'px';
        ghost.style.top = e.clientY - 28 + 'px';
      }
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      removeGhost();
      if (didDrag) {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const plotEl = target && target.closest ? target.closest('.plot') : null;
        if (plotEl) {
          const i = Number(plotEl.dataset.index);
          waterAt(i, e.clientX, e.clientY);
        }
      } else {
        toggleWaterMode();
      }
    };

    els.waterCan.addEventListener('pointerup', endDrag);
    els.waterCan.addEventListener('pointercancel', () => {
      dragging = false;
      removeGhost();
    });
  }

  function dropWater(x, y) {
    if (!x || REDUCED) return;
    const rect = els.fxLayer.getBoundingClientRect();
    for (let n = 0; n < 5; n += 1) {
      const d = document.createElement('div');
      d.className = 'fx-drop';
      d.style.left = x - rect.left + (Math.random() * 20 - 10) + 'px';
      d.style.top = y - rect.top + (Math.random() * 10 - 5) + 'px';
      els.fxLayer.appendChild(d);
      later(() => d.remove(), 500);
    }
  }

  function sparkAtPlot(i) {
    if (REDUCED) return;
    const el = els.plots.children[i];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const fr = els.fxLayer.getBoundingClientRect();
    for (let n = 0; n < 4; n += 1) {
      const s = document.createElement('div');
      s.className = 'fx-spark';
      s.style.left = r.left - fr.left + r.width * (0.3 + Math.random() * 0.4) + 'px';
      s.style.top = r.top - fr.top + r.height * (0.3 + Math.random() * 0.4) + 'px';
      els.fxLayer.appendChild(s);
      later(() => s.remove(), 500);
    }
  }

  function dirtBurst(i) {
    if (REDUCED) return;
    const el = els.plots.children[i];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const fr = els.fxLayer.getBoundingClientRect();
    for (let n = 0; n < 6; n += 1) {
      const d = document.createElement('div');
      d.className = 'fx-dirt';
      d.style.left = r.left - fr.left + r.width / 2 + 'px';
      d.style.top = r.top - fr.top + r.height / 2 + 'px';
      d.style.setProperty('--dx', Math.random() * 40 - 20 + 'px');
      d.style.setProperty('--dy', -(16 + Math.random() * 28) + 'px');
      els.fxLayer.appendChild(d);
      later(() => d.remove(), 500);
    }
  }

  /* ------------------------------------------------------------------ */
  /* warehouse                                                           */
  /* ------------------------------------------------------------------ */

  function renderShelves() {
    els.shelves.innerHTML = '';
    CROP_IDS.forEach((id) => {
      const shelf = document.createElement('div');
      shelf.className = 'shelf';
      const label = document.createElement('div');
      label.className = 'shelf-label';
      label.textContent = CROPS[id].label;
      const stack = document.createElement('div');
      stack.className = 'shelf-stack';
      const count = G.inventory[id] || 0;
      const show = Math.min(count, MAX_SHELF_SHOW);
      for (let n = 0; n < show; n += 1) {
        const item = document.createElement('div');
        item.className = 'shelf-item';
        item.innerHTML = cropSvg(id, 4, false);
        stack.appendChild(item);
      }
      if (count > MAX_SHELF_SHOW) {
        const more = document.createElement('div');
        more.className = 'shelf-item';
        more.style.fontSize = '18px';
        more.style.display = 'grid';
        more.style.placeItems = 'center';
        more.textContent = '✨';
        stack.appendChild(more);
      }
      shelf.appendChild(label);
      shelf.appendChild(stack);
      els.shelves.appendChild(shelf);
    });
  }

  function inventoryTotal() {
    return CROP_IDS.reduce((s, id) => s + (G.inventory[id] || 0), 0);
  }

  /* ------------------------------------------------------------------ */
  /* kitchen                                                             */
  /* ------------------------------------------------------------------ */

  function returnSlotsToInventory() {
    G.slots.forEach((id) => {
      G.inventory[id] = (G.inventory[id] || 0) + 1;
    });
    G.slots = [];
  }

  function setTool(tool) {
    if (tool === G.tool) return;
    returnSlotsToInventory();
    G.tool = tool;
    G.blendProgress = 0;
    G.stirProgress = 0;
    G.lastAngle = null;
    document.querySelectorAll('.tool-tab').forEach((b) => {
      const on = b.dataset.tool === tool;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    els.mixerStation.hidden = tool !== 'mixer';
    els.saladStation.hidden = tool !== 'salad';
    saveState();
    if (G.scene === 'kitchen') renderPantry();
    renderSlots();
    updateCookVisual();
    updateBlendButton();
  }

  function renderKitchen() {
    const empty = inventoryTotal() === 0 && G.slots.length === 0;
    els.kitchenEmpty.hidden = !empty;
    els.kitchenWork.hidden = empty;
    if (empty) {
      pulseTab('field');
      return;
    }
    renderPantry();
    renderSlots();
    updateCookVisual();
    updateBlendButton();
    renderFriend();
  }

  function renderFriend() {
    const f = FRIENDS[G.friendIndex % FRIENDS.length];
    els.friendFace.innerHTML = friendSvg(f.id);
  }

  function renderPantry() {
    els.pantry.innerHTML = '';
    CROP_IDS.forEach((id) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pantry-btn';
      btn.dataset.crop = id;
      btn.disabled = (G.inventory[id] || 0) <= 0;
      btn.setAttribute('aria-label', CROPS[id].label);
      btn.innerHTML = cropSvg(id, 4, false) + `<span>${G.inventory[id] || 0}</span>`;
      btn.addEventListener('click', () => addIngredient(id));
      els.pantry.appendChild(btn);
    });
  }

  function maxSlots() {
    return 3;
  }

  function minSlots() {
    return G.tool === 'salad' ? 2 : 1;
  }

  function addIngredient(id) {
    if (G.busy) return;
    if ((G.inventory[id] || 0) <= 0) return;
    if (G.slots.length >= maxSlots()) return;
    G.inventory[id] -= 1;
    G.slots.push(id);
    G.blendProgress = 0;
    G.stirProgress = 0;
    setRing(0);
    sfx('pop');
    buzz('soft');
    saveState();
    renderPantry();
    renderSlots();
    updateCookVisual();
    updateBlendButton();
  }

  function renderSlots() {
    els.cookSlots.innerHTML = '';
    for (let i = 0; i < maxSlots(); i += 1) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      if (G.slots[i]) slot.innerHTML = cropSvg(G.slots[i], 4, false);
      els.cookSlots.appendChild(slot);
    }
  }

  function avgColor(ids) {
    if (!ids.length) return { r: 255, g: 209, b: 102 };
    let r = 0;
    let g = 0;
    let b = 0;
    ids.forEach((id) => {
      const c = CROPS[id].rgb;
      r += c.r;
      g += c.g;
      b += c.b;
    });
    const n = ids.length;
    return {
      r: Math.round(r / n),
      g: Math.round(g / n),
      b: Math.round(b / n),
    };
  }

  function rgbCss(c) {
    return `rgb(${c.r},${c.g},${c.b})`;
  }

  function updateCookVisual() {
    const col = avgColor(G.slots);
    if (G.tool === 'mixer') {
      els.juice.style.background = rgbCss(col);
      const h = G.slots.length ? 25 + G.blendProgress * 55 : 0;
      els.juice.style.height = h + '%';
    } else {
      els.saladMix.style.background = G.slots.length
        ? rgbCss({
            r: Math.round((col.r + 120) / 2),
            g: Math.round((col.g + 180) / 2),
            b: Math.round((col.b + 80) / 2),
          })
        : '#a8d86e';
      els.saladMix.innerHTML = G.slots.map((id) => cropSvg(id, 4, false)).join('');
    }
  }

  function updateBlendButton() {
    const ok = G.tool === 'mixer' && G.slots.length >= minSlots() && !G.busy;
    els.blendBtn.disabled = !ok;
  }

  function setRing(p) {
    const offset = RING_LEN * (1 - Math.max(0, Math.min(1, p)));
    els.ringFill.style.strokeDashoffset = String(offset);
  }

  function recipeKey(tool, slots) {
    return tool + ':' + slots.slice().sort().join('+');
  }

  function finishCook() {
    if (G.busy || G.slots.length < minSlots()) return;
    G.busy = true;
    els.mixerJar.classList.remove('is-blending');

    const tool = G.tool;
    const used = G.slots.slice();
    const key = recipeKey(tool, used);
    const isNew = G.recipes.indexOf(key) < 0;
    if (isNew) {
      G.recipes.push(key);
      showRecipeToast(tool, used);
    }

    sfx('chime');
    buzz('success');
    yumFeed(() => {
      G.slots = [];
      G.blendProgress = 0;
      G.stirProgress = 0;
      setRing(0);
      G.cookCount += 1;
      G.friendIndex = (G.friendIndex + 1) % FRIENDS.length;
      G.busy = false;
      saveState();
      renderKitchen();
      if (G.cookCount >= COOKS_TO_END && !G.endingShown) {
        later(() => showEnding(), 600);
      }
    });
  }

  function showRecipeToast(tool, slots) {
    const col = avgColor(slots);
    els.recipeCard.innerHTML = tool === 'mixer' ? juiceSvg(rgbCss(col)) : saladSvg();
    els.recipeToast.hidden = false;
    later(() => {
      els.recipeToast.hidden = true;
    }, 2200);
  }

  function yumFeed(done) {
    els.friendBubble.hidden = false;
    els.friendBubble.textContent = '냠냠';
    els.friendSpot.classList.add('is-yum');
    els.hearts.innerHTML = '';
    for (let i = 0; i < 3; i += 1) {
      const h = document.createElement('span');
      h.className = 'heart';
      h.textContent = '❤️';
      h.style.left = 30 + i * 20 + '%';
      h.style.animationDelay = i * 0.12 + 's';
      els.hearts.appendChild(h);
    }
    later(() => {
      els.friendSpot.classList.remove('is-yum');
      els.friendBubble.hidden = true;
      els.hearts.innerHTML = '';
      if (typeof done === 'function') done();
    }, 1100);
  }

  /* mixer hold — Date.now 기준. 짧은 탭도 조금씩 채워 대체 경로 제공 */
  function bindMixer() {
    let holding = false;
    let timer = 0;
    let holdStarted = 0;
    let progressAtStart = 0;
    let holdPointerId = null;

    const clearHold = () => {
      holding = false;
      holdPointerId = null;
      clearInterval(timer);
      timer = 0;
      els.blendBtn.classList.remove('is-holding');
      els.mixerJar.classList.remove('is-blending');
    };

    const tick = () => {
      if (!holding) return;
      if (G.slots.length < minSlots() || G.busy) return;
      const elapsed = (Date.now() - holdStarted) / 1000;
      G.blendProgress = Math.min(1, progressAtStart + elapsed * 0.55);
      updateCookVisual();
      if (G.blendProgress >= 1) {
        clearHold();
        finishCook();
      }
    };

    const start = (e) => {
      if (els.blendBtn.disabled || G.busy) return;
      if (e && e.button != null && e.button !== 0) return;
      e.preventDefault();
      // 이미 누르는 중이면 무시
      if (holding) return;
      holding = true;
      holdPointerId = e.pointerId;
      holdStarted = Date.now();
      progressAtStart = G.blendProgress;
      // 탭(짧게 뗐다 누름)도 진행 — 꾹이 어려울 때 대체
      progressAtStart = Math.min(1, progressAtStart + 0.2);
      G.blendProgress = progressAtStart;
      updateCookVisual();
      els.blendBtn.classList.add('is-holding');
      els.mixerJar.classList.add('is-blending');
      buzz('soft');
      sfx('whoosh');
      clearInterval(timer);
      timer = setInterval(tick, 50);
      if (G.blendProgress >= 1) {
        clearHold();
        finishCook();
      }
    };

    const stop = (e) => {
      if (!holding) return;
      if (e && holdPointerId != null && e.pointerId !== holdPointerId) return;
      tick();
      const done = G.blendProgress >= 1;
      clearHold();
      if (done && !G.busy) finishCook();
    };

    els.blendBtn.addEventListener('pointerdown', start);
    els.blendBtn.addEventListener('pointerup', stop);
    els.blendBtn.addEventListener('pointercancel', stop);
  }

  /* salad stir */
  function bindSalad() {
    let active = false;
    let moved = false;
    let startX = 0;
    let startY = 0;

    const angleAt = (e) => {
      const r = els.saladBowl.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      return Math.atan2(e.clientY - cy, e.clientX - cx);
    };

    els.saladBowl.addEventListener('pointerdown', (e) => {
      if (G.busy || G.slots.length < minSlots()) return;
      active = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      G.lastAngle = angleAt(e);
      els.saladBowl.setPointerCapture(e.pointerId);
    });

    els.saladBowl.addEventListener('pointermove', (e) => {
      if (!active || G.busy) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (dx * dx + dy * dy > 36) moved = true;
      const a = angleAt(e);
      if (G.lastAngle == null) {
        G.lastAngle = a;
        return;
      }
      let d = a - G.lastAngle;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      G.lastAngle = a;
      const turn = Math.abs(d) / (Math.PI * 2);
      G.stirProgress = Math.min(1, G.stirProgress + turn * 1.35);
      setRing(G.stirProgress);
      if (G.stirProgress >= 1) {
        active = false;
        finishCook();
      }
    });

    const end = (e) => {
      // 탭 대체: 원을 안 돌리고 콕만 해도 진행
      if (active && !moved && !G.busy && G.slots.length >= minSlots() && G.stirProgress < 1) {
        G.stirProgress = Math.min(1, G.stirProgress + 0.2);
        setRing(G.stirProgress);
        sfx('pop');
        if (G.stirProgress >= 1) finishCook();
      }
      active = false;
      G.lastAngle = null;
      void e;
    };
    els.saladBowl.addEventListener('pointerup', end);
    els.saladBowl.addEventListener('pointercancel', () => {
      active = false;
      G.lastAngle = null;
    });
  }

  /* ------------------------------------------------------------------ */
  /* ending                                                              */
  /* ------------------------------------------------------------------ */

  function showEnding() {
    G.endingShown = true;
    // 명세 §6 소프트 엔딩 문구
    if (window.KidsKit && typeof KidsKit.softEnding === 'function') {
      KidsKit.softEnding({
        title: '오늘 텃밭 끝! 내일 또 자라 있을 거야.',
        emoji: '🐰🐿️🐻',
        onAgain: () => {
          G.cookCount = 0;
          G.endingShown = false;
          showScene('field');
        },
        onRest: () => {
          // 명세 쉬자 멘트는 softEnding 기본 로비 이동 전 별도 표시 없이 이동
          // KidsKit 버튼 라벨은 "쉬자" 고정 — 멘트는 아래 커스텀 오버레이에서 처리하지 않음
          window.location.href = '../../index.html';
        },
      });
    }

    // "다 같이 배불러!" 는 요리 3번 후 제안 카피로 버블에 잠깐 표시
    els.friendBubble.hidden = false;
    els.friendBubble.textContent = '다 같이 배불러!';
    later(() => {
      if (G.endingShown) els.friendBubble.hidden = true;
    }, 2500);
  }

  function showRestMessageThenLobby() {
    // 쉬자: 명세 멘트
    if (window.KidsKit && typeof KidsKit.softEnding === 'function') {
      KidsKit.softEnding({
        title: '우리도 진짜 간식 먹으러 가 볼까?',
        emoji: '🥕',
        onAgain: () => {},
        onRest: () => {
          window.location.href = '../../index.html';
        },
      });
      // softEnding의 "또 할래"는 닫기만 — onAgain 이미 오버레이 제거
      return;
    }
    window.location.href = '../../index.html';
  }

  /* ------------------------------------------------------------------ */
  /* boot                                                                */
  /* ------------------------------------------------------------------ */

  function bindUI() {
    els.seedPouch.querySelectorAll('.seed-btn').forEach((btn) => {
      btn.addEventListener('click', () => setSeed(btn.dataset.crop));
    });

    bindWaterCan();

    els.sceneTabs.querySelectorAll('.scene-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        sfx('pop');
        showScene(btn.dataset.scene);
      });
    });

    document.querySelectorAll('.tool-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        sfx('pop');
        setTool(btn.dataset.tool);
      });
    });

    bindMixer();
    bindSalad();

    if (els.btnSound) {
      const syncMute = () => {
        const muted = window.KidsKit && KidsKit.sound && KidsKit.sound.isMuted();
        els.btnSound.textContent = muted ? '🔇' : '🔊';
      };
      syncMute();
      els.btnSound.addEventListener('click', () => {
        if (window.KidsKit && KidsKit.sound) KidsKit.sound.toggleMute();
        syncMute();
      });
    }

    if (window.KidsKit && KidsKit.restButton) {
      KidsKit.restButton({
        parent: document.body,
        onRest: showRestMessageThenLobby,
      });
    }
  }

  function startTutorial() {
    // 첫 90초: 물뿌리개 반짝
    const hasGrowing = G.plots.some((p) => p.stage > 0 && p.stage < 4);
    if (hasGrowing) {
      els.waterCan.classList.add('is-pulse');
      toggleWaterMode(true);
    }
  }

  function init() {
    setRing(0);
    const { isReturn } = loadState();
    bindUI();
    renderPlots();
    renderFriend();
    showScene('field');
    if (!isReturn) startTutorial();
    else {
      // 재방문: 자란 작물 있으면 뽑기 힌트만
      if (G.plots.some((p) => p.stage >= 4)) showHint('👆');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
