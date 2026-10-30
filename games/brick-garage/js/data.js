/**
 * 브릭 특장차 데이터
 * 좌표는 조립 보드(16:10) 기준 퍼센트. 브릭 순서는 base → wheels → cab → gimmick → siren.
 */

const BG_SLOTS = {
  base: { x: 7, y: 51, w: 86, h: 19 },
  wheels: { x: 14, y: 68, w: 72, h: 17 },
  cab: { x: 12, y: 23, w: 36, h: 30 },
  siren: { x: 20, y: 12, w: 16, h: 12 },
};

const BG_WHEEL_CHOICES = [
  { id: 'normal', color: '#4b5563', icon: '🛞' },
  { id: 'monster', color: '#1f2937', icon: '🛞' },
];

const BG_DRIVERS = ['🧑‍🚒', '👮', '🧑‍🔧', '🧑‍✈️', '🧑‍🏗️'];

const BG_FEATURED = [
  {
    id: 'fire_ladder',
    name: '사다리 소방차',
    icon: '🚒',
    category: 'fire',
    color: '#e63946',
    trim: '#ffd166',
    driver: '🧑‍🚒',
    track: false,
    sirenColor: '#ff5252',
    gimmick: {
      id: 'ladder',
      label: '사다리',
      emoji: '🪜',
      slot: { x: 48, y: 36, w: 47, h: 13 },
      color: '#cfd8e3',
      pattern: 'stripes',
      studs: 5,
    },
  },
  {
    id: 'police',
    name: '경찰차',
    icon: '🚓',
    category: 'police',
    color: '#2563eb',
    trim: '#f8fafc',
    driver: '👮',
    track: false,
    sirenColor: '#ef4444',
    gimmick: {
      id: 'net',
      label: '그물 발사기',
      emoji: '🥅',
      slot: { x: 52, y: 25, w: 36, h: 26 },
      color: '#334155',
      pattern: 'grid',
      studs: 3,
    },
  },
  {
    id: 'excavator',
    name: '포클레인',
    icon: '🚜',
    category: 'construction',
    color: '#f9c74f',
    trim: '#f9844a',
    driver: '🧑‍🔧',
    track: true,
    sirenColor: '#f59e0b',
    gimmick: {
      id: 'arm',
      label: '집게 팔',
      emoji: '⛏️',
      slot: { x: 51, y: 18, w: 41, h: 34 },
      color: '#f9844a',
      pattern: 'diag',
      studs: 3,
      rotate: -16,
    },
  },
  {
    id: 'mixer',
    name: '레미콘',
    icon: '🚛',
    category: 'construction',
    color: '#f8961e',
    trim: '#fef3c7',
    driver: '🧑‍🔧',
    track: false,
    sirenColor: '#f59e0b',
    gimmick: {
      id: 'drum',
      label: '돌아가는 통',
      emoji: '🌀',
      slot: { x: 52, y: 23, w: 35, h: 28 },
      color: '#ffd166',
      pattern: 'diag',
      studs: 3,
      rotate: -10,
    },
  },
  {
    id: 'carrier',
    name: '카캐리어',
    icon: '🚚',
    category: 'transport',
    color: '#4361ee',
    trim: '#90e0ef',
    driver: '🧑‍✈️',
    track: false,
    sirenColor: '#22c55e',
    gimmick: {
      id: 'carrier',
      label: '2층 실음판',
      emoji: '🚗',
      slot: { x: 47, y: 27, w: 46, h: 25 },
      color: '#4cc9f0',
      pattern: 'lines',
      studs: 4,
    },
  },
  {
    id: 'crane',
    name: '크레인',
    icon: '🏗️',
    category: 'construction',
    color: '#ffd166',
    trim: '#ef476f',
    driver: '🧑‍🏗️',
    track: true,
    sirenColor: '#ef4444',
    gimmick: {
      id: 'boom',
      label: '크레인 팔',
      emoji: '🪝',
      slot: { x: 50, y: 10, w: 42, h: 41 },
      color: '#ef476f',
      pattern: 'diag',
      studs: 4,
      rotate: -20,
    },
  },
];

const BG_CATEGORIES = [
  { id: 'fire', icon: '🚒', label: '소방', color: '#ef4444' },
  { id: 'police', icon: '🚓', label: '경찰', color: '#2563eb' },
  { id: 'medic', icon: '🚑', label: '구조', color: '#22c55e' },
  { id: 'construction', icon: '🏗️', label: '중장비', color: '#f59e0b' },
  { id: 'service', icon: '🧹', label: '환경', color: '#06b6d4' },
  { id: 'transport', icon: '🚛', label: '운송', color: '#a855f7' },
];

const BG_FREE_BASE_IDS = BG_FEATURED.map((v) => v.id);
const BG_FREE_GIMMICK_IDS = BG_FEATURED.map((v) => v.id);

