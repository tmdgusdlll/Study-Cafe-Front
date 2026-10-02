import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import SceneLayout from '../components/SceneLayout.tsx'

export default function Landing() {
  return (
    <SceneLayout align="right">
      <motion.section
        className="panel w-full max-w-[480px] rounded-lg p-7 sm:p-9"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.6, bounce: 0 }}
      >
        <p className="text-[13px] tracking-[.04em] text-muted">늦은 밤, 늘 앉던 창가 자리</p>
        <h1 className="mt-4 mb-4 font-serif text-[clamp(52px,8vw,88px)] leading-[.95] font-normal tracking-[-0.02em] [font-variation-settings:'opsz'_144]">
          Study-<em className="text-amber">Cafe</em>
        </h1>
        <p className="mb-8 text-[16px] leading-[1.7] text-muted">
          램프 하나 켜고 커피 한 잔 옆에 두면 시간이 조용히 흘러갑니다. 채운 시간만큼 포인트가 쌓이는 나만의 단골 카페.
        </p>
        <div className="flex gap-2.5">
          <Link to="/login" className="btn btn-primary flex-1">
            로그인
          </Link>
          <Link to="/signup" className="btn btn-secondary flex-1">
            회원가입
          </Link>
        </div>
      </motion.section>
    </SceneLayout>
  )
}
