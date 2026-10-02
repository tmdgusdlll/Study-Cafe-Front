import { useMutation } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api/auth.ts'
import { ApiError } from '../api/mock.ts'
import Field from '../components/Field.tsx'
import SceneLayout from '../components/SceneLayout.tsx'

type LocationState = { email?: string; signedUp?: boolean } | null

export default function Login() {
  const navigate = useNavigate()
  const from = useLocation().state as LocationState
  const [email, setEmail] = useState(from?.email ?? '')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => navigate('/home', { replace: true }),
  })

  // 서버 오류 코드에 맞는 칸 아래에 문구 표시
  const code = mutation.error instanceof ApiError ? mutation.error.code : null
  const message = mutation.error?.message ?? null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate({ email, password })
  }

  return (
    <SceneLayout>
      <form onSubmit={submit} className="panel w-full max-w-[380px] rounded-lg p-7" noValidate>
        <h1 className="font-serif text-[32px]">다시 오셨네요</h1>
        <p className="mt-1.5 mb-6 text-sm text-muted">
          {from?.signedUp ? '가입이 완료됐어요. 로그인해 주세요.' : '늘 앉던 자리 그대로 비워뒀어요.'}
        </p>
        <div className="flex flex-col gap-4">
          <Field
            id="email"
            label="이메일"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={code === 'MEMBER_NOT_FOUND' ? message : null}
          />
          <Field
            id="password"
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={code === 'INVALID_PASSWORD' ? message : null}
          />
        </div>
        {message && code !== 'MEMBER_NOT_FOUND' && code !== 'INVALID_PASSWORD' && (
          <p role="alert" className="mt-4 text-[13px] text-danger">
            {message}
          </p>
        )}
        <button type="submit" disabled={mutation.isPending} className="btn btn-primary mt-6 w-full">
          {mutation.isPending ? '들어가는 중…' : '로그인'}
        </button>
        <p className="mt-5 text-center text-sm text-muted">
          처음이신가요?{' '}
          <Link to="/signup" className="font-semibold text-ink underline-offset-4 hover:underline">
            회원가입
          </Link>
        </p>
      </form>
    </SceneLayout>
  )
}
