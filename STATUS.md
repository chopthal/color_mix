# STATUS

• 기준본: main
• 피처 브랜치: chopthal/feat-mantis-vs-spinosaurus
• 담당: 째깍 크아앙! 놀이 싸움 (`games/mantis-spino`)
• 갱신: 2026-11-04

## 지금

`째깍 크아앙! 놀이 싸움` v1 구현 완료.
- 내 친구·적 친구를 11종 풀(동물·공룡·곤충)에서 각각 선택(기본 사마귀 vs 스피노) → 캐릭터별 커스텀 공격 **3버튼**(외침·돌진·폴짝·물뿌리기 등) → 상대 3기술 랜덤 반격 → 3겨루기 → 하이파이브 엔딩
- 무해화 놀이 싸움(마시멜로 이빨·낫 앞다리·"폭신!"·웃음), 무승패·무HP. "또!"는 같은 조합 재대결
- 로컬 검증 완료(390·320 레이아웃, 캔버스 렌더, 3기술 모션, 상태 전이, 오류 없음). 로비 카드 13장.

## 막힘

없음.

## 다음 할 일

(비움 — 실기기(iPhone Safari) 확인 후 커밋/PR 결정)

## 사용자 액션

• 실행: `npx --yes serve . -p 4173` 후 `http://localhost:4173/` 로비에서 진입 (현재 4173 서버 켜져 있음)
  - 직접 URL: `http://localhost:4173/games/mantis-spino/index.html`
• 이전 화면이 캐시됐으면 강력 새로고침(Ctrl+F5 / iOS 새로고침) 1회
• 실기기(iPhone Safari)에서 터치·오디오·속도 확인 (공격/반격 속도·효과음 톤 조정 권장)
• PR 리뷰 및 머지: https://github.com/chopthal/color_mix/pull/8
