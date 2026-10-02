import type { CSSProperties, ReactNode } from 'react'
import type { Period } from '../hooks/useTimeOfDay.ts'
import { useZoomPan } from '../hooks/useZoomPan.ts'

// 로그인 후 홈 장면 — 카페 안 앞쪽 위에서 내려다보는 원근 시점 (동물의 숲 실내 느낌).
// 좌표: x 왼쪽→오른쪽(-6~6), y 안쪽 벽→앞쪽(0~9), z 높이. 1 = 약 50cm

type V = [number, number, number]

const W = 9 // 방 절반 폭
const D = 13 // 방 깊이
const H = 5.6 // 벽 높이

// 카메라: 방 앞쪽 위에서 안쪽 벽을 향해 내려다본다
const CAM = { y: 19, z: 12.5, pitch: 0.62, f: 520 }
const [COS, SIN] = [Math.cos(CAM.pitch), Math.sin(CAM.pitch)]

const depth = ([, y, z]: V) => (CAM.y - y) * COS + (CAM.z - z) * SIN
const proj = (v: V): [number, number] => {
  const [x, y, z] = v
  const up = (z - CAM.z) * COS + (CAM.y - y) * SIN
  const d = depth(v)
  return [(CAM.f * x) / d, (-CAM.f * up) / d]
}
// 그 위치에서 1단위가 화면에서 몇 px인지 (2D 소품 크기용)
const unitAt = (v: V) => CAM.f / depth(v)

const pts = (...vs: V[]) => vs.map((v) => proj(v).map((n) => n.toFixed(1)).join(',')).join(' ')
const disc = (x: number, y: number, z: number, r: number) =>
  pts(...Array.from({ length: 28 }, (_, i) => [x + r * Math.cos((i / 28) * Math.PI * 2), y + r * Math.sin((i / 28) * Math.PI * 2), z] as V))

// 색을 f배 밝게/어둡게
const shade = (hex: string, f: number) =>
  '#' +
  [1, 3, 5]
    .map((i) => Math.round(Math.min(255, parseInt(hex.slice(i, i + 2), 16) * f)).toString(16).padStart(2, '0'))
    .join('')

// 시간대별 팔레트 — light는 가구·소품 밝기 배율
const PALETTE: Record<Period, { sky: [string, string]; wall: string; floor: string; far: string; near: string; windows: number; sun: number; moon: number; lamp: number; patch: number; light: number }> = {
  morning: { sky: ['#F7D9B5', '#FBE9D4'], wall: '#F0E2CB', floor: '#C99C70', far: '#D9C3AA', near: '#BFA68C', windows: 0, sun: 1, moon: 0, lamp: 0.2, patch: 0.35, light: 1 },
  day: { sky: ['#9FCBDA', '#E3F0F2'], wall: '#F3E8D6', floor: '#CDA177', far: '#B8C6C6', near: '#97A9AB', windows: 0, sun: 1, moon: 0, lamp: 0.1, patch: 0.3, light: 1 },
  evening: { sky: ['#6B4C7A', '#E88A5B'], wall: '#DDBB97', floor: '#A9774D', far: '#7A5466', near: '#4A3550', windows: 0.6, sun: 1, moon: 0, lamp: 0.75, patch: 0.15, light: 0.88 },
  night: { sky: ['#0E1424', '#1B2235'], wall: '#55433A', floor: '#5E4231', far: '#1A2236', near: '#0C1220', windows: 1, sun: 0, moon: 1, lamp: 1, patch: 0, light: 0.7 },
}

// 직육면체. 카메라에서 보이는 면(옆면 하나, 앞면, 윗면)만 그린다
function Box({ at: [x, y, z], size: [w, d, h], color, top }: { at: V; size: V; color: string; top?: string }) {
  const [x2, y2, z2] = [x + w, y + d, z + h]
  return (
    <g>
      {x2 < 0 && <polygon className="tone" points={pts([x2, y, z], [x2, y2, z], [x2, y2, z2], [x2, y, z2])} style={{ fill: shade(color, 0.8) }} />}
      {x > 0 && <polygon className="tone" points={pts([x, y, z], [x, y2, z], [x, y2, z2], [x, y, z2])} style={{ fill: shade(color, 0.8) }} />}
      <polygon className="tone" points={pts([x, y2, z], [x2, y2, z], [x2, y2, z2], [x, y2, z2])} style={{ fill: shade(color, 0.9) }} />
      <polygon className="tone" points={pts([x, y, z2], [x2, y, z2], [x2, y2, z2], [x, y2, z2])} style={{ fill: top ?? color }} />
    </g>
  )
}

