# STATUS

• 기준본: main
• 피처 브랜치: chopthal/feat-transform-hide-seek (PR 생성)
• 담당: 반짝반짝 별사탕을 지켜요 (`games/star-candy`) · 뾰로롱! 변신 숨바꼭질 (`games/transform-hide`)
• 갱신: 2026-10-31

## 지금

두 게임 v1 구현 완료.
- 반짝반짝 별사탕을 지켜요 — 상자 숨기기 → 드래그 콩! → 5번 지키면 엔딩
- 뾰로롱! 변신 숨바꼭질 — 물건 변신 숨기 → 술래 순찰·"히히!" → ♪ 단서 찾기 → 2라운드 엔딩

로컬 검증 완료. 로비 카드 12장.

## 막힘

없음.

## 다음 할 일

(비움 — 실기기 확인 후 다음 놀이·변주 또는 커밋/PR 결정)

## 사용자 액션

• 실행 방법 (폴더를 브라우저로 열면 목록만 보입니다)
  - 폴더 안의 `index.html` 파일을 직접 열기 (file:// 동작)
  - 또는 `npx --yes serve . -p 4173` 실행 후 `http://localhost:4173/` 로비에서 진입
  - 직접 URL: `http://localhost:4173/games/star-candy/index.html` · `http://localhost:4173/games/transform-hide/index.html` (서버가 슬래시로 자동 보정)
• 현재 `localhost:4173` 서버가 켜져 있음 (꺼져 있으면 위 `serve` 재실행)
• 이전 화면이 캐시됐으면 강력 새로고침(Ctrl+F5 / iOS 새로고침) 1회
• 실기기(iPhone Safari)에서 두 게임의 터치·연출·속도 확인
• PR 리뷰 및 머지 (링크는 대화에서 확인)
