/**
 * 째깍 크아앙! 놀이 싸움 — 캐릭터 데이터
 * 내 친구와 적 친구를 전체 11종에서 각각 고른다.
 * 캐릭터마다 커스텀 공격 3종(motion: dash/hop/shout/splash, effect: spark/ring/bubble/leaf/dust).
 * 무기는 '무해화'(둥근 마시멜로·솜·거품)되어 있고, 얼굴은 항상 웃는다.
 */
const MS_CHARS = [
  {
    id: 'mantis',
    name: '사마귀',
    kind: '곤충',
    color: '#7ecb6a',
    belly: '#e4f8d8',
    accent: '#2f7d32',
    art: { mantisBody: true, scythes: true, antennae: true },
    attacks: [
      { id: 'scythe', label: '째깍 낫', emoji: '🦗', sfx: 'scythe', motion: 'dash', effect: 'spark' },
      { id: 'shout', label: '째깍!', emoji: '📣', sfx: 'scythe', motion: 'shout', effect: 'ring' },
      { id: 'hop', label: '솜폴짝', emoji: '⬆️', sfx: 'boing', motion: 'hop', effect: 'leaf' },
    ],
  },
  {
    id: 'spino',
    name: '스피노',
    kind: '공룡',
    color: '#3f9ae0',
    belly: '#d6ecff',
    accent: '#1d4ed8',
    art: { sail: true, webbed: true, longSnout: true },
    attacks: [
      { id: 'roar', label: '크아앙!', emoji: '📣', sfx: 'chomp', motion: 'shout', effect: 'ring' },
      { id: 'bite', label: '깨물기', emoji: '🦷', sfx: 'chomp', motion: 'dash', effect: 'spark' },
      { id: 'push', label: '밀기', emoji: '💨', sfx: 'bonk', motion: 'dash', effect: 'dust' },
    ],
  },

  // 동물
  {
    id: 'lion',
    name: '사자',
    kind: '동물',
    color: '#f5b94e',
    belly: '#fdeecf',
    accent: '#a8661a',
    art: { mane: true },
    attacks: [
      { id: 'roar', label: '어흥!', emoji: '📣', sfx: 'chomp', motion: 'shout', effect: 'ring' },
      { id: 'bite', label: '물기', emoji: '🦷', sfx: 'chomp', motion: 'dash', effect: 'spark' },
      { id: 'push', label: '밀기', emoji: '💨', sfx: 'bonk', motion: 'dash', effect: 'dust' },
    ],
  },
  {
    id: 'elephant',
    name: '코끼리',
    kind: '동물',
    color: '#9db6d9',
    belly: '#e3ecfa',
    accent: '#4a5f8a',
    art: { trunk: true, bigEars: true },
    attacks: [
      { id: 'roar', label: '뿌우~', emoji: '📣', sfx: 'trunk', motion: 'shout', effect: 'ring' },
      { id: 'water', label: '물 뿌리기', emoji: '💧', sfx: 'trunk', motion: 'splash', effect: 'bubble' },
      { id: 'push', label: '코로 밀기', emoji: '💨', sfx: 'trunk', motion: 'dash', effect: 'dust' },
    ],
  },
  {
    id: 'rabbit',
    name: '토끼',
    kind: '동물',
    color: '#f6a7c1',
    belly: '#ffeaf2',
    accent: '#c25c82',
    art: { longEars: true },
    attacks: [
      { id: 'hop', label: '깡충!', emoji: '⬆️', sfx: 'boing', motion: 'hop', effect: 'spark' },
      { id: 'push', label: '폴짝 밀기', emoji: '💨', sfx: 'boing', motion: 'dash', effect: 'dust' },
      { id: 'shout', label: '깡충깡충!', emoji: '📣', sfx: 'boing', motion: 'shout', effect: 'ring' },
    ],
  },

  // 공룡
  {
    id: 'trex',
    name: '티라노',
    kind: '공룡',
    color: '#e0603f',
    belly: '#ffd9c7',
    accent: '#9a3412',
    art: { bigHead: true, tinyArms: true },
    attacks: [
      { id: 'roar', label: '어흥!', emoji: '📣', sfx: 'chomp', motion: 'shout', effect: 'ring' },
      { id: 'bite', label: '깨물기', emoji: '🦷', sfx: 'chomp', motion: 'dash', effect: 'spark' },
      { id: 'push', label: '꼬리 밀기', emoji: '💨', sfx: 'bonk', motion: 'dash', effect: 'dust' },
    ],
  },
  {
    id: 'trike',
    name: '트리케라',
    kind: '공룡',
    color: '#8bbf5a',
    belly: '#e6f5cf',
    accent: '#3f6212',
    art: { frill: true, horns: true },
    attacks: [
      { id: 'horn', label: '뿔 콩', emoji: '🦏', sfx: 'bonk', motion: 'dash', effect: 'dust' },
      { id: 'shout', label: '콩!', emoji: '📣', sfx: 'bonk', motion: 'shout', effect: 'ring' },
      { id: 'stomp', label: '쿵!', emoji: '⬇️', sfx: 'bonk', motion: 'hop', effect: 'dust' },
    ],
  },
  {
    id: 'brachio',
    name: '브라키오',
    kind: '공룡',
    color: '#6aa9c9',
    belly: '#d9f0fb',
    accent: '#155e75',
    art: { longNeck: true, longTail: true },
    attacks: [
      { id: 'shout', label: '쿵~', emoji: '📣', sfx: 'bonk', motion: 'shout', effect: 'ring' },
      { id: 'stomp', label: '발쿵', emoji: '⬇️', sfx: 'bonk', motion: 'hop', effect: 'dust' },
      { id: 'push', label: '목 밀기', emoji: '💨', sfx: 'bonk', motion: 'dash', effect: 'dust' },
    ],
  },

  // 곤충
  {
    id: 'stag',
    name: '사슴벌레',
    kind: '곤충',
    color: '#7a5c46',
    belly: '#e7d7c6',
    accent: '#3f2d20',
    art: { bigPincers: true },
    attacks: [
      { id: 'pincer', label: '집게 콕', emoji: '🪲', sfx: 'scythe', motion: 'dash', effect: 'spark' },
      { id: 'shout', label: '째깍!', emoji: '📣', sfx: 'scythe', motion: 'shout', effect: 'ring' },
      { id: 'hop', label: '폴짝', emoji: '⬆️', sfx: 'boing', motion: 'hop', effect: 'spark' },
    ],
  },
  {
    id: 'beetle',
    name: '장수풍뎅이',
    kind: '곤충',
    color: '#8a6a4f',
    belly: '#efe0cc',
    accent: '#4a3421',
    art: { horn: true },
    attacks: [
      { id: 'horn', label: '뿔 콩', emoji: '🪲', sfx: 'bonk', motion: 'dash', effect: 'dust' },
      { id: 'shout', label: '쾅!', emoji: '📣', sfx: 'bonk', motion: 'shout', effect: 'ring' },
      { id: 'stomp', label: '쿵!', emoji: '⬇️', sfx: 'bonk', motion: 'hop', effect: 'dust' },
    ],
  },
  {
    id: 'ladybug',
    name: '무당벌레',
    kind: '곤충',
    color: '#e8544a',
    belly: '#f9d7d2',
    accent: '#8f1f14',
    art: { spots: true },
    attacks: [
      { id: 'bump', label: '통통 콩', emoji: '🐞', sfx: 'pop', motion: 'dash', effect: 'spark' },
      { id: 'shout', label: '통통!', emoji: '📣', sfx: 'pop', motion: 'shout', effect: 'ring' },
      { id: 'hop', label: '통통 폴짝', emoji: '⬆️', sfx: 'pop', motion: 'hop', effect: 'spark' },
    ],
  },
];
