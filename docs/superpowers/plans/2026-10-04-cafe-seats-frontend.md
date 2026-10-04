# 카페 좌석 실시간 점유 — 프론트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈 장면에 10개 좌석을 그리고, 빈 의자를 눌러 앉으면 모든 접속자의 화면에 닉네임 달린 캐릭터가 실시간으로 나타난다. 만석이면 구경 모드로 공부 시작을 막는다.

**Architecture:** STOMP 연결·구독·전송은 `useCafeSeats` 훅 하나에 모으고, 파생 값(내 자리, 안내 상태, 앉은 시간 문구, 캐릭터 옷 색)은 순수 함수 `lib/seats.ts`로 계산한다. 장면(`CafeInterior`)은 좌석표를 props로 받아 그리기만 하고, 안내 배너·정보 카드·주문 잠금은 `Home`이 조립한다.

**Tech Stack:** React 19, TypeScript, Vite, `@stomp/stompjs` 7, Tailwind 4, Playwright(MCP)로 확인

**Spec:** `../backend/docs/superpowers/specs/2026-10-04-cafe-seats-design.md`
**선행:** 백엔드 계획 `../backend/docs/superpowers/plans/2026-10-04-cafe-seats-backend.md` 완료, 프론트 로그인 연동(`feat/auth-api`) 위에서 작업

## Global Constraints

- 좌석 10개, ID `0`~`9`. ID와 장면 좌표의 대응은 프론트 상수에만 둔다
- STOMP 주소: `${VITE_API_URL}`의 `http`를 `ws`로 바꾼 주소 + `/ws`. CONNECT 헤더 `Authorization: Bearer <액세스 토큰>`
- 구독: `/topic/cafe/seats`(먼저), `/user/queue/errors`, `/app/cafe/seats`(현재 좌석표 1회). 보내기: `/app/cafe/seat.take` `{ seatId }`, `/app/cafe/status` `{ studying }`
- 좌석표 JSON: `[{ seatId, occupant: { memberId, nickname, sittingSince(ISO), studying } | null }]`
- 공부 상태: 타이머 `running`만 `studying: true`
- 문구: "카페에 연결하는 중…", "앉을 자리를 골라주세요", "지금은 만석이에요. 자리가 나면 바로 앉을 수 있어요", "방금 다른 분이 앉았어요", 주문 잠금 "먼저 자리를 골라주세요", 카드 "공부 중"/"쉬는 중", "방금 앉았어요"/"N분째 앉아 있어요"/"N시간 M분째 앉아 있어요"
- 색·모션은 `DESIGN.md`. 장면 색은 다크 모드와 무관(장면 안 글자도 고정색). UI 색은 `amber`·`sage`·`muted`·`ink` 토큰
- 장면 안 버튼은 키보드(Enter/Space)로도 눌러야 하고 `aria-label`이 있어야 한다
- 주석은 한글. 검증: `npx tsc -b`, `npx oxlint`, `node src/lib/*.check.ts`

## Review Focus

- 장면은 `pointerdown`에서 포인터 캡처로 드래그를 시작하므로, 의자·캐릭터에서 `pointerdown` 전파를 막지 않으면 `click`이 장면 컨테이너로 가서 앉기가 안 된다 → Task 2 확인 단계
- 연결이 끊긴 동안(재연결 중)에는 의자를 눌러도 아무 일이 없어야 하고 "연결 중" 안내가 보여야 한다 → Task 2·3
- 새로고침하면 30초 유예 안에 다시 연결되어 같은 자리에 그대로 앉아 있어야 한다 → Task 4
- 정보 카드를 연 상대가 자리를 떠나면 카드가 닫혀야 한다(빈 카드가 남으면 안 됨) → Task 3
- 지난번에 공부 중이던 세션이 복원된 상태(자리 없이 running)에서도 앉는 순간 `studying: true`가 서버에 전달되어야 한다 → Task 3

---

## 파일 구조

| 파일 | 역할 |
|---|---|
| `src/lib/seats.ts` | 좌석 타입과 파생 값 순수 함수 |
| `src/lib/seats.check.ts` | 위 함수 셀프 체크 |
| `src/hooks/useCafeSeats.ts` | STOMP 연결·구독·앉기·공부 상태 전송 |
| `src/components/CafeInterior.tsx` (수정) | 10석 배치, 앉은 캐릭터·닉네임, 빈 의자 선택 |
| `src/index.css` (수정) | 빈 의자 강조, 닉네임 글자 스타일 |
| `src/components/SeatGuide.tsx` | 장면 위 안내 배너 |
| `src/components/SeatCard.tsx` | 캐릭터 정보 카드 |
| `src/components/SessionPanel.tsx` (수정) | `locked`면 주문 버튼 잠금 |
| `src/pages/Home.tsx` (수정) | 훅·장면·배너·카드·잠금·공부 상태 동기화 조립 |

