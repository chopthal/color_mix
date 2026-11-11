# color-coloring — 외부 LLM 프롬프트

> 1차 SVG 24슬롯 전부 ready. 아래는 **더 풍부한 교체본**이 필요할 때용 선택 프롬프트(현재 WebP는 유지).

## 선택 업그레이드 (ready 유지)

### stage-day — 낮 무대 배경
- 저장: games/color-coloring/assets/stage-day.webp
- 크기: 800×800 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, soft flat kids stage backdrop for daytime, gentle blue sky fading to pale green ground, fluffy white clouds, warm sun glow upper right, empty center for a coloring subject, no characters, no text, no thick outlines on background, pastel friendly."
- 왜 SVG로 부족한가: 구름·햇살 디테일과 대기감은 래스터 일러스트가 더 부드러움.

### stage-night — 밤 무대 배경
- 저장: games/color-coloring/assets/stage-night.webp
- 크기: 800×800 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, soft flat kids stage backdrop for nighttime, deep blue-purple sky, gentle crescent moon, soft twinkling stars, calm gradient ground, empty center for a coloring subject, not scary, no characters, no text."
- 왜 SVG로 부족한가: 별·달빛 분위기는 비트맵 그라데이션이 더 자연스러움.

### stage-rainbow — 무지개 무대 배경
- 저장: games/color-coloring/assets/stage-rainbow.webp
- 크기: 800×800 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, soft kids stage backdrop with a pastel rainbow arc and candy-colored sky bands, fluffy clouds, empty center for a coloring subject, gentle and bright, no characters, no text."
- 왜 SVG로 부족한가: 무지개 밴드·구름 블렌드가 SVG보다 래스터가 부드러움.

### frame-mat — 재방문 액자 테두리
- 저장: games/color-coloring/assets/frame-mat.webp
- 크기: 512×512 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, empty ornate picture frame mat for kids artwork, warm wood-like rounded frame with soft inner cream mat, hollow transparent center for placing a drawing, front view, bold clean dark-brown outline (#3D2B1F), no text, transparent outside and center."
- 왜 SVG로 부족한가: 나무결·입체감 있는 액자 질감은 래스터가 유리.

## 선화(outline) 20종

대표 20종 선화는 **기존 SVG 파트 경로와 동일 geometry**로 작성해 정렬이 맞음. 어긋남으로 뺀 슬롯 없음. 교체 시에도 viewBox `0 0 300 300`·파트 경계 일치 필수.
