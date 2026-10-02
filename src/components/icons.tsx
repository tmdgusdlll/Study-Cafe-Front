// 아이콘 라이브러리 없이 쓰는 최소 인라인 아이콘 (stroke = currentColor)
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export const SunIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

export const MoonIcon = () => (
  <svg {...base}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
  </svg>
)

export const SoundIcon = ({ on }: { on: boolean }) => (
  <svg {...base}>
    <path d="M4 9h3l5-4v14l-5-4H4z" />
    {on ? <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M16 9l5 6M21 9l-5 6" />}
  </svg>
)

export const MenuIcon = () => (
  <svg {...base}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
)

export const CollapseIcon = () => (
  <svg {...base}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

export const ExpandIcon = () => (
  <svg {...base}>
    <path d="M6 15l6-6 6 6" />
  </svg>
)
