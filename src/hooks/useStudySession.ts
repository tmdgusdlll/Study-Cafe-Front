import { useEffect, useState } from 'react'
import { read, write } from '../api/mock.ts'
import * as S from '../lib/session.ts'

// 새로고침이면 sessionStorage가 남아 있고, 탭을 닫았다 새로 열면 비어 있다.
// 페이지 로드당 한 번만 판단해야 하므로 모듈 최상단에서 계산하고,
// 같은 페이지에서 홈을 다시 열 때(상점 → 홈)는 이어서 진행한다
const TAB_KEY = 'sc.tab-alive'
let reopenedTab = sessionStorage.getItem(TAB_KEY) === null
sessionStorage.setItem(TAB_KEY, '1')

const sessionKey = (memberId: number) => `sc.session.${memberId}`
// 진행 중 세션이 마지막으로 화면에 살아 있던 시각
const seenKey = (memberId: number) => `sc.session-seen.${memberId}`

const isActive = (s: S.SessionState): s is S.ActiveSession =>
  s.status === 'running' || s.status === 'paused' || s.status === 'reached'

export function useStudySession(memberId: number) {
  // 초기화 함수는 StrictMode에서 두 번 불리므로 읽기만 하고, 소비는 마운트 후에 한다
  const [state, setState] = useState<S.SessionState>(() =>
    S.restore(read(sessionKey(memberId), S.IDLE), !reopenedTab, read(seenKey(memberId), 0)),
  )
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    reopenedTab = false
  }, [])

  useEffect(() => write(sessionKey(memberId), state), [memberId, state])

  // 진행 중에만: 화면 갱신, 목표 도달 확인, 마지막 활성 시각 기록
  const running = state.status === 'running'
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      write(seenKey(memberId), t)
      setState((s) => (s.status === 'running' ? S.tick(s, t) : s))
    }, 250)
    return () => clearInterval(id)
  }, [memberId, running])

  const update = (fn: (s: S.ActiveSession, t: number) => S.SessionState) =>
    setState((s) => (isActive(s) ? fn(s, Date.now()) : s))

  return {
    state,
    remainingMs: isActive(state) ? S.remainingOf(state, now) : 0,
    start: (goalMinutes: number) => {
      const t = Date.now()
      setNow(t)
      setState(S.start(goalMinutes, t))
    },
    pause: () => update(S.pause),
    resume: () => update(S.resume),
    // 완료하기·중도 종료. 적립할 결과를 돌려준다
    finish: (): S.SessionResult | null => {
      if (!isActive(state)) return null
      const result = S.finish(state, Date.now())
      setState(result)
      return result
    },
    // 지금 종료하면 받을 포인트 (확인 창 표시용)
    previewPoints: () => (isActive(state) ? S.pointsFor(S.elapsedOf(state, Date.now())) : 0),
    dismissResult: () => setState(S.IDLE),
  }
}
