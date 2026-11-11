# KidsKit (`games/_shared`)

만 3~5세 키즈 미니게임용 **공용 키트**. 클래식 스크립트(모듈 아님)이며 `window.KidsKit` 하나만 노출한다. 외부 의존 없음.

## 게임에 붙이는 방법

게임 HTML `<head>` / `</body>` 앞에 두 줄만 추가한다.

```html
<link rel="stylesheet" href="../_shared/kit.css">
<script src="../_shared/kit.js"></script>
```

(깊이·폴더에 따라 `../_shared` 경로만 조정.)

파비콘은 루트 `favicon.svg`를 쓴다. 각 HTML에 아래 한 줄을 넣으면 된다(이 작업에서는 기존 게임에 삽입하지 않음).

```html
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
```

## 데모

`demo.html`을 열어 프리셋 사운드·프리로드·store·햅틱·쉬자·소프트 엔딩을 눌러 볼 수 있다.

## API

### `KidsKit.assets.preload(list, onProgress?) → Promise`

- `list`: 문자열 URL 또는 `{ src, key? }` 배열
- 성공 시 `{ images, failed }`
- 이미지 실패 시 `console.warn` 후 **투명 placeholder**로 계속 (게임 중단 금지)
- `onProgress(loaded, total, item)` 선택
- **ready 게이트:** 페이지 기준 `assets/ready.json`(`["a.webp"]` / `{ready:[]}` / `{files:[]}`, 확장자 생략 가능)이 있으면 목록에 없는 `assets/` 이미지는 **요청하지 않고** placeholder로 돌려준다(이미지 생성 전 404 방지). 파일이 없으면 전부 요청. 게임은 placeholder(`img.dataset.kidsKitPlaceholder === '1'`)면 코드 드로잉으로 폴백한다.

### `KidsKit.restButton({ onRest?, parent?, position? })`

- `position`: `'br'`(기본) · `'bl'` · `'tr'` · `'tl'` — 게임 하단 UI와 겹치면 바꾼다.

### `KidsKit.sound`

- `play(url | preset)` — 프리셋: `pop` | `chime` | `whoosh` | `boing` | `sparkle`
- 파일 URL 실패/부재 시 합성음 폴백
- 첫 사용자 제스처에서 `AudioContext` lazy 생성
- `isMuted()` / `setMuted(bool)` / `toggleMute()` — `localStorage` 키 `kidsKit.muted`

### `KidsKit.store(namespace)`

게임별 네임스페이스 localStorage 래퍼.

- `get(key, fallback)` / `set(key, value)` / `update(key, updater, fallback)` / `remove(key)`
- JSON 직렬화, 모든 접근 `try/catch` (사생활 모드에서도 게임 정상)

예: `KidsKit.store('fishing').get('visits', 0)`

### `KidsKit.restButton({ onRest?, parent? })`

화면 구석 떠 있는 **쉬자** 버튼(터치 ≥64px, safe-area 고려).  
`onRest` 없으면 `../../index.html`(로비)로 이동.

### `KidsKit.softEnding({ title, emoji?, onAgain?, onRest? })`

오버레이 + 제목 + **또 할래** / **쉬자**. 실패·점수 화면이 아님.  
`onRest` 기본값 = 로비 이동.

### `KidsKit.haptic(kind?)`

지원 기기에서 짧은 진동. 미지원은 무시. `kind`: `light`(기본) | `soft` | `medium` | `success`

## 설계 메모

- UX 계약(`docs/PROJECT.md` §5·§8): 소프트 엔딩·휴식 출구, No Penalty
- 가드레일 카피/페르소나는 이 키트가 창작하지 않음 — 호출자가 `title` 등만 전달
- 공용 아트는 `games/_shared/assets/` (이미지 파이프라인: `docs/art/`)
