import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { getAccessToken } from './api/auth.ts'
import Home from './pages/Home.tsx'
import Landing from './pages/Landing.tsx'
import Login from './pages/Login.tsx'
import Shop from './pages/Shop.tsx'
import Signup from './pages/Signup.tsx'

// 로그아웃 상태로 홈·상점에 오면 랜딩으로
function RequireAuth({ children }: { children: ReactNode }) {
  return getAccessToken() ? children : <Navigate to="/" replace />
}

// 로그인 상태로 랜딩·로그인·회원가입에 오면 홈으로
function GuestOnly({ children }: { children: ReactNode }) {
  return getAccessToken() ? <Navigate to="/home" replace /> : children
}

export default function App() {
  return (
    // OS "동작 줄이기" 설정 존중
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route path="/" element={<GuestOnly><Landing /></GuestOnly>} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
        <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/shop" element={<RequireAuth><Shop /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MotionConfig>
  )
}
