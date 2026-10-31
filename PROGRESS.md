# PROGRESS

최신이 위. 세션은 상단 2~3개만 읽는다.

## 2026-10-31 — 쿵쿵! 공룡 범퍼섬 친구 공룡 선택

• 요약: 선택 화면에 친구 공룡 8종 + 🎲 랜덤 행 추가. 내 공룡과 친구를 각각 선택하고 같은 공룡 미러 매치 허용. 수동 선택한 친구는 내 공룡을 바꿔도 유지되며, 자동 선택 상태에서는 내 공룡과 겹치면 다른 공룡으로 자동 변경
• 검증: `node --check` 통과. serve(4173) + ego-browser 390×844에서 친구 버튼 9개(8+랜덤), 초기 스피노, 내 공룡 스피노→친구 기가노토 자동, 친구 티라노 수동 선택 후 내 공룡 변경에도 유지, 미러 매치, 랜덤→테리지노, 시작 후 친구 칩 일치. 320×568에서 친구 행 가로 스크롤·공룡 그리드 세로 스크롤·시작 버튼 노출·가로 오버플로우 없음. 오류 이벤트 없음
• 경로: `games/dino-bumper/index.html`, `games/dino-bumper/css/style.css`, `games/dino-bumper/js/game.js`, `docs/games/dino-bumper.md`, `STATUS.md`, `PROGRESS.md`
• 리스크: 실기기 미확인. 친구 행 가로 스크롤은 실기기 터치 확인 권장

## 2026-10-31 — 쿵쿵! 공룡 범퍼섬 v1 구현

• 요약: `games/dino-bumper/` 신설. 드래그 이동 → 쿵 충돌(스쿼시·별·"통!", HP·승패 없음) → 열매 팝업/수집 → 5개 모으면 황금 열매 → 반짝이 링으로 함께 밀면 엔딩. 공룡 8종 패시브 특기(넉백·물웅덩이·폴짝·밀기·반사·속도·흔들림+열매 추가·간지럼), 아레나 3종(초원/강가/얼음, 마찰 차등), 로비 카드 연결. 열매는 0.28초 뒤부터 획득 가능하게 해 자동 획득 방지, AI는 플레이어가 황금 열매를 한 번 건드린 뒤에만 함께 밀도록 해 혼자 끝내지 않음
• 검증: `node --check` 3파일 통과. serve(4173) + ego-browser 390×844에서 8종 카드·3 아레나 선택, 시작·친구 자동 선택, 드래그 충돌→별·열매 팝업, 가만히 4.2초에 바구니 0/5(자동 획득 없음), 쓸기 수집→황금 열매→링 도달→엔딩 오버레이, 또!·공룡 바꾸기·시작 재진입, 320/375/390/768/1024 레이아웃(2·4열, 내부 스크롤, 시작 버튼 항상 노출, 가로 오버플로우 없음), 초원/강가/얼음 캔버스 렌더, 오류 이벤트 없음. ego `Page.captureScreenshot` 타임아웃은 환경 이슈라 `canvas.toDataURL`로 대체 확인
• 경로: `games/dino-bumper/`(index.html, css/style.css, js/{data,sound,game}.js), `index.html`, `docs/games/dino-bumper.md`, `STATUS.md`, `PROGRESS.md`
• 리스크: 실기기(iPhone Safari) 미확인. 물리 감도·AI 속도는 실기기에서 조정 권장. ego 환경은 rAF가 멈춰 canvas가 비어 보이나 실브라우저는 정상

## 2026-10-31 — 쿵쿵! 공룡 범퍼섬 구상 합의

• 요약: `docs/games/dino-bumper.md` 신설. 드래그 이동 → 쿵 충돌(무피해·승패 없음) → 열매 수집 → 황금 열매 함께 밀기 엔딩. 공룡 8종 패시브 특기, 아레나 3종(초원/강가/얼음), 간식 도감 재방문 훅. v1 Done 3 / 미룸 3. 사용자 확정: 웹 게임·둘 다 성공·공룡 8종
• 검증: 문서만. §8-1~8-4 체크리스트·§6-1 가드레일 대조 확인. 자동테스트 없음
• 경로: `docs/games/dino-bumper.md`, `STATUS.md`, `PROGRESS.md`
• 리스크: 구현 전 충돌 감도·아레나 마찰 튜닝 필요. 실기기 확인 미실시

