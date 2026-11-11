# 스타일 A — 두꺼운 외곽선 플랫 (확정 2026-11-11)

> 사용자 확정: 스타일 방향 **A**. 1차 에셋은 API 없이 **워커가 SVG로 직접 그려** WebP로 변환한다. 목표는 "기존 코드 드로잉보다 확실히 나아짐"이지 최고 품질이 아니다. 복잡해서 SVG로 부족한 그림은 외부 이미지 LLM용 프롬프트를 남기고 사용자가 완성본을 전달한다.

## 1. 규격 (모든 게임 공통 — 여기서 벗어나면 세계관이 깨진다)

| 항목 | 규칙 |
|---|---|
| 외곽선 | 색 `#3D2B1F`(진한 코코아), 두께 = 짧은 변의 **4%**(128px → 5px, 512px → 20px), `stroke-linejoin="round"` `stroke-linecap="round"` |
| 형태 | 큰 둥근 덩어리 위주. 모서리 반경 크게. 가는 선·뾰족한 끝 금지(뿔·가시·이빨은 끝을 둥글게) |
| 채색 | 면당 **단색 1개 + 하이라이트 1개**(같은 색을 밝게, 좌상단 작은 타원/초승달, opacity 0.5~0.7). 그라데이션은 배경에만 |
| 그림자 | 캐릭터·소품: **없음**. 필요하면 발밑 접지 타원 1개(`#3D2B1F` opacity 0.12) |
| 얼굴 | 눈 = 진한 타원 + 흰 반짝점 1개, 볼터치 = 분홍 원 opacity 0.5, 입 = 짧은 둥근 곡선. 눈은 얼굴 중앙보다 아래쪽 |
| 비례 | 머리 큼(몸의 0.8~1배), 팔다리 짧고 굵게 |
| 시점 | 정면 또는 3/4. 게임이 좌우 방향을 쓰면 **오른쪽을 보게** 그리고 코드가 뒤집는다 |
| 배경(bg-/scene-/sky-/stage-/arena-/room-/city-) | 외곽선 없음 또는 아주 옅게. 큰 색면 3~5단 + 부드러운 그라데이션. 가운데는 놀이 공간이라 비워 둔다 |
| 글자 | 이미지 안 글자·숫자 금지 |
| 캔버스 | `viewBox`를 매니페스트 width×height 비율과 같게. 피사체는 여백 6~8% 두고 가운데 |

## 2. 공용 팔레트 (게임별로 5~8색만 골라 쓴다)

| 이름 | 값 | 용도 예 |
|---|---|---|
| ink | `#3D2B1F` | 외곽선·눈 |
| cream | `#FFF6E5` | 하이라이트 바탕, 배 |
| sun | `#FFC94A` | 노랑 |
| tangerine | `#FF9F45` | 주황 |
| strawberry | `#FF6B81` | 빨강·분홍 |
| blush | `#FFB3C1` | 볼터치·연분홍 |
| grape | `#A78BFA` | 보라 |
| sky | `#7CC6FE` | 파랑 |
| ocean | `#3BA4E6` | 진파랑·물 |
| mint | `#6EE7B7` | 민트 |
| leaf | `#7BD389` | 초록 |
| forest | `#3FA34D` | 진초록 |
| cocoa | `#B07A4F` | 갈색·나무 |
| cloud | `#FFFFFF` | 흰색 |
| night | `#2E3A6B` | 밤 배경(밤 장면 허용) |

## 3. 작업 흐름 (워커)

1. 매니페스트(`tools/imagegen/manifests/<게임>.json`)의 슬롯 이름 그대로 `tools/imagegen/svg/<게임>/<name>.svg` 작성
2. `cd tools/imagegen && node svg2webp.mjs <게임>` → `games/<게임>/assets/<name>.webp` 생성 + `ready.json` 등록
3. 게임을 headless로 열어 **기존(코드 드로잉) vs 새 이미지** 스크린샷 비교(스크린샷은 레포 밖)
4. 기존보다 못하거나 어색하면 `node svg2webp.mjs <게임> --unready <name>`으로 빼고(코드 드로잉 유지) 외부 프롬프트 목록에 올린다
5. 외부 LLM이 나은 그림은 `docs/art/prompts/<게임>.md`에 프롬프트 작성(아래 형식)

## 4. 외부 LLM 프롬프트 형식 (`docs/art/prompts/<게임>.md`)

```
### <슬롯 이름> — <용도 한 줄>
- 저장: games/<게임>/assets/<name>.webp (또는 png 전달 시 오케스트레이터가 변환)
- 크기: <W>×<H> (2배로 생성 권장), 배경: 투명 | 꽉 찬 배경
- 프롬프트(영문, 그대로 복사):
  "Children's game asset, bold clean dark-brown outline (#3D2B1F), flat colors with one soft highlight per shape,
   round chunky shapes, cute friendly face, no text, <subject...>, transparent background, centered."
- 왜 SVG로 부족한가: <한 줄>
```