---

### Task 1: 좌석 파생 값 (`lib/seats.ts`)

**Files:**
- Create: `src/lib/seats.ts`
- Test: `src/lib/seats.check.ts`

**Interfaces:**
- Produces:
  - `type Occupant = { memberId: number; nickname: string; sittingSince: string; studying: boolean }`
  - `type Seat = { seatId: number; occupant: Occupant | null }`
  - `type SeatErrorCode = 'SEAT_TAKEN' | 'INVALID_SEAT'`
  - `type SeatGuideState = 'connecting' | 'pick' | 'full' | 'seated'`
  - `mySeatId(seats: Seat[], memberId: number): number | null`
  - `seatGuide(seats: Seat[] | null, connected: boolean, memberId: number): SeatGuideState`
  - `sittingLabel(since: string, now: number): string`
  - `outfitOf(memberId: number): { shirt: string; hair: string }`

- [ ] **Step 1: 실패하는 셀프 체크 작성**

```ts
// 좌석 파생 값 셀프 체크 — `node src/lib/seats.check.ts`
import assert from 'node:assert/strict'
import { mySeatId, outfitOf, type Seat, seatGuide, sittingLabel } from './seats.ts'

const empty = (seatId: number): Seat => ({ seatId, occupant: null })
const taken = (seatId: number, memberId: number): Seat => ({
  seatId,
  occupant: { memberId, nickname: `손님${memberId}`, sittingSince: '2026-10-04T10:00:00Z', studying: false },
})
const seats = (fill: (id: number) => Seat) => Array.from({ length: 10 }, (_, i) => fill(i))

// 내 자리
assert.equal(mySeatId(seats((i) => (i === 3 ? taken(3, 7) : empty(i))), 7), 3)
assert.equal(mySeatId(seats(empty), 7), null)

// 안내 상태: 연결 전이나 좌석표 전이면 연결 중
assert.equal(seatGuide(null, true, 7), 'connecting')
assert.equal(seatGuide(seats(empty), false, 7), 'connecting')
assert.equal(seatGuide(seats(empty), true, 7), 'pick')
assert.equal(seatGuide(seats((i) => taken(i, i + 100)), true, 7), 'full')
// 꽉 차 있어도 그중 하나가 내 자리면 앉은 상태
assert.equal(seatGuide(seats((i) => (i === 0 ? taken(0, 7) : taken(i, i + 100))), true, 7), 'seated')

// 앉은 시간 문구
const since = '2026-10-04T10:00:00Z'
const at = (minutes: number) => Date.parse(since) + minutes * 60_000 + 30_000
assert.equal(sittingLabel(since, Date.parse(since) + 20_000), '방금 앉았어요')
assert.equal(sittingLabel(since, at(40)), '40분째 앉아 있어요')
assert.equal(sittingLabel(since, at(60)), '1시간째 앉아 있어요')
assert.equal(sittingLabel(since, at(65)), '1시간 5분째 앉아 있어요')

// 옷 색은 회원마다 고정
assert.deepEqual(outfitOf(7), outfitOf(7))
assert.notDeepEqual(outfitOf(1).shirt, outfitOf(2).shirt)

console.log('seats check: ok')
```

- [ ] **Step 2: 실패 확인**

Run: `node src/lib/seats.check.ts`
Expected: `Cannot find module` (seats.ts 없음)

- [ ] **Step 3: 구현**

