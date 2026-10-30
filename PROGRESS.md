# PROGRESS

최신이 위. 세션은 상단 2~3개만 읽는다.

## 2026-10-30 — 게임 구상 체크리스트·양식

• 요약: 질림 방지·연속성·Done 정의를 `docs/PROJECT.md` §8로 고정. 게임별 `docs/games/_template.md` 추가. ASSUMPTIONS A-08
• 검증: 문서만. 자동테스트 없음. §8·템플릿 항목이 논의 초안에 대응하는지 대조 확인
• 경로: `docs/PROJECT.md`, `docs/games/_template.md`, `ASSUMPTIONS.md`, `STATUS.md`, `PROGRESS.md`
• 리스크: 기존 게임별 시범 작성은 아직 없음 — 다음 개편 때 양식 복사본부터

## 2026-10-30 — 핸드오프 체계 부트스트랩

• 요약: AGENTS 병합(운영+UX), STATUS/PROGRESS/ASSUMPTIONS, docs/PROJECT·templates, Cursor/Gemini/README 어댑터, 검증·모델 표 기입
• 검증: 패키지/자동테스트 없음 확인. 미리보기 명령 SSOT = `npx --yes serve . -p 4173` (이 세션에서 serve 기동·브라우저 시각 확인은 생략 — 부트스트랩만)
• 경로: `AGENTS.md`, `STATUS.md`, `PROGRESS.md`, `ASSUMPTIONS.md`, `docs/PROJECT.md`, `docs/agent-prompt-templates.md`, `.cursor/rules/workflow.mdc`, `GEMINI.md`, `README.md`
• 리스크: UI 스모크는 다음 제품 작업 완료 시 serve로 증거화할 것