## 2026-10-30 — 브릭 특장차 차고 스페셜 파츠 해금

• 요약: 출동 성공 누적 3/6/9회에 네온 사이렌·황금 갈고리·제트 엔진 순차 해금(확정, 뽑기·화폐 없음). 해금 카드 연출 후 자유 조립 부품에 추가 — 네온 사이렌 색+발광, 황금 갈고리(붐 기믹·크레인 미션), 제트 바퀴(발광). `missions`/`specials` 저장, 구버전 저장 기본값 폴백
• 검증: `node --check` 5파일. 320×568·390×844 ego-browser에서 3/6/9 해금·카드 표시/자동 숨김, 잠금 상태에서 사이렌 5·기믹 6·바퀴 2 순환 유지, 해금 후 각 부품 발광·미션 연결, 스페셜 콤보 저장→선반→출동, 중복 해금 없음(10회차에도 3종), 오류 이벤트 없음
• 경로: `games/brick-garage/js/{data,app,storage}.js`, `index.html`, `css/style.css`, `docs/games/brick-garage.md`
• 리스크: 해금 카드·발광 강도는 실기기 시각 확인 권장. 실기기 확인 미실시

## 2026-10-30 — 브릭 특장차 차고 58종 도감

• 요약: `special-vehicles` 52종의 이름·색·분류를 `js/roster.js`로 기계적 파생, 기존 6종과 합쳐 58종 로스터 구성. 6 카테고리 탭(소방/경찰/구조/중장비/환경/운송) 필터 추가. actionType→8 기믹(사다리·물대포·집게·붐·통·실음판·그물·밀판) 매핑으로 신규 차량도 5개 미션에 연결. 자유 조립 부품은 기존 6종으로 큐레이션 유지
• 검증: `node --check` 5파일(roster 포함). 390×844·320×568 ego-browser에서 탭별 11/9/7/15/8/8장·오버플로우 없음, 생성 차량 펌프소방차→물·레미콘→길 메우기·2층 운반트럭→싣기·불도저→바위·노면청소차→물 완료, 저장 후 선반 재출동, 자유 조립 6종 큐레이션 유지, 오류 이벤트 없음
• 경로: `games/brick-garage/js/roster.js`(신규), `js/{data,app}.js`, `index.html`, `css/style.css`, `docs/games/brick-garage.md`
• 리스크: 로스터는 원본 데이터 파생이라 `special-vehicles` 변경 시 재생성 필요. 스페셜 파츠 해금은 미착수

## 2026-10-30 — 브릭 특장차 차고 차체 도색 팔레트

• 요약: 자유 조립에 6색 도색 팔레트 추가. 선택 색이 하판 브릭에 즉시 반영되고 저장·선반 미니카·출동 차량까지 유지. 구버전 저장(도색 필드 없음)은 하판 기본색으로 폴백, 블루프린트 차량은 기존 색 유지
• 검증: `node --check` 4파일. 390×844·320×568 ego-browser에서 6색 선택·선택 링 1개, 저장 후 JSON/선반/출동 색 유지, 저장 없이 출동 반영, 구버전 폴백, 블루프린트 소방차 색·물 미션 회귀, 오버플로우/오류 없음
• 경로: `games/brick-garage/js/{app,data,storage}.js`, `index.html`, `css/style.css`, `docs/games/brick-garage.md`
• 리스크: 실기기 확인 미실시. 색 대비(노랑·초록)는 실기기에서 재확인 권장

## 2026-10-30 — 브릭 특장차 차고 자유 조립 심화

