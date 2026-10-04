# Study-Cafe 프론트 작업 로그

> 프론트엔드 전용 로그. 백엔드는 `../../backend/docs/WORKLOG.md` 참고.

## 현재 위치 (한눈 요약)

- **프론트**: 랜딩·로그인·회원가입·홈(공부 세션·포인트)·상점(준비 중) 화면을 목 데이터로 구현 완료. 설계 `docs/main-screen-design.md`, 디자인 시스템 `DESIGN.md`
- **백엔드 연동 가능 API**: 회원 인증 / 공부 세션 / 포인트(적립·차감·이력) / 상점(목록·구매·보유)
- **레포 구조**: `Study-Cafe/backend`(레포1, →Render) + `Study-Cafe/frontend`(레포2, →Vercel)

## 프론트 디자인/애니메이션 전략

- **컨셉**: 스터디카페는 "아늑하고 살아있는 느낌"이 핵심. 마이크로 인터랙션으로 생동감을 준다.
- **구현 도구**: Motion(motion.dev, `motion/react`) — 애니메이션 구현 라이브러리. 에밀 스킬이 판단, Motion이 구현.
- **주력 스킬 조합**: `apple-design`(스프링·물리적 모션 기준) + `animate`(모션 구현 결정·코드) + `mobile-native`(폰 네이티브 마감)
- **토스트**: 포인트 적립/구매 완료 알림은 나중에 `ask-sonner`(Sonner) 붙일 때 바로 사용
- **접근성**: `MotionConfig reducedMotion="user"`로 OS "동작 줄이기" 존중 (필수)
- **작업 흐름**: brainstorming → design-consultation/apple-design → design-taste-frontend 구현 → find-animation-opportunities → animate → mobile-native → review-animations + design-review 검수

## 다음 할 일 (우선순위 순)

- [x] 프론트 메인 화면 구현 (목 데이터) — `docs/main-screen-design.md`
- [x] 프론트 첫 커밋 + GitHub frontend 레포 생성/연결
- [ ] 카페 좌석 실시간 점유 (10석, 자리 선택, 다른 사용자 표시, 구경 모드) — 설계 `../backend/docs/superpowers/specs/2026-10-04-cafe-seats-design.md`. 단계 1(로그인 실제 연동)·3(프론트 좌석)이 프론트 작업
- [ ] 카페 손님 표시 + 1:1 대화 설계 — 실제 사용자(WebSocket + STOMP) + NPC(백엔드 RAG) (`docs/main-screen-design.md` "다음 작업")
- [ ] 백엔드 연동 — `src/api/*.ts`의 mock 함수를 fetch로 교체 (회원 → 포인트 → 공부 세션 순)
- [ ] 상점 화면

## 작업 일지 (최신순)

### 2026-10-01
- `/grill-me`로 메인 화면 설계 확정 → `docs/main-screen-design.md`
- `/design-consultation`으로 디자인 시스템 확정 ("늦은 밤 단골 카페", Fraunces + Pretendard, 램프 앰버) → `DESIGN.md`. AI 목업 도구는 OpenAI 키가 없어 HTML 미리보기로 대체
- 메인 화면 구현 (목 데이터): 시간대별 SVG 카페 장면, 카운트다운 세션(일시정지·접기 알약·새로고침 이어가기·탭 재오픈 시 일시정지), 영수증 결과 카드, 포인트 적립 연출, 다크 모드, 카페 소리(CC0, Freesound #437461)
- 목 API는 백엔드와 같은 응답 형식·에러 코드·검증 문구 사용. 셀프 체크 `node src/lib/session.check.ts`
- 레포 재구성: 프론트용 `Study-Cafe/frontend/` 신설(별도 레포), 기존 백엔드는 `Study-Cafe/backend/`로 이동
- 프론트 스캐폴딩: Vite + React + TS + Tailwind v4 + TanStack Query + React Router, 빌드 검증 통과, `git init`(아직 미커밋)
- 배포 방향 확정: 프론트=Vercel / 백엔드=Render (레포 2개 분리)
- 에밀 코왈스키 스킬 팩 설치(13종): emil-design-eng, animate, apple-design, mobile-native, find/improve/review-animations, animation-vocabulary, ask-sonner, pick-ui-library, prototype 등 (`~/.claude/skills/`)
- 프론트에 Motion(motion.dev) 설치 (`motion@13.4.6`) — 애니메이션 구현 라이브러리
- 프론트 디자인/애니메이션 전략 확정 (위 섹션 참고): apple-design + animate + mobile-native 조합, 토스트는 ask-sonner
