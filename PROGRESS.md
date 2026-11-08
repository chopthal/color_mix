# PROGRESS

최신이 위. 세션은 상단 2~3개만 읽는다.  
**보관 정책:** 최근 10개 항목만 유지하며, 10개 초과 시 가장 오래된 항목은 [`docs/archive/PROGRESS_ARCHIVE.md`](docs/archive/PROGRESS_ARCHIVE.md)로 이동 보관한다.

## 2026-11-08 — 달콤 사탕 자판기와 치카치카 v1 구현

• 요약: `games/candy-machine/` 신설. 음료수형 자판기(동전 투입 → 12종 사탕 버튼 콕 → 배출구 도어 오픈 → 사탕 획득) → 포장지 까기 → 쪽쪽 녹여먹기(3단계 축소) vs 아작 깨물기(아야+반창고) → 뮤탄스균 발생 → 왕칫솔 슥삭 치카치카로 반짝반짝 완치 루프. 12종 사탕(롤리팝 4·별사탕 4·알사탕 4), 주니토니풍 남아 캐릭터, No Penalty(양치하면 100% 회복). 로비 카드 17번째 추가.
• 검증: `node --check` 통과. serve(4173)+T3 preview(430×932, iPhone 14 Pro Max)에서 동전→버튼→도어→까기→쪽쪽×3→치카치카 스크럽→엔딩 오버레이("치카치카 대성공!") 전 경로 구동, JS 예외 0.
• 경로: `games/candy-machine/`(index.html, css/style.css, js/game.js), `index.html`, `docs/games/candy-machine.md`, `STATUS.md`, `PROGRESS.md`
• 리스크: 실기기(iPhone Safari) 미확인. 터치감·효과음 톤·사탕 낙하 연출은 실기기 조정 권장.

## 2026-11-07 — Orca 오케스트레이션 키즈 게임 3종 병렬 구현 및 통합

• 요약: Orca 오케스트레이션을 통해 OpenCode 2개(DeepSeek V4.1 Flash)와 Antigravity 1개(Gemini 3.8 Flash Medium)를 독립 워크트리에 출격시켜 3개 신규 게임을 병렬 구현 후 메인 트리에 머지 통합.
  1) `숲속 냄비 요리` (`games/forest-soup/`): 재료 퐁당 투입, 뱅글뱅글 젓기, 동물 3회 냠냠 시식 및 스티커 보관
  2) `음악 정원` (`games/music-garden/`): 구름 톡 빗방울, 새싹 퐁 줄기 쑥 꽃 팡 3단계 성장, 5음계(도레미솔라) 꽃 연주
  3) `포근포근 밤밤` (`games/cozy-night/`): 동물 3종 토닥토닥 재우기 5단계, 오르골 자장가, 포근한 이불 덮어주기, 과몰입 방지 취침 엔딩
• 검증: 각 워커별 Playwright/ego-browser 가상 브라우저 검증(390x844, 320x568, 가로 오버플로우 없음, JS 예외 0) 완료. 메인 작업트리 통합 후 `node --check` 3개 JS 모두 에러 0건. 로비 카드 16장 연동 확인, 로컬 서버(`http://localhost:4173`) HTTP 200 OK 서빙 확인.
• 경로: `games/{forest-soup,music-garden,cozy-night}/`, `docs/games/{forest-soup,music-garden,cozy-night}.md`, `index.html`, `STATUS.md`, `PROGRESS.md`
• 리스크: 실기기(iPhone Safari) 미확인 (사운드 톤 및 터치감 확인 권장)

## 2026-11-04 — 사마귀 앞다리 낫 리디자인

• 요약: 사마귀 `scythes` 아트를 뭉툭한 솜 낫 → 실제 사마귀 앞다리처럼 **뾰족한 낫**(곡선 테이퍼 + 안쪽 가시 2개)으로 교체. `drawSickle` 헬퍼 추가, 앞/뒤 두 다리로 입체감. 사용자 확인(이 정도 날카로움 허용)
• 검증: `node --check` 통과. ego 캔버스 스냅샷(faceoff·attack `째깍 낫`)에서 뾰족한 낫 형태·얼굴 미가림 확인, 오류 0
• 경로: `games/mantis-spino/js/game.js`, `docs/games/mantis-spino.md`, `STATUS.md`, `PROGRESS.md`
• 리스크: 실기기 미확인

## 2026-11-04 — 째깍 크아앙! 놀이 싸움 3기술 확장

