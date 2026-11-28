/**
 * 부릉부릉 드라이브 — 튜닝 상수 · 문구 · 목적지/구간/날씨 데이터 (데이터만)
 * 단위: 거리 m, 속도 m/s, 시간 s, 각도 deg(접미사 Deg)
 */

export const CONFIG = {
  car: {
    vmax: 11, // 약 40km/h 체감
    accel: 5.3, // 출발 가속 (속도가 오를수록 taper만큼 줄어 0→vmax ≈ 3초)
    accelTaper: 0.55,
    coast: 5.5, // 페달 떼면 감속 (vmax → 0 ≈ 2초)
    coastEaseV: 2.5,
    coastMinFactor: 0.3,
    revIdle: 0.32,
    nose: 2.0, // 눈(카메라) → 앞범퍼
    eyeHeight: 1.2,
    eyeOffsetX: -0.3, // 운전석(왼쪽)
  },
  steer: {
    latMax: 2.5,
    latFullSpeed: 4,
    magnetGain: 1.6,
    latSmooth: 7,
    springTime: 0.3,
    maxVisualDeg: 120,
    dMin: 1.3,
    dMax: 5.7,
    blinkOnSteer: 0.3, // 핸들 입력이 이만큼 넘으면 깜빡이 자동 점등
  },
  road: {
    lanes: [1.75, 5.25],
    oncomingD: -1.75,
    shoulderD: 8.25,
    edgeL: -4.0,
    edgeR: 9.5,
    curbW: 0.3,
    curbH: 0.15,
    walkW: 3.0,
    kappa1: 0.0052, // 곡률 진폭 (반경 ≈ 190m)
    wave1: 280,
    kappa2: 0.0026,
    wave2: 170,
    hold: 40, // 정지 이벤트·시작·도착 전후 직선
    blend: 45,
    tableStep: 0.5,
  },
  world: {
    chunkLen: 40,
    chunksAlive: 10,
    chunksBehind: 1,
    rowStep: 2,
    fogNear: 45,
    fogFar: 250,
    treesPerChunk: 34, // 종류별 인스턴스 슬롯
    syncChunks: 5, // 여행 시작 시 즉시 만드는 청크 수 (나머지는 프레임 분할)
    buildBudgetMs: 4,
    themeBlend: 30, // 구간 전환 블렌드 폭
    waterY: -1.0, // 바다
    riverY: -3.2, // 다리 아래 강
    farGroundY: -3.6,
  },
  camera: {
    hFovDeg: 80,
    vFovMinDeg: 50,
    vFovMaxDeg: 80,
    pitchDeg: -4.5,
    pitchPortraitDeg: -15,
    speedFovDeg: 4,
    yawDeg: 6,
    rollDeg: 1.5,
    shake: 0.0045,
    bonnetEdgeFrac: 0.13,
    near: 0.1,
    far: 1500,
  },
  magic: {
    approachDist: 60,
    startDist: 35,
    gap: 2.0,
    tailK: 1.3,
    judgeDist: 15, // 정지 판정 (더 멀리서 멈추면 페달 반짝으로 조금 더)
  },
  follow: { minGap: 8, accel: 3, sameLane: 2.4, tractorHalfLen: 1.8 },
  tractor: {
    speed: 3,
    spawnAhead: 60,
    promptDist: 30,
    honkDist: 50,
    yieldTime: 1.5,
    blinkHz: 2.2,
    rePulseAfter: 10,
    autoYieldAfter: 25,
    waveDelay: 0.2,
    despawnBehind: 15,
    zoneMargin: 45, // 터널·세차장·도착지 앞에서는 미리 비켜 줌
  },
  crossing: {
    startDelay: 1.0,
    speed: 4.4,
    stagger: 0.45,
    fromD: -4.65, // 왼쪽 연석 바로 위 (횡단보도 입구)
    toD: 11.4,
    greenDelay: 0.8,
    crossOffset: 3.5,
    scale: 1.45,
    lookMaxDeg: 26, // 정지 중 동물 쪽으로 고개 돌림 최대
    lookMarginDeg: 12,
  },
  train: {
    trackOffset: 6.5, // 정지선 → 선로 중심
    speed: 9,
    startU: -38,
    cars: 4,
    carLen: 7.2,
    barrierTime: 1.6,
    bellEvery: 0.48,
  },
  tunnel: { minLight: 0.5, fade: 22, promptAhead: 40, hemiSky: 0xfff0dc, hemiGround: 0xeadbc6, fog: 0x8a7866 },
  wash: { slowSpeed: 3, slowFrom: 30, decel: 1.8 },
  seaView: { jumpEvery: [3.2, 5.0], honkJumpCooldown: 1.2 },
  horn: { cooldown: 0.35, birdCooldown: 6, emptyAhead: 60, birdMin: 14, birdMax: 42 },
  oncoming: { speed: 9, spawnAhead: 230, minInterval: 8, maxInterval: 13, stopBeyond: 9.5 },
  schedule: {
    startClear: 190, // 출발 후 첫 이벤트까지 최소 거리
    endClear: 150, // 도착 전 비워 두는 거리
    minGap: 120, // 이벤트 사이 최소 간격
    boundaryClear: 45, // 구간 경계에서 떨어뜨림
    arrivalBack: 45, // 마지막 구간 끝에서 도착 정차 지점까지
  },
  hints: { idleDelay: 5, weatherLineAfter: 10 },
  speech: { minMs: 2800, perCharMs: 170 },
  blinker: { duration: 3 },
  wiper: { period: 1.7, sweep: 0.9 },
  perf: { pixelRatioMax: 1.5, slowFrameMs: 22, slowWindow: 2 },
  sim: { maxFrameDt: 0.1, step: 1 / 60 },
};

