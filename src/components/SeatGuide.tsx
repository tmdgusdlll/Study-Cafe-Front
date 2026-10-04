import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import type { SeatErrorCode, SeatGuideState } from '../lib/seats.ts'

const TEXT: Record<Exclude<SeatGuideState, 'seated'>, string> = {
  connecting: '카페에 연결하는 중…',
  pick: '앉을 자리를 골라주세요',
  full: '지금은 만석이에요. 자리가 나면 바로 앉을 수 있어요',
}
// 자리를 빼앗겼다는 안내를 보여주는 시간
const ERROR_MS = 3000

type Props = { state: SeatGuideState; error: { code: SeatErrorCode; at: number } | null }

// 장면 위 가운데 안내. 앉아 있으면 숨고, 자리 선택이 실패하면 잠깐 알려준다
export default function SeatGuide({ state, error }: Props) {
  // 안내 시간이 지난 오류의 시각. 새 오류(at이 다름)가 오면 다시 보인다
  const [expiredAt, setExpiredAt] = useState<number | null>(null)
  useEffect(() => {
    if (error?.code !== 'SEAT_TAKEN') return
    const t = setTimeout(() => setExpiredAt(error.at), ERROR_MS)
    return () => clearTimeout(t)
  }, [error])

  const showError = error?.code === 'SEAT_TAKEN' && expiredAt !== error.at
  const text = showError ? '방금 다른 분이 앉았어요' : state === 'seated' ? null : TEXT[state]
  return (
    <div aria-live="polite" className="pointer-events-none fixed top-[max(5.25rem,calc(env(safe-area-inset-top)+4.5rem))] left-1/2 z-10 -translate-x-1/2 sm:top-24">
      <AnimatePresence mode="wait">
        {text && (
          <motion.p
            key={text}
            className="panel rounded-full px-4 py-2 text-sm whitespace-nowrap text-ink"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
