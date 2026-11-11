# star-candy — 외부 이미지 LLM 프롬프트

스타일 A(`docs/art/style-A-svg.md`) 준수. 1차 SVG webp는 전원 ready로 유지. 아래는 디테일·분위기 보강용.

### bg-nursery — 밤 별 보물방 배경
- 저장: games/star-candy/assets/bg-nursery.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 768×1280 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game background, flat bold soft colors from palette night #2E3A6B grape #A78BFA strawberry #FF6B81 cream #FFF6E5 sun #FFC94A, cozy night candy treasure nursery interior, deep purple walls with soft star dots, round moon window on the left, pink star rug on the floor center, candy jars only at left and right edges, empty clear play space in the middle for characters, no characters, no text, no door in the image, soft gradients only, no harsh outlines on background shapes."
- 왜 SVG로 부족한가: 벽·달창·러그·단지 원근과 야간 분위기의 부드러운 층이 SVG 단색면으로는 얕다.

### bg-garden — 밤 별사탕 정원 배경
- 저장: games/star-candy/assets/bg-garden.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 768×1280 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game background, flat bold soft colors from palette night #2E3A6B sky #7CC6FE leaf #7BD389 sun #FFC94A tangerine #FF9F45 cream #FFF6E5, soft night candy garden exterior, deep blue starry sky, round moon window left, yellow star rug center, candy bushes with star blooms only at left and right edges, empty clear middle play space, no characters, no text, no extra doors or gates, soft gradients only."
- 왜 SVG로 부족한가: 밤하늘·덤불·정원 깊이가 단색 타원 조합으로는 밋밋하다.

### kid — 별 지킴이 아이
- 저장: games/star-candy/assets/kid.webp
- 크기: 256×256 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, no text, a cute round-headed child holding a small star wand, soft blue candy-guard outfit, short limbs, front three-quarter view facing right, transparent background, centered."
- 왜 SVG로 부족한가: 손·지팡이·옷 주름의 귀여운 디테일을 SVG로 더 다듬기 어렵다.

### fairy-blue / fairy-pink / fairy-mint — 요정 3종
- 저장: games/star-candy/assets/fairy-blue.webp, fairy-pink.webp, fairy-mint.webp
- 크기: 256×256 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, no text, a cute round floating fairy with tiny translucent wings, facing right, gentle smile, short stubby limbs, transparent background, centered. Variant A blue body with small gold crown. Variant B pink body with soft bow on head. Variant C mint-green body with yellow star tip antenna."
- 왜 SVG로 부족한가: 날개 투명감·장식(왕관/리본/별 안테나)의 입체감이 SVG에서 평평하다.
