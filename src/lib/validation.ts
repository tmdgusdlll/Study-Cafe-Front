// 백엔드 SignUpRequest·LoginRequest 검증 규칙과 같은 규칙 (문구도 동일)
// 위반 시 첫 번째 오류 문구, 통과 시 null

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | null {
  if (!email.trim()) return '이메일을 입력해주세요'
  if (!EMAIL.test(email)) return '이메일 형식이 올바르지 않습니다'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password.trim()) return '비밀번호를 입력해주세요'
  if (password.length < 8 || password.length > 20) return '비밀번호는 8~20자여야 합니다'
  return null
}

export function validateNickname(nickname: string): string | null {
  if (!nickname.trim()) return '닉네임을 입력해주세요'
  if (nickname.length < 2 || nickname.length > 10) return '닉네임은 2~10자여야 합니다'
  return null
}

export function validateSignup(body: { email: string; password: string; nickname: string }): string | null {
  return validateEmail(body.email) ?? validatePassword(body.password) ?? validateNickname(body.nickname)
}

export function validateLogin(body: { email: string; password: string }): string | null {
  if (!body.email.trim()) return '이메일을 입력해주세요'
  if (!body.password.trim()) return '비밀번호를 입력해주세요'
  return null
}
