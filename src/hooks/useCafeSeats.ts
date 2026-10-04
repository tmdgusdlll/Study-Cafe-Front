import { Client } from '@stomp/stompjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getAccessToken } from '../api/auth.ts'
import type { Seat, SeatErrorCode } from '../lib/seats.ts'

const WS_URL = `${import.meta.env.VITE_API_URL.replace(/^http/, 'ws')}/ws`

// 카페 좌석 STOMP 연결 — 좌석표 구독, 앉기·공부 상태 전송. 끊기면 3초마다 다시 연결한다
export function useCafeSeats() {
  const client = useRef<Client | null>(null)
  const [seats, setSeats] = useState<Seat[] | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<{ code: SeatErrorCode; at: number } | null>(null)

  useEffect(() => {
    const c = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
      reconnectDelay: 3000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      onConnect: () => {
        setConnected(true)
        // 변경 알림을 먼저 구독해 두고 현재 좌석표를 받는다 (사이의 변경을 놓치지 않게)
        c.subscribe('/topic/cafe/seats', (m) => setSeats(JSON.parse(m.body) as Seat[]))
        c.subscribe('/user/queue/errors', (m) => setError({ code: (JSON.parse(m.body) as { code: SeatErrorCode }).code, at: Date.now() }))
        c.subscribe('/app/cafe/seats', (m) => setSeats(JSON.parse(m.body) as Seat[]))
      },
      onWebSocketClose: () => setConnected(false),
    })
    c.activate()
    client.current = c
    return () => {
      client.current = null
      void c.deactivate()
    }
  }, [])

  // 연결이 없을 때 보낸 요청은 버린다 (재연결 후 사용자가 다시 고른다)
  const send = useCallback((destination: string, body: unknown) => {
    if (client.current?.connected) client.current.publish({ destination, body: JSON.stringify(body) })
  }, [])
  const take = useCallback((seatId: number) => send('/app/cafe/seat.take', { seatId }), [send])
  const setStudying = useCallback((studying: boolean) => send('/app/cafe/status', { studying }), [send])

  return { seats, connected, error, take, setStudying }
}