const BG_NEON_SIREN_COLOR = '#22d3ee';
const BG_JET_WHEEL_COLOR = '#fb923c';

const BG_SPECIALS = {
  neon_siren: {
    id: 'neon_siren',
    name: '네온 사이렌',
    emoji: '💡',
    slot: 'siren',
    threshold: 3,
  },
  gold_hook: {
    id: 'gold_hook',
    name: '황금 갈고리',
    emoji: '🪝',
    slot: 'gimmick',
    threshold: 6,
  },
  jet_engine: {
    id: 'jet_engine',
    name: '제트 엔진',
    emoji: '🔥',
    slot: 'wheels',
    threshold: 9,
  },
};

const BG_SPECIAL_ORDER = ['neon_siren', 'gold_hook', 'jet_engine'];

const BG_SPECIAL_GIMMICK = {
  id: 'gimmick',
  slot: { x: 50, y: 10, w: 42, h: 41 },
  color: '#f5c542',
  shape: 'gimmick',
  studs: 4,
  pattern: 'diag',
  emoji: '🪝',
  rotate: -20,
  glow: true,
};

const BG_PART_ORDER = ['base', 'wheels', 'cab', 'gimmick', 'siren'];

function bgRoster() {
  return typeof BG_ROSTER !== 'undefined' ? BG_ROSTER : BG_FEATURED;
}

function bgGetVehicle(id) {
  const roster = bgRoster();
  return roster.find((v) => v.id === id) || roster[0];
}

function bgResolvePart(vehicle, partId, wheelChoice) {
  switch (partId) {
    case 'base':
      return {
        id: 'base',
        slot: BG_SLOTS.base,
        color: vehicle.color,
        shape: 'base',
        studs: 6,
      };
    case 'wheels': {
      if (wheelChoice === 'jet') {
        return {
          id: 'wheels',
          slot: BG_SLOTS.wheels,
          color: BG_JET_WHEEL_COLOR,
          shape: vehicle.track ? 'track' : 'wheel',
          studs: 0,
          choices: BG_WHEEL_CHOICES,
          choiceId: 'jet',
          glow: true,
        };
      }
      const choice =
        BG_WHEEL_CHOICES.find((c) => c.id === wheelChoice) || BG_WHEEL_CHOICES[0];
      return {
        id: 'wheels',
        slot: BG_SLOTS.wheels,
        color: choice.color,
        shape: vehicle.track ? 'track' : 'wheel',
        studs: 0,
        choices: BG_WHEEL_CHOICES,
        choiceId: choice.id,
      };
    }
    case 'cab':
      return {
        id: 'cab',
        slot: BG_SLOTS.cab,
        color: vehicle.trim,
        shape: 'cab',
        studs: 2,
        driver: vehicle.driver,
      };
    case 'gimmick': {
      const g = vehicle.gimmick;
      return {
        id: 'gimmick',
        slot: g.slot,
        color: g.color,
        shape: 'gimmick',
        studs: g.studs,
        pattern: g.pattern,
        emoji: g.emoji,
        rotate: g.rotate || 0,
      };
    }
    case 'siren':
      return {
        id: 'siren',
        slot: BG_SLOTS.siren,
        color: vehicle.sirenColor,
        shape: 'siren',
        studs: 1,
      };
    default:
      return null;
  }
}

/**
 * 자유 조립 콤보: 하판/운전석/바퀴는 base 차량, 기믹은 gimmick 차량, 사이렌은 색상 지정.
 */
function bgResolveComboPart(combo, partId) {
  const base = bgGetVehicle(combo.baseId);

  if (partId === 'gimmick') {
    if (combo.gimmickId === 'special_gold_hook') {
      return Object.assign({}, BG_SPECIAL_GIMMICK);
    }
    return bgResolvePart(bgGetVehicle(combo.gimmickId), 'gimmick');
  }

  if (partId === 'base') {
    const chassis = bgResolvePart(base, 'base');
    if (combo.paint) chassis.color = combo.paint;
    return chassis;
  }

  if (partId === 'cab') {
    const cab = bgResolvePart(base, 'cab');
    if (combo.driver) cab.driver = combo.driver;
    return cab;
  }

  if (partId === 'siren') {
    const color = combo.sirenColor || base.sirenColor;
    return {
      id: 'siren',
      slot: BG_SLOTS.siren,
      color,
      shape: 'siren',
      studs: 1,
      glow: color === BG_NEON_SIREN_COLOR,
    };
  }

  return bgResolvePart(base, partId, combo.wheels);
}

function bgComboGimmickType(combo) {
  if (combo.gimmickId === 'special_gold_hook') return 'boom';
  return bgGetVehicle(combo.gimmickId).gimmick.id;
}
