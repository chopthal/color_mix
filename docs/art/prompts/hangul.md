# hangul — 외부 LLM 이미지 프롬프트

> SVG 1차본은 `ready.json`에 유지 중. 아래는 배경 디테일·분위기 보강용 선택 프롬프트.

### bg-classroom — 교실 무대 배경 (칠판 분위기, 중앙 비움)
- 저장: games/hangul/assets/bg-classroom.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 768×512 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F) only on tiny edge props, flat colors with one soft highlight per shape,
   round chunky shapes, soft kids classroom chalkboard backdrop, warm cream and pale mint chalk surface, faint wooden chalk tray at bottom edge, tiny books and a small plant only at far left and right edges, empty calm open center for writing play, no text, no letters, no numbers, gentle school mood, very light pastel so foreground orange stroke roads stay readable, filled background, centered."
- 왜 SVG로 부족한가: 칠판 질감·분필 가루·부드러운 원근을 SVG 단색면만으로는 깊게 내기 어렵다.

### bg-playground — 놀이터 무대 배경 (하늘·잔디, 중앙 비움)
- 저장: games/hangul/assets/bg-playground.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 768×512 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F) only on tiny edge props, flat colors with one soft highlight per shape,
   round chunky shapes, soft outdoor playground backdrop, light blue sky soft white clouds, gentle green grass hill at bottom, one rounded tree and a few balloons only at far edges, empty calm open center for writing play, no text, no letters, no numbers, cheerful daytime, very light pastel so foreground orange stroke roads stay readable, filled background, centered."
- 왜 SVG로 부족한가: 하늘·잔디·구름의 부드러운 대기감과 가장자리 소품 풍성함을 SVG로 충분히 내기 어렵다.

### bg-ocean — 바다 무대 배경 (물·모래, 중앙 비움)
- 저장: games/hangul/assets/bg-ocean.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 768×512 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F) only on tiny edge props, flat colors with one soft highlight per shape,
   round chunky shapes, soft ocean play backdrop, gentle teal water bands and sandy cream shore at bottom, tiny shell and round fish only at far edges, empty calm open center for writing play, no text, no letters, no numbers, calm sunny sea, very light pastel so foreground orange stroke roads stay readable, filled background, centered."
- 왜 SVG로 부족한가: 물결·모래·수면 하이라이트의 부드러운 질감을 SVG 평면만으로 풍부하게 내기 어렵다.
