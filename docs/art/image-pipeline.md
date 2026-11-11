# 이미지 생성 파이프라인

목표: 사람이 Gemini 앱으로 **스타일 앵커**를 만든 뒤, `tools/imagegen` 배치로 게임 에셋을 WebP(투명)로 맞춘다.  
비용은 모델·해상도·호출 수에 따라 달라지므로 **최신 단가는 공식 요금표를 확인**한다. 이 문서에 숫자 단가를 적지 않는다.

## 0. 전제

- API 키: 환경변수 `GEMINI_API_KEY`만 사용. 파일·커밋에 키를 두지 않는다.
- 모델: 기본 `gemini-2.5-flash-image` (`GEMINI_IMAGE_MODEL`로 변경 가능).
- 스타일 초안: [`style-guide.md`](./style-guide.md) → 확정 후 `tools/imagegen/style-prefix.txt` 갱신.

## 1. 앵커 만들기 (사람)

1. Gemini 앱(또는 AI Studio)에서 확정 스타일로 **기준 이미지 1~3장** 생성.
2. 캐릭터/소품이 또렷하고, 배경은 단순할수록 이후 배치 일관성이 좋다.
3. 파일을 `tools/imagegen/refs/`에 저장  
   예: `refs/music-garden-anchor.webp`, `refs/shared-buddy.png`
4. 금기(괴물·어둠·폭력·분리 불안 등)가 섞였는지 사람이 눈으로 검수.

## 2. 매니페스트 작성

1. `tools/imagegen/manifest.example.json`을 복사해 게임별 `manifest.json`으로 둔다.
2. 항목 필드:
   - `name` — 논리 이름 (`--only` 필터에 사용)
   - `outPath` — 레포 루트 기준 출력 경로 (`games/.../assets/....webp`)
   - `prompt` — 에셋 고유 설명(스타일 프리픽스와 합쳐짐)
   - `width` / `height` — 최종 저장 픽셀(표시 크기의 2배 권장)
   - `refs` — 기준 이미지 경로 배열(없으면 텍스트만)
   - `variants` — 선택. 같은 베이스에 상태/색만 다른 하위 항목 펼침
3. 크로마 배경 지시가 프롬프트에 빠지지 않게 한다(스크립트가 프리픽스+키잉 문구를 붙임).

## 3. 실행

```bash
cd tools/imagegen
npm install
node gen.mjs --dry-run --manifest manifest.example.json   # 계획만
node gen.mjs --manifest manifest.json                     # 생성
node gen.mjs --manifest manifest.json --only cloud-tap    # 일부만
node gen.mjs --manifest manifest.json --force             # 기존 파일 덮어쓰기
```

처리 순서(항목당):

1. 출력 파일이 있고 `--force` 없으면 **skip**
2. `style-prefix.txt` + 항목 `prompt` + 크로마 배경 지시문 결합
3. `refs[]`가 있으면 인라인 이미지로 함께 전달
4. Gemini `models.generateContent` 호출 → `inlineData` 수신
5. **배경 제거:** 단색 크로마(`#00FF00` 기본)로 생성 지시한 뒤 **sharp로 색 거리 키잉**  
   - 근거: 어린이 플랫/그림책 에셋은 배경을 평평한 크로마로 고정하기 쉽고, 별도 세그멘테이션 API 없이 재현 가능하다.  
   - 한계: 피사체에 크로마와 비슷한 초록이 있으면 구멍 남. 그때는 크로마 색을 마젠타(`#FF00FF`)로 바꾸거나 수동 검수.
6. `width`×`height`로 리사이즈 → WebP 저장

## 4. 검수 / 재생성

체크리스트:

- [ ] 투명 가장자리에 크로마 잔여(헤일로) 없는가
- [ ] 스타일·선 두께·팔레트가 앵커와 같은가
- [ ] 무섭거나 과자극인 디테일이 없는가
- [ ] 용량·해상도가 `style-guide.md` 가이드에 가까운가
- [ ] 파일명이 `games/<게임>/assets/<이름>[-<상태>].webp` 규칙인가

문제 있으면 해당 `name`만 `--only` + `--force`로 재생성.  
프롬프트를 고쳤으면 매니페스트를 먼저 커밋·기록한다(키는 제외).

## 5. 게임에 연결

에셋이 준비되면 각 게임이 `KidsKit.assets.preload`로 로드한다.  
**이 파이프라인 작업만으로 기존 게임 HTML을 수정하지 않는다.** 적용은 별도 작업.
