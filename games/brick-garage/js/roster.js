/**
 * 50+종 로스터 — special-vehicles 데이터에서 이름·색·분류를 기계적으로 파생.
 * gimmick은 actionType 기준으로 8종(사다리/물대포/집게/붐/통/실음판/그물/밀판)에 매핑한다.
 */
const BG_ROSTER_SEED = [
  ["pump_fire","펌프 소방차","🚒","fire","#e02424","#ffffff","water",false],
  ["tanker_fire","물탱크 소방차","💧","fire","#c81e1e","#fde047","water",false],
  ["aerial_ladder","고가사다리차","🪜","fire","#e02424","#ffffff","ladder",false],
  ["articulated_ladder","굴절사다리차","🪜","fire","#e02424","#facc15","ladder",false],
  ["remote_water_tower","무인방수탑차","🗼","fire","#991b1b","#38bdf8","water",false],
  ["chemical_fire","화학소방차","🧪","fire","#dc2626","#22c55e","water",false],
  ["smoke_light","조연차","💡","fire","#e02424","#fef08a","light_wind",false],
  ["rescue_crane","구조공작차","🏗️","fire","#b91c1c","#f97316","crane",false],
  ["wildland_pump","험지펌프차","🌲","fire","#b91c1c","#84cc16","water",false],
  ["command_fire","소방지휘차","🚨","fire","#ef4444","#ffffff","command",false],
  ["police_patrol","고속순찰차","🚓","police","#1d4ed8","#ffffff","patrol",false],
  ["csi_van","과학수사차 (CSI)","🔍","police","#1e3a8a","#93c5fd","scan",false],
  ["swat_armor","경찰특공대 장갑차","🛡️","police","#1f2937","#4b5563","guard",false],
  ["police_bike","교통순찰 싸이카","🏍️","police","#ffffff","#1d4ed8","patrol",false],
  ["police_tow","폴리스 견인차","🛻","police","#2563eb","#facc15","crane",false],
  ["police_mobile_bus","이동파출소 버스","🚌","police","#1d4ed8","#ffffff","command",false],
  ["police_water_cannon","경찰 물대포차","💦","police","#1e40af","#60a5fa","water",false],
  ["eod_robot_van","폭발물처리차 (EOD)","🤖","police","#374151","#f59e0b","robot",false],
  ["ambulance","일반 구급차","🚑","medic","#ffffff","#ef4444","heal",false],
  ["icu_ambulance","특수 구급차 (중환자용)","🏥","medic","#ffffff","#3b82f6","heal",false],
  ["hospital_bus","이동식 병원 버스","🚐","medic","#ffffff","#10b981","heal",false],
  ["mountain_atv_truck","산악구조차 (ATV)","⛰️","medic","#f97316","#ffffff","patrol",false],
  ["water_rescue_boat","수난구조차","🚤","medic","#0284c7","#facc15","crane",false],
  ["heli_support","닥터헬기 지원차","🚁","medic","#ffffff","#e11d48","command",false],
  ["animal_rescue","동물구조대 차량","🐶","medic","#84cc16","#ffffff","heal",false],
  ["crawler_excavator","무한궤도 굴착기","🚜","construction","#eab308","#1f2937","dig_smash",true],
  ["wheel_excavator","타이어 굴착기","🚜","construction","#f59e0b","#1f2937","dig_smash",false],
  ["rough_crane","대형 맹꽁이 크레인","🏗️","construction","#f59e0b","#374151","crane",false],
  ["mobile_tower_crane","타워크레인 트럭","🏗️","construction","#d97706","#ffffff","crane",false],
  ["bulldozer","불도저","🚜","construction","#eab308","#111827","drive_push",true],
  ["wheel_loader","휠로더","🚜","construction","#f59e0b","#1f2937","dig_smash",false],
  ["skid_loader","스키드로더","🚜","construction","#fbbf24","#1f2937","dig_smash",false],
  ["dump_truck","덤프트럭","🚛","construction","#3b82f6","#f59e0b","cargo_dump",false],
  ["mixer_truck","레미콘 (콘크리트 믹서)","🚚","construction","#10b981","#f1f5f9","cargo_spin",false],
  ["concrete_pump","콘크리트 펌프카","🏗️","construction","#ef4444","#ffffff","ladder",false],
  ["road_roller","아스팔트 롤러","🚜","construction","#eab308","#374151","drive_push",false],
  ["drill_rig","천공기 (드릴차)","🔩","construction","#f97316","#1f2937","dig_smash",true],
  ["garbage_truck","압축 진개차 (쓰레기차)","🚛","service","#15803d","#86efac","cargo_dump",false],
  ["street_sweeper","노면청소차","🧹","service","#059669","#facc15","clean",false],
  ["water_sprinkler","살수차","💦","service","#0284c7","#e0f2fe","water",false],
  ["snow_plow","제설차","❄️","service","#f97316","#f8fafc","drive_push",false],
  ["cherry_picker","고소작업차 (바가지차)","💡","service","#0284c7","#ffffff","ladder",false],
  ["electric_repair","활선작업차 (전기수리)","⚡","service","#eab308","#38bdf8","ladder",false],
  ["sewer_suction","하수구 준설차","🕳️","service","#475569","#38bdf8","water",false],
  ["library_bus","이동식 도서관 버스","📚","service","#f59e0b","#ec4899","command",false],
  ["underlift_wrecker","언더리프트 견인차","🛻","transport","#7c3aed","#facc15","crane",false],
  ["rollback_carrier","셀프로더 (어부바카)","🚚","transport","#6d28d9","#ffffff","cargo_dump",false],
  ["car_transporter","카캐리어 (2층 운반트럭)","🚗","transport","#5b21b6","#f59e0b","cargo_dump",false],
  ["fuel_tanker","유조차","⛽","transport","#9333ea","#cbd5e1","water",false],
  ["pushback_tractor","항공기 토잉카","✈️","transport","#eab308","#1f2937","drive_push",false],
  ["airport_deicer","공항 제설·제빙차","❄️","transport","#2563eb","#f8fafc","water",false],
  ["recovery_tank","장갑 구난전차","🛡️","transport","#365314","#1c1917","crane",true],
];

