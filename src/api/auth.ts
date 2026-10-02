// 회원 API (목) — 백엔드 /api/v1/members/* 와 같은 요청·응답
import { validateLogin, validateSignup } from '../lib/validation.ts'
import { type ApiResponse, fail, ok, read, unwrap, write } from './mock.ts'

export type SignUpRequest = { email: string; password: string; nickname: string }
export type LoginRequest = { email: string; password: string }
export type LoginResponse = { accessToken: string; refreshToken: string }
export type MemberInfo = { memberId: number; email: string; nickname: string }

// 목 회원 저장소 — 비밀번호 평문 저장은 목 단계 한정
type MockMember = MemberInfo & { password: string }
const MEMBERS_KEY = 'sc.members'
const TOKEN_KEY = 'sc.auth'

export function getAccessToken(): string | null {
  return read<LoginResponse | null>(TOKEN_KEY, null)?.accessToken ?? null
}

// 목 액세스 토큰: 실제 JWT처럼 회원 번호만 담는다 (subject = memberId).
// 서버가 토큰에서 회원을 꺼내는 동작을 흉내 낼 때만 쓴다
export function currentMemberId(): number | null {
  const id = Number(getAccessToken()?.split('.')[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

async function mockSignup(body: SignUpRequest): Promise<ApiResponse<null>> {
  const invalid = validateSignup(body)
  if (invalid) return fail('INVALID_INPUT', invalid)
  const members = read<MockMember[]>(MEMBERS_KEY, [])
  if (members.some((m) => m.email === body.email)) return fail('EMAIL_ALREADY_EXISTS')
  write(MEMBERS_KEY, [...members, { ...body, memberId: members.length + 1 }])
  return ok(null)
}

async function mockLogin(body: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  const invalid = validateLogin(body)
  if (invalid) return fail('INVALID_INPUT', invalid)
  const member = read<MockMember[]>(MEMBERS_KEY, []).find((m) => m.email === body.email)
  if (!member) return fail('MEMBER_NOT_FOUND')
  if (member.password !== body.password) return fail('INVALID_PASSWORD')
  return ok({ accessToken: `mock.${member.memberId}.${crypto.randomUUID()}`, refreshToken: crypto.randomUUID() })
}

async function mockGetMe(): Promise<ApiResponse<MemberInfo>> {
  const id = currentMemberId()
  const member = read<MockMember[]>(MEMBERS_KEY, []).find((m) => m.memberId === id)
  if (!member) return fail('UNAUTHORIZED')
  return ok({ memberId: member.memberId, email: member.email, nickname: member.nickname })
}

export const signup = (body: SignUpRequest) => unwrap(mockSignup(body))

export async function login(body: LoginRequest): Promise<void> {
  write(TOKEN_KEY, await unwrap(mockLogin(body)))
}

export const getMe = () => unwrap(mockGetMe())

// 로그아웃 실패(토큰 만료 등)와 관계없이 로컬 토큰은 지운다
export async function logout(): Promise<void> {
  localStorage.removeItem(TOKEN_KEY)
}
