# forest-soup — 외부 이미지 LLM 프롬프트

스타일 A (`docs/art/style-A-svg.md`) 준수. SVG 1차본은 `ready.json`에 넣어 두었고, 아래는 퀄리티 업그레이드용.

### forest-bg — 숲 클리어링 배경
- 저장: games/forest-soup/assets/forest-bg.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 768×1024 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game backdrop, soft sunny forest clearing, bold clean shapes, flat colors with soft gradients only in sky and grass, gentle round trees left and right, grassy hills, tiny flowers at edges, warm daytime light, open empty center play space for a cooking pot, no characters, no text, no outlines on large background shapes, calm cozy mood, vertical 3:4."
- 왜 SVG로 부족한가: 하늘·언덕·나무 깊이감과 부드러운 대기 그라데이션을 SVG 단색 덩어리로는 충분히 내기 어렵다.

### pot — 위쪽에서 본 숲속 냄비(가운데 구멍)
- 저장: games/forest-soup/assets/pot.webp
- 크기: 512×512 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, top-down cute clay cooking pot, warm cocoa brown (#B07A4F) rim and round side handles, large perfectly circular empty transparent hole in the center for soup, thick rim so the metal/clay ring stays visible around the hole, no face on rim, no text, transparent background, centered."
- 왜 SVG로 부족한가: 림 두께·하이라이트·손잡이 입체감을 수프 레이어와 정확히 맞추는 마감이 SVG보다 래스터 일러스트가 낫다.

### friend-fox — 여우 친구
- 저장: games/forest-soup/assets/friend-fox.webp
- 크기: 256×256 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly fox facing forward, tangerine orange body, cream muzzle and belly, soft fluffy white-tipped tail, short stubby limbs, big head, eyes lower on face with white sparkle, pink blush cheeks, small smile, no text, transparent background, centered."
- 왜 SVG로 부족한가: 귀·꼬리 털 실루엣과 주둥이 면 분할을 작은 표시 크기에서도 또렷하게 유지하기 어렵다.

### friend-deer — 사슴 친구
- 저장: games/forest-soup/assets/friend-deer.webp
- 크기: 256×256 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly deer facing forward, cocoa brown body, cream belly, tiny soft rounded antlers with blunt tips, short stubby limbs, big head, eyes lower on face with white sparkle, pink blush cheeks, small smile, no sharp points, no text, transparent background, centered."
- 왜 SVG로 부족한가: 작은 뿔·귀 실루엣을 둥글게 유지하면서도 사슴으로 읽히게 하는 디테일이 SVG에서 약하다.