```ts
// 카페 좌석 — 백엔드 STOMP 좌석표와 같은 모양. 화면에 필요한 값은 순수 함수로 계산한다

export type Occupant = { memberId: number; nickname: string; sittingSince: string; studying: boolean }
export type Seat = { seatId: number; occupant: Occupant | null }
export type SeatErrorCode = 'SEAT_TAKEN' | 'INVALID_SEAT'
// 연결 중 / 자리 고르기 / 만석(구경) / 앉음
export type SeatGuideState = 'connecting' | 'pick' | 'full' | 'seated'

export function mySeatId(seats: Seat[], memberId: number): number | null {
  return seats.find((s) => s.occupant?.memberId === memberId)?.seatId ?? null
}

export function seatGuide(seats: Seat[] | null, connected: boolean, memberId: number): SeatGuideState {
  if (!connected || !seats) return 'connecting'
  if (mySeatId(seats, memberId) !== null) return 'seated'
  return seats.every((s) => s.occupant) ? 'full' : 'pick'
}

// 방금 앉았어요 / 40분째 앉아 있어요 / 1시간 5분째 앉아 있어요
export function sittingLabel(since: string, now: number): string {
  const minutes = Math.floor((now - Date.parse(since)) / 60_000)
  if (minutes < 1) return '방금 앉았어요'
  const [h, m] = [Math.floor(minutes / 60), minutes % 60]
  const span = h ? `${h}시간${m ? ` ${m}분` : ''}` : `${m}분`
  return `${span}째 앉아 있어요`
}

// 회원마다 옷·머리색을 고정 (장면 팔레트 안에서 고른 색)
const SHIRTS = ['#7C8B6F', '#7C8EA8', '#B5643E', '#9A6644', '#8C6A8F', '#5F7F86']
const HAIRS = ['#3A2A22', '#2B1E16', '#6B3E22']

export const outfitOf = (memberId: number) => ({
  shirt: SHIRTS[memberId % SHIRTS.length],
  hair: HAIRS[memberId % HAIRS.length],
})
```

- [ ] **Step 4: 통과 확인**

Run: `node src/lib/seats.check.ts && npx tsc -b && npx oxlint`
Expected: `seats check: ok`, 타입·린트 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add src/lib/seats.ts src/lib/seats.check.ts
git commit -m "feat: 좌석 파생 값 순수 함수 추가"
```

---

### Task 2: STOMP 훅 + 장면 10석

**Files:**
- Modify: `package.json`, `package-lock.json` (`@stomp/stompjs` 설치)
- Create: `src/hooks/useCafeSeats.ts`
- Modify: `src/components/CafeInterior.tsx`
- Modify: `src/index.css`
- Modify: `src/pages/Home.tsx` (장면에 좌석 전달까지만. 배너·카드·잠금은 Task 3)

**Interfaces:**
- Consumes: `Seat`, `Occupant`, `SeatErrorCode`, `outfitOf` (Task 1), `getAccessToken()` (`api/auth.ts`)
- Produces:
  - `useCafeSeats(): { seats: Seat[] | null; connected: boolean; error: { code: SeatErrorCode; at: number } | null; take(seatId: number): void; setStudying(studying: boolean): void }`
  - `CafeInterior` props: `{ period: Period; calm?: boolean; seats?: Seat[] | null; myId?: number | null; pickable?: boolean; onPick?: (seatId: number) => void; onInspect?: (memberId: number) => void }` — 기존 `studying` prop은 제거

- [ ] **Step 1: 라이브러리 설치**

Run: `npm install @stomp/stompjs`
Expected: `package.json` dependencies에 `"@stomp/stompjs": "^7.x"` 추가

- [ ] **Step 2: 훅 작성**

```ts
import { Client } from '@stomp/stompjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getAccessToken } from '../api/auth.ts'
import type { Seat, SeatErrorCode } from '../lib/seats.ts'

const WS_URL = `${import.meta.env.VITE_API_URL.replace(/^http/, 'ws')}/ws`

