# STATUS (현재 상태·백로그 대시보드)

> 완료 이력·검증 증거는 `git log` 참조. 이 문서는 **지금·막힘·다음 할 일**만 간결히 유지.

| 항목 | 내용 |
|------|------|
| **지금** | 17개 게임 고도화 — 1a/1b(`5d93db9`) + 2단계 + **3단계 이미지 1차 완료(미커밋)**: 스타일 A SVG→WebP 15게임 ~3.3MB(`tools/imagegen/svg2webp.mjs`), 후속 화면 버그 수정 5건(DeepSeek). 전역 스모크 17페이지×2뷰포트 JS 오류·에셋 404·가로 넘침 0 |
| **이번 프로젝트 워커 (사용자 지정, `docs/workflow.md` §2보다 우선)** | **2026-11-11부터 다음 작업은 OpenCode DeepSeek V4.1 Flash**(`opencode-go/deepseek-v4.1-flash`, variant high 기본). 진행 중인 3단계 Cursor Auto 15건은 그대로 완주. 독립 게임 폴더 단위 병렬 허용(사용자 명시) |
| **막힘** | 없음 |
| **다음 할 일** | ① 레이아웃 잔여(DeepSeek 묶음 진행 중): ocean-peekaboo 말풍선이 은신처 가림·은신처 겹침·가로 겹침 / candy-machine 가로 자판기 비율 왜곡 / brick-garage 반김 배너 글자 가림·가로 조립판-컨베이어 겹침·"소개 듣기" 2줄 / star-candy 문 비율·엔딩 쉬자 중복 / pumpkin-train 360폭 4px 넘침 ② 외부 LLM 프롬프트(`docs/art/prompts/*.md`)로 배경·주요 캐릭터 보강(선택, 보류) ③ 실기기 플레이. 결정: brick-garage 가로 화면 "오늘의 출동" 카드 접힘 유지 |
| **절대 금지** | 원본 데이터·시크릿 임의 수정 / 지시 전 commit·push·PR |
