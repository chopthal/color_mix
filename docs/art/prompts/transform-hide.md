# transform-hide — 외부 이미지 LLM 프롬프트

> 1차 SVG는 `ready.json`에 넣어 두었다. 아래는 디테일·분위기에서 SVG 한계가 큰 슬롯용 교체 프롬프트다.

### bg-living — 마법 거실 배경
- 저장: games/transform-hide/assets/bg-living.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 780×1688 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F) only on small props if any, flat soft lavender wall colors with gentle gradients, round chunky shapes, magical kids living room backdrop, soft lavender walls with tiny star dots, glowing purple arch portal near top center, round star window on the right, oval soft star rug on warm wooden floor, empty center play space with no characters and no hide objects, front view, no text, full-bleed background."
- 왜 SVG로 부족한가: 포털 빛·벽 질감·원근감이 단색 면만으로는 얕다.

### bg-kitchen — 아늑한 부엌 배경
- 저장: games/transform-hide/assets/bg-kitchen.webp
- 크기: 780×1688 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, soft flat colors with gentle gradients, cozy kids kitchen backdrop, warm cream walls, soft upper cabinet band without looking like UI slots, light tile hints on sides only, square window with pink curtains, simple sink silhouette on the left, soft orange oval mat on wooden floor, empty center play space with no characters and no hide objects, front view, no text, full-bleed background."
- 왜 SVG로 부족한가: 타일·커튼 주름·수납장 입체감이 SVG 면 분할로는 밋밋하다.

### bg-garden — 밝은 정원 배경
- 저장: games/transform-hide/assets/bg-garden.webp
- 크기: 780×1688 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, soft flat colors with gentle gradients, bright kids garden backdrop, soft blue sky with round clouds and a gentle sun, wooden fence across mid distance, green grass hill in the foreground, empty center play space with no characters and no hide objects, front view, no text, full-bleed background."
- 왜 SVG로 부족한가: 하늘·잔디 그라데이션과 울타리 깊이가 SVG보다 LLM 쪽이 자연스럽다.

### kid — 마법 지팡이 아이
- 저장: games/transform-hide/assets/kid.webp
- 크기: 256×320 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, no text, a cute round child character holding a short magic wand with a star tip, gentle smile, short purple tunic with a star on the belly, big head, soft shapes, front three-quarter view facing right, centered, transparent background."
- 왜 SVG로 부족한가: 머리카락·옷 주름·손-지팡이 연결이 더 귀엽게 다듬힐 여지가 있다.

### fairy-sky / fairy-peach / fairy-lilac — 탐색 요정 3종
- 저장: games/transform-hide/assets/fairy-sky.webp, fairy-peach.webp, fairy-lilac.webp
- 크기: 각 256×320 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, no text, a cute round seeker fairy with tiny translucent wings, floating pose facing right, centered, transparent background. Variant A sky-blue body with small gold crown. Variant B peach-orange body with pink bow on the head. Variant C lilac-purple body with yellow star on an antenna and soft sparkles near feet."
- 왜 SVG로 부족한가: 날개 반투명·포즈 생동감·장식 디테일이 SVG보다 LLM이 낫다.
