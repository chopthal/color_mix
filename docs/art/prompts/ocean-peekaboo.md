# ocean-peekaboo — 외부 LLM 이미지 프롬프트

> 1차 SVG WebP는 전부 ready로 유지. 아래는 더 풍부한 완성본이 필요하면 교체용.

### sea-bg — 바닷속 배경 씬
- 저장: games/ocean-peekaboo/assets/sea-bg.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 768×1280 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F) only on tiny distant props if any, flat colors with soft watercolor-like water gradient, soft underwater ocean background scene, gentle blue water from light cyan top to deeper blue bottom, faint god-rays from above, sandy seafloor at bottom, calm bright mood, open empty play space in the center, no characters, no text, no scary darkness."
- 왜 SVG로 부족한가: 빛살·수심 그라데이션·모래 질감이 많은 풀씬 배경이라 SVG 1차는 단순 색면 위주.

### shark — 졸린 아기 상어
- 저장: games/ocean-peekaboo/assets/shark.webp
- 크기: 320×176 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, no text, a cute sleepy baby shark swimming sideways facing right, soft sky-blue body, cream belly, closed sleepy curved eyes, tiny blush cheeks, gentle smile, rounded fins no sharp teeth, tiny soft bubble marks above head instead of letters, transparent background, centered."
- 왜 SVG로 부족한가: 졸린 표정·부드러운 부피감을 더 살리면 귀여움이 올라감(현재 SVG도 사용 가능).

### whale — 아기 고래
- 저장: games/ocean-peekaboo/assets/whale.webp
- 크기: 320×192 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, no text, a cute baby whale swimming sideways facing right, soft ocean-blue body, cream belly, round eyes with white sparkle, happy gentle smile, tiny spout bubbles, short rounded fins, transparent background, centered."
- 왜 SVG로 부족한가: 몸통 곡선·물보라 디테일을 LLM이 더 풍부하게 다듬기 좋음(현재 SVG도 사용 가능).
