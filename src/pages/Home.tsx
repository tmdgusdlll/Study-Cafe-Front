import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe, logout, type MemberInfo } from '../api/auth.ts'
import { earn, getBalance } from '../api/points.ts'
import CafeInterior from '../components/CafeInterior.tsx'
import Header from '../components/Header.tsx'
import SeatCard from '../components/SeatCard.tsx'
import SeatGuide from '../components/SeatGuide.tsx'
import SessionPanel from '../components/SessionPanel.tsx'
import { useCafeSeats } from '../hooks/useCafeSeats.ts'
import { useStudySession } from '../hooks/useStudySession.ts'
import { useTimeOfDay } from '../hooks/useTimeOfDay.ts'
import { seatGuide } from '../lib/seats.ts'

function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return useCallback(async () => {
    await logout()
    queryClient.clear()
    navigate('/', { replace: true })
  }, [navigate, queryClient])
}

function Cafe({ member }: { member: MemberInfo }) {
  const queryClient = useQueryClient()
  const period = useTimeOfDay()
  const session = useStudySession(member.memberId)
  const onLogout = useLogout()
  const seats = useCafeSeats()
  const guide = seatGuide(seats.seats, seats.connected, member.memberId)
  const [inspected, setInspected] = useState<number | null>(null)
  // 상대가 자리를 떠나면 카드도 닫힌다 (좌석표에서 다시 찾는다)
  const inspectedOccupant = seats.seats?.find((s) => s.occupant?.memberId === inspected)?.occupant ?? null
  const closeCard = useCallback(() => setInspected(null), [])

  // 타이머가 진행 중일 때만 "공부 중". 앉는 순간(재연결 포함)에도 현재 상태를 보낸다
  const running = session.state.status === 'running'
  const seated = guide === 'seated'
  const { setStudying } = seats
  useEffect(() => {
    if (seated) setStudying(running)
  }, [seated, running, setStudying])

  const balance = useQuery({ queryKey: ['points'], queryFn: getBalance })
  const earnPoints = useMutation({
    mutationFn: earn,
    onSuccess: (data) => queryClient.setQueryData(['points'], data),
  })

  const active = session.state.status === 'running' || session.state.status === 'paused' || session.state.status === 'reached'

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <CafeInterior
        period={period}
        calm={active}
        seats={seats.seats}
        myId={member.memberId}
        pickable={seats.connected}
        onPick={seats.take}
        onInspect={setInspected}
      />
      <Header nickname={member.nickname} balance={balance.data?.balance} dim={active} onLogout={onLogout} />
      <SeatGuide state={guide} error={seats.error} />
      {inspectedOccupant && <SeatCard occupant={inspectedOccupant} mine={inspectedOccupant.memberId === member.memberId} onClose={closeCard} />}
      {/* 타이머는 카페를 가리지 않게 구석 카드로 (모바일은 아래쪽) */}
      <main className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 flex justify-center sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[380px]">
        <SessionPanel
          session={session}
          locked={!seated}
          onFinished={(result) => {
            if (result.earned > 0) earnPoints.mutate(result.earned)
          }}
        />
      </main>
    </div>
  )
}

export default function Home() {
  const period = useTimeOfDay()
  const onLogout = useLogout()
  const me = useQuery({ queryKey: ['me'], queryFn: getMe, retry: false })

  // 토큰이 유효하지 않으면 로그아웃 처리
  const unauthorized = me.isError
  useEffect(() => {
    if (unauthorized) onLogout()
  }, [unauthorized, onLogout])

  if (!me.data) {
    return (
      <div className="relative min-h-dvh overflow-hidden">
        <CafeInterior period={period} />
      </div>
    )
  }

  return <Cafe member={me.data} />
}
