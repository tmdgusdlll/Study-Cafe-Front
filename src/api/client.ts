// 백엔드 API 공통 — 응답 envelope(ApiResponse)을 풀고, 실패면 ApiError를 던진다

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

const BASE_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'sc.auth'

export type Tokens = { accessToken: string; refreshToken: string }

export function readTokens(): Tokens | null {
  const raw = localStorage.getItem(TOKEN_KEY)
  return raw === null ? null : (JSON.parse(raw) as Tokens)
}

export function saveTokens(tokens: Tokens | null) {
  if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
  else localStorage.removeItem(TOKEN_KEY)
}

// 응답 envelope을 풀어 data만 돌려주고, 실패면 ApiError를 던진다
export async function unwrap<T>(res: Promise<ApiResponse<T>>): Promise<T> {
  const body = await res
  if (!body.success) throw new ApiError(body.code, body.message ?? body.code)
  return body.data
}

export async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const token = readTokens()?.accessToken
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('NETWORK_ERROR', '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요')
  }
  // 서버가 envelope 없이 실패한 경우(프록시 오류 등)도 같은 모양의 오류로 바꾼다
  const parsed = (await res.json().catch(() => null)) as ApiResponse<T> | null
  if (!parsed) throw new ApiError('INTERNAL_SERVER_ERROR', '서버 오류가 발생했습니다')
  return unwrap(Promise.resolve(parsed))
}