const BG_CATEGORY_DRIVER = {
  fire: '🧑‍🚒',
  police: '👮',
  medic: '🧑‍⚕️',
  construction: '🧑‍🔧',
  service: '🧑‍🔧',
  transport: '🧑‍✈️',
};

const BG_CATEGORY_SIREN = {
  fire: '#ff5252',
  police: '#3b82f6',
  medic: '#22c55e',
  construction: '#f59e0b',
  service: '#06b6d4',
  transport: '#a855f7',
};

const BG_ACTION_GIMMICK = {
  "water": "cannon",
  "ladder": "ladder",
  "crane": "boom",
  "dig_smash": "arm",
  "drive_push": "blade",
  "cargo_spin": "drum",
  "cargo_dump": "carrier",
  "clean": "cannon",
  "heal": "net",
  "scan": "net",
  "command": "net",
  "patrol": "net",
  "guard": "net",
  "robot": "net",
  "light_wind": "net"
};

const BG_GIMMICK_TEMPLATES = {
  ladder: {
    label: '사다리',
    emoji: '🪜',
    slot: { x: 48, y: 36, w: 47, h: 13 },
    color: '#cfd8e3',
    pattern: 'stripes',
    studs: 5,
  },
  cannon: {
    label: '물대포',
    emoji: '💦',
    slot: { x: 50, y: 33, w: 36, h: 16 },
    color: '#60a5fa',
    pattern: 'lines',
    studs: 2,
  },
  blade: {
    label: '밀판',
    emoji: '',
    slot: { x: 44, y: 40, w: 48, h: 14 },
    color: '#64748b',
    pattern: 'lines',
    studs: 0,
  },
  arm: {
    label: '집게 팔',
    emoji: '⛏️',
    slot: { x: 51, y: 18, w: 41, h: 34 },
    color: '#f9844a',
    pattern: 'diag',
    studs: 3,
    rotate: -16,
  },
  boom: {
    label: '크레인 팔',
    emoji: '🪝',
    slot: { x: 50, y: 10, w: 42, h: 41 },
    color: '#ef476f',
    pattern: 'diag',
    studs: 4,
    rotate: -20,
  },
  drum: {
    label: '돌아가는 통',
    emoji: '🌀',
    slot: { x: 52, y: 23, w: 35, h: 28 },
    color: '#ffd166',
    pattern: 'diag',
    studs: 3,
    rotate: -10,
  },
  carrier: {
    label: '실음판',
    emoji: '🚗',
    slot: { x: 47, y: 27, w: 46, h: 25 },
    color: '#4cc9f0',
    pattern: 'lines',
    studs: 4,
  },
  net: {
    label: '그물',
    emoji: '🥅',
    slot: { x: 52, y: 25, w: 36, h: 26 },
    color: '#334155',
    pattern: 'grid',
    studs: 3,
  },
};

const BG_GENERATED = BG_ROSTER_SEED.map(
  ([id, name, icon, category, color, trim, action, track]) => {
    const type = BG_ACTION_GIMMICK[action] || 'net';
    const template = BG_GIMMICK_TEMPLATES[type];
    return {
      id,
      name,
      icon,
      category,
      color,
      trim,
      driver: BG_CATEGORY_DRIVER[category] || '🧑‍🔧',
      track: Boolean(track),
      sirenColor: BG_CATEGORY_SIREN[category] || '#f59e0b',
      gimmick: Object.assign({}, template, { id: type }),
    };
  }
);

const BG_ROSTER = BG_FEATURED.concat(BG_GENERATED);
