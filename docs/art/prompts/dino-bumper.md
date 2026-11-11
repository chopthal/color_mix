# dino-bumper — 외부 이미지 LLM 프롬프트

> 1차 SVG WebP는 전부 ready로 넣었다. 아래는 SVG로 디테일이 얕은 슬롯(특히 아레나 바닥판)의 고품질 교체용.

### arena-meadow — 초원 아레나 바닥판
- 저장: games/dino-bumper/assets/arena-meadow.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 512×384 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, soft flat kids play arena meadow ground plate, gentle green grass patches and tiny soft wildflowers only at the far edges, empty open center play space, soft sky-to-grass color bands, no characters, no text, bold clean dark-brown outline (#3D2B1F) only on tiny edge props if any, flat colors with one soft highlight per shape, round chunky shapes, top-down friendly view, centered."
- 왜 SVG로 부족한가: 넓은 바닥판의 풀·꽃 디테일과 깊이감을 SVG 단색면만으로는 풍성하게 못 낸다.

### arena-river — 강가 아레나 바닥판
- 저장: games/dino-bumper/assets/arena-river.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 512×384 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, soft flat kids play arena riverside ground plate, gentle blue water band near bottom edges with soft white ripple arcs, sandy mint banks with tiny rounded pebbles only at edges, empty open center play space, soft sky-to-water color bands, no characters, no text, bold clean dark-brown outline (#3D2B1F) only on tiny edge props if any, flat colors with one soft highlight per shape, round chunky shapes, top-down friendly view, centered."
- 왜 SVG로 부족한가: 물결·물가 질감과 부드러운 수면 그라데이션을 SVG 1차로는 얕게만 표현된다.

### arena-ice — 얼음 아레나 바닥판
- 저장: games/dino-bumper/assets/arena-ice.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 512×384 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, soft flat kids play arena icy ground plate, pale blue and white frosty surface with soft sparkle glints only near edges, gentle snow patches, empty open center play space, soft winter sky-to-ice color bands, no characters, no text, bold clean dark-brown outline (#3D2B1F) only on tiny edge props if any, flat colors with one soft highlight per shape, round chunky shapes, top-down friendly view, centered."
- 왜 SVG로 부족한가: 얼음 반짝임·서리 질감의 밀도는 외부 이미지 LLM이 더 낫다.

### dino-brachio — 브라키오사우루스 캐릭터
- 저장: games/dino-bumper/assets/dino-brachio.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 256×256 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, no text, cute round teal brachiosaurus dinosaur toy with clearly long soft neck and long rounded tail, big head tiny stubby legs, three-quarter front view facing right, transparent background, centered."
- 왜 SVG로 부족한가: 긴 목·꼬리 실루엣을 처비 비율 안에서 또렷이 구분하기 어렵다.

### dino-spino — 스피노사우루스 캐릭터
- 저장: games/dino-bumper/assets/dino-spino.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 256×256 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, no text, cute round blue spinosaurus dinosaur toy with tall soft rounded sail on back, gentle long snout, webbed feet, three-quarter front view facing right, transparent background, centered."
- 왜 SVG로 부족한가: 돛·긴 주둥이 실루엣이 처비 몸통에 묻히기 쉬워 종 구분이 약해질 수 있다.
