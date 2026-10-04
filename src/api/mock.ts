// 목 API 공통 — 백엔드 ApiResponse와 같은 모양으로 응답하고 localStorage에 저장한다.
// 백엔드 연동 시 각 API 파일의 mock 함수만 fetch 호출로 교체한다.
import type { ApiResponse } from './client.ts'

// 백엔드 ErrorCode와 같은 이름·문구
const MESSAGES: Record<string, string> = {
  UNAUTHORIZED: '인증이 필요합니다',
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

export function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  return raw === null ? fallback : (JSON.parse(raw) as T)
}

export function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}
