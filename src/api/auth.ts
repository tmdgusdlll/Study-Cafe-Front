// 회원 API — 백엔드 /api/v1/members/*
import { readTokens, request, saveTokens, type Tokens } from './client.ts'

export type SignUpRequest = { email: string; password: string; nickname: string }
export type LoginRequest = { email: string; password: string }
export type MemberInfo = { memberId: number; email: string; nickname: string }

export function getAccessToken(): string | null {
  return readTokens()?.accessToken ?? null
}

// 액세스 토큰(JWT)의 subject에 회원 번호가 들어 있다. 서명 검증은 서버 몫이고, 여기서는 읽기만 한다
export function currentMemberId(): number | null {
  try {
    const payload = getAccessToken()?.split('.')[1]
    if (!payload) return null
    const { sub } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { sub?: string }
    const id = Number(sub)
    return Number.isInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

export const signup = (body: SignUpRequest) => request<null>('POST', '/api/v1/members/signup', body)

export async function login(body: LoginRequest): Promise<void> {
  saveTokens(await request<Tokens>('POST', '/api/v1/members/login', body))
}

// ponytail: 액세스 토큰(24시간)이 만료되면 재발급 없이 로그아웃된다. 리프레시(/members/refresh)는 필요해지면 추가
export const getMe = () => request<MemberInfo>('GET', '/api/v1/members/me')

// 로그아웃 실패(토큰 만료 등)와 관계없이 로컬 토큰은 지운다
export async function logout(): Promise<void> {
  try {
    await request<null>('POST', '/api/v1/members/logout')
  } catch {
    // 서버 로그아웃 실패는 무시
  } finally {
    saveTokens(null)
  }
}
