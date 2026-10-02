# Design System — Study-Cafe

## Product Context
- **What this is:** 가상의 카페에서 목표 시간만큼 공부하고 포인트를 모아 상점에서 쓰는 웹 서비스
- **Who it's for:** 혼자 공부·작업하지만 "어딘가에 앉아 있는" 분위기가 필요한 사람
- **Space/industry:** 스터디 타이머, 앰비언트 포커스 앱 (Flocus, Lofi Cafe, LifeAt, I Miss My Cafe, Virtual Cottage)
- **Project type:** 웹 앱 (모바일 우선 반응형)
- **기억될 한 가지:** 늦은 밤 단골 카페

## Aesthetic Direction
- **Direction:** 따뜻한 오가닉 + 에디토리얼. 종이, 나무, 텅스텐 조명의 재질감
- **Decoration level:** intentional — SVG 카페 장면 + 은은한 종이 그레인(불투명도 6%)만
- **Mood:** 램프 하나 켜진 창가 자리. 조용하고 따뜻하며, 시선을 뺏지 않고 곁에 있는 느낌
- **차별점:** 경쟁 서비스는 남의 영상·애니 루프 배경 + 산세리프 디지털 타이머로 수렴한다. Study-Cafe는 ① 실제 시각을 따르는 하나의 카페 장면 ② 메뉴판 같은 세리프 타이머 ③ 영수증으로 찍혀 나오는 보상으로 차별화한다
- **Reference sites:** https://flocus.com, https://lofi.cafe, https://imissmycafe.com

## Typography
- **Display/Hero:** Fraunces (가변, opsz 144) — 브랜드명과 큰 타이머 숫자 전용. 카페 메뉴판 같은 부드러운 세리프
- **Body / UI / Labels:** Pretendard Variable — 한글 가독성
- **Data / Numbers:** Pretendard `tabular-nums` (포인트, 시간). 타이머는 Fraunces `tabular-nums lining-nums`
- **Loading:** Fraunces는 Google Fonts, Pretendard는 jsDelivr 동적 서브셋 CDN (`index.html` `<link>`)
- **Scale:**
  | 용도 | 폰트 | 크기 |
  |---|---|---|
  | 타이머 (데스크톱 / 모바일) | Fraunces 300 | 104px / 72px |
  | 브랜드 히어로 | Fraunces 400 | clamp(56px, 9vw, 112px) |
  | 제목 | Fraunces 400 | 32px |
  | 본문 | Pretendard 400 | 16px / 1.7 |
  | 라벨·숫자 | Pretendard 600 | 14px |
  | 캡션 | Pretendard 400 | 13px |

## Color
- **Approach:** restrained — 강조색은 램프 앰버 하나. 세이지는 진행·완료 상태 전용

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `paper` | `#F6EFE4` | `#1A1411` | 배경 |
| `paper-2` | `#EFE5D6` | `#231B17` | 카드, 보조 버튼 |
| `ink` | `#2B1E16` | `#F3E9DC` | 본문 글자 |
| `muted` | `#7A6656` | `#A8968A` | 보조 글자 |
| `line` | `#2B1E16` 13% | `#F3E9DC` 12% | 테두리 |
| `amber` | `#D9822B` | `#F2A65A` | 주 버튼, 포인트 |
| `amber-ink` | `#FFF8EE` | `#1A1411` | 앰버 위 글자 |
| `sage` | `#7C8B6F` | `#9AAA8B` | 진행 중, 완료 |
| `danger` | `#B5523B` | `#B5523B` | 오류 |
| `panel` | `rgba(246,239,228,.78)` | `rgba(26,20,17,.72)` | 장면 위 반투명 패널 (blur 18~22px) |

- **Dark mode:** UI 색만 바꾼다. 장면은 다크 모드와 무관하게 시간대만 따른다. 기본값은 OS 설정, 토글로 변경해 저장

### 장면 팔레트 (시간대)
| 구간 | 하늘 위 → 아래 | 벽 | 램프 빛 |
|---|---|---|---|
| 아침 6~11시 | `#F7D9B5` → `#FBE9D4` | `#E9D9C2` | 25% |
| 낮 11~17시 | `#B9D7DF` → `#E3F0F2` | `#EADFCF` | 15% |
| 저녁 17~20시 | `#6B4C7A` → `#E88A5B` | `#C9A588` | 70% |
| 밤 20~6시 | `#111829` → `#1B2235` | `#3A2C26` | 100% |

## Spacing
- **Base unit:** 8px (세부 정렬은 4px)
- **Density:** comfortable
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** 장면 우선. 배경 전체가 카페 장면이고 UI는 그 위에 떠 있다
- **홈:** 상단 헤더 패널 + 가운데 타이머 패널. 모바일도 같은 구조 (헤더에는 포인트 + 메뉴만)
- **장면 구도:** 랜딩·로그인은 창가 정면 장면(`CafeScene`). 로그인 후 홈은 카페 안 앞쪽 위에서 내려다보는 원근 실내 장면(`CafeInterior`, 동물의 숲 실내 느낌) — 안쪽 벽 큰 창(바깥 거리 풍경), 왼쪽 바 카운터·커피 머신, 창가 바 테이블에 내 캐릭터, 손님 테이블 2개. 화면을 꽉 채우고 모바일은 내 자리 중심으로 자른다
- **타이머 위치:** 데스크톱은 오른쪽 아래 카드(380px), 모바일은 아래쪽 시트
- **Max content width:** 1180px (랜딩·폼)
- **Border radius:** sm 6px (칩 내부, 견본) / md 12px (버튼, 입력, 헤더) / lg 20px (타이머 패널, 카드) / full (프리셋 칩, 타이머 알약)

## Motion
- **Approach:** intentional — 장면의 "살아있음"과 상태 전환에만. 스프링 위주 (Motion `motion/react`)
- **장면:** 커피 김 5초 루프, 램프 약한 깜빡임 7초, 시간대 전환 4초 크로스페이드. 세션 중에는 더 느리게
- **UI:** 타이머 패널 접기·펼치기는 스프링(bounce 0), 버튼 누름 scale .97, 포인트 숫자 올라가기 0.8초
- **Easing:** enter ease-out / exit ease-in / move ease-in-out
- **Duration:** micro 50~100ms / short 150~250ms / medium 250~400ms / long 400~700ms
- **접근성:** `MotionConfig reducedMotion="user"`, CSS 루프는 `prefers-reduced-motion`에서 정지

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-01 | 초기 디자인 시스템 작성 | `/design-consultation`, 경쟁 서비스 조사 + "늦은 밤 단골 카페" 컨셉 |
| 2026-10-01 | 세리프 타이머, 영수증 결과 카드, 실제 시각 장면을 리스크로 채택 | 영상 배경 + 디지털 타이머로 수렴한 카테고리와 차별화 |
| 2026-10-01 | AI 목업 대신 HTML 미리보기로 확정 | 목업 도구에 OpenAI API 키가 없어 대체 경로 사용 |
| 2026-10-02 | 홈 장면을 실내 원근 시점으로 분리, 타이머는 구석 카드 | 로그인 후에는 카페 안에 들어온 느낌. 아이소메트릭은 멀게 느껴져 동물의 숲식 시점으로 변경 |