/** 확정 문구 (docs/games/drive-trip.md §10-1 · §8-B — 창작 금지, 원문 그대로) */
export const LINES = {
  key: '열쇠를 돌려 볼까?',
  start: '오른쪽 페달을 꾹 눌러 봐!',
  red: '빨간불이네. 손을 떼 볼까?',
  selfStop: '우와, 딱 멈췄다!',
  magicStop: '같이 멈췄다!',
  crossing: '친구들이 건너가요~',
  green: '초록불! 출발~',
  slowCar: '빵빵 해 볼까?',
  yielded: '먼저 가~ 고마워!',
  arrive: '도착! 운전 정말 멋졌어.',
  firstMeet: '안녕, 나는 토리야. 같이 드라이브 가자!',
  pick: '오늘은 어디 갈까?',
  go: {
    sea: '바닷가로 출발!',
    zoo: '동물원으로 출발!',
    grandma: '할머니 댁으로 출발!',
    park: '놀이공원으로 출발!',
  },
  train: '땡땡땡! 기차가 와요. 멈춰 볼까?',
  trainBye: '기차야 안녕~',
  tunnel: '터널이다! 불을 켜 볼까?',
  wash: '세차장이다! 거품 목욕~',
  rain: '비가 와요. 와이퍼를 켜 볼까?',
  sunset: '해가 지고 있어. 불을 켜 볼까?',
  arrived: {
    sea: '바닷가에 도착!',
    zoo: '동물원에 도착!',
    grandma: '할머니 댁에 도착!',
    park: '놀이공원에 도착!',
  },
  stamp: '도장 쾅!',
  endingTitle: '도착!',
};

/**
 * 목적지: 구간(테마·길이) 흐름 + 고유 이벤트 + 도착 연출.
 * unique.seg = 이벤트가 들어갈 구간 번호, at = 구간 안 위치 비율, len = 이벤트 지형 길이
 */
export const DESTINATIONS = {
  sea: {
    emoji: '🏖️',
    segments: [
      { theme: 'town', length: 320 },
      { theme: 'farm', length: 460 },
      { theme: 'coast', length: 740 },
    ],
    unique: { type: 'seaView', seg: 2, at: 0.42, len: 170 },
    arrival: 'beach',
  },
  zoo: {
    emoji: '🦒',
    segments: [
      { theme: 'town', length: 320 },
      { theme: 'forest', length: 1200 },
    ],
    unique: { type: 'tunnel', seg: 1, at: 0.4, len: 180 },
    arrival: 'zoo',
  },
  grandma: {
    emoji: '🏡',
    segments: [
      { theme: 'town', length: 300 },
      { theme: 'farm', length: 520 },
      { theme: 'bridge', length: 300 },
      { theme: 'country', length: 480 },
    ],
    unique: { type: 'train', seg: 1, at: 0.55 },
    arrival: 'grandma',
  },
  park: {
    emoji: '🎡',
    segments: [
      { theme: 'town', length: 300 },
      { theme: 'market', length: 600 },
      { theme: 'bridge', length: 340 },
      { theme: 'town', length: 240 },
    ],
    unique: { type: 'wash', seg: 1, at: 0.78, len: 30 },
    arrival: 'amusement',
  },
};

export const DEST_ORDER = ['zoo', 'grandma', 'park', 'sea'];

