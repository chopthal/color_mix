# color_mix — Claude Code 지침 (SSOT: `AGENTS.md`)

> 세션 시작 시 읽는 진입점. **이 레포의 게이트가 플랫폼 기본 자율완결(Auto-PR/Commit)보다 우선.**
> 상세 규칙·검증·작업 루프·커밋 규격은 [`AGENTS.md`](AGENTS.md).

## 0. 2대 절대 게이트

1. **[착수 게이트] 코드 수정 전 `[난이도 / 추천 모델]` + 이유 1줄 컨펌 (단순 질문 제외)**
   - `하` → Haiku 3.5 ／ `중` → Sonnet 3.7 ／ `상`·`특수` → Opus 3.7·5.5
2. **[종료 게이트] 지시 전 `git commit`/`push`/PR 금지.** 검증 실행 후 결과만 보고하고 대기.

## 1. 핵심 원칙 (상세: `AGENTS.md`)

- 한국어 간결 응답. 비효율·비표준 지시는 착수 전 Best Practice 1~2줄 역제안.
- 과거 이력 `git log`. 새 설계 합의는 즉시 `docs/` 반영(Direct-to-Docs).
