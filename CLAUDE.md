# color_mix — Claude Code 지침 (SSOT: `AGENTS.md`)

> 세션 시작 시 읽는 진입점. **이 레포의 게이트가 플랫폼 기본 자율완결(Auto-PR/Commit)보다 우선.**
> 상세 규칙·검증·작업 루프·커밋 규격은 [`AGENTS.md`](AGENTS.md). 역할·워커 배정표·위임·감사는 [`docs/workflow.md`](docs/workflow.md).

## 0. 2대 절대 게이트

1. **[착수 게이트] 코드 수정 전 `[난이도 / 워커: <제공자·모델(레벨)>]` + 이유 1줄 컨펌 (단순 질문 제외)**
   - 배정표는 `docs/workflow.md` §2에만 있다(여기 중복 기재 금지).
2. **[종료 게이트] 지시 전 `git commit`/`push`/PR 금지.** 검증 실행 후 결과만 보고하고 대기.

## 1. Claude의 역할

- 기본은 **오케스트레이터**(Opus 5.5 medium): 조사 → 분해·배정 → 브리프 위임 → 감사(diff 직접 리뷰 + 검증 재실행) → 테스트 시나리오. 절차·작업 모드: `docs/workflow.md` §1·§3·§4.
- 위임받은 Claude 워커로 실행될 때는 **워커 모드 조항**(`docs/workflow.md` §5)을 따른다.

## 2. 핵심 원칙 (상세: `AGENTS.md`)

- 한국어 간결 응답. 비효율·비표준 지시는 착수 전 Best Practice 1~2줄 역제안.
- 과거 이력 `git log`. 새 설계 합의는 즉시 `docs/` 반영(Direct-to-Docs).
