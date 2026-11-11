# dino-hide-seek — 외부 LLM 이미지 프롬프트

> 1차 SVG WebP는 46슬롯 전부 ready로 유지. 아래는 더 풍부한 완성본이 필요하면 교체용.

### scene-forest — 쥬라기 숲 배경
- 저장: games/dino-hide-seek/assets/scene-forest.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 512×360 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, soft watercolor-like landscape without harsh outlines, flat colors with gentle gradients, lush prehistoric forest play background, soft green rolling hills, rounded cartoon trees on left and right edges only, light blue sky with fluffy white clouds, empty open foreground play space in the center, warm bright daytime mood, no characters, no text, no sharp spikes."
- 왜 SVG로 부족한가: 숲 깊이감·나뭇잎 군집·빛 그라데이션을 풀씬으로 풍부하게 내려면 LLM이 유리.

### scene-meadow — 공룡 초원 배경
- 저장: games/dino-hide-seek/assets/scene-meadow.webp
- 크기: 512×360 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, soft watercolor-like landscape without harsh outlines, flat colors with gentle gradients, warm prehistoric meadow play background, soft grass hills in mint and leaf greens, tiny round flowers on the sides, distant rounded hill shapes, sunny cream-blue sky, empty open foreground play space in the center, no characters, no text."
- 왜 SVG로 부족한가: 풀밭 질감·꽃 군집·따뜻한 대기감이 단순 색면보다 풍부해야 함.

### scene-lake — 호수와 하늘 배경
- 저장: games/dino-hide-seek/assets/scene-lake.webp
- 크기: 512×360 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, soft watercolor-like landscape without harsh outlines, flat colors with gentle gradients, gentle prehistoric lakeside play background, soft sandy shore band, calm blue water in the lower half with tiny sparkles, soft green hills above, a few rounded reeds at the left edge, empty open play space in the center, no characters, no text."
- 왜 SVG로 부족한가: 물결·반사·모래 질감이 많은 풀씬이라 SVG 1차는 단순 색면 위주.

### dino-spino — 스피노사우루스
- 저장: games/dino-hide-seek/assets/dino-spino.webp
- 크기: 256×256 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, no text, cute chibi Spinosaurus standing facing right, mint-teal body, cream belly, big soft sail on the back with rounded top, long rounded snout, big head short limbs, dark oval eye with white sparkle, pink blush cheek, gentle smile, no sharp teeth menace, transparent background, centered."
- 왜 SVG로 부족한가: 돛·긴 주둥이 실루엣을 더 또렷하고 부드럽게 다듬으면 종 식별이 쉬워짐(현재 SVG도 사용 가능).

### dino-ptera — 프테라노돈
- 저장: games/dino-hide-seek/assets/dino-ptera.webp
- 크기: 256×256 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, no text, cute chibi Pteranodon facing forward-right, soft yellow body, wide rounded wings, long soft head crest sweeping back, tiny orange beak, cream belly, dark oval eye with white sparkle, pink blush, no sharp tips, transparent background, centered."
- 왜 SVG로 부족한가: 날개 막·볏 곡선 디테일을 LLM이 더 풍부하게 살릴 수 있음(현재 SVG도 사용 가능).

### dino-elasm — 엘라스모사우루스
- 저장: games/dino-hide-seek/assets/dino-elasm.webp
- 크기: 256×256 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, no text, cute chibi Elasmosaurus facing right, soft purple body, cream belly, very long curved neck with small round head, four rounded flippers, gentle smile, dark oval eye with white sparkle, pink blush, transparent background, centered."
- 왜 SVG로 부족한가: 초장경 목의 우아한 곡선을 SVG 1차보다 더 자연스럽게 표현 가능.

### dino-tri — 트리케라톱스
- 저장: games/dino-hide-seek/assets/dino-tri.webp
- 크기: 256×256 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, no text, cute chibi Triceratops standing facing right, soft leaf-green body, cream belly, big round frill, three short rounded horns, big head short limbs, dark oval eye with white sparkle, pink blush cheek, gentle smile, transparent background, centered."
- 왜 SVG로 부족한가: 프릴·뿔 세트의 종 시그니처를 더 또렷하게 다듬을 여지(현재 SVG도 사용 가능).