• 요약: 자유 조립에서 운전석 피규어 5종 탭 교체 추가(콤보 저장·선반·출동까지 반영). `저장` 없이 현재 조합으로 바로 `출동` 버튼 추가. 구버전 저장(운전석 필드 없음)은 하판 기본 피규어로 폴백
• 검증: `node --check` 4파일. 390×844·320×568 ego-browser에서 교체 5종, 저장 없이 레미콘 미션 진입·완료, 저장 후 카캐리어 미션에서 운전석 유지, 구버전 저장 폴백, 3버튼 오버플로우 없음, 오류 이벤트 없음
• 경로: `games/brick-garage/js/{app,data,storage}.js`, `index.html`, `css/style.css`, `docs/games/brick-garage.md`
• 리스크: 실기기 확인 미실시. 자유 조립 부품 수가 늘면 보드·트레이 밀도 재확인 필요

## 2026-10-30 — 브릭 특장차 차고 출동 5종 확장

• 요약: 레미콘(길 구멍 3칸 메우기·시멘트 낙하 연출), 카캐리어(미니카 3대를 캐리어 위 슬롯에 싣기) 미션 추가. 기믹 기준 분기 — 사다리→물, 팔/붐→크레인, 통→길 메우기, 실음판→싣기, 그물→바위. 자유 조립 콤보도 기믹에 따라 동일 분기
• 검증: `node --check` 4파일 통과. 390×844 ego-browser에서 레미콘 3/3·카캐리어 3/3(연속 탭 예약 슬롯 포함) 완료·주행, 경찰차 바위 유지, 자유 조립 통/실음판→각 미션 진입, reduced-motion 완주, 레미콘 5초 힌트, 오류 이벤트 없음
• 경로: `games/brick-garage/js/{app,sound}.js`, `css/style.css`, `docs/games/brick-garage.md`
• 리스크: 실기기 확인 미실시. 미션별 연출 강도는 사용자 시각 확인 후 조정

## 2026-10-30 — 브릭 특장차 차고 자유 조립

• 요약: `자유 조립` 화면 추가 — 하판·기믹·사이렌·바퀴를 탭해 돌리고 `섞기`로 랜덤 조합, `저장` 시 선반에 추가. 기믹 기준으로 출동 미션 분기(사다리→물, 팔/붐→크레인). 선반은 블루프린트+자유 조립 통합 정렬
• 검증: `node --check` 4파일 통과. 390×844 ego-browser에서 5슬롯·교체 4종(하판/기믹/사이렌/바퀴) 동작, 저장 후 선반 2개·개수 표시, 사다리 기믹→물 5/5·붐 기믹→크레인 3/3 완료, `또!` 리셋, 블루프린트 경찰차→바위 유지, 오류 이벤트 없음
• 경로: `games/brick-garage/js/{app,data,storage}.js`, `index.html`, `css/style.css`, `docs/games/brick-garage.md`
• 리스크: 실기기 확인 미실시. 자유 조립 상한/정리(선반 많아질 때) 정책 미정

## 2026-10-30 — 브릭 특장차 차고 1차 확장 (차량별 출동 3종)

• 요약: 차량별 미션 분기 추가 — 소방(불 블록 5개에 물 발사·물방울 연출), 포클레인/크레인(끊어진 다리 3칸에 블록 놓기), 경찰/레미콘/카캐리어(바위 부수기 유지). `또!` 재시작·선반 출동 연동, 애니메이션 미완료/reduced-motion 폴백
• 검증: `node --check` 통과. 390×844 ego-browser에서 물 5/5 소화·크레인 3/3 슬롯·바위 부수기 동작, 미션 요소 도시 내부 배치, 선반→물/크레인 진입, 5초 힌트, reduced-motion 완주, `또!` 초기화, 오류 이벤트 없음(239 events). 스크린샷은 ego `captureScreenshot` 타임아웃 지속
• 경로: `games/brick-garage/js/app.js`, `js/sound.js`, `css/style.css`, `index.html`, `docs/games/brick-garage.md`
• 리스크: 실기기(아이폰 Safari) 확인 미실시. 미션 난도·연출은 사용자 시각 확인 후 조정

## 2026-10-30 — 브릭 특장차 차고 1차

