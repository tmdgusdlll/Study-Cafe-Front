import { useEffect, useState } from 'react'
import { type Occupant, sittingLabel } from '../lib/seats.ts'

type Props = { occupant: Occupant; mine: boolean; onClose: () => void }

// 캐릭터를 누르면 뜨는 카드 — 닉네임, 공부 상태, 앉은 지 얼마나
export default function SeatCard({ occupant, mine, onClose }: Props) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      clearInterval(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <section
      aria-label={`${occupant.nickname} 정보`}
      className="panel fixed top-[max(5.25rem,calc(env(safe-area-inset-top)+4.5rem))] left-1/2 z-20 w-[min(320px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg px-5 py-4 sm:top-24"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-serif text-xl text-ink">
          {occupant.nickname}
          {mine && <span className="ml-2 align-middle text-xs font-sans text-amber">나</span>}
        </h2>
        <button type="button" onClick={onClose} aria-label="닫기" className="-mt-1 -mr-2 rounded-md p-2 text-muted transition-colors hover:text-ink">
          ✕
        </button>
      </div>
      <p className="mt-2 inline-flex items-center gap-2 text-sm text-ink">
        <span className={`size-[7px] rounded-full ${occupant.studying ? 'bg-sage' : 'bg-muted'}`} />
        {occupant.studying ? '공부 중' : '쉬는 중'}
      </p>
      <p className="mt-1 text-sm text-muted">{sittingLabel(occupant.sittingSince, now)}</p>
      {/* 다음 작업: 손님과 1:1 대화 버튼 자리 */}
    </section>
  )
}
