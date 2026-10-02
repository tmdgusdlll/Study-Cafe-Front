import { animate, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

// 숫자가 바뀌면 이전 값에서 새 값까지 0.8초 동안 올라간다 (포인트 적립 연출)
export function useCountUp(value: number, from?: number): number {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(from ?? value)
  const prev = useRef(from ?? value)

  useEffect(() => {
    if (reduce) {
      prev.current = value
      return
    }
    const controls = animate(prev.current, value, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    })
    prev.current = value
    return () => controls.stop()
  }, [value, reduce])

  // 동작 줄이기 설정이면 연출 없이 바로 최종 값
  return reduce ? value : shown
}
