import { motion } from 'motion/react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { validateNickname } from '../lib/validation.ts'

type Props = {
  pending: boolean
  // 서버 오류 문구 (닉네임 검증 실패 등)
  error: string | null
  onSubmit: (nickname: string) => void
}

// 회원가입 마지막 단계. 닉네임을 정하기 전에는 닫을 수 없다
export default function NicknameModal({ pending, error, onSubmit }: Props) {
  const [nickname, setNickname] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const invalid = validateNickname(nickname)
    setLocalError(invalid)
    if (!invalid) onSubmit(nickname)
  }

  const message = localError ?? error

  return (
    <dialog
      ref={dialog}
      // Esc로 닫히지 않게
      onCancel={(e) => e.preventDefault()}
      aria-labelledby="nickname-title"
      className="m-auto w-[min(92vw,380px)] bg-transparent p-0 backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <motion.form
        onSubmit={submit}
        className="panel rounded-lg p-7 text-ink"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
      >
        <h2 id="nickname-title" className="font-serif text-[28px]">
          뭐라고 불러드릴까요?
        </h2>
        <p className="mt-2 mb-6 text-sm text-muted">카페에서 쓸 닉네임을 정해주세요. 2~10자</p>
        <label htmlFor="nickname" className="mb-1.5 block text-[13px] text-muted">
          닉네임
        </label>
        <input
          id="nickname"
          className="field"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={10}
          autoFocus
          autoComplete="nickname"
          aria-invalid={message !== null}
          aria-describedby={message ? 'nickname-error' : undefined}
        />
        {message && (
          <p id="nickname-error" role="alert" className="mt-1.5 text-[13px] text-danger">
            {message}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary mt-6 w-full">
          {pending ? '가입하는 중…' : '가입 완료'}
        </button>
      </motion.form>
    </dialog>
  )
}
