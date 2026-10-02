import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
  error?: string | null
}

// 라벨 + 입력 + 오류 문구
export default function Field({ id, label, error, ...input }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] text-muted">
        {label}
      </label>
      <input
        id={id}
        className="field"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...input}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
