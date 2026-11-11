# brick-garage — 외부 이미지 LLM 프롬프트

스타일 A SVG 1차본은 ready에 넣어둠. 아래는 디테일·원근이 더 필요할 때 교체용.

### garage-bg — 차고 내부 배경
- 저장: games/brick-garage/assets/garage-bg.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 780×1688 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F) only on shelf props, flat colors with one soft highlight per shape,
   round chunky shapes, cute friendly brick toy garage interior, open shelves with tiny colorful toy vehicles on left and right,
   soft daylight window at top, empty open floor in the lower half for UI cards, no text, no scary shadows, portrait 9:19."
- 왜 SVG로 부족한가: 세로로 긴 실내 원근·선반 디테일을 SVG 면분할만으로 풍부하게 넣기 어렵다.

### city-day — 낮 도시 출동 배경
- 저장: games/brick-garage/assets/city-day.webp
- 크기: 780×980 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, flat colors with soft sky gradient, bold dark-brown outline (#3D2B1F) on toy block buildings only,
   cute daytime block city skyline, colorful round buildings, blue sky and sun, empty gray road occupying the bottom third for play space, no text, no characters."
- 왜 SVG로 부족한가: 스카이라인 층위·대기감이 SVG 단순 건물 실루엣보다 풍부해야 한다.

### city-sunset — 노을 도시 출동 배경
- 저장: games/brick-garage/assets/city-sunset.webp
- 크기: 780×980 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, flat colors with warm orange-pink sunset sky gradient, bold dark-brown outline (#3D2B1F) on toy block buildings only,
   cute sunset block city skyline, warm pastel toy buildings, empty road at bottom third for play space, friendly not scary, no text, no characters."
- 왜 SVG로 부족한가: 노을 대기·빛 번짐은 SVG 그라데이션만으로 한계가 있다.

### vehicle-crane — 크레인 특장차 전신
- 저장: games/brick-garage/assets/vehicle-crane.webp
- 크기: 384×240 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape,
   round chunky shapes, cute friendly brick-style mobile crane toy, yellow body pink boom arm and hook, tracks, three-quarter front facing right, studs on bricks, cute face in cab window, transparent background, centered, no text."
- 왜 SVG로 부족한가: 붐·훅 관절과 트랙 덩어리 실루엣을 한 장에서 더 또렷하게 맞추기 어렵다.