• 요약: 공격 버튼 1개 → **캐릭터별 커스텀 3기술**로 확장. 각 기술은 `motion`(dash/hop 돌진·폴짝, shout/splash 제자리 외침·물뿌리기)과 `effect`(spark/ring/bubble/leaf/dust)로 연출. 예) 스피노 크아앙!·깨물기·밀기, 코끼리 뿌우~·물 뿌리기·코로 밀기, 사마귀 째깍 낫·째깍!·솜폴짝. 하단 공격 바에 3버튼, 상대는 자기 3기술 중 **랜덤 반격**. 파티클에 ring/leaf/bubble/dust 추가
• 검증: `node --check` 2파일. ego-browser(가상 프레임). 코끼리 라벨(뿌우~/물 뿌리기/코로 밀기)·사마귀 라벨(째깍 낫/째깍!/솜폴짝) 확인, shout(소리물결)·splash(거품)·dash(돌진 접촉)·hop(폴짝) 4모션 프레임 캔버스 스냅샷 확인, 3겨루기→엔딩, 오류 0. 모바일 390·320: 공격 버튼 3개·가로 오버플로우 없음. ego는 CSS transition을 진행하지 못해(opacity 0 고정) `transition:none`으로 검증 → opacity 1·translateY 0·bottom 828(<844) 정상 확인
• 경로: `games/mantis-spino/js/{data,game}.js`, `games/mantis-spino/index.html`, `games/mantis-spino/css/style.css`, `docs/games/mantis-spino.md`, `STATUS.md`, `PROGRESS.md`
• 리스크: 실기기(iPhone Safari) 미확인. 3버튼 배치·모션 속도·효과음 톤은 실기기에서 조정 권장. ego는 CSS 전환/ rAF 정지 환경이고 포인터 입력도 페이지로 전달되지 않아(클릭 로그 0건) 실제 탭은 미검증 — 버튼 핸들러는 programmatic click으로 검증, 버튼은 pointer-events auto·z-index 5·뷰포트 내(바닥 828<844, 데스크톱 905<921)

## 2026-11-04 — 째깍 크아앙! 놀이 싸움 개편 (내/적 선택·돌진 공격)

• 요약: 사마귀·스피노가 같은 편이라는 해석을 바로잡아 **서로 겨루는 사이**로 정리. 선택 화면을 '내 친구 / 적 친구' 두 줄로 바꿔 **전체 11종(동물·공룡·곤충) 풀에서 양쪽을 각각 선택**(기본 사마귀 vs 스피노, 미러 허용). 공격 시 제자리 런지 대신 **상대 앞까지 달려가(돌진) 공격 후 복귀**하도록 `attackCharge` 이동 곡선 추가, 맞은 쪽은 살짝 밀려남. "또!"는 새 랜덤 대신 **같은 조합 재대결**
• 검증: `node --check` 3파일 통과. serve(4173) + ego-browser(가상 프레임 `__step`). 선택 줄 각 11장·기본/스와프(mantis↔spino) 반영, 계속 진행해 3겨루기→엔딩 오버레이, "또!"(같은 조합 재대결)·"친구 바꾸기"(선택 복귀), 돌진 프레임(rest→dash→contact)에서 공격자가 실제로 상대 앞까지 이동·접촉 확인, 390×844(dpr2)·320×568 가로 오버플로우 없음·선택 줄 가로 스크롤·시작 버튼 노출, 오류 이벤트 없음
• 경로: `games/mantis-spino/js/{data,game}.js`, `games/mantis-spino/index.html`, `games/mantis-spino/css/style.css`, `docs/games/mantis-spino.md`, `STATUS.md`, `PROGRESS.md`
• 리스크: 실기기(iPhone Safari) 미확인. 돌진 속도·접촉 간격·효과음 톤은 실기기에서 조정 권장

## 2026-11-04 — 째깍 크아앙! 놀이 싸움 v1 구현

• 요약: `games/mantis-spino/` 신설. 사마귀/스피노 중 내 캐릭터 선택 → 큼직한 공격 버튼 1개(자동) 탭 → 내 캐릭터 공격 연출("째깍!"/"크아앙!") → 상대 "폭신!" 빙글 + 별·하트·거품 + 웃음 → 상대 자동 반격 → 3겨루기 → 하이파이브 + 색종이 엔딩("또! / 친구 바꾸기 / 쉬자"). 상대 메이트 9종(동물 사자·코끼리·토끼 / 공룡 티라노·트리케라·브라키오 / 곤충 사슴벌레·장수풍뎅이·무당벌레) 랜덤. 무해화(마시멜로 이빨·솜 낫·거품 등)·무승패·무HP. 로비 카드 추가
• 검증: `node --check` 3파일 통과. serve(4173) + ego-browser. ego는 rAF가 멈춰 있어 가상 프레임(`window.__step`, setTimeout 대체 shim)으로 직접 구동해 검증. 로비 카드 13장·href(`games/mantis-spino/index.html`)·진입, 선택 2장(썸네일 렌더)·사마귀/스피노 선택, 시작→faceOff→공격→폭신 파티클→반격→3겨루기→엔딩 오버레이, "또!"(새 랜덤 메이트)·"친구 바꾸기"(선택 복귀), 390×844(dpr2)·320×568 가로 오버플로우 없음·공격/시작 버튼 노출, 오류 이벤트 없음. **모바일(dpr>1)에서 캔버스가 속성 크기(780px)로 커져 잘리던 문제 발견 → `#gameCanvas{width:100%;height:100%}`로 수정 후 clientW=390 확인.** `.card-mantis` 로비 카드 CSS/HTML 추가
• 경로: `games/mantis-spino/`(index.html, css/style.css, js/{data,sound,game}.js), `index.html`, `docs/games/mantis-spino.md`, `STATUS.md`, `PROGRESS.md`
• 리스크: 실기기(iPhone Safari) 미확인. 공격/반격 속도·효과음 톤은 실기기에서 조정 권장. ego는 rAF 정지 환경이라 가상 프레임으로 검증(실브라우저는 정상)

