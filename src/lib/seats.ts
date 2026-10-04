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

// 카드로 보고 있는 손님의 한 번의 방문. 같은 회원이라도 떠났다가 다시 앉으면 앉은 시각이 달라 다른 방문이다
export type Visit = { memberId: number; sittingSince: string }

// 자리를 옮겨도 찾고(앉은 시각 유지), 떠났거나 다시 앉았으면 null
export function findVisit(seats: Seat[] | null, visit: Visit | null): Occupant | null {
  if (!seats || !visit) return null
  return seats.find((s) => s.occupant?.memberId === visit.memberId && s.occupant.sittingSince === visit.sittingSince)?.occupant ?? null
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
