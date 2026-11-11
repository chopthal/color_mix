# fishing — 외부 이미지 LLM 프롬프트

> 1차 SVG→WebP는 `ready.json`에 등록됨. 아래는 복잡한 수중 배경의 완성도를 더 올리고 싶을 때용.

### bg-morning — 아침 수중 배경
- 저장: games/fishing/assets/bg-morning.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 780×1688 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F) only on tiny side seaweed if any, flat soft underwater morning scene, gentle sun rays from above, sandy seabed, soft bubbles, keep the center play area empty, no characters, no text, friendly bright cyan-blue water, kid-safe."
- 왜 SVG로 부족한가: 광선·수심 대기감·모래 질감을 SVG 단색면만으로는 깊게 내기 어렵다.

### bg-noon — 한낮 수중 배경
- 저장: games/fishing/assets/bg-noon.webp
- 크기: 780×1688 (2배 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, flat soft bright midday underwater ocean, clear blue water, sandy seabed, soft side seaweed, keep center empty for play, no characters, no text, kid-safe, calm and friendly."
- 왜 SVG로 부족한가: 맑은 물의 깊이감·하이라이트 층이 SVG 그라데이션만으로는 밋밋하다.

### bg-afternoon — 오후 수중 배경
- 저장: games/fishing/assets/bg-afternoon.webp
- 크기: 780×1688 (2배 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, flat soft afternoon underwater ocean with warm golden-blue tint, sandy seabed, soft side plants, keep center empty, no characters, no text, kid-safe."
- 왜 SVG로 부족한가: 따뜻한 오후 빛 번짐과 모래 톤의 자연스러운 혼합이 SVG에서 약하다.

### bg-sunset — 노을 수중 배경
- 저장: games/fishing/assets/bg-sunset.webp
- 크기: 780×1688 (2배 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, flat soft sunset underwater scene with coral pink and gentle purple water glow, sandy seabed, keep center empty, no characters, no text, cute not scary, kid-safe."
- 왜 SVG로 부족한가: 핑크·보라 노을 수중 분위기 전환의 부드러운 색 혼합이 SVG 한계다.

### bg-night — 밤 수중 배경
- 저장: games/fishing/assets/bg-night.webp
- 크기: 780×1688 (2배 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, gentle night underwater ocean with soft teal glow and tiny friendly sparkles, sandy seabed, keep center empty, no characters, no text, calm cute not scary, kid-safe."
- 왜 SVG로 부족한가: 밤 수중의 은은한 티얼 글로우·반짝임을 SVG로 풍부하게 내기 어렵다.