/** 날씨/시간대 (여행마다 가중 랜덤) */
export const WEATHERS = {
  clear: {
    weight: 50,
    sky: { zenith: 0x7fc4f0, mid: 0xbfe4fb, horizon: 0xeaf5f1, sun: 0xfff3d6, sunDir: [-0.45, 0.32, -0.83] },
    fog: { color: 0xeaf5f1, near: 45, far: 250 },
    hemi: { sky: 0xf2f8ff, ground: 0xc9dfae, intensity: 2.5 },
    sun: { color: 0xfff0da, intensity: 1.7, dir: [-0.3, 1, 0.25] },
    hills: 0xffffff,
    clouds: 0x9aa4b0,
    lamps: 0,
    snow: 0,
  },
  sunset: {
    weight: 20,
    sky: { zenith: 0x7e86d6, mid: 0xf4ae9c, horizon: 0xffd6a6, sun: 0xffc27a, sunDir: [-0.35, 0.07, -0.94] },
    fog: { color: 0xf6caa8, near: 40, far: 230 },
    hemi: { sky: 0xffdcc4, ground: 0xb79a7c, intensity: 2.0 },
    sun: { color: 0xffb27a, intensity: 2.0, dir: [-0.5, 0.35, -0.8] },
    hills: 0xf2c3b0,
    clouds: 0xc27e74,
    lamps: 1,
    snow: 0,
    line: 'sunset',
    hint: 'lights',
  },
  rain: {
    weight: 15,
    sky: { zenith: 0x93a6bb, mid: 0xbac6d2, horizon: 0xd6dde3, sun: 0x000000, sunDir: [0, 1, 0] },
    fog: { color: 0xd2d9df, near: 30, far: 190 },
    hemi: { sky: 0xe4ecf4, ground: 0xa9b9a0, intensity: 2.3 },
    sun: { color: 0xe8eef6, intensity: 0.7, dir: [-0.2, 1, 0.3] },
    hills: 0xc5ccd6,
    clouds: 0x6f7884,
    lamps: 0.5,
    snow: 0,
    line: 'rain',
    hint: 'wiper',
  },
  snow: {
    weight: 15,
    sky: { zenith: 0xa7c3e2, mid: 0xd5e3f1, horizon: 0xeef3f8, sun: 0xffffff, sunDir: [-0.45, 0.3, -0.84] },
    fog: { color: 0xe9eff5, near: 38, far: 210 },
    hemi: { sky: 0xf4f8ff, ground: 0xdfe6ee, intensity: 2.5 },
    sun: { color: 0xffffff, intensity: 1.2, dir: [-0.3, 1, 0.25] },
    hills: 0xffffff,
    clouds: 0xa8b2be,
    lamps: 0.3,
    snow: 0.85,
  },
};

export const PALETTE = {
  ground: 0xa9d98b,
  asphalt: 0x9aa1b5,
  shoulder: 0xa3aabd,
  white: 0xfbfbf6,
  yellow: 0xffcf4d,
  curb: 0xf4efe6,
  walkA: 0xf3e2c9,
  walkB: 0xe9d3b5,
  verge: 0xd9cdb4,
  path: 0xe9d6ad,
  sand: 0xf6e2b3,
  carBody: 0xff8270,
  trunk: 0xa47551,
};

/**
 * 구간 테마 — 청크 생성기는 이 값과 테마별 장식 함수만 보고 풍경을 만든다.
 * side: 노변 단면 'walk'(연석+인도) | 'verge'(흙길 갓) | 'deck'(다리 위) — 해안은 오른쪽이 방파제+바다
 */
export const THEMES = {
  town: {
    ground: 0xa9d98b,
    side: 'walk',
    walls: [0xfff6e8, 0xfde8d7, 0xeaf3ff, 0xfff3c9, 0xe7f6ea, 0xf6e9ff],
    roofs: [0xff9b85, 0x7fc4f0, 0x8fd6b5, 0xffd166, 0xb9a2f0, 0xffb58a],
    flowers: [0xff9fb8, 0xffe07a, 0xffffff, 0xc7a6ff],
    blossom: 0.25,
    farTrees: 7,
  },
  farm: {
    ground: 0xa8d47f,
    side: 'verge',
    flowers: [0xffe07a, 0xffffff],
    farTrees: 3,
  },
  coast: {
    ground: 0xb1d98e,
    side: 'verge',
    walls: [0xffffff, 0xeaf3ff, 0xfff3c9],
    roofs: [0x7fc4f0, 0x5fa8de, 0xff9b85],
    flowers: [0xffffff, 0xffe07a],
    farTrees: 6,
  },
  forest: {
    ground: 0x8fcb78,
    side: 'verge',
    flowers: [0xffffff, 0xffe07a, 0xc7a6ff],
    farTrees: 8,
  },
  country: {
    ground: 0xb6d68b,
    side: 'verge',
    flowers: [0xffe07a, 0xff9fb8],
    farTrees: 6,
  },
  market: {
    ground: 0xa9d98b,
    side: 'walk',
    walls: [0xfff6e8, 0xffe9d6, 0xe6f2ff, 0xfff1c2],
    roofs: [0xff9b85, 0x7fc4f0, 0xffd166],
    awnings: [
      [0xff8a7a, 0xffffff],
      [0x6cbcf0, 0xffffff],
      [0x7fd6a6, 0xffffff],
      [0xffc94a, 0xffffff],
      [0xb69cf5, 0xffffff],
    ],
    flowers: [0xff9fb8, 0xffe07a],
    farTrees: 4,
  },
  bridge: {
    ground: 0xa9d98b,
    side: 'deck',
    flowers: [0xffffff],
  },
};

export const DEG = Math.PI / 180;