// 3D 위치에 원근 크기로 2D 소품을 그린다 (1단위 = 1)
function At({ v, children }: { v: V; children: ReactNode }) {
  const [sx, sy] = proj(v)
  return <g transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)}) scale(${unitAt(v).toFixed(2)})`}>{children}</g>
}

function Steam({ v, size = 1 }: { v: V; size?: number }) {
  return (
    <At v={v}>
      <g transform={`scale(${size * 0.012})`}>
        {['M-24 -10 C -40 -30, -8 -48, -26 -74', 'M0 -8 C -16 -28, 16 -46, -2 -70', 'M24 -10 C 8 -30, 40 -48, 22 -72'].map((d, i) => (
          <path key={d} className={`steam ${i ? `steam-${i + 1}` : ''}`} d={d} stroke="#FFF3E2" strokeWidth="6" fill="none" strokeLinecap="round" />
        ))}
      </g>
    </At>
  )
}

// 둥근 테이블 (원판 + 기둥)
function RoundTable({ x, y, r = 0.85, k }: { x: number; y: number; r?: number; k: (hex: string) => string }) {
  return (
    <g>
      <polygon className="tone" points={disc(x, y, 0.01, 0.45)} style={{ fill: k('#2B1E16') }} opacity=".35" />
      <Box at={[x - 0.1, y - 0.1, 0]} size={[0.2, 0.2, 1.45]} color={k('#3A2A22')} />
      <polygon className="tone" points={disc(x, y, 1.4, r)} style={{ fill: k('#7A5038') }} />
      <polygon className="tone" points={disc(x, y, 1.5, r)} style={{ fill: k('#C08A5E') }} />
    </g>
  )
}

// 등받이 의자 — 손님 자리 (다음 작업에서 손님이 앉는다)
function Chair({ x, y, k }: { x: number; y: number; k: (hex: string) => string }) {
  return (
    <g>
      <Box at={[x - 0.4, y - 0.4, 0]} size={[0.8, 0.8, 0.95]} color={k('#9A6644')} top={k('#B97F57')} />
      <Box at={[x - 0.4, y - 0.55, 0.95]} size={[0.8, 0.15, 0.9]} color={k('#9A6644')} />
    </g>
  )
}

function Stool({ x, y, k }: { x: number; y: number; k: (hex: string) => string }) {
  return (
    <g>
      <Box at={[x - 0.07, y - 0.07, 0]} size={[0.14, 0.14, 1.15]} color="#2B1E16" />
      <polygon className="tone" points={disc(x, y, 1.15, 0.38)} style={{ fill: k('#8A5A3B') }} />
      <polygon className="tone" points={disc(x, y, 1.22, 0.38)} style={{ fill: k('#B97F57') }} />
    </g>
  )
}

// 천장에서 내려온 펜던트 조명 + 아래로 번지는 빛
function Pendant({ x, y, z = 3.9, lamp, glow }: { x: number; y: number; z?: number; lamp: number; glow: V }) {
  const [cx, top] = proj([x, y, H + 1])
  const [, sy] = proj([x, y, z])
  const u = unitAt([x, y, z])
  const [gx, gy] = proj(glow)
  return (
    <g>
      <line x1={cx} y1={top} x2={cx} y2={sy} stroke="#2B1E16" strokeWidth="1.2" opacity=".6" />
      <g className="tone" style={{ opacity: lamp }}>
        <ellipse className="flicker" cx={gx} cy={gy} rx={u * 2.4} ry={u * 1.3} fill="url(#room-lamp)" />
      </g>
      <path d={`M${cx - u * 0.45} ${sy + u * 0.4} L${cx + u * 0.45} ${sy + u * 0.4} L${cx + u * 0.2} ${sy} L${cx - u * 0.2} ${sy} Z`} fill="#C9763A" />
      <ellipse className="tone" cx={cx} cy={sy + u * 0.4} rx={u * 0.3} ry={u * 0.08} fill="#FFE1A8" style={{ opacity: 0.3 + lamp * 0.7 }} />
    </g>
  )
}

// 내 캐릭터 — 창가 자리에 등을 보이고 앉아 있다. 공부 중이면 타자 치듯 살짝 움직인다
function Me({ v, typing, k }: { v: V; typing: boolean; k: (hex: string) => string }) {
  return (
    <At v={v}>
      <g className={typing ? 'typing' : undefined}>
        {/* 몸통·팔 */}
        <path className="tone" d="M-0.42 0 C -0.46 -0.5, -0.36 -0.82, 0 -0.84 C 0.36 -0.82, 0.46 -0.5, 0.42 0 Z" style={{ fill: k('#7C8B6F') }} />
        <ellipse className="tone" cx="-0.42" cy="-0.42" rx="0.13" ry="0.3" style={{ fill: k('#6E7F5E') }} transform="rotate(18 -0.42 -0.42)" />
        <ellipse className="tone" cx="0.42" cy="-0.42" rx="0.13" ry="0.3" style={{ fill: k('#6E7F5E') }} transform="rotate(-18 0.42 -0.42)" />
        {/* 큰 머리 (뒤통수) */}
        <circle className="tone" cx="0" cy="-1.28" r="0.52" style={{ fill: k('#3A2A22') }} />
        <ellipse className="tone" cx="-0.5" cy="-1.18" rx="0.1" ry="0.14" style={{ fill: k('#E8C4A8') }} />
        <ellipse className="tone" cx="0.5" cy="-1.18" rx="0.1" ry="0.14" style={{ fill: k('#E8C4A8') }} />
        <path d="M-0.28 -1.62 C -0.1 -1.75, 0.15 -1.72, 0.3 -1.58" stroke="#fff" strokeOpacity=".12" strokeWidth=".06" fill="none" strokeLinecap="round" />
      </g>
    </At>
  )
}

// 서 있는 사람 — front: 카메라를 보고 있음(얼굴), back: 등을 보임.
// anim: idle(살짝 흔들림), 없으면 가만히 서 있음
function Person({ v, facing, shirt, apron, hair, anim, k }: { v: V; facing: 'front' | 'back'; shirt: string; apron?: string; hair: string; anim?: 'idle'; k: (hex: string) => string }) {
  const skin = k('#E8C4A8')
  return (
    <At v={v}>
      <g className={anim === 'idle' ? 'sway' : undefined}>
        {/* 다리 */}
        <rect className="tone" x="-0.3" y="-1.3" width="0.24" height="1.3" rx="0.1" style={{ fill: k('#3A2E2A') }} />
        <rect className="tone" x="0.06" y="-1.3" width="0.24" height="1.3" rx="0.1" style={{ fill: k('#3A2E2A') }} />
        {/* 몸통 + 앞치마 */}
        <path className="tone" d="M-0.42 -1.2 C -0.46 -1.7, -0.36 -2.04, 0 -2.06 C 0.36 -2.04, 0.46 -1.7, 0.42 -1.2 Z" style={{ fill: k(shirt) }} />
        {apron && facing === 'front' && <path className="tone" d="M-0.3 -1.25 L -0.28 -1.9 L 0.28 -1.9 L 0.3 -1.25 Z" style={{ fill: k(apron) }} />}
        {apron && facing === 'back' && <path d="M-0.36 -1.72 L 0.36 -1.72" stroke={k(apron)} strokeWidth="0.06" />}
        {/* 팔: 왼팔 고정, 오른팔은 동작 */}
        <ellipse className="tone" cx="-0.42" cy="-1.6" rx="0.12" ry="0.3" style={{ fill: k(shirt) }} transform="rotate(14 -0.42 -1.6)" />
        <g>
          <ellipse className="tone" cx="0.42" cy="-1.62" rx="0.12" ry="0.3" style={{ fill: k(shirt) }} transform="rotate(-14 0.42 -1.62)" />
          <circle className="tone" cx="0.5" cy="-1.34" r="0.09" style={{ fill: skin }} />
        </g>
        {/* 머리 */}
        <g>
          {facing === 'front' ? (
            <>
              <circle className="tone" cx="0" cy="-2.5" r="0.5" style={{ fill: skin }} />
              <path className="tone" d="M-0.52 -2.5 C -0.56 -3.05, 0.56 -3.05, 0.52 -2.5 C 0.4 -2.78, -0.4 -2.78, -0.52 -2.5 Z" style={{ fill: k(hair) }} />
              <circle cx="-0.17" cy="-2.46" r="0.05" fill="#2B1E16" />
              <circle cx="0.17" cy="-2.46" r="0.05" fill="#2B1E16" />
              <path d="M-0.1 -2.3 Q 0 -2.24, 0.1 -2.3" stroke="#2B1E16" strokeWidth="0.035" fill="none" strokeLinecap="round" />
              <ellipse cx="-0.3" cy="-2.36" rx="0.08" ry="0.05" fill="#E8907A" opacity=".5" />
              <ellipse cx="0.3" cy="-2.36" rx="0.08" ry="0.05" fill="#E8907A" opacity=".5" />
            </>
          ) : (
            <>
              <circle className="tone" cx="0" cy="-2.5" r="0.5" style={{ fill: k(hair) }} />
              <ellipse className="tone" cx="-0.48" cy="-2.42" rx="0.09" ry="0.13" style={{ fill: skin }} />
              <ellipse className="tone" cx="0.48" cy="-2.42" rx="0.09" ry="0.13" style={{ fill: skin }} />
            </>
          )}
        </g>
      </g>
    </At>
  )
}

// 바깥 풍경: 카페가 높은 층에 있어 창밖으로 거리 건물들이 내려다보인다.
// [x, 폭, 꼭대기 높이] — 바닥은 화면 아래로 충분히 내려 둔다
const OUT = { far: -14, near: -6, ground: -12 }
const FAR: [number, number, number][] = [[-12, 2, -1.8], [-9.6, 1.6, -2.8], [-7.6, 1.8, -1.2], [-5.4, 1.4, -2.4], [-3.6, 2, -3], [-1.4, 1.4, -0.6], [0.4, 1.8, -2], [2.6, 1.5, -0.9], [4.6, 2, -2.6], [6.8, 1.5, -1.4], [8.8, 1.8, -2.2], [11, 1.6, -1]]
const NEAR: [number, number, number][] = [[-10, 2.6, -1.4], [-6.5, 2.6, -1.6], [-3, 2.2, -0.9], [0.6, 2.8, -2.1], [4, 2.4, -1.2], [7.2, 2.6, -1.8]]
const LIGHTS = Array.from({ length: 64 }, (_, i) => [-12 + ((i * 1.37) % 24), -6 + ((i * 0.53) % 5)] as const)

// 창문 (안쪽 벽, x: -4~5, z: 1.7~4.9)
const WIN = { x1: -4, x2: 5, z1: 1.7, z2: 4.9 }

// 확대·축소 버튼 — 장면 왼쪽 위 (헤더 아래)
function ZoomControls({ zoom }: { zoom: Omit<ReturnType<typeof useZoomPan>, 'box'> }) {
  const btn = 'flex size-10 items-center justify-center text-lg text-ink transition-colors hover:bg-paper-2 disabled:opacity-35'
  return (
    <div
      className="panel fixed top-[max(5.25rem,calc(env(safe-area-inset-top)+4.5rem))] left-3 z-10 flex flex-col overflow-hidden rounded-md sm:top-24 sm:left-5"
      // 버튼을 눌러도 장면 드래그가 시작되지 않게
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button type="button" onClick={zoom.zoomIn} disabled={!zoom.canZoomIn} aria-label="확대" className={btn}>
        +
      </button>
      <button type="button" onClick={zoom.zoomOut} disabled={!zoom.canZoomOut} aria-label="축소" className={`${btn} border-t border-line`}>
        −
      </button>
      {zoom.scale > 1.01 && (
        <button type="button" onClick={zoom.reset} aria-label="원래 크기로" className={`${btn} border-t border-line text-[11px] font-semibold tabular-nums`}>
          {zoom.scale.toFixed(1)}×
        </button>
      )}
    </div>
  )
}

type Props = {
  period: Period
  // 세션 진행·일시정지 중 — 움직임을 잔잔하게
  calm?: boolean
  // 공부 중 — 노트북 불빛이 켜지고 캐릭터가 타자를 친다
  studying?: boolean
}

export default function CafeInterior({ period, calm = false, studying = false }: Props) {
  const p = PALETTE[period]
  const k = (hex: string) => shade(hex, p.light)
  // ref(box)는 따로 꺼내 둔다 — 렌더 중 ref가 든 객체를 읽지 않도록
  const { box, ...zoom } = useZoomPan()
  const [sunX, sunY] = proj([3.2, OUT.far, -1.6])
  const sunR = unitAt([3.2, OUT.far, -1.6]) * 0.9

  return (
    <div
      ref={box}
      {...zoom.handlers}
      // 브라우저 기본 스크롤·핀치 확대 대신 장면 확대를 쓴다
      className={`absolute inset-0 touch-none overflow-hidden transition-colors duration-[4000ms] select-none ${zoom.scale > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{ background: shade(p.floor, 0.7) }}
    >
      <svg
        className="scene h-full w-full origin-center will-change-transform"
        style={{ '--scene-speed': calm ? 1.8 : 1, ...zoom.style } as CSSProperties}
        // 방 안쪽이 화면을 꽉 채우도록 잘라서 보여준다
        viewBox="-300 -212 600 440"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="room-sky" x1="0" y1="0" x2="0" y2="1">
            <stop className="tone" offset="0" style={{ stopColor: p.sky[0] }} />
            <stop className="tone" offset="1" style={{ stopColor: p.sky[1] }} />
          </linearGradient>
          <radialGradient id="room-lamp" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#FFB866" stopOpacity=".5" />
            <stop offset="1" stopColor="#FFB866" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="room-screen" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#CFE3F0" stopOpacity=".55" />
            <stop offset="1" stopColor="#CFE3F0" stopOpacity="0" />
          </radialGradient>
          <clipPath id="room-glass">
            <polygon points={pts([WIN.x1, 0, WIN.z1], [WIN.x2, 0, WIN.z1], [WIN.x2, 0, WIN.z2], [WIN.x1, 0, WIN.z2])} />
          </clipPath>
        </defs>

        {/* 바닥 + 마루 줄눈 */}
        <polygon className="tone" points={pts([-W, 0, 0], [W, 0, 0], [W, D, 0], [-W, D, 0])} style={{ fill: p.floor }} />
        <g stroke="#000" opacity=".08">
          {Array.from({ length: 13 }, (_, i) => -W + i).map((x) => {
            const [a, b] = [proj([x, 0, 0]), proj([x, D, 0])]
            return <line key={x} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
          })}
        </g>

        {/* 벽: 안쪽, 왼쪽, 오른쪽 + 아래쪽 징두리 판벽 */}
        <polygon className="tone" points={pts([-W, 0, 0], [W, 0, 0], [W, 0, H], [-W, 0, H])} style={{ fill: p.wall }} />
        <polygon className="tone" points={pts([-W, 0, 0], [-W, D, 0], [-W, D, H], [-W, 0, H])} style={{ fill: shade(p.wall, 0.9) }} />
        <polygon className="tone" points={pts([W, 0, 0], [W, D, 0], [W, D, H], [W, 0, H])} style={{ fill: shade(p.wall, 0.86) }} />
        <polygon className="tone" points={pts([-W, 0, 0], [W, 0, 0], [W, 0, 1.4], [-W, 0, 1.4])} style={{ fill: k('#8A5A3B') }} />
        <polygon className="tone" points={pts([-W, 0, 0], [-W, D, 0], [-W, D, 1.4], [-W, 0, 1.4])} style={{ fill: k('#7A4F33') }} />
        <polygon className="tone" points={pts([W, 0, 0], [W, D, 0], [W, D, 1.4], [W, 0, 1.4])} style={{ fill: k('#734A30') }} />

        {/* 창문 너머 풍경 */}
        <g clipPath="url(#room-glass)">
          <rect x="-300" y="-300" width="600" height="400" fill="url(#room-sky)" />
          <circle className="tone" cx={sunX} cy={sunY} r={sunR} fill="#FFE2B0" style={{ opacity: p.sun }} />
          <g className="tone" style={{ opacity: p.moon }}>
            <circle cx={sunX} cy={sunY} r={sunR * 0.8} fill="#F3E9DC" />
            <circle cx={sunX + sunR * 0.35} cy={sunY - sunR * 0.25} r={sunR * 0.7} fill="#1B2235" />
          </g>
          {FAR.map(([x, w, h]) => (
            <polygon key={x} className="tone" points={pts([x, OUT.far, OUT.ground], [x + w, OUT.far, OUT.ground], [x + w, OUT.far, h], [x, OUT.far, h])} style={{ fill: p.far }} />
          ))}
          <g className="tone" fill="#FFCF85" style={{ opacity: p.windows }}>
            {LIGHTS.map(([x, z], i) => (
              <polygon key={i} points={pts([x, OUT.far, z], [x + 0.18, OUT.far, z], [x + 0.18, OUT.far, z + 0.24], [x, OUT.far, z + 0.24])} opacity={0.5 + (i % 3) * 0.2} />
            ))}
          </g>
          {NEAR.map(([x, w, h]) => (
            <polygon key={x} className="tone" points={pts([x, OUT.near, OUT.ground], [x + w, OUT.near, OUT.ground], [x + w, OUT.near, h], [x, OUT.near, h])} style={{ fill: p.near }} />
          ))}
        </g>
        {/* 창틀 */}
        <g stroke="#3A2A22" strokeWidth="5" fill="none" strokeLinejoin="round">
          <polygon points={pts([WIN.x1, 0, WIN.z1], [WIN.x2, 0, WIN.z1], [WIN.x2, 0, WIN.z2], [WIN.x1, 0, WIN.z2])} />
          <polyline points={pts([(WIN.x1 + WIN.x2) / 2, 0, WIN.z1], [(WIN.x1 + WIN.x2) / 2, 0, WIN.z2])} />
          <polyline points={pts([WIN.x1, 0, 3.4], [WIN.x2, 0, 3.4])} strokeWidth="3" />
        </g>
        <polygon className="tone" points={pts([WIN.x1 - 0.2, 0, WIN.z1 - 0.15], [WIN.x2 + 0.2, 0, WIN.z1 - 0.15], [WIN.x2 + 0.2, 0.35, WIN.z1 - 0.15], [WIN.x1 - 0.2, 0.35, WIN.z1 - 0.15])} style={{ fill: k('#C08A5E') }} />

        {/* 창으로 들어온 햇빛 */}
        <polygon className="tone" points={pts([WIN.x1 + 0.6, 2.4, 0.01], [WIN.x2 + 0.6, 2.4, 0.01], [WIN.x2 + 2, 8, 0.01], [WIN.x1 + 2, 8, 0.01])} fill="#FFF4DC" style={{ opacity: p.patch }} />

        {/* 왼쪽 주방: 메뉴판 + 선반 + 뒤쪽 작업대(커피 머신) + 앞쪽 주문 카운터, 사이에 직원 동선 */}
        <polygon points={pts([-8.6, 0, 2.7], [-5.6, 0, 2.7], [-5.6, 0, 4.6], [-8.6, 0, 4.6])} fill={k('#2F3B33')} stroke="#3A2A22" strokeWidth="3" />
        <g stroke="#F3E9DC" strokeWidth="2" opacity=".6" strokeLinecap="round">
          {[4.25, 3.85, 3.5, 3.15].map((z, i) => {
            const [a, b] = [proj([-8.2, 0, z]), proj([i === 0 ? -7.1 : -6, 0, z])]
            return <line key={z} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
          })}
        </g>
        <Box at={[-W, 2.2, 3.3]} size={[0.5, 3.4, 0.1]} color={k('#8A5A3B')} />
        {[2.5, 3.1, 3.7, 4.3, 4.9].map((y, i) => (
          <Box key={y} at={[-W + 0.1, y, 3.4]} size={[0.32, 0.32, 0.38]} color={k(i % 2 ? '#D9822B' : '#F3E9DC')} />
        ))}
        {/* 뒤쪽 작업대 + 커피 머신 */}
        <Box at={[-W, 0, 0]} size={[3.8, 1.5, 1.9]} color={k('#8A5A3B')} top={k('#EDE3D3')} />
        <Box at={[-8.4, 0.15, 1.9]} size={[1.5, 0.9, 1.25]} color={k('#B9B5AE')} top={k('#DAD6CF')} />
        <Box at={[-8.2, 1.05, 2.25]} size={[0.25, 0.15, 0.3]} color={k('#4A4743')} />
        <Box at={[-7.5, 1.05, 2.25]} size={[0.25, 0.15, 0.3]} color={k('#4A4743')} />
        {/* 추출 중인 커피 줄기 + 받치는 잔 */}
        <polyline className="pour" points={pts([-7.375, 1.13, 2.25], [-7.375, 1.13, 2.12])} stroke="#6B3E22" strokeWidth="2.5" strokeLinecap="round" />
        <Box at={[-7.52, 1.0, 1.9]} size={[0.3, 0.3, 0.24]} color={k('#F3E9DC')} />
        <Steam v={[-7.65, 0.6, 3.2]} size={0.7} />
        <Steam v={[-7.37, 1.15, 2.2]} size={0.35} />
        <Box at={[-6.5, 0.3, 1.9]} size={[0.6, 0.6, 1]} color={k('#3A2C26')} top={k('#5A4438')} />
        {[0.3, 0.8].map((y) => (
          <Box key={y} at={[-5.7, y, 1.9]} size={[0.32, 0.32, 0.36]} color={k('#F3E9DC')} />
        ))}

        {/* 직원 1: 머신 앞에서 커피를 내린다 (등을 보임) */}
        <Person v={[-7.4, 2.0, 0]} facing="back" shirt="#F3E9DC" apron="#5A3B28" hair="#3A2A22" k={k} />
        {/* 직원 2: 계산대에서 주문을 받는다 (손님을 보고 있음) */}
        <Person v={[-7.0, 2.7, 0]} facing="front" shirt="#F3E9DC" apron="#5A3B28" hair="#6B3E22" k={k} />

        {/* 앞쪽 주문 카운터 + 계산대 + 디저트 진열장 */}
        <Box at={[-W, 3.2, 0]} size={[3.8, 1, 1.9]} color={k('#8A5A3B')} top={k('#EDE3D3')} />
        <Box at={[-6.2, 3.35, 1.9]} size={[0.7, 0.5, 0.25]} color={k('#3A3B40')} top={k('#55565C')} />
        <polygon points={pts([-6.15, 3.4, 2.15], [-5.55, 3.4, 2.15], [-5.55, 3.4, 2.65], [-6.15, 3.4, 2.65])} fill="#2B2B30" />
        <polygon className="screen-blink" points={pts([-6.1, 3.4, 2.2], [-5.6, 3.4, 2.2], [-5.6, 3.4, 2.6], [-6.1, 3.4, 2.6])} fill="#CFE3F0" />
        <Box at={[-8.8, 3.35, 1.9]} size={[1.4, 0.7, 0.55]} color={k('#E6D8C4')} top={k('#F3E9DC')} />
        {[-8.5, -8.0].map((x) => (
          <Box key={x} at={[x, 3.6, 1.95]} size={[0.3, 0.3, 0.16]} color={k('#C9763A')} />
        ))}
        <Pendant x={-7.4} y={3.6} lamp={p.lamp} glow={[-7.4, 3.6, 1.9]} />

        {/* 주문하는 손님 */}
        <Stool x={-8.3} y={4.8} k={k} />
        <Person v={[-5.7, 4.9, 0]} facing="back" shirt="#7C8EA8" hair="#2B1E16" anim="idle" k={k} />

        {/* 오른쪽 뒤 구석 화분 */}
        <Box at={[7.6, 0.4, 0]} size={[0.9, 0.9, 1]} color={k('#B5643E')} />
        <At v={[8.05, 0.85, 1]}>
          <g transform="scale(0.011)">
            <path d="M0 0 C -40 -70, -110 -90, -130 -150 C -70 -130, -20 -90, 0 0 Z" fill={k('#6E7F5E')} />
            <path d="M0 0 C 20 -90, 80 -120, 120 -180 C 110 -110, 60 -60, 0 0 Z" fill={k('#7C8B6F')} />
            <path d="M0 0 C -10 -80, 10 -150, 0 -220 C 30 -150, 20 -80, 0 0 Z" fill={k('#5F6F51')} />
          </g>
        </At>

        {/* 창가 바 테이블 — 가운데가 내 자리 */}
        <Pendant x={0.6} y={0.7} lamp={p.lamp} glow={[0.6, 0.8, 1.9]} />
        <Box at={[-3.6, 0.2, 0]} size={[0.14, 0.14, 1.8]} color="#2B1E16" />
        <Box at={[4.5, 0.2, 0]} size={[0.14, 0.14, 1.8]} color="#2B1E16" />
        <Box at={[-3.8, 0.05, 1.8]} size={[8.6, 0.95, 0.14]} color={k('#8A5A3B')} top={k('#C08A5E')} />
        {/* 노트북: 내 쪽을 향해 열려 있어 카메라에는 뚜껑 뒷면이 보인다 */}
        {studying && (
          <ellipse cx={proj([0.6, 0.6, 2.3])[0]} cy={proj([0.6, 0.6, 2.3])[1]} rx={unitAt([0.6, 0.6, 2.3]) * 0.9} ry={unitAt([0.6, 0.6, 2.3]) * 0.55} fill="url(#room-screen)" />
        )}
        <Box at={[0.15, 0.55, 1.94]} size={[0.9, 0.55, 0.04]} color="#55565C" />
        <Box at={[0.15, 0.42, 1.94]} size={[0.9, 0.06, 0.62]} color="#3A3B40" top="#5C5D63" />
        <Box at={[1.6, 0.45, 1.94]} size={[0.3, 0.3, 0.34]} color={k('#F3E9DC')} />
        <Steam v={[1.75, 0.6, 2.32]} size={0.55} />
        <Box at={[-2.9, 0.45, 1.94]} size={[0.3, 0.3, 0.34]} color={k('#F3E9DC')} />
        {[-2.6, -1.0, 2.2, 3.8].map((x) => (
          <Stool key={x} x={x} y={1.6} k={k} />
        ))}
        <Stool x={0.6} y={1.6} k={k} />
        <Me v={[0.6, 1.6, 1.25]} typing={studying} k={k} />

        {/* 오른쪽 벽 부스 좌석 (소파 + 사각 테이블) */}
        {[2.6, 7.0].map((y) => (
          <g key={y}>
            <Box at={[8.5, y, 0.9]} size={[0.5, 3, 1.3]} color={k('#8C4A32')} />
            <Box at={[7.5, y, 0]} size={[1.5, 3, 0.9]} color={k('#8C4A32')} top={k('#A85D40')} />
            {y < 6 && <Pendant x={6.4} y={y + 1.5} lamp={p.lamp} glow={[6.4, y + 1.5, 1.5]} />}
            <Box at={[6.25, y + 1.35, 0]} size={[0.3, 0.3, 1.4]} color={k('#3A2A22')} />
            <Box at={[5.6, y + 0.6, 1.4]} size={[1.6, 1.8, 0.12]} color={k('#7A5038')} top={k('#C08A5E')} />
            <Box at={[6.1, y + 1.2, 1.52]} size={[0.26, 0.26, 0.3]} color={k('#F3E9DC')} />
            <Chair x={4.8} y={y + 1.6} k={k} />
          </g>
        ))}

        {/* 가운데 러그 + 둥근 손님 테이블 */}
        <polygon className="tone" points={disc(-0.6, 6.6, 0.02, 3.4)} style={{ fill: k('#B5643E') }} opacity=".5" />
        <polygon className="tone" points={disc(-0.6, 6.6, 0.03, 2.9)} fill="none" stroke={k('#F3E9DC')} strokeOpacity=".35" strokeWidth="2" />
        {[
          [-3.4, 4.6],
          [1.6, 4.4],
          [-1.4, 8.4],
          [-5.6, 9.2],
          [3.2, 9.0],
        ].map(([x, y]) => (
          <g key={`${x},${y}`}>
            {y < 6 ? (
              <Pendant x={x} y={y} lamp={p.lamp} glow={[x, y, 1.5]} />
            ) : (
              <g className="tone" style={{ opacity: p.lamp * 0.8 }}>
                <ellipse cx={proj([x, y, 1.5])[0]} cy={proj([x, y, 1.5])[1]} rx={unitAt([x, y, 1.5]) * 2.4} ry={unitAt([x, y, 1.5]) * 1.3} fill="url(#room-lamp)" />
              </g>
            )}
            <Chair x={x - 1.1} y={y + 0.2} k={k} />
            <RoundTable x={x} y={y} k={k} />
            <Chair x={x + 1.1} y={y + 0.2} k={k} />
          </g>
        ))}
        <Box at={[-3.6, 4.5, 1.5]} size={[0.26, 0.26, 0.3]} color={k('#F3E9DC')} />
        <Box at={[-1.2, 8.2, 1.5]} size={[0.26, 0.26, 0.3]} color={k('#F3E9DC')} />

        {/* 왼쪽 앞 화분 */}
        <Box at={[-8.6, 9.4, 0]} size={[1, 1, 1.1]} color={k('#B5643E')} />
        <At v={[-8.1, 9.9, 1.1]}>
          <g transform="scale(0.013)">
            <path d="M0 0 C -40 -70, -110 -90, -130 -150 C -70 -130, -20 -90, 0 0 Z" fill={k('#6E7F5E')} />
            <path d="M0 0 C 20 -90, 80 -120, 120 -180 C 110 -110, 60 -60, 0 0 Z" fill={k('#7C8B6F')} />
            <path d="M0 0 C -10 -80, 10 -150, 0 -220 C 30 -150, 20 -80, 0 0 Z" fill={k('#5F6F51')} />
          </g>
        </At>
      </svg>
      <ZoomControls zoom={zoom} />
    </div>
  )
}
