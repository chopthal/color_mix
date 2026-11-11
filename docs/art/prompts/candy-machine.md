# candy-machine — 외부 이미지 LLM 프롬프트

SVG 1차본은 ready에 넣어 두었음. 아래는 디테일·분위기 보강용.

### bg — 사탕 가게 벽 배경
- 저장: games/candy-machine/assets/bg.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: 780×1688 (2배로 생성 권장), 배경: 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F) only on tiny decor if any, flat pastel candy-shop wall, warm cream and peach tones, soft vertical gradient, gentle polka dots near edges only, empty center play space, no characters, no vending machine, no text, front view, full bleed background."
- 왜 SVG로 부족한가: 큰 세로 배경의 분위기·미묘한 질감을 플랫 SVG만으로는 풍성하게 만들기 어렵다.

### machine — 분홍 사탕 자판기 본체
- 저장: games/candy-machine/assets/machine.webp
- 크기: 512×640 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, pink candy vending machine body, light blue empty glass display window with faint shelf lines, soft button panel area without lit buttons, bottom tray door closed labeled none, coin slot on upper right, no text, no numbers, transparent background, centered front view."
- 왜 SVG로 부족한가: 유리 반사·패널 깊이와 버튼 영역 정렬을 한 장으로 더 자연스럽게 맞추려면 래스터 디테일이 낫다.

### boy-neutral — 아이 얼굴 (기본 미소)
- 저장: games/candy-machine/assets/boy-neutral.webp
- 크기: 384×384 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, little boy head only, soft brown hair with fluffy bangs, gentle smile, big rosy cheeks, eyes slightly below center with white sparkle dots, kid-safe, no text, transparent background, centered."
- 왜 SVG로 부족한가: 머리숱·피부 하이라이트·표정의 미세한 귀여움을 SVG 패스로는 한계가 있다.

### boy-happy — 아이 얼굴 (기쁨)
- 저장: games/candy-machine/assets/boy-happy.webp
- 크기: 384×384 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, same little boy head, happy closed smiling eyes, open joyful mouth, rosy cheeks, soft brown hair, no text, transparent background, centered."
- 왜 SVG로 부족한가: 동일 캐릭터 일관성 유지하며 기쁨 표정을 더 생생하게 하려면 외부 생성이 유리하다.

### boy-wince — 아이 얼굴 (아야, 반창고)
- 저장: games/candy-machine/assets/boy-wince.webp
- 크기: 384×384 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, same little boy head, soft wince expression, squinted eyes, small beige bandaid on cheek, gentle not scary, kid-safe, no text, transparent background, centered."
- 왜 SVG로 부족한가: 아픈 표정을 무섭지 않게 유지하는 미묘한 균형이 SVG로는 어렵다.

### boy-sour — 아이 얼굴 (새콤)
- 저장: games/candy-machine/assets/boy-sour.webp
- 크기: 384×384 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, same little boy head, funny sour lemon puckered lips, squinted playful eyes, rosy cheeks, soft brown hair, no text, transparent background, centered."
- 왜 SVG로 부족한가: 우스꽝스러운 새콤 표정의 재미를 과하지 않게 그리기 어렵다.

### boy-sparkle — 아이 얼굴 (반짝)
- 저장: games/candy-machine/assets/boy-sparkle.webp
- 크기: 384×384 (2배로 생성 권장), 배경: 투명
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape, round chunky shapes, cute friendly face, same little boy head, delighted sparkling eyes, big smile, tiny star sparkles near cheeks, soft brown hair, no text, transparent background, centered."
- 왜 SVG로 부족한가: 반짝 이펙트와 눈 하이라이트의 생동감을 더 올리고 싶다.
