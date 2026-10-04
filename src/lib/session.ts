// 공부 세션 상태와 포인트 계산 — 순수 함수만 둔다 (시간은 항상 인자로 받음)

// 카페 메뉴처럼 고르는 목표 시간 (실제 결제 아님)
export const MENU = [
  { name: '에스프레소', minutes: 30, label: '30분' },
  { name: '아이스 아메리카노', minutes: 60, label: '1시간' },
  { name: '카페라떼', minutes: 120, label: '2시간' },
  { name: '시그니처 라떼', minutes: 180, label: '3시간' },
] as const

const MINUTE = 60_000
// 포인트를 받을 수 있는 최소 공부 시간 (분)
const MIN_REWARD_MINUTES = 10

export type ActiveSession = {
  status: 'running' | 'paused' | 'reached'
  goalMs: number
  // 직전 일시정지까지 쌓인 공부 시간
  elapsedMs: number
  // 진행 중일 때 마지막으로 재개한 시각, 그 외에는 null
  resumedAt: number | null
  pauseCount: number
}

export type SessionResult = {
  status: 'result'
  goalMs: number
  studiedMs: number
  pauseCount: number
  earned: number
  completed: boolean
}

export type SessionState = { status: 'idle' } | ActiveSession | SessionResult

export const IDLE: SessionState = { status: 'idle' }

// 1분당 1P, 1분 미만 버림, 10분 미만이면 0P
export function pointsFor(studiedMs: number): number {
  const minutes = Math.floor(studiedMs / MINUTE)
  return minutes < MIN_REWARD_MINUTES ? 0 : minutes
}

export function start(goalMinutes: number, now: number): ActiveSession {
  return { status: 'running', goalMs: goalMinutes * MINUTE, elapsedMs: 0, resumedAt: now, pauseCount: 0 }
}

export function elapsedOf(s: ActiveSession, now: number): number {
  const running = s.status === 'running' && s.resumedAt !== null ? now - s.resumedAt : 0
  return Math.min(s.goalMs, s.elapsedMs + running)
}

export function remainingOf(s: ActiveSession, now: number): number {
  return s.goalMs - elapsedOf(s, now)
}

// 목표 시간을 채웠으면 완료 대기 상태로 고정한다
export function tick(s: ActiveSession, now: number): ActiveSession {
  if (s.status !== 'running' || elapsedOf(s, now) < s.goalMs) return s
  return { ...s, status: 'reached', elapsedMs: s.goalMs, resumedAt: null }
}

export function pause(s: ActiveSession, now: number): ActiveSession {
  if (s.status !== 'running') return s
  return { ...s, status: 'paused', elapsedMs: elapsedOf(s, now), resumedAt: null, pauseCount: s.pauseCount + 1 }
}

export function resume(s: ActiveSession, now: number): ActiveSession {
  if (s.status !== 'paused') return s
  return { ...s, status: 'running', resumedAt: now }
}

// 완료하기 또는 중도 종료 → 결과
export function finish(s: ActiveSession, now: number): SessionResult {
  const studiedMs = elapsedOf(s, now)
  return {
    status: 'result',
    goalMs: s.goalMs,
    studiedMs,
    pauseCount: s.pauseCount,
    earned: pointsFor(studiedMs),
    completed: studiedMs >= s.goalMs,
  }
}

// 페이지를 다시 열었을 때 복원.
// 새로고침이면 그대로 이어가고, 탭을 닫았다 연 경우면 마지막으로 탭이 살아 있던 시각에 일시정지한다.
export function restore(s: SessionState, isReload: boolean, lastSeenAt: number): SessionState {
  if (s.status !== 'running' || isReload) return s
  const paused = pause(s, Math.max(lastSeenAt, s.resumedAt ?? lastSeenAt))
  // 닫혀 있던 사이에 목표를 채웠다면 완료 대기로
  return paused.elapsedMs >= paused.goalMs ? { ...paused, status: 'reached', elapsedMs: paused.goalMs } : paused
}

// 48:05 형식
export function formatClock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 50분 00초 형식
export function formatDuration(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000)
  return `${Math.floor(total / 60)}분 ${String(total % 60).padStart(2, '0')}초`
}
