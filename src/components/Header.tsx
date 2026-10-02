import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAmbientSound } from '../hooks/useAmbientSound.ts'
import { useCountUp } from '../hooks/useCountUp.ts'
import { MenuIcon, SoundIcon } from './icons.tsx'
import ThemeToggle from './ThemeToggle.tsx'

type Props = {
  nickname: string
  balance: number | undefined
  // 세션 중에는 흐리게 (마우스를 올리거나 포커스하면 다시 선명하게)
  dim: boolean
  onLogout: () => void
}

function SoundControl({ sound }: { sound: ReturnType<typeof useAmbientSound> }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={sound.toggle}
        aria-pressed={sound.on}
        aria-label={sound.on ? '카페 소리 끄기' : '카페 소리 켜기'}
        title="카페 소리"
        className="rounded-md p-2 text-muted transition-colors hover:text-ink aria-pressed:text-amber"
      >
        <SoundIcon on={sound.on} />
      </button>
      {sound.on && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={sound.volume}
          onChange={(e) => sound.setVolume(Number(e.target.value))}
          aria-label="카페 소리 볼륨"
          className="w-20 accent-amber"
        />
      )}
    </div>
  )
}

// 처음 받은 값은 그대로 보여주고, 이후 적립될 때만 숫자가 올라간다
function Points({ value }: { value: number }) {
  const shown = useCountUp(value)
  return <>{shown.toLocaleString()}P</>
}

export default function Header({ nickname, balance, dim, onLogout }: Props) {
  const sound = useAmbientSound()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      className={`fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 transition-opacity duration-500 sm:inset-x-5 sm:top-5 ${
        dim && !menuOpen ? 'opacity-60 focus-within:opacity-100 hover:opacity-100' : ''
      }`}
    >
      <div className="panel flex items-center justify-between rounded-md py-2 pr-2 pl-4">
        <span className="font-serif text-[22px]">Study-Cafe</span>

        <div className="flex items-center gap-1 sm:gap-3">
          <span className="px-2 text-sm font-semibold tabular-nums" aria-label={balance === undefined ? '포인트 불러오는 중' : `보유 포인트 ${balance}P`}>
            <span className="mr-1.5 text-amber" aria-hidden="true">●</span>
            {balance === undefined ? '…' : <Points value={balance} />}
          </span>

          <nav className="hidden items-center gap-3 text-sm text-muted sm:flex">
            <Link to="/shop" className="rounded-md px-2 py-2 transition-colors hover:text-ink">
              상점
            </Link>
            <SoundControl sound={sound} />
            <ThemeToggle />
            <span className="px-1 text-ink">{nickname}</span>
            <button type="button" onClick={onLogout} className="rounded-md px-2 py-2 transition-colors hover:text-ink">
              로그아웃
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label="메뉴"
            className="rounded-md p-2 text-muted sm:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          {/* 바깥을 누르면 닫힘 */}
          <button type="button" aria-label="메뉴 닫기" className="fixed inset-0 -z-10 cursor-default" onClick={() => setMenuOpen(false)} />
          <nav className="panel mt-2 flex flex-col gap-1 rounded-md p-2 text-sm sm:hidden">
            <span className="px-3 py-2 text-muted">{nickname} 님</span>
            <Link to="/shop" className="rounded-md px-3 py-2.5 hover:bg-paper-2">
              상점
            </Link>
            <div className="flex items-center justify-between rounded-md px-1">
              <span className="px-2 text-muted">카페 소리</span>
              <SoundControl sound={sound} />
            </div>
            <ThemeToggle withLabel />
            <button type="button" onClick={onLogout} className="rounded-md px-3 py-2.5 text-left hover:bg-paper-2">
              로그아웃
            </button>
          </nav>
        </>
      )}
    </header>
  )
}
