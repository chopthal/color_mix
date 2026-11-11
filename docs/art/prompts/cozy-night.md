# cozy-night — 외부 이미지 LLM 프롬프트

> SVG 1차본은 `ready.json`에 넣어 두었다. 아래는 분위기·디테일이 SVG로 한계인 슬롯용 보강 프롬프트.

### bg-room — 침실 밤 배경(벽·은은한 램프빛)
- 저장: games/cozy-night/assets/bg-room.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 768×1280 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, soft flat illustration style matching bold clean dark-brown outline world,
   cozy kids bedroom night wall backdrop, soft lavender-blue and deep night blue gradient,
   gentle warm lamp glow in one corner, subtle purple curtain edges, empty center play space,
   no characters, no furniture in the middle, no text, no numbers, calm sleepy mood, full-bleed background."
- 왜 SVG로 부족한가: 큰 배경의 부드러운 조명·공간감·텍스처를 단색 면만으로는 깊게 내기 어렵다.

### moon — 초승달 캐릭터
- 저장: games/cozy-night/assets/moon.webp
- 크기: 192×192 (2배 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape,
   round chunky shapes, cute friendly crescent moon character, gentle closed-eye smile, rosy cheek,
   soft yellow glow, no text, transparent background, centered."
- 왜 SVG로 부족한가: 초승달 실루엣과 은은한 글로우를 마스크로 근사하면 가장자리·광운이 어색해지기 쉽다.
