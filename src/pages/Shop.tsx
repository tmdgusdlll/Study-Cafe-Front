import { Link } from 'react-router-dom'
import SceneLayout from '../components/SceneLayout.tsx'

// 상점 화면은 다음 작업 — 지금은 라우트 자리만
export default function Shop() {
  return (
    <SceneLayout>
      <section className="panel w-full max-w-[380px] rounded-lg p-7 text-center">
        <h1 className="font-serif text-[32px]">상점 준비 중</h1>
        <p className="mt-2 mb-6 text-sm text-muted">모은 포인트로 자리를 꾸밀 수 있게 준비하고 있어요.</p>
        <Link to="/home" className="btn btn-secondary w-full">
          자리로 돌아가기
        </Link>
      </section>
    </SceneLayout>
  )
}
