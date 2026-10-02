// 목 API 공통 — 백엔드 ApiResponse와 같은 모양으로 응답하고 localStorage에 저장한다.
// 백엔드 연동 시 각 API 파일의 mock 함수만 fetch 호출로 교체한다.

export type ApiResponse<T> = {
  success: boolean
  code: string
  data: T
  message: string | null
}

export class ApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

// 백엔드 ErrorCode와 같은 이름·문구
const MESSAGES: Record<string, string> = {
  UNAUTHORIZED: '인증이 필요합니다',
  INVALID_INPUT: '입력값이 올바르지 않습니다',
  MEMBER_NOT_FOUND: '회원을 찾을 수 없습니다',
  EMAIL_ALREADY_EXISTS: '이미 사용 중인 이메일입니다',
  INVALID_PASSWORD: '비밀번호가 일치하지 않습니다',
}

// 실제 네트워크처럼 약간 지연
const delay = () => new Promise((r) => setTimeout(r, 250 + Math.random() * 250))

export async function ok<T>(data: T): Promise<ApiResponse<T>> {
  await delay()
  return { success: true, code: 'SUCCESS', data, message: null }
}

export async function fail(code: string, message?: string): Promise<ApiResponse<never>> {
  await delay()
  return { success: false, code, data: undefined as never, message: message ?? MESSAGES[code] ?? code }
}

// 응답 envelope을 풀어 data만 돌려주고, 실패면 ApiError를 던진다
export async function unwrap<T>(res: Promise<ApiResponse<T>>): Promise<T> {
  const body = await res
  if (!body.success) throw new ApiError(body.code, body.message ?? body.code)
  return body.data
}

export function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  return raw === null ? fallback : (JSON.parse(raw) as T)
}

export function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}
