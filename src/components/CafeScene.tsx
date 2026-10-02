import type { CSSProperties } from 'react'
import type { Period } from '../hooks/useTimeOfDay.ts'

// 시간대별 장면 팔레트 — DESIGN.md "장면 팔레트"
const PALETTE: Record<Period, { sky: [string, string]; wall: string; floor: string; table: string; city: string; windows: number; sun: number; moon: number; lamp: number }> = {
  morning: { sky: ['#F7D9B5', '#FBE9D4'], wall: '#E9D9C2', floor: '#DCC8AC', table: '#9A6B48', city: '#C9B6A0', windows: 0, sun: 1, moon: 0, lamp: 0.25 },
  day: { sky: ['#B9D7DF', '#E3F0F2'], wall: '#EADFCF', floor: '#DDCFBA', table: '#9A6B48', city: '#A9B9BC', windows: 0, sun: 1, moon: 0, lamp: 0.15 },
  evening: { sky: ['#6B4C7A', '#E88A5B'], wall: '#C9A588', floor: '#B58F72', table: '#7E5338', city: '#4A3550', windows: 0.6, sun: 1, moon: 0, lamp: 0.7 },
  night: { sky: ['#111829', '#1B2235'], wall: '#3A2C26', floor: '#2E231E', table: '#5A3B28', city: '#0C1220', windows: 1, sun: 0, moon: 1, lamp: 1 },
}

const BUILDINGS = [
  [196, 420, 120], [330, 360, 90], [430, 450, 160], [610, 390, 110], [740, 470, 140],
  [900, 340, 100], [1020, 430, 150], [1190, 380, 96], [1300, 460, 104],
]

// 창밖 건물 불빛 — 매 렌더마다 바뀌지 않도록 고정 배치
const WINDOW_LIGHTS = Array.from({ length: 46 }, (_, i) => ({
  x: 210 + ((i * 97) % 1180),
  y: 380 + ((i * 53) % 230),
  opacity: 0.5 + (i % 3) * 0.2,
}))

type Props = {
  period: Period
  // 세션 중에는 움직임을 더 잔잔하게
  calm?: boolean
}

// 화면 전체를 덮는 카페 창가 장면 (장식용)
export default function CafeScene({ period, calm = false }: Props) {
  const p = PALETTE[period]
  const tone = (fill: string) => ({ fill })

  return (
    <svg
      className="scene pointer-events-none absolute inset-0 h-full w-full"
      style={{ '--scene-speed': calm ? 1.8 : 1 } as CSSProperties}
      // 왼쪽(램프·커피잔) 기준으로 잘라 좁은 화면에서도 둘 다 보이게
      viewBox="100 0 1500 900"
      preserveAspectRatio="xMinYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
          <stop className="tone" offset="0" style={{ stopColor: p.sky[0] }} />
          <stop className="tone" offset="1" style={{ stopColor: p.sky[1] }} />
        </linearGradient>
        <radialGradient id="scene-lamp" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#FFB866" stopOpacity=".75" />
          <stop offset="1" stopColor="#FFB866" stopOpacity="0" />
        </radialGradient>
        <filter id="scene-grain">
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .06 0" />
        </filter>
      </defs>

      <rect className="tone" width="1600" height="900" style={tone(p.wall)} />
      <rect className="tone" y="640" width="1600" height="260" style={tone(p.floor)} />

      {/* 창 */}
      <rect x="180" y="90" width="1240" height="560" rx="10" fill="#2B1E16" opacity=".85" />
      <rect x="196" y="106" width="1208" height="528" fill="url(#scene-sky)" />
      <circle className="tone" cx="1180" cy="230" r="54" fill="#FFE2B0" style={{ opacity: p.sun }} />
      <g className="tone" style={{ opacity: p.moon }}>
        <circle cx="1180" cy="210" r="38" fill="#F3E9DC" />
        <circle cx="1196" cy="198" r="34" fill="#1B2235" />
      </g>
      <g>
        {BUILDINGS.map(([x, y, w]) => (
          <rect key={x} className="tone" x={x} y={y} width={w} height={634 - y} style={tone(p.city)} />
        ))}
      </g>
      <g className="tone" fill="#FFCF85" style={{ opacity: p.windows }}>
        {WINDOW_LIGHTS.map((l, i) => (
          <rect key={i} x={l.x} y={l.y} width="9" height="12" opacity={l.opacity} />
        ))}
      </g>
      <rect x="196" y="365" width="1208" height="10" fill="#2B1E16" opacity=".85" />
      <rect x="796" y="106" width="10" height="528" fill="#2B1E16" opacity=".85" />

      {/* 테이블 */}
      <rect className="tone" x="0" y="660" width="1600" height="40" style={tone(p.table)} />
      <rect x="0" y="700" width="1600" height="200" fill="#000" opacity=".12" />

      {/* 램프 빛 */}
      <g className="tone" style={{ opacity: p.lamp }}>
        <ellipse className="flicker" cx="300" cy="560" rx="420" ry="300" fill="url(#scene-lamp)" />
      </g>
      <g transform="translate(250 430)">
        <path d="M-70 0 L70 0 L40 -70 L-40 -70 Z" fill="#C9763A" />
        <path className="flicker" d="M-70 0 L70 0 L40 -70 L-40 -70 Z" fill="#FFB866" opacity=".35" />
        <rect x="-4" y="0" width="8" height="190" fill="#2B1E16" />
        <rect x="-46" y="190" width="92" height="40" rx="6" fill="#2B1E16" />
      </g>

      {/* 커피잔 */}
      <g transform="translate(345 600)">
        <path className="steam" d="M10 -40 C -6 -60, 26 -78, 8 -104" stroke="#FFF3E2" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path className="steam steam-2" d="M34 -38 C 18 -58, 50 -76, 32 -100" stroke="#FFF3E2" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path className="steam steam-3" d="M58 -40 C 42 -60, 74 -78, 56 -102" stroke="#FFF3E2" strokeWidth="5" fill="none" strokeLinecap="round" />
        <rect x="-10" y="-30" width="90" height="90" rx="14" fill="#F3E9DC" />
        <path d="M80 -6 q 30 0 30 24 q 0 24 -30 24" stroke="#F3E9DC" strokeWidth="10" fill="none" />
        <ellipse cx="35" cy="62" rx="62" ry="11" fill="#E6D8C4" />
      </g>

      {/* 화분 */}
      <g transform="translate(1360 660)">
        <path d="M-50 0 L50 0 L38 -80 L-38 -80 Z" fill="#B5643E" />
        <path d="M0 -80 C -40 -150, -110 -170, -130 -230 C -70 -210, -20 -170, 0 -80 Z" fill="#6E7F5E" />
        <path d="M0 -80 C 20 -170, 80 -200, 120 -260 C 110 -190, 60 -140, 0 -80 Z" fill="#7C8B6F" />
        <path d="M0 -80 C -10 -160, 10 -230, 0 -300 C 30 -230, 20 -160, 0 -80 Z" fill="#5F6F51" />
      </g>

      <rect width="1600" height="900" filter="url(#scene-grain)" />
    </svg>
  )
}