// 카페 좌석 STOMP 연결 — 좌석표 구독, 앉기·공부 상태 전송. 끊기면 3초마다 다시 연결한다
export function useCafeSeats() {
  const client = useRef<Client | null>(null)
  const [seats, setSeats] = useState<Seat[] | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<{ code: SeatErrorCode; at: number } | null>(null)

  useEffect(() => {
    const c = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
      reconnectDelay: 3000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      onConnect: () => {
        setConnected(true)
        // 변경 알림을 먼저 구독해 두고 현재 좌석표를 받는다 (사이의 변경을 놓치지 않게)
        c.subscribe('/topic/cafe/seats', (m) => setSeats(JSON.parse(m.body) as Seat[]))
        c.subscribe('/user/queue/errors', (m) => setError({ code: (JSON.parse(m.body) as { code: SeatErrorCode }).code, at: Date.now() }))
        c.subscribe('/app/cafe/seats', (m) => setSeats(JSON.parse(m.body) as Seat[]))
      },
      onWebSocketClose: () => setConnected(false),
    })
    c.activate()
    client.current = c
    return () => {
      client.current = null
      void c.deactivate()
    }
  }, [])

  // 연결이 없을 때 보낸 요청은 버린다 (재연결 후 사용자가 다시 고른다)
  const send = useCallback((destination: string, body: unknown) => {
    if (client.current?.connected) client.current.publish({ destination, body: JSON.stringify(body) })
  }, [])
  const take = useCallback((seatId: number) => send('/app/cafe/seat.take', { seatId }), [send])
  const setStudying = useCallback((studying: boolean) => send('/app/cafe/status', { studying }), [send])

  return { seats, connected, error, take, setStudying }
}
```

- [ ] **Step 3: 장면에서 고정 인물·남는 가구 제거**

`src/components/CafeInterior.tsx`에서:
- `Me` 컴포넌트 정의와 `<Me v={[0.6, 1.6, 1.25]} k={k} />` 삭제
- 창가 바 스툴: `{[-2.6, -1.0, 2.2, 3.8].map(...)}`와 `<Stool x={0.6} y={1.6} k={k} />`를 지운다(좌석 스툴은 Step 5에서 그린다)
- "주문하는 손님" 주석 아래 `<Stool x={-8.3} y={4.8} k={k} />`와 `<Person v={[-5.7, 4.9, 0]} ... />` 삭제
- 노트북 화면 불빛 `{studying && (<ellipse ... fill="url(#room-screen)" />)}` 삭제 (노트북 본체 Box는 장식으로 유지). `#room-screen` 그라디언트가 더 쓰이지 않으면 `<defs>`에서도 삭제
- `Props`의 `studying`과 그 주석 삭제, `Chair` 주석의 "(다음 작업에서 손님이 앉는다)"를 지운다
- 가운데 둥근 테이블은 뒤쪽 두 개만 남긴다: 앞쪽 `[-1.4, 8.4]`, `[-5.6, 9.2]`, `[3.2, 9.0]`과 그 위 컵 `<Box at={[-1.2, 8.2, 1.5]} ... />` 삭제. 러그는 유지

- [ ] **Step 4: 좌석 표와 앉은 캐릭터 컴포넌트 추가**

`Person` 정의 아래에 추가한다. `Seated`는 지운 `Me`의 그림을 옷·머리색과 방향을 받도록 넓힌 것이다.

