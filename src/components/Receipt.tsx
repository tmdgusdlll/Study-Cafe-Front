import { useCountUp } from '../hooks/useCountUp.ts'
import { formatDuration, type SessionResult } from '../lib/session.ts'

type Props = {
  result: SessionResult
  onClose: () => void
}

const timeNow = () => new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })

// 세션 결과 — 카페 영수증처럼 찍혀 나온다 (테마와 무관하게 종이색 고정)
export default function Receipt({ result, onClose }: Props) {
  const earned = useCountUp(result.earned, 0)

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="receipt w-[300px] max-w-full bg-[#FFFCF6] px-6 pt-7 pb-8 text-[#2B1E16] tabular-nums shadow-[0_24px_50px_-28px_rgba(0,0,0,.5)]">
        <h2 className="text-center font-serif text-2xl">Study-Cafe</h2>
        <p className="mt-1 mb-5 text-center text-xs tracking-[.08em] text-[#7A6656]">
          RECEIPT · {timeNow()} · {result.completed ? '목표 달성' : '중도 종료'}
        </p>
        <dl className="text-sm [&>div]:flex [&>div]:justify-between [&>div]:border-b [&>div]:border-dashed [&>div]:border-[#2B1E1630] [&>div]:py-2">
          <div>
            <dt>목표 시간</dt>
            <dd>{Math.round(result.goalMs / 60_000)}분</dd>
          </div>
          <div>
            <dt>집중한 시간</dt>
            <dd>{formatDuration(result.studiedMs)}</dd>
          </div>
          <div>
            <dt>일시정지</dt>
            <dd>{result.pauseCount}회</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-sm">적립</span>
          <b className="font-serif text-4xl font-normal text-[#C06F1E]">+{earned}P</b>
        </div>
        {result.earned === 0 && <p className="mt-2 text-right text-xs text-[#7A6656]">10분 이상 공부하면 적립돼요</p>}
      </div>
      <button type="button" onClick={onClose} className="btn btn-primary min-w-40">
        확인
      </button>
    </div>
  )
}
