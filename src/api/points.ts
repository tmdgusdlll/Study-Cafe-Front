// 포인트 API (목) — 백엔드 GET /api/v1/points/balance 응답 { memberId, balance }
import { currentMemberId } from './auth.ts'
import { type ApiResponse, fail, ok, read, unwrap, write } from './mock.ts'

export type PointBalance = { memberId: number; balance: number }

const START_BALANCE = 1240
const key = (memberId: number) => `sc.points.${memberId}`

async function mockGetBalance(): Promise<ApiResponse<PointBalance>> {
  const memberId = currentMemberId()
  if (!memberId) return fail('UNAUTHORIZED')
  return ok({ memberId, balance: read(key(memberId), START_BALANCE) })
}

// ponytail: 클라이언트가 적립액을 정하는 건 목 단계 한정. 연동 시 서버가 세션 종료 API에서 계산해야 한다
async function mockEarn(amount: number): Promise<ApiResponse<PointBalance>> {
  const memberId = currentMemberId()
  if (!memberId) return fail('UNAUTHORIZED')
  const balance = read(key(memberId), START_BALANCE) + amount
  write(key(memberId), balance)
  return ok({ memberId, balance })
}

export const getBalance = () => unwrap(mockGetBalance())
export const earn = (amount: number) => unwrap(mockEarn(amount))