```tsx
// 좌석 ID(0~9)와 장면 위치. 백엔드는 ID만 안다. stool은 창을 보고(등이 보임), chair는 카메라를 본다
type SeatPlace = { id: number; kind: 'stool' | 'chair'; x: number; y: number }
const STOOLS: SeatPlace[] = [-2.6, -1.0, 0.6, 2.2].map((x, id) => ({ id, kind: 'stool', x, y: 1.6 }))
const BOOTHS: { y: number; seat: SeatPlace }[] = [
  { y: 2.6, seat: { id: 4, kind: 'chair', x: 4.8, y: 4.2 } },
  { y: 7.0, seat: { id: 5, kind: 'chair', x: 4.8, y: 8.6 } },
]
const TABLES: { x: number; y: number; seats: [SeatPlace, SeatPlace] }[] = [
  { x: -3.4, y: 4.6, seats: [{ id: 6, kind: 'chair', x: -4.5, y: 4.8 }, { id: 7, kind: 'chair', x: -2.3, y: 4.8 }] },
  { x: 1.6, y: 4.4, seats: [{ id: 8, kind: 'chair', x: 0.5, y: 4.6 }, { id: 9, kind: 'chair', x: 2.7, y: 4.6 }] },
]

// 앉아 있는 사람 — back: 창을 보고 앉아 등이 보임, front: 카메라를 보고 앉음
function Seated({ v, facing, shirt, hair, k }: { v: V; facing: 'front' | 'back'; shirt: string; hair: string; k: (hex: string) => string }) {
  const skin = k('#E8C4A8')
  return (
    <At v={v}>
      {/* 몸통·팔 */}
      <path className="tone" d="M-0.42 0 C -0.46 -0.5, -0.36 -0.82, 0 -0.84 C 0.36 -0.82, 0.46 -0.5, 0.42 0 Z" style={{ fill: k(shirt) }} />
      <ellipse className="tone" cx="-0.42" cy="-0.42" rx="0.13" ry="0.3" style={{ fill: shade(k(shirt), 0.9) }} transform="rotate(18 -0.42 -0.42)" />
      <ellipse className="tone" cx="0.42" cy="-0.42" rx="0.13" ry="0.3" style={{ fill: shade(k(shirt), 0.9) }} transform="rotate(-18 0.42 -0.42)" />
      {facing === 'back' ? (
        <>
          {/* 큰 머리 (뒤통수) */}
          <circle className="tone" cx="0" cy="-1.28" r="0.52" style={{ fill: k(hair) }} />
          <ellipse className="tone" cx="-0.5" cy="-1.18" rx="0.1" ry="0.14" style={{ fill: skin }} />
          <ellipse className="tone" cx="0.5" cy="-1.18" rx="0.1" ry="0.14" style={{ fill: skin }} />
        </>
      ) : (
        <>
          <circle className="tone" cx="0" cy="-1.28" r="0.5" style={{ fill: skin }} />
          <path className="tone" d="M-0.52 -1.28 C -0.56 -1.83, 0.56 -1.83, 0.52 -1.28 C 0.4 -1.56, -0.4 -1.56, -0.52 -1.28 Z" style={{ fill: k(hair) }} />
          <circle cx="-0.17" cy="-1.24" r="0.05" fill="#2B1E16" />
          <circle cx="0.17" cy="-1.24" r="0.05" fill="#2B1E16" />
          <path d="M-0.1 -1.08 Q 0 -1.02, 0.1 -1.08" stroke="#2B1E16" strokeWidth="0.035" fill="none" strokeLinecap="round" />
        </>
      )}
    </At>
  )
}

// 키보드로도 누를 수 있는 장면 속 버튼. pointerdown을 막아야 장면 드래그(포인터 캡처)가 click을 가로채지 않는다
function sceneButton(label: string, onPress: () => void) {
  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    onPointerDown: (e: { stopPropagation: () => void }) => e.stopPropagation(),
    onClick: onPress,
    onKeyDown: (e: { key: string; preventDefault: () => void }) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onPress()
      }
    },
  } as const
}

type SeatLayer = {
  seats: Seat[]
  myId: number | null
  pickable: boolean
  onPick: (seatId: number) => void
  onInspect: (memberId: number) => void
}

// 좌석 하나: 앉은 사람(+닉네임) 또는 고를 수 있는 빈 의자 표시
function SeatSpot({ place, layer, k }: { place: SeatPlace; layer: SeatLayer; k: (hex: string) => string }) {
  const occupant = layer.seats[place.id]?.occupant ?? null
  const v: V = [place.x, place.y, place.kind === 'stool' ? 1.25 : 0.95]
  if (!occupant) {
    if (!layer.pickable) return null
    return (
      <g className="seat-empty" {...sceneButton(`${place.id + 1}번 자리에 앉기`, () => layer.onPick(place.id))}>
        <polygon points={disc(place.x, place.y, v[2] + 0.03, 0.55)} />
      </g>
    )
  }
  const outfit = outfitOf(occupant.memberId)
  const mine = occupant.memberId === layer.myId
  return (
    <g className="seat-person" {...sceneButton(`${occupant.nickname} 정보 보기`, () => layer.onInspect(occupant.memberId))}>
      <Seated v={v} facing={place.kind === 'stool' ? 'back' : 'front'} shirt={outfit.shirt} hair={outfit.hair} k={k} />
      <At v={v}>
        <text y="-2.05" textAnchor="middle" fontSize="0.42" className={mine ? 'name-tag name-tag-mine' : 'name-tag'}>
          {occupant.nickname}
        </text>
      </At>
    </g>
  )
}
```

파일 맨 위 import에 추가: `import { outfitOf, type Seat } from '../lib/seats.ts'`

- [ ] **Step 5: 좌석을 그리는 순서대로 배치**

앞의 가구가 뒤의 사람을 가리도록, 각 좌석은 자기 가구 바로 뒤에 그린다.

`Props`를 다음으로 바꾸고 컴포넌트 시그니처를 맞춘다:

```tsx
type Props = {
  period: Period
  // 세션 진행·일시정지 중 — 움직임을 잔잔하게
  calm?: boolean
  // 좌석표 (없으면 좌석을 그리지 않는다: 로딩 중·연결 전)
  seats?: Seat[] | null
  myId?: number | null
  // 빈 의자를 눌러 앉을 수 있는지 (연결되어 있을 때만)
  pickable?: boolean
  onPick?: (seatId: number) => void
  onInspect?: (memberId: number) => void
}

export default function CafeInterior({ period, calm = false, seats = null, myId = null, pickable = false, onPick = () => {}, onInspect = () => {} }: Props) {
  // ...기존 코드
  const layer: SeatLayer | null = seats ? { seats, myId, pickable, onPick, onInspect } : null
```

창가 바 테이블 블록에서, 지운 스툴 자리에:

```tsx
        {STOOLS.map((place) => (
          <g key={place.id}>
            <Stool x={place.x} y={place.y} k={k} />
            {layer && <SeatSpot place={place} layer={layer} k={k} />}
          </g>
        ))}
```

