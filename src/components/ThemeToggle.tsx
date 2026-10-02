import { useTheme } from '../hooks/useTheme.ts'
import { MoonIcon, SunIcon } from './icons.tsx'

export default function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const { theme, toggle } = useTheme()
  const label = theme === 'dark' ? '라이트 모드로' : '다크 모드로'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-2 rounded-md p-2 text-muted transition-colors hover:text-ink"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      {withLabel && <span className="text-sm">{label}</span>}
    </button>
  )
}
