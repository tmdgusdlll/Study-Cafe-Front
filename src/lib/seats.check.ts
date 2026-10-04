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