부스 블록의 `{[2.6, 7.0].map((y) => (` 를 `{BOOTHS.map(({ y, seat }) => (`로 바꾸고, `<Chair x={4.8} y={y + 1.6} k={k} />` 바로 아래에 `{layer && <SeatSpot place={seat} layer={layer} k={k} />}`를 추가한다.

둥근 테이블 블록(Step 3에서 두 개만 남긴 배열)을 다음으로 바꾼다:

```tsx
        {TABLES.map(({ x, y, seats: pair }) => (
          <g key={`${x},${y}`}>
            <Pendant x={x} y={y} lamp={p.lamp} glow={[x, y, 1.5]} />
            {pair.map((place) => (
              <Chair key={place.id} x={place.x} y={place.y} k={k} />
            ))}
            <RoundTable x={x} y={y} k={k} />
            {layer && pair.map((place) => <SeatSpot key={place.id} place={place} layer={layer} k={k} />)}
          </g>
        ))}
```

`<svg>`의 `aria-hidden="true"`를 지우고 `role="group" aria-label="카페 좌석"`으로 바꾼다 (좌석 버튼이 보조기기에 보여야 한다).

- [ ] **Step 6: 스타일 추가**

`src/index.css`의 `.scene .screen-blink` 줄 아래에 추가:

```css
/* 좌석 — 빈 의자 강조와 닉네임 (장면 색이라 다크 모드와 무관) */
.scene .seat-empty { cursor: pointer; outline: none; }
.scene .seat-empty polygon { fill: #F2A65A; opacity: 0.35; transition: opacity 150ms ease-out; }
.scene .seat-empty:hover polygon, .scene .seat-empty:focus-visible polygon { opacity: 0.75; }
.scene .seat-person { cursor: pointer; outline: none; }
.scene .seat-person:focus-visible .name-tag { text-decoration: underline; }
.scene .name-tag { fill: #FFF8EE; stroke: rgba(43, 30, 22, 0.75); stroke-width: 0.12; paint-order: stroke; font-weight: 600; }
.scene .name-tag-mine { fill: #F2A65A; }
```

- [ ] **Step 7: Home에서 훅을 장면에 연결**

`src/pages/Home.tsx`의 `Cafe` 컴포넌트:

```tsx
import { useCafeSeats } from '../hooks/useCafeSeats.ts'
// ...
  const seats = useCafeSeats()
// ...
      <CafeInterior
        period={period}
        calm={active}
        seats={seats.seats}
        myId={member.memberId}
        pickable={seats.connected}
        onPick={seats.take}
        onInspect={() => {}}
      />
```

(`onInspect`는 Task 3에서 카드와 연결한다. 기존 `studying={...}` prop은 지운다.)

- [ ] **Step 8: 타입·린트 확인**

Run: `npx tsc -b && npx oxlint && node src/lib/seats.check.ts && node src/lib/session.check.ts`
Expected: 오류 없음

- [ ] **Step 9: 브라우저 확인 (백엔드 필요)**

1. `backend`에서 DB와 서버 실행: `docker compose -p study-cafe up -d` 후 `./gradlew bootRun` (8080)
2. `frontend`에서 `npm run dev` (5173)
3. Playwright로 가입·로그인 → `/home` 스크린샷: 빈 의자 10개에 앰버 원판이 보이고, 앞쪽 테이블 3개·주문 손님·고정 캐릭터가 없다
4. 빈 의자 하나를 클릭 → 그 자리에 캐릭터와 앰버 닉네임이 나타난다 (클릭이 장면 드래그에 먹히지 않는지 확인)
5. 다른 빈 의자를 클릭 → 캐릭터가 옮겨 간다
6. Tab으로 빈 의자에 포커스 후 Enter → 앉는다
7. 스크린샷을 보고 의자·캐릭터 위치가 어색하면 `STOOLS`/`BOOTHS`/`TABLES` 좌표만 조정한다

- [ ] **Step 10: 커밋**

```bash
git add package.json package-lock.json src/hooks/useCafeSeats.ts src/components/CafeInterior.tsx src/index.css src/pages/Home.tsx
git commit -m "feat: 카페 장면을 10석으로 바꾸고 STOMP로 자리에 앉기"
```

---

### Task 3: 안내 배너, 정보 카드, 주문 잠금, 공부 상태 동기화

**Files:**
- Create: `src/components/SeatGuide.tsx`
- Create: `src/components/SeatCard.tsx`
- Modify: `src/components/SessionPanel.tsx`
- Modify: `src/pages/Home.tsx`

