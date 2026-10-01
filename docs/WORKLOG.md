# Study-Cafe 프론트 작업 로그

> 프론트엔드 전용 로그. 백엔드는 `../../backend/docs/WORKLOG.md` 참고.

## 현재 위치 (한눈 요약)

- **프론트**: Vite+React+TS 골격 셋업 완료 (Tailwind v4 + TanStack Query + React Router + Motion), 아직 화면 미구현
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

- [ ] 프론트 메인 화면 구현 (brainstorming → design-consultation → 스타일 선택 → design-taste-frontend → 검수)
- [ ] 프론트 첫 커밋 + GitHub frontend 레포 생성/연결
- [ ] 로그인/회원가입 화면 — 백엔드 `/api/v1/members` API 연동 (API 클라이언트 + 토큰 저장부터)
- [ ] 세션 타이머 / 포인트 / 상점 화면

## 작업 일지 (최신순)

### 2026-10-01
- 레포 재구성: 프론트용 `Study-Cafe/frontend/` 신설(별도 레포), 기존 백엔드는 `Study-Cafe/backend/`로 이동
- 프론트 스캐폴딩: Vite + React + TS + Tailwind v4 + TanStack Query + React Router, 빌드 검증 통과, `git init`(아직 미커밋)
- 배포 방향 확정: 프론트=Vercel / 백엔드=Render (레포 2개 분리)
- 에밀 코왈스키 스킬 팩 설치(13종): emil-design-eng, animate, apple-design, mobile-native, find/improve/review-animations, animation-vocabulary, ask-sonner, pick-ui-library, prototype 등 (`~/.claude/skills/`)
- 프론트에 Motion(motion.dev) 설치 (`motion@13.4.6`) — 애니메이션 구현 라이브러리
- 프론트 디자인/애니메이션 전략 확정 (위 섹션 참고): apple-design + animate + mobile-native 조합, 토스트는 ask-sonner