## 2026-10-31 — 뾰로롱! 변신 숨바꼭질 v1 구현

• 요약: `games/transform-hide/` 신설. 숨는 차례(물건 4개 중 콕 → 뾰로롱 변신 → 술래 요정 순찰 → 근처 지날 때 물건 씰룩+"히히!" → 약 6.5초 뒤 "?" 하며 포기) → 찾는 차례(친구가 물건에 숨고 ♪ 단서 → 콕 → "까르르!" 발견, 틀려도 무벌점) → 2라운드 → 소프트 엔딩. 요정 3종(하늘/복숭아/라일락) 무언 연출, 물건 아트 4종(피아노/곰인형/소파/선물상자), 로비 카드 추가
• 검증: `node --check` 3파일. serve(4173) + ego-browser 390×844(dpr2)·1920×860에서 로비 카드 12장·href(`games/transform-hide/index.html`)·진입, 선택 요정 3장(390에서 가로 오버플로우 없음·시작 버튼 노출), 숨기→술래 순찰·"히히!"→"?" 포기→찾기(♪ 단서 위에 지속 표시)→콕 발견→2라운드→엔딩 오버레이, 틀린 물건 무벌점, 오류 이벤트 없음. ego는 rAF가 정지해 canvas가 비어 보여 `requestAnimationFrame` shim(setTimeout) 후 `canvas.toDataURL` 스냅샷으로 확인. 상대경로 자산 + 인라인 슬래시 보정 스크립트로 `file://.../index.html` 직접 열기와 `serve` 진입 모두 자산 200·요정 3장·시작·렌더 확인
• 경로: `games/transform-hide/`(index.html, css/style.css, js/{data,sound,game}.js), `index.html`, `docs/games/transform-hide.md`, `STATUS.md`, `PROGRESS.md`
• 리스크: 실기기(iPhone Safari) 미확인. 숨는 차례 6.5초·요정 속도·간지럼 타이밍은 실기기에서 조정 권장. `dino-hide-seek`와 이름 혼동 방지 위해 '변신'을 전면에 둠

## 2026-10-31 — 반짝반짝 별사탕을 지켜요 v1 구현

• 요약: `games/star-candy/` 신설. 상자 5개 중 하나에 별사탕 숨기기 → 요정이 다가와 상자를 열려 함 → 아이 캐릭터를 드래그해 콩! 밀어내기(비눗방울·엉덩방아). 손가락으로 잡고 있으면 요정이 닿는 순간 발동(이동 속도 조건 없음). 놓쳐 상자를 열어도 "앗!" 후 다시 숨기기(벌점·타이머 없음). 5번 지키면 소프트 엔딩. 요정 3종(파랑/핑크/민트) 무언 연출, 상자별 패턴, 별 HUD 5칸. 로비 카드 추가
• 검증: `node --check` 3파일. serve(4173) + ego-browser 1920×860·390×844(dpr2)에서 로비 카드 11장·href(`games/star-candy/`)·진입, 선택 화면 요정 3장(390에서 카드 0~390 안, 가로 오버플로우 없음, 시작 버튼 노출), 시작→상자 탭 숨기기(사탕 사라짐), 요정 접근→드래그 홀드 콩!(HUD 별 1→5), 5콩 소프트 엔딩 오버레이, 무입력 시 요정이 상자 열고 "앗!"→별사탕 재숨기기, 오류 이벤트 없음. ego는 rAF가 정지해 canvas가 비어 보여 `requestAnimationFrame` shim(setTimeout) 후 `canvas.toDataURL` 스냅샷으로 확인. `serve` cleanUrls가 `/games/star-candy/index.html`을 슬래시 없는 `/games/star-candy`로 보내 상대경로 자산이 404 나던 문제는 CSS/JS를 상대경로로 두고, 게임 HTML 인라인 스크립트가 슬래시 없는 서버 URL을 `/games/star-candy/`로 보정하게 해 해결. `index.html` 직접 열기(file://)와 serve 진입 모두 자산 200·요정 3장·시작·렌더 확인. (절대경로 방식은 file://에서 깨져 폐기)
• 경로: `games/star-candy/`(index.html, css/style.css, js/{data,sound,game}.js), `index.html`, `docs/games/star-candy.md`, `STATUS.md`, `PROGRESS.md`
• 리스크: 실기기(iPhone Safari) 미확인. 드래그 홀드 판정·요정 속도는 실기기에서 조정 권장. 콩! 중 손가락을 계속 잡고 있으면 반복 방어로 엔딩까지 갈 수 있음(의도된 몸으로 막기)

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

---

> [!NOTE]
> 11번째 이전의 과거 작업 내역은 [docs/archive/PROGRESS_ARCHIVE.md](docs/archive/PROGRESS_ARCHIVE.md)에 보관되어 있습니다.

