import { useEffect, useState } from 'react'

export type Period = 'morning' | 'day' | 'evening' | 'night'

// 구간이 시작되는 시각(시). 경계 조정은 여기서만 한다
const STARTS: [Period, number][] = [
  ['morning', 6],
  ['day', 11],
  ['evening', 17],
  ['night', 20],
]

export function periodAt(hour: number): Period {
  let period: Period = 'night'
  for (const [name, start] of STARTS) if (hour >= start) period = name
  return period
}

// 개발 모드에서만 ?time=night 처럼 구간을 강제 지정
function forcedPeriod(): Period | null {
  if (!import.meta.env.DEV) return null
  const t = new URLSearchParams(location.search).get('time')
  return STARTS.some(([name]) => name === t) ? (t as Period) : null
}

// 기기 시각 기준 시간대. 1분마다 확인한다
export function useTimeOfDay(): Period {
  const [period, setPeriod] = useState(() => forcedPeriod() ?? periodAt(new Date().getHours()))

  useEffect(() => {
    if (forcedPeriod()) return
    const id = setInterval(() => setPeriod(periodAt(new Date().getHours())), 60_000)
    return () => clearInterval(id)
  }, [])

  return period
}
