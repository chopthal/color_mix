/**
 * 뾰로롱! 변신 숨바꼭질 — 요정·물건·순찰 데이터
 * 요정은 색과 장식만 다르고 대사는 없다(무언 연출).
 */
const TH_FAIRIES = [
  {
    id: 'sky',
    label: '하늘',
    color: '#6ba8ff',
    belly: '#e6f0ff',
    accent: '#3b82f6',
    hat: 'crown',
  },
  {
    id: 'peach',
    label: '복숭아',
    color: '#ff9f80',
    belly: '#ffe8df',
    accent: '#e8590c',
    hat: 'bow',
  },
  {
    id: 'lilac',
    label: '라일락',
    color: '#b28dff',
    belly: '#f0e7ff',
    accent: '#7c3aed',
    hat: 'star',
  },
];

const TH_OBJECTS = [
  { kind: 'piano', aria: '피아노', portrait: [0.22, 0.3], landscape: [0.14, 0.52] },
  { kind: 'teddy', aria: '곰인형', portrait: [0.78, 0.3], landscape: [0.38, 0.36] },
  { kind: 'sofa', aria: '소파', portrait: [0.24, 0.53], landscape: [0.62, 0.56] },
  { kind: 'gift', aria: '선물상자', portrait: [0.76, 0.53], landscape: [0.86, 0.4] },
];

const TH_PATROL = {
  portrait: [
    [0.3, 0.23],
    [0.7, 0.23],
    [0.7, 0.47],
    [0.3, 0.47],
  ],
  landscape: [
    [0.18, 0.52],
    [0.4, 0.45],
    [0.62, 0.48],
    [0.82, 0.42],
  ],
};