• 요약: `docs/games/brick-garage.md` 합의본 작성 후 `games/brick-garage/` 신설. 설계도 6종 · 탭→자동 스냅 조립(브릭 5개, 바퀴 선택) · 완성 연출(사이렌 점멸·팡파레) · 블록 바위 부수기 출동 · `localStorage` 선반 저장. 로비 카드 추가
• 검증: `node --check` 4파일 통과. `serve`(4173) + ego-browser 390×844에서 6종 모두 dots5/bricks5·저장 확인, 경찰차 몬스터 바퀴 저장, 선반 6개, 선반→출동·또!·사운드 토글·5초 힌트·reduced-motion 조립 완주 확인. 콘솔 오류 이벤트 없음. 스크린샷은 ego `Page.captureScreenshot` 타임아웃(환경 이슈)으로 미확보
• 경로: `games/brick-garage/`(index.html, css/style.css, js/{data,sound,storage,app}.js), `docs/games/brick-garage.md`, `index.html`
• 리스크: 390px 세로만 확인(태블릿 가로 시각 확인 미실시). 애니메이션 완료 이벤트에 상태 진행을 의존하지 않도록 폴백 타이머 적용

## 2026-10-30 — 호박 특장차 2차 고도화: 워프 터널 & 차고 파츠 꾸미기

• 요약: `games/pumpkin-train/` 2차 고도화 완료.
  - 마녀 모자 워프 터널 기믹 및 4단계 맵 신설 (포털 통과 뾰로롱 연출 + 발자국 프리뷰 경로 연결)
  - 호박 차고 모달 및 4종 파츠(👑 황금 왕관, 🦇 박쥐 날개, 🎀 캔디 리본, ⭐ 별 범퍼) 탈부착 시스템 구현 (`localStorage` 연동)
  - 스테이지 클리어 보상 파츠 자동 해금 및 축하 연출
  - Web Audio 마법 워프음(`playWarp`) & 장착음(`playEquip`) 추가
• 검증: Node.js 구문 검사(`audio.js`, `game.js`), DOM 무결성 23종 항목 전수 통과.
• 경로: `games/pumpkin-train/index.html`, `games/pumpkin-train/css/style.css`, `games/pumpkin-train/js/game.js`, `games/pumpkin-train/js/audio.js`, `docs/games/pumpkin-train.md`
• 리스크: 없음.

## 2026-10-30 — 호박 특장차와 사탕 미로 대모험 MVP 구현

• 요약: `games/pumpkin-train/` 신규 게임 구현 (5x5 미로, 탭 기반 레일 코딩, 반투명 호박 발자국 프리뷰, 멈춘 자리 이어하기 No Reset, 사탕 꼬리 기차 트레일러 연출, 호박 바위 밀기/주스 분사 기믹, Web Audio API 효과음). 로비(`index.html`) 카드 연결 완료.
• 검증: node 구문 검사(`audio.js`, `game.js`), DOM 무결성 검증 스크립트 실행, 로컬 서버(`npx serve -p 4173`) 엔드포인트 응답(301/200) 및 링크 유효성 확인.
• 경로: `games/pumpkin-train/index.html`, `games/pumpkin-train/css/style.css`, `games/pumpkin-train/js/game.js`, `games/pumpkin-train/js/audio.js`, `index.html`
• 리스크: 실제 유아 터치 환경에서 반응형 스케일 및 오디오 최초 제스처 확인 권장.

## 2026-10-30 — 호박 특장차와 사탕 미로 대모험 구상 합의

• 요약: `docs/games/pumpkin-train.md` 구상 문서 신설. 탭 기반 블록 코딩, 발자국 프리뷰, 멈춘 자리 이어하기, 사탕 꼬리 기차 MVP 합의.
• 검증: `docs/PROJECT.md` §8 체크리스트 및 가드레일 항목 대조 확인.
• 경로: `docs/games/pumpkin-train.md`, `STATUS.md`, `PROGRESS.md`
• 리스크: 없음 (구상 완료, 구현 모델 선택 대기)

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
