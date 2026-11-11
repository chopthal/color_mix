/**
 * 반짝반짝 별사탕을 지켜요 — 요정·상자·장소·스티커 데이터
 * 요정은 색과 장식만 다르고 대사는 없다(무언 연출).
 */
const SC_FAIRIES = [
  {
    id: 'blue',
    label: '파랑',
    color: '#5c9dff',
    belly: '#e3efff',
    accent: '#2f6bd8',
    hat: 'crown',
  },
  {
    id: 'pink',
    label: '핑크',
    color: '#ff8fc4',
    belly: '#ffe6f2',
    accent: '#d6336c',
    hat: 'bow',
  },
  {
    id: 'mint',
    label: '민트',
    color: '#5fd6a6',
    belly: '#e0fff2',
    accent: '#1f9d6b',
    hat: 'star',
  },
];

/**
 * 상자 5개 — 색·무늬·리본으로 구분 (어느 상자든 숨기기 가능)
 * color = 몸통, dark = 뚜껑, ribbon = 리본, motif = 앞면 무늬(코드 드로잉 폴백용)
 */
const SC_BOXES = [
  { color: '#FFC94A', dark: '#FF9F45', ribbon: '#FF6B81', motif: '#FFF6E5', pattern: 'star' },
  { color: '#FFB3C1', dark: '#FF6B81', ribbon: '#FFF6E5', motif: '#FF6B81', pattern: 'heart' },
  { color: '#6EE7B7', dark: '#3FA34D', ribbon: '#FFF6E5', motif: '#3FA34D', pattern: 'dot' },
  { color: '#A78BFA', dark: '#8B6FD9', ribbon: '#FF6B81', motif: '#FFF6E5', pattern: 'moon' },
  { color: '#FF9F45', dark: '#B07A4F', ribbon: '#FFF6E5', motif: '#FF6B81', pattern: 'stripe' },
];

/**
 * 장소 변주 (지키기 정체성 — 밤 보물방 / 별 정원)
 * transform-hide의 낮 민트 거실과 톤·소품을 분리한다.
 */
const SC_PLACES = [
  {
    id: 'nursery',
    label: '별 보물방',
    wallTop: '#3d2a5c',
    wallBottom: '#6b3d6e',
    stripe: '#5a3470',
    floorTop: '#5c3d55',
    floorBottom: '#3f2a3c',
    rugOuter: '#ff8fc4',
    rugInner: '#ffd6e7',
    windowFrame: '#ffb4d0',
    door: '#ffc078',
    doorStroke: '#f59f00',
    prop: 'jars',
  },
  {
    id: 'garden',
    label: '별사탕 정원',
    wallTop: '#1e3a5f',
    wallBottom: '#2d5a7a',
    stripe: '#244e6e',
    floorTop: '#3d6b4f',
    floorBottom: '#2a4a38',
    rugOuter: '#ffe066',
    rugInner: '#fff3bf',
    windowFrame: '#8ce0c0',
    door: '#a9e34b',
    doorStroke: '#74b816',
    prop: 'bushes',
  },
];

/** 콩! 성공 연출 로테이션 (비눗방울 → 엉덩방아 → 폭죽) */
const SC_KNOCK_FX = ['bubble', 'plop', 'firework'];

/**
 * 스티커 도감 1종 — 라운드 지키기 성공 시 순서대로 해금
 * 재방문 시 선택 화면에서 반김
 */
const SC_STICKERS = [
  { id: 'star-guard', emoji: '⭐', label: '지킴이별' },
  { id: 'candy-heart', emoji: '🍬', label: '달콤하트' },
  { id: 'fairy-wave', emoji: '🧚', label: '요정안녕' },
  { id: 'moon-jar', emoji: '🌙', label: '달단지' },
  { id: 'spark-pop', emoji: '✨', label: '반짝콩' },
];

/** 이미지 슬롯 (파일 없으면 코드 드로잉 폴백) */
const SC_ASSET_SLOTS = [
  { key: 'kid', src: 'assets/kid.webp' },
  { key: 'fairy-blue', src: 'assets/fairy-blue.webp' },
  { key: 'fairy-pink', src: 'assets/fairy-pink.webp' },
  { key: 'fairy-mint', src: 'assets/fairy-mint.webp' },
  { key: 'candy', src: 'assets/candy.webp' },
  { key: 'box-star', src: 'assets/box-star.webp' },
  { key: 'box-heart', src: 'assets/box-heart.webp' },
  { key: 'box-dot', src: 'assets/box-dot.webp' },
  { key: 'box-moon', src: 'assets/box-moon.webp' },
  { key: 'box-stripe', src: 'assets/box-stripe.webp' },
  { key: 'bg-nursery', src: 'assets/bg-nursery.webp' },
  { key: 'bg-garden', src: 'assets/bg-garden.webp' },
  { key: 'door', src: 'assets/door.webp' },
];
