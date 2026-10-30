/**
 * 내 차고 선반 저장 (localStorage)
 */
const BrickStorage = {
  STORAGE_KEY: 'kids_brick_garage_v1',

  getDefaultState() {
    return {
      built: [],
      free: [],
      missions: 0,
      specials: [],
      lastId: null,
      sound: true,
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return this.getDefaultState();
      const parsed = JSON.parse(raw);
      const base = this.getDefaultState();
      return {
        ...base,
        ...parsed,
        built: Array.isArray(parsed.built) ? parsed.built : [],
        free: Array.isArray(parsed.free) ? parsed.free : [],
        missions: Number(parsed.missions) || 0,
        specials: Array.isArray(parsed.specials) ? parsed.specials : [],
      };
    } catch (e) {
      console.warn('브릭 차고 저장을 불러오지 못했습니다:', e);
      return this.getDefaultState();
    }
  },

  save(state) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('브릭 차고 저장에 실패했습니다:', e);
    }
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
    this.save(state);
    return entry;
  },

  countAll(state) {
    return state.built.length + state.free.length;
  },

  getBuiltVehicles(state) {
    return state.built
      .map((item) => {
        const vehicle = BG_VEHICLES.find((v) => v.id === item.id);
        return vehicle ? { vehicle, item } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b.item.at || 0) - (a.item.at || 0));
  },
};
