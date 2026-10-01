import { Route, Routes } from 'react-router-dom'

// 임시 홈 — Tailwind 동작 확인용. 실제 화면(로그인/세션/상점)은 이후 추가
function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2">
      <h1 className="text-3xl font-bold">Study-Cafe</h1>
      <p className="text-gray-500">프론트 골격 준비 완료</p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}
