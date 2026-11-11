/**
 * 내 차고 선반 저장 (localStorage + KidsKit.store 동기화)
 */
const BrickStorage = {
  STORAGE_KEY: 'kids_brick_garage_v1',
  kit: null,

  getKit() {
    if (this.kit) return this.kit;
    if (typeof KidsKit !== 'undefined' && KidsKit.store) {
      this.kit = KidsKit.store('brick-garage');
    }
    return this.kit;
  },

  getDefaultState() {
    return {
      built: [],
      free: [],
      missions: 0,
      specials: [],
      lastId: null,
      sound: true,
      visits: 0,
      welcomeCarId: null,
      lastVisitDay: null,
    };
  },

  todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  },

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const base = this.getDefaultState();
      const parsed = raw ? JSON.parse(raw) : {};
      const state = {
        ...base,
        ...parsed,
        built: Array.isArray(parsed.built) ? parsed.built : [],
        free: Array.isArray(parsed.free) ? parsed.free : [],
        missions: Number(parsed.missions) || 0,
        specials: Array.isArray(parsed.specials) ? parsed.specials : [],
      };

      const kit = this.getKit();
      if (kit) {
        const kitVisits = kit.get('visits', state.visits || 0);
        state.visits = Math.max(Number(state.visits) || 0, Number(kitVisits) || 0);
        if (!state.welcomeCarId) {
          state.welcomeCarId = kit.get('welcomeCarId', null);
        }
      }

      return state;
    } catch (e) {
      console.warn('브릭 차고 저장을 불러오지 못했습니다:', e);
      return this.getDefaultState();
    }
  },

  save(state) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      const kit = this.getKit();
      if (kit) {
        kit.set('visits', state.visits || 0);
        kit.set('welcomeCarId', state.welcomeCarId || null);
        kit.set('missions', state.missions || 0);
        kit.set('lastId', state.lastId || null);
      }
    } catch (e) {
      console.warn('브릭 차고 저장에 실패했습니다:', e);
    }
  },

  /** 재방문 반김 — 하루 첫 진입 시 visits↑, 오늘 반기는 차 선정 */
  noteVisit(state, roster) {
    const day = this.todayKey();
    const isNewDay = state.lastVisitDay !== day;
    if (isNewDay) {
      state.visits = (state.visits || 0) + 1;
      state.lastVisitDay = day;
      const list = Array.isArray(roster) ? roster : [];
      if (list.length) {
        const dayIndex =
          day.split('-').reduce((sum, part) => sum + Number(part), 0) +
          (state.visits || 1);
        const pick =
          state.lastId && list.some((v) => v.id === state.lastId)
            ? state.lastId
            : list[dayIndex % list.length].id;
        state.welcomeCarId = pick;
      }
      this.save(state);
    }
    return isNewDay;
  },

  isBuilt(state, id) {
    return state.built.some((item) => item.id === id);
  },

  markBuilt(state, id, wheels) {
    const existing = state.built.find((item) => item.id === id);
    if (existing) {
      existing.wheels = wheels;
      existing.at = Date.now();
    } else {
      state.built.push({ id, wheels, at: Date.now() });
    }
    state.lastId = id;
    state.welcomeCarId = id;
    this.save(state);
  },

  markFree(state, combo) {
    const entry = {
      key: 'free_' + Date.now(),
      baseId: combo.baseId,
      gimmickId: combo.gimmickId,
      sirenColor: combo.sirenColor,
      wheels: combo.wheels,
      driver: combo.driver,
      paint: combo.paint,
      at: Date.now(),
    };
    state.free.push(entry);
    state.lastId = combo.baseId;
    state.welcomeCarId = combo.baseId;
    this.save(state);
    return entry;
  },

  countAll(state) {
    return state.built.length + state.free.length;
  },

  getBuiltVehicles(state) {
    return state.built
      .map((item) => {
        const vehicle = BG_VEHICLES
          ? BG_VEHICLES.find((v) => v.id === item.id)
          : bgRoster().find((v) => v.id === item.id);
        return vehicle ? { vehicle, item } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b.item.at || 0) - (a.item.at || 0));
  },

  todayDispatchVehicle(roster) {
    const list = Array.isArray(roster) ? roster : [];
    if (!list.length) return null;
    const day = this.todayKey();
    const seed = day.split('-').reduce((sum, part) => sum + Number(part), 0);
    return list[seed % list.length];
  },
};