**Interfaces:**
- Consumes: `useCafeSeats()` (Task 2), `seatGuide`, `sittingLabel`, `SeatGuideState`, `Occupant` (Task 1)
- Produces:
  - `<SeatGuide state={SeatGuideState} error={{ code; at } | null} />`
  - `<SeatCard occupant={Occupant} mine={boolean} onClose={() => void} />`
  - `SessionPanel` prop `locked: boolean`

- [ ] **Step 1: 안내 배너**

```tsx
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import type { SeatErrorCode, SeatGuideState } from '../lib/seats.ts'

const TEXT: Record<Exclude<SeatGuideState, 'seated'>, string> = {
  connecting: '카페에 연결하는 중…',
  pick: '앉을 자리를 골라주세요',
  full: '지금은 만석이에요. 자리가 나면 바로 앉을 수 있어요',
}
// 자리를 빼앗겼다는 안내를 보여주는 시간
const ERROR_MS = 3000

type Props = { state: SeatGuideState; error: { code: SeatErrorCode; at: number } | null }

// 장면 위 가운데 안내. 앉아 있으면 숨고, 자리 선택이 실패하면 잠깐 알려준다
export default function SeatGuide({ state, error }: Props) {
  const [shownError, setShownError] = useState<number | null>(null)
  useEffect(() => {
    if (error?.code !== 'SEAT_TAKEN') return
    setShownError(error.at)
    const t = setTimeout(() => setShownError(null), ERROR_MS)
    return () => clearTimeout(t)
  }, [error])

  const text = shownError !== null ? '방금 다른 분이 앉았어요' : state === 'seated' ? null : TEXT[state]
  return (
    <div aria-live="polite" className="pointer-events-none fixed top-[max(5.25rem,calc(env(safe-area-inset-top)+4.5rem))] left-1/2 z-10 -translate-x-1/2 sm:top-24">
      <AnimatePresence mode="wait">
        {text && (
          <motion.p
            key={text}
            className="panel rounded-full px-4 py-2 text-sm whitespace-nowrap text-ink"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: 정보 카드**

```tsx
import { useEffect, useState } from 'react'
import { type Occupant, sittingLabel } from '../lib/seats.ts'

type Props = { occupant: Occupant; mine: boolean; onClose: () => void }

// 캐릭터를 누르면 뜨는 카드 — 닉네임, 공부 상태, 앉은 지 얼마나
export default function SeatCard({ occupant, mine, onClose }: Props) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      clearInterval(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <section
      aria-label={`${occupant.nickname} 정보`}
      className="panel fixed top-[max(5.25rem,calc(env(safe-area-inset-top)+4.5rem))] left-1/2 z-20 w-[min(320px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg px-5 py-4 sm:top-24"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-serif text-xl text-ink">
          {occupant.nickname}
          {mine && <span className="ml-2 align-middle text-xs font-sans text-amber">나</span>}
        </h2>
        <button type="button" onClick={onClose} aria-label="닫기" className="-mt-1 -mr-2 rounded-md p-2 text-muted transition-colors hover:text-ink">
          ✕
        </button>
      </div>
      <p className="mt-2 inline-flex items-center gap-2 text-sm text-ink">
        <span className={`size-[7px] rounded-full ${occupant.studying ? 'bg-sage' : 'bg-muted'}`} />
        {occupant.studying ? '공부 중' : '쉬는 중'}
      </p>
      <p className="mt-1 text-sm text-muted">{sittingLabel(occupant.sittingSince, now)}</p>
      {/* 다음 작업: 손님과 1:1 대화 버튼 자리 */}
    </section>
  )
}
```

- [ ] **Step 3: 주문 잠금**

`src/components/SessionPanel.tsx`:
- `Props`에 `// 자리에 앉기 전에는 공부를 시작할 수 없다` 주석과 `locked: boolean` 추가, 시그니처 `({ session, onFinished, locked }: Props)`
- idle 주문 버튼을 다음으로 바꾼다:

```tsx
                    <button
                      type="button"
                      disabled={locked || goal === 0}
                      onClick={() => session.start(goal)}
                      className="btn btn-primary w-full"
                    >
                      {locked ? '먼저 자리를 골라주세요' : goal === 0 ? '메뉴를 골라주세요' : `주문하기 · ${formatMinutes(goal)}`}
                    </button>
```

- [ ] **Step 4: Home 조립과 공부 상태 동기화**

`src/pages/Home.tsx`의 `Cafe`:

