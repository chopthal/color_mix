# music-garden — 외부 이미지 LLM 프롬프트

> SVG 1차본은 `ready`에 유지. 아래는 더 부드러운 페인터리 퀄리티가 필요할 때 쓸 대체 프롬프트.

### sky-morning — 아침 하늘 워시
- 저장: games/music-garden/assets/sky-morning.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 512×768 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, soft morning sky wash only, warm peach to pale blue vertical gradient, large empty play space in the center, no clouds no sun no objects no text, gentle color bands, cozy flat kids book background, 512x768."
- 왜 SVG로 부족한가: 부드러운 대기감·색 밴드 블렌딩은 SVG 단색 면보다 페인터리 그라데이션이 낫다.

### sky-day — 낮 하늘 워시
- 저장: games/music-garden/assets/sky-day.webp
- 크기: 512×768 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, soft daytime sky wash only, pale blue to light mint-green vertical gradient, large empty play space in the center, no clouds no sun no objects no text, gentle color bands, cozy flat kids book background, 512x768."
- 왜 SVG로 부족한가: 낮 하늘도 미묘한 대기 그라데이션이 핵심이라 벡터 면만으로는 깊이가 얕다.

### sky-evening — 노을 하늘 워시
- 저장: games/music-garden/assets/sky-evening.webp
- 크기: 512×768 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, soft evening sky wash only, warm peach to soft lavender vertical gradient, large empty play space in the center, no clouds no sun no objects no text, gentle color bands, cozy flat kids book background, 512x768."
- 왜 SVG로 부족한가: 노을의 따뜻한 색 전이·부드러운 대기감은 래스터 페인팅이 유리하다.

### flowerbed — 나무 화단(빈 흙)
- 저장: games/music-garden/assets/flowerbed.webp
- 크기: 512×192 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, simple wooden flower bed planter box filled with soft soil, empty of plants, front view, no text, transparent background, centered, wide horizontal composition."
- 왜 SVG로 부족한가: 나무결·흙 질감의 부드러운 덩어리를 SVG 도형만으로 풍부하게 내기 어렵다.
