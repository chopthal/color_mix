(function () {
  'use strict';

  var DINO = window.DINO || (window.DINO = {});

  DINO.SPECIES = [
    /* ---------- 쥬라기 숲 · 낮 ---------- */
    {
      id: 'tri', name: '트리', full: '트리케라톱스', habitat: 'forest', time: 'day',
      diet: 'plant', kind: 'ceratops', pitch: 261,
      body: '#7bd48c', belly: '#dcf7dd', accent: '#4fae68',
      facts: ['머리에 뿔이 세 개 있어요.', '커다란 프릴로 몸을 지켜요.', '나뭇잎을 아작아작 먹어요.']
    },
    {
      id: 'stego', name: '스테고', full: '스테고사우루스', habitat: 'forest', time: 'day',
      diet: 'plant', kind: 'stego', pitch: 233,
      body: '#b795ff', belly: '#e8ddff', accent: '#8f68e0',
      facts: ['등에 커다란 판이 있어요.', '꼬리 가시로 몸을 지켜요.', '작은 머리로 풀을 먹어요.']
    },
    {
      id: 'dilo', name: '딜로', full: '딜로포사우루스', habitat: 'forest', time: 'day',
      diet: 'meat', kind: 'theropod', pitch: 247,
      body: '#5fd0c4', belly: '#d6f7f3', accent: '#2fa596',
      opts: { crest: 'double' },
      facts: ['머리에 볏이 두 개 있어요.', '빠르게 달릴 수 있어요.', '이빨이 톱날처럼 생겼어요.']
    },
    {
      id: 'pachy', name: '파키', full: '파키케팔로사우루스', habitat: 'forest', time: 'day',
      diet: 'plant', kind: 'pachy', pitch: 277,
      body: '#7fb9ff', belly: '#dcecff', accent: '#4f8fe0',
      facts: ['머리가 딱딱한 공처럼 생겼어요.', '머리로 쿵쿵 부딪쳐요.', '풀과 열매를 먹어요.']
    },
    {
      id: 'theri', name: '테리', full: '테리지노사우루스', habitat: 'forest', time: 'day',
      diet: 'plant', kind: 'theri', pitch: 294,
      body: '#f39ac8', belly: '#ffe0f0', accent: '#d06aa0',
      facts: ['앞발톱이 아주 길어요.', '배가 통통해요.', '높은 나뭇잎을 끌어당겨 먹어요.']
    },

    /* ---------- 쥬라기 숲 · 밤 ---------- */
    {
      id: 'tino', name: '티노', full: '티라노사우루스', habitat: 'forest', time: 'night',
      diet: 'meat', kind: 'theropod', pitch: 196,
      body: '#ff8a7a', belly: '#ffd9d1', accent: '#e35d4f',
      opts: { big: true },
      facts: ['이빨이 아주 날카로워요.', '두 발로 씽씽 달려요.', '냄새로 먹이를 찾아요.']
    },
    {
      id: 'velo', name: '벨로시', full: '벨로키랍토르', habitat: 'forest', time: 'night',
      diet: 'meat', kind: 'theropod', pitch: 293,
      body: '#ffa94d', belly: '#ffe3bf', accent: '#e08422',
      opts: { raptor: true },
      facts: ['깃털이 나 있어요.', '무리 지어 다녀요.', '발톱이 아주 날카로워요.']
    },
    {
      id: 'ankylo', name: '안킬로', full: '안킬로사우루스', habitat: 'forest', time: 'night',
      diet: 'plant', kind: 'ankylo', pitch: 208,
      body: '#c79a6b', belly: '#f2ddc2', accent: '#8f6a45',
      facts: ['등이 단단한 갑옷으로 덮여 있어요.', '꼬리 끝에 커다란 방망이가 있어요.', '낮은 곳의 풀을 먹어요.']
    },
    {
      id: 'ovi', name: '오비', full: '오비랍토르', habitat: 'forest', time: 'night',
      diet: 'omni', kind: 'theropod', pitch: 311,
      body: '#8fe0b8', belly: '#ddf8e8', accent: '#4fb57a',
      opts: { small: true, feather: true, beak: true },
      facts: ['머리에 볏이 있어요.', '알을 품는 공룡이에요.', '여러 가지를 다 먹어요.']
    },
    {
      id: 'compso', name: '콤프소', full: '콤프소그나투스', habitat: 'forest', time: 'night',
      diet: 'meat', kind: 'theropod', pitch: 330,
      body: '#ffd45e', belly: '#fff2c4', accent: '#e0a92e',
      opts: { small: true, crest: 'ridge' },
      facts: ['닭만큼 작은 공룡이에요.', '아주 빨리 달려요.', '작은 곤충과 동물을 먹어요.']
    },

    /* ---------- 공룡 초원 · 낮 ---------- */
    {
      id: 'braki', name: '브라키', full: '브라키오사우루스', habitat: 'meadow', time: 'day',
      diet: 'plant', kind: 'sauropod', pitch: 220,
      body: '#7fb9ff', belly: '#dcecff', accent: '#4f8fe0',
      facts: ['목이 아주 길어요.', '높은 나뭇잎을 먹어요.', '코가 머리 위에 있어요.']
    },
    {
      id: 'diplo', name: '디플로', full: '디플로도쿠스', habitat: 'meadow', time: 'day',
      diet: 'plant', kind: 'sauropod', pitch: 196,
      body: '#8fd48f', belly: '#e0f7df', accent: '#57ae6b',
      opts: { whip: true },
      facts: ['꼬리가 채찍처럼 길어요.', '등뼈가 튼튼해요.', '이빨이 작아서 잎을 통째로 삼켜요.']
    },
    {
      id: 'para', name: '파라', full: '파라사우롤로푸스', habitat: 'meadow', time: 'day',
      diet: 'plant', kind: 'hadrosaur', pitch: 262,
      body: '#ffb066', belly: '#ffe3c6', accent: '#e0862e',
      opts: { crest: 'long' },
      facts: ['머리에 긴 관이 있어요.', '그 관으로 소리를 내요.', '무리 지어 풀을 먹어요.']
    },
    {
      id: 'maia', name: '마이아', full: '마이아사우루스', habitat: 'meadow', time: 'day',
      diet: 'plant', kind: 'hadrosaur', pitch: 294,
      body: '#6fd6c4', belly: '#d6f7f0', accent: '#3aa995',
      opts: { crest: 'short' },
      facts: ['다정한 엄마 공룡이에요.', '새끼에게 먹이를 물어다 줘요.', '둥지에서 알을 돌봐요.']
    },
    {
      id: 'argen', name: '아르헨', full: '아르헨티노사우루스', habitat: 'meadow', time: 'day',
      diet: 'plant', kind: 'sauropod', pitch: 175,
      body: '#b795ff', belly: '#e8ddff', accent: '#8f68e0',
      opts: { huge: true },
      facts: ['아주아주 큰 공룡이에요.', '목이 길어 구름에 닿을 것 같아요.', '하루 종일 나뭇잎을 먹어요.']
    },

    /* ---------- 공룡 초원 · 밤 ---------- */
    {
      id: 'allo', name: '알로', full: '알로사우루스', habitat: 'meadow', time: 'night',
      diet: 'meat', kind: 'theropod', pitch: 233,
      body: '#9fbf6b', belly: '#e5f2c9', accent: '#6f8f42',
      opts: { crest: 'ridge' },
      facts: ['등에 작은 볏이 있어요.', '무리 지어 사냥해요.', '긴 꼬리로 균형을 잡아요.']
    },
    {
      id: 'carno', name: '카르노', full: '카르노타우루스', habitat: 'meadow', time: 'night',
      diet: 'meat', kind: 'theropod', pitch: 208,
      body: '#ff8a7a', belly: '#ffd9d1', accent: '#c9483a',
      opts: { horns: true, big: true },
      facts: ['머리에 뿔이 두 개 있어요.', '팔이 아주 짧아요.', '빠르게 달려요.']
    },
    {
      id: 'cerato', name: '케라토', full: '케라토사우루스', habitat: 'meadow', time: 'night',
      diet: 'meat', kind: 'theropod', pitch: 247,
      body: '#c79a6b', belly: '#f2ddc2', accent: '#8f6a45',
      opts: { noseHorn: true },
      facts: ['코에 뿔이 있어요.', '등에 작은 돌기가 있어요.', '날카로운 이빨로 먹이를 먹어요.']
    },
    {
      id: 'giga', name: '기가노', full: '기가노토사우루스', habitat: 'meadow', time: 'night',
      diet: 'meat', kind: 'theropod', pitch: 185,
      body: '#9aa9c4', belly: '#e0e6f2', accent: '#64748f',
      opts: { big: true },
      facts: ['티노만큼 큰 사냥꾼이에요.', '머리가 아주 커요.', '무리 지어 사냥했어요.']
    },
    {
      id: 'deino', name: '데이노', full: '데이노니쿠스', habitat: 'meadow', time: 'night',
      diet: 'meat', kind: 'theropod', pitch: 311,
      body: '#ffd45e', belly: '#fff2c4', accent: '#d9a01f',
      opts: { raptor: true },
      facts: ['발톱으로 먹이를 잡아요.', '무리 지어 다녀요.', '영리한 사냥꾼이에요.']
    },

    /* ---------- 호수와 하늘 · 낮 ---------- */
    {
      id: 'spino', name: '스피노', full: '스피노사우루스', habitat: 'lake', time: 'day',
      diet: 'fish', kind: 'theropod', pitch: 208,
      body: '#5fd0c4', belly: '#d6f7f3', accent: '#2fa596',
      opts: { sail: true },
      facts: ['등에 커다란 돛이 있어요.', '물고기를 좋아해요.', '긴 입으로 물속을 뒤져요.']
    },
    {
      id: 'baryo', name: '바리오', full: '바리오닉스', habitat: 'lake', time: 'day',
      diet: 'fish', kind: 'theropod', pitch: 262,
      body: '#c79a6b', belly: '#f2ddc2', accent: '#8f6a45',
      opts: { longSnout: true },
      facts: ['입이 악어처럼 길어요.', '물가에서 물고기를 잡아요.', '커다란 발톱이 있어요.']
    },
    {
      id: 'plesio', name: '플레시오', full: '플레시오사우루스', habitat: 'lake', time: 'day',
      diet: 'fish', kind: 'marine', pitch: 246,
      body: '#5fd6c7', belly: '#d3f7f2', accent: '#33ab9c',
      opts: { marine: 'plesio' },
      facts: ['목이 길고 지느러미가 있어요.', '바다에서 헤엄쳐요.', '물고기를 잡아먹어요.']
    },
    {
      id: 'ptera', name: '프테라', full: '프테라노돈', habitat: 'lake', time: 'day',
      diet: 'fish', kind: 'ptera', pitch: 329,
      body: '#ffcf5c', belly: '#fff1c4', accent: '#e0a52e',
      facts: ['하늘을 날아요.', '머리에 긴 볏이 있어요.', '물고기를 잡아요.']
    },
    {
      id: 'archaeo', name: '아르케', full: '아르케옵테릭스', habitat: 'lake', time: 'day',
      diet: 'meat', kind: 'bird', pitch: 349,
      body: '#ffa94d', belly: '#ffe3bf', accent: '#d07a1f',
      facts: ['날개에 깃털이 있어요.', '짧게 날 수 있어요.', '곤충과 작은 동물을 먹어요.']
    },

    /* ---------- 호수와 하늘 · 밤 ---------- */
    {
      id: 'sucho', name: '수코', full: '수코미무스', habitat: 'lake', time: 'night',
      diet: 'fish', kind: 'theropod', pitch: 233,
      body: '#9fbf6b', belly: '#e5f2c9', accent: '#6f8f42',
      opts: { longSnout: true, smallSail: true },
      facts: ['악어처럼 긴 입이 있어요.', '물고기를 잡아먹어요.', '등에 작은 돛이 있어요.']
    },
    {
      id: 'elasm', name: '엘라스모', full: '엘라스모사우루스', habitat: 'lake', time: 'night',
      diet: 'fish', kind: 'marine', pitch: 220,
      body: '#b795ff', belly: '#e8ddff', accent: '#8f68e0',
      opts: { marine: 'elasm' },
      facts: ['목이 아주 길어요.', '지느러미로 헤엄쳐요.', '물고기를 잡아요.']
    },
    {
      id: 'mosa', name: '모사', full: '모사사우루스', habitat: 'lake', time: 'night',
      diet: 'fish', kind: 'marine', pitch: 196,
      body: '#7fb9ff', belly: '#dcecff', accent: '#4f8fe0',
      opts: { marine: 'mosa' },
      facts: ['바다의 왕이에요.', '긴 몸으로 헤엄쳐요.', '물고기와 오징어를 먹어요.']
    },
    {
      id: 'ichthyo', name: '이크티오', full: '이크티오사우루스', habitat: 'lake', time: 'night',
      diet: 'fish', kind: 'marine', pitch: 277,
      body: '#5fa8e8', belly: '#d6e9ff', accent: '#2f7fc4',
      opts: { marine: 'ichthyo' },
      facts: ['돌고래처럼 생겼어요.', '아주 빨리 헤엄쳐요.', '물고기를 먹어요.']
    },
    {
      id: 'rhamph', name: '람포', full: '람포링쿠스', habitat: 'lake', time: 'night',
      diet: 'fish', kind: 'ptera', pitch: 311,
      body: '#ff8a7a', belly: '#ffd9d1', accent: '#d95c4c',
      opts: { longTail: true },
      facts: ['긴 꼬리가 있어요.', '하늘을 날아요.', '물고기를 잡아요.']
    }
  ];

  DINO.HABITATS = [
    { id: 'forest', name: '쥬라기 숲', emoji: '🌳', sub: '나무와 풀숲 사이' },
    { id: 'meadow', name: '공룡 초원', emoji: '🌾', sub: '따뜻한 풀밭' },
    { id: 'lake', name: '호수와 하늘', emoji: '🌊', sub: '물가와 하늘 위' }
  ];

  DINO.SPOTS = {
    forest: [
      { type: 'bush', x: 11, y: 62 }, { type: 'tree', x: 80, y: 51 },
      { type: 'rock', x: 53, y: 69 }, { type: 'cloud', x: 28, y: 20 },
      { type: 'grass', x: 88, y: 69 }, { type: 'bush', x: 41, y: 57 }
    ],
    meadow: [
      { type: 'flower', x: 12, y: 64 }, { type: 'rock', x: 79, y: 68 },
      { type: 'bush', x: 46, y: 70 }, { type: 'cloud', x: 26, y: 20 },
      { type: 'hay', x: 87, y: 62 }, { type: 'flower', x: 57, y: 58 }
    ],
    lake: [
      { type: 'reed', x: 12, y: 59 }, { type: 'rock', x: 74, y: 66 },
      { type: 'lily', x: 42, y: 71 }, { type: 'cloud', x: 24, y: 19 },
      { type: 'shell', x: 87, y: 71 }, { type: 'coral', x: 57, y: 61 }
    ]
  };

  DINO.FOODS = [
    { id: 'meat', emoji: '🥩', label: '고기' },
    { id: 'plant', emoji: '🌿', label: '나뭇잎' },
    { id: 'fish', emoji: '🐟', label: '물고기' }
  ];

  DINO.DIET_EMOJI = { meat: '🥩', plant: '🌿', fish: '🐟', omni: '🥩' };
  DINO.DIET_LABEL = { meat: '고기', plant: '나뭇잎', fish: '물고기', omni: '고기와 나뭇잎' };
  DINO.ACC_EMOJI = { hat: '🎩', ribbon: '🎀', crown: '👑' };
  DINO.ACC_LABEL = { hat: '모자', ribbon: '리본', crown: '왕관' };

  DINO.SAVE_KEY = 'dino-hide-seek-v2';
  DINO.TOTAL_SPECIES = DINO.SPECIES.length;
  DINO.TOTAL_HEARTS = DINO.TOTAL_SPECIES * 3;
  DINO.LINE = '#34455c';
})();