```tsx
import SeatCard from '../components/SeatCard.tsx'
import SeatGuide from '../components/SeatGuide.tsx'
import { seatGuide } from '../lib/seats.ts'
// ...
  const seats = useCafeSeats()
  const guide = seatGuide(seats.seats, seats.connected, member.memberId)
  const [inspected, setInspected] = useState<number | null>(null)
  // 상대가 자리를 떠나면 카드도 닫힌다 (좌석표에서 다시 찾는다)
  const inspectedOccupant = seats.seats?.find((s) => s.occupant?.memberId === inspected)?.occupant ?? null
  const closeCard = useCallback(() => setInspected(null), [])

  // 타이머가 진행 중일 때만 "공부 중". 앉는 순간(재연결 포함)에도 현재 상태를 보낸다
  const running = session.state.status === 'running'
  const seated = guide === 'seated'
  const { setStudying } = seats
  useEffect(() => {
    if (seated) setStudying(running)
  }, [seated, running, setStudying])
```

렌더 부분:

```tsx
      <CafeInterior
        period={period}
        calm={active}
        seats={seats.seats}
        myId={member.memberId}
        pickable={seats.connected}
        onPick={seats.take}
        onInspect={setInspected}
      />
      <Header ... />
      <SeatGuide state={guide} error={seats.error} />
      {inspectedOccupant && <SeatCard occupant={inspectedOccupant} mine={inspectedOccupant.memberId === member.memberId} onClose={closeCard} />}
```

`SessionPanel`에 `locked={!seated}`를 넘긴다. `useState`, `useCallback`, `useEffect` import를 맞춘다.

- [ ] **Step 5: 타입·린트 확인**

Run: `npx tsc -b && npx oxlint && node src/lib/seats.check.ts && node src/lib/session.check.ts`
Expected: 오류 없음

- [ ] **Step 6: 브라우저 확인 (백엔드 실행 중)**

1. 로그인 직후: "앉을 자리를 골라주세요" 배너, 주문 버튼 "먼저 자리를 골라주세요"(비활성)
2. 앉으면 배너가 사라지고 주문 버튼이 메뉴 선택 상태로 돌아온다
3. 내 캐릭터 클릭 → 카드에 닉네임 + "나", "쉬는 중", "방금 앉았어요". Esc와 ✕로 닫힌다
4. 메뉴를 담고 주문(타이머 running) → 카드를 다시 열면 "공부 중", 일시정지하면 "쉬는 중"
5. 백엔드를 끄면 "카페에 연결하는 중…"이 뜨고 빈 의자 강조가 사라진다. 다시 켜면 자동 재연결되어 원래 자리에 앉아 있다(30초 안이면)

- [ ] **Step 7: 커밋**

```bash
git add src/components/SeatGuide.tsx src/components/SeatCard.tsx src/components/SessionPanel.tsx src/pages/Home.tsx
git commit -m "feat: 좌석 안내 배너·정보 카드·주문 잠금·공부 상태 동기화"
```

---

### Task 4: 두 사용자 실시간 확인 + 워크로그

**Files:**
- Modify: `docs/WORKLOG.md`

- [ ] **Step 1: Playwright로 두 계정 동시 확인**

브라우저 컨텍스트 2개(A, B)에 서로 다른 계정으로 로그인한 뒤 확인한다.

1. A가 3번 자리에 앉음 → B 화면에 A 닉네임 캐릭터가 나타난다(흰 글자), A 화면에는 앰버 글자
2. B가 A의 캐릭터를 클릭 → 카드에 A 닉네임, "나" 표시 없음
3. B가 A와 같은 자리를 키보드로 고르려 해도 빈 의자 버튼이 없다. 경합 확인은 B가 빈자리를 고르는 순간 A가 먼저 같은 자리를 차지하도록 콘솔에서 `publish`로 동시에 보내 "방금 다른 분이 앉았어요"가 B에게만 뜨는지 본다
4. A를 새로고침 → 같은 자리에 그대로
5. A 컨텍스트를 닫음 → 30초가 지나면 B 화면에서 그 자리가 빈 의자로 바뀐다(B가 정보 카드를 열어 두었다면 카드도 닫힌다)
6. 각 단계 스크린샷을 보고 확인한다

- [ ] **Step 2: 워크로그 갱신**

`docs/WORKLOG.md` "다음 할 일"의 카페 좌석 항목을 `[x]`로 바꾸고, "작업 일지"에 날짜(2026-10-04)와 한 줄 요약(10석 장면, STOMP 실시간 좌석, 닉네임·정보 카드, 구경 모드, 주문 잠금)을 추가한다.

- [ ] **Step 3: 커밋**

```bash
git add docs/WORKLOG.md
git commit -m "docs: 워크로그에 카페 좌석 프론트 완료 기록"
```
