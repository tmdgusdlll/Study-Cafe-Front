import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import type { useStudySession } from '../hooks/useStudySession.ts'
import { formatClock, GOAL_PRESETS, type SessionResult } from '../lib/session.ts'
import { CollapseIcon, ExpandIcon } from './icons.tsx'
import Receipt from './Receipt.tsx'

type Props = {
  session: ReturnType<typeof useStudySession>
  onFinished: (result: SessionResult) => void
}

const spring = { type: 'spring', duration: 0.45, bounce: 0 } as const
const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
}

export default function SessionPanel({ session, onFinished }: Props) {
  const { state, remainingMs } = session
  const [goal, setGoal] = useState<number>(GOAL_PRESETS[0])
  const [collapsed, setCollapsed] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const active = state.status === 'running' || state.status === 'paused' || state.status === 'reached'
  const goalMinutes = active ? Math.round(state.goalMs / 60_000) : goal
  // 목표 달성 시에는 완료하기 버튼이 보이도록 접힌 상태를 무시
  const isCollapsed = collapsed && (state.status === 'running' || state.status === 'paused')

  const finish = () => {
    setConfirming(false)
    setCollapsed(false)
    const result = session.finish()
    if (result) onFinished(result)
  }

  const view = state.status === 'result' ? 'result' : confirming && active ? 'confirm' : state.status

  return (
    <>
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.section
            key="panel"
            aria-label="공부 세션"
            className={`relative w-full max-w-[440px] rounded-lg px-6 pt-6 pb-6 text-center ${
              view === 'result' ? '' : 'panel shadow-[0_30px_60px_-30px_rgba(0,0,0,.45)]'
            }`}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={spring}
          >
            {(state.status === 'running' || state.status === 'paused') && !confirming && (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-label="타이머 접기"
                title="타이머 접기"
                className="absolute top-3 right-3 rounded-md p-2 text-muted transition-colors hover:text-ink"
              >
                <CollapseIcon />
              </button>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={view} {...fade}>
                {view === 'idle' && (
                  <>
                    <p className="text-sm text-muted">오늘은 얼마나 앉아 있을까요?</p>
                    <div className="display-digits mt-3 mb-6 text-[64px] sm:text-[80px]">{formatClock(goal * 60_000)}</div>
                    <div role="radiogroup" aria-label="목표 시간" className="mb-6 flex justify-center gap-2">
                      {GOAL_PRESETS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          role="radio"
                          aria-checked={goal === m}
                          onClick={() => setGoal(m)}
                          className="chip"
                        >
                          {m}분
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => session.start(goal)} className="btn btn-primary w-full">
                      공부 시작
                    </button>
                  </>
                )}

                {(view === 'running' || view === 'paused' || view === 'reached') && (
                  <>
                    <p className="inline-flex items-center gap-2 text-[13px] text-muted">
                      <span
                        className={`size-[7px] rounded-full ${
                          view === 'running' ? 'bg-sage shadow-[0_0_0_4px_color-mix(in_srgb,var(--sage)_25%,transparent)]' : view === 'reached' ? 'bg-amber' : 'bg-muted'
                        }`}
                      />
                      {view === 'running' ? '집중 중' : view === 'paused' ? '일시정지' : '목표 달성'} · 목표 {goalMinutes}분
                    </p>
                    <div
                      className={`display-digits mt-3 mb-6 text-[64px] transition-opacity duration-300 sm:text-[80px] ${view === 'paused' ? 'opacity-40' : ''}`}
                      role="timer"
                      aria-label={`남은 시간 ${formatClock(remainingMs)}`}
                    >
                      {formatClock(remainingMs)}
                    </div>
                    <div className="flex justify-center gap-2.5">
                      {view === 'running' && (
                        <button type="button" onClick={session.pause} className="btn btn-secondary">
                          일시정지
                        </button>
                      )}
                      {view === 'paused' && (
                        <button type="button" onClick={session.resume} className="btn btn-primary">
                          다시 시작
                        </button>
                      )}
                      {view === 'reached' ? (
                        <button type="button" onClick={finish} className="btn btn-primary w-full">
                          완료하기
                        </button>
                      ) : (
                        <button type="button" onClick={() => setConfirming(true)} className="btn btn-ghost">
                          종료
                        </button>
                      )}
                    </div>
                  </>
                )}

                {view === 'confirm' && (
                  <>
                    <p className="font-serif text-2xl">여기까지 할까요?</p>
                    <p className="mt-3 mb-6 text-[15px] text-muted">
                      {session.previewPoints() > 0
                        ? `지금 종료하면 ${session.previewPoints()}P를 받습니다`
                        : '10분 미만이라 지금 종료하면 포인트가 없어요'}
                    </p>
                    <div className="flex justify-center gap-2.5">
                      <button type="button" onClick={() => setConfirming(false)} className="btn btn-secondary">
                        계속 공부
                      </button>
                      <button type="button" onClick={finish} className="btn btn-ghost text-danger hover:text-danger">
                        종료하기
                      </button>
                    </div>
                  </>
                )}

                {state.status === 'result' && <Receipt result={state} onClose={session.dismissResult} />}
              </motion.div>
            </AnimatePresence>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 접었을 때: 남은 시간 + 열기 표시가 있는 작은 알약. 누르면 타이머 창이 다시 펼쳐진다 */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.button
            key="pill"
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label={`타이머 펼치기, 남은 시간 ${formatClock(remainingMs)}`}
            className="panel fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 sm:right-5 sm:bottom-5 sm:left-auto sm:translate-x-0 items-center gap-2.5 rounded-full py-2 pr-2 pl-5 shadow-[0_16px_40px_-20px_rgba(0,0,0,.5)] transition-[filter] hover:brightness-110 active:scale-[.97]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={spring}
          >
            <span className={`size-[7px] rounded-full ${state.status === 'running' ? 'bg-sage' : 'bg-muted'}`} />
            {state.status === 'paused' && <span className="text-[13px] text-muted">일시정지</span>}
            <span className="font-serif text-xl tabular-nums">{formatClock(remainingMs)}</span>
            <span className="flex items-center gap-1 rounded-full bg-amber py-1.5 pr-2.5 pl-2 text-[13px] font-semibold text-amber-ink">
              <ExpandIcon />
              열기
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
