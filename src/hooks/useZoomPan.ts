import { type PointerEvent, type WheelEvent, useRef, useState } from 'react'

const MIN = 1
const MAX = 2.5

type View = { scale: number; x: number; y: number }

// 장면 확대·축소·이동 — 휠(데스크톱), 두 손가락 핀치(모바일), 드래그로 이동, 버튼
// 1배보다 작게는 줄이지 않는다 (장면이 이미 화면을 꽉 채운 상태가 1배)
export function useZoomPan() {
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 })
  // 버튼으로 바꿀 때만 부드럽게, 손으로 조작할 때는 즉시
  const [smooth, setSmooth] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<number | null>(null)

  // 확대한 만큼만 움직일 수 있게 (장면 밖이 보이지 않도록)
  const clamp = (v: View): View => {
    const r = box.current?.getBoundingClientRect()
    const scale = Math.min(MAX, Math.max(MIN, v.scale))
    const mx = r ? ((scale - 1) * r.width) / 2 : 0
    const my = r ? ((scale - 1) * r.height) / 2 : 0
    return { scale, x: Math.min(mx, Math.max(-mx, v.x)), y: Math.min(my, Math.max(-my, v.y)) }
  }

  // (cx, cy) 지점을 기준으로 factor배 — 손가락·커서 아래 지점이 제자리에 남는다.
  // 연속 이벤트가 같은 렌더 안에 몰려도 누적되도록 직전 상태(v) 기준으로 계산한다
  const zoomBy = (factor: number, cx: number, cy: number) =>
    setView((v) => {
      const r = box.current!.getBoundingClientRect()
      const px = cx - r.left - r.width / 2
      const py = cy - r.top - r.height / 2
      const s = Math.min(MAX, Math.max(MIN, v.scale * factor))
      return clamp({ scale: s, x: px - ((px - v.x) * s) / v.scale, y: py - ((py - v.y) * s) / v.scale })
    })

  const step = (factor: number) => {
    const r = box.current!.getBoundingClientRect()
    setSmooth(true)
    zoomBy(factor, r.left + r.width / 2, r.top + r.height / 2)
  }

  const distance = () => {
    const [a, b] = [...pointers.current.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  const handlers = {
    onWheel: (e: WheelEvent) => {
      setSmooth(false)
      zoomBy(Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY)
    },
    onPointerDown: (e: PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.current.size === 2) pinch.current = distance()
      setSmooth(false)
    },
    onPointerMove: (e: PointerEvent) => {
      const prev = pointers.current.get(e.pointerId)
      if (!prev) return
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.current.size === 2 && pinch.current) {
        const d = distance()
        const [a, b] = [...pointers.current.values()]
        zoomBy(d / pinch.current, (a.x + b.x) / 2, (a.y + b.y) / 2)
        pinch.current = d
      } else if (pointers.current.size === 1) {
        setView((v) => clamp({ ...v, x: v.x + e.clientX - prev.x, y: v.y + e.clientY - prev.y }))
      }
    },
    onPointerUp: (e: PointerEvent) => {
      pointers.current.delete(e.pointerId)
      pinch.current = null
    },
  }

  return {
    box,
    handlers: { ...handlers, onPointerCancel: handlers.onPointerUp },
    style: {
      transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
      transition: smooth ? 'transform 250ms cubic-bezier(.22,1,.36,1)' : 'none',
    },
    scale: view.scale,
    zoomIn: () => step(1.4),
    zoomOut: () => step(1 / 1.4),
    reset: () => {
      setSmooth(true)
      setView({ scale: 1, x: 0, y: 0 })
    },
    canZoomIn: view.scale < MAX - 0.01,
    canZoomOut: view.scale > MIN + 0.01,
  }
}
