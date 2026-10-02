import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTimeOfDay } from '../hooks/useTimeOfDay.ts'
import CafeScene from './CafeScene.tsx'
import ThemeToggle from './ThemeToggle.tsx'

type Props = {
  children: ReactNode
  // 데스크톱에서 패널 위치. 랜딩은 램프·커피잔을 가리지 않게 오른쪽
  align?: 'center' | 'right'
}

// 카페 장면 배경 + 상단 로고·테마 토글 (랜딩, 로그인, 회원가입, 상점)
export default function SceneLayout({ children, align = 'center' }: Props) {
  const period = useTimeOfDay()

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <CafeScene period={period} />
      <div className="fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex items-center justify-between sm:inset-x-5 sm:top-5">
        <Link to="/" className="panel rounded-md px-4 py-2 font-serif text-[22px]">
          Study-Cafe
        </Link>
        <div className="panel rounded-md p-0.5">
          <ThemeToggle />
        </div>
      </div>
      <main
        className={`relative z-10 flex min-h-dvh items-end justify-center px-4 pt-24 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-24 ${
          align === 'right' ? 'lg:justify-end lg:pr-[8vw]' : ''
        }`}
      >
        {children}
      </main>
    </div>
  )
}
