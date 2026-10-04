import { useMutation } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../api/auth.ts'
import { ApiError } from '../api/client.ts'
import Field from '../components/Field.tsx'
import NicknameModal from '../components/NicknameModal.tsx'
import SceneLayout from '../components/SceneLayout.tsx'
import { validateEmail, validatePassword } from '../lib/validation.ts'

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({})
  const [askNickname, setAskNickname] = useState(false)

  // 백엔드는 이메일·비밀번호·닉네임을 한 요청으로 받으므로 닉네임 확정 시점에 가입한다
  const mutation = useMutation({
    mutationFn: signup,
    onSuccess: () => navigate('/login', { replace: true, state: { email, signedUp: true } }),
    onError: (e) => {
      if (e instanceof ApiError && e.code === 'EMAIL_ALREADY_EXISTS') {
        setAskNickname(false)
        setErrors({ email: e.message })
      }
    },
  })

  const next = (e: FormEvent) => {
    e.preventDefault()
    const found = { email: validateEmail(email), password: validatePassword(password) }
    setErrors(found)
    if (!found.email && !found.password) {
      mutation.reset()
      setAskNickname(true)
    }
  }

  return (
    <SceneLayout>
      <form onSubmit={next} className="panel w-full max-w-[380px] rounded-lg p-7" noValidate>
        <h1 className="font-serif text-[32px]">자리 하나 맡아둘게요</h1>
        <p className="mt-1.5 mb-6 text-sm text-muted">이메일과 비밀번호를 정하면 닉네임만 남아요.</p>
        <div className="flex flex-col gap-4">
          <Field
            id="email"
            label="이메일"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Field
            id="password"
            label="비밀번호"
            type="password"
            autoComplete="new-password"
            placeholder="8~20자"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
        </div>
        <button type="submit" className="btn btn-primary mt-6 w-full">
          다음
        </button>
        <p className="mt-5 text-center text-sm text-muted">
          이미 계정이 있나요?{' '}
          <Link to="/login" className="font-semibold text-ink underline-offset-4 hover:underline">
            로그인
          </Link>
        </p>
      </form>

      {askNickname && (
        <NicknameModal
          pending={mutation.isPending}
          error={mutation.error?.message ?? null}
          onSubmit={(nickname) => mutation.mutate({ email, password, nickname })}
        />
      )}
    </SceneLayout>
  )
}
