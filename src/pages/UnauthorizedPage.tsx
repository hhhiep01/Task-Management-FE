import { Link } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { getUserHomePath } from '@/features/auth/utils/redirects'

export function UnauthorizedPage() {
  const { user } = useAuth()
  const homePath = getUserHomePath(user)
  const actionLabel = user ? 'Về trang của tôi' : 'Chọn tài khoản đăng nhập khác'

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-6">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-red-600">403</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Không có quyền truy cập</h1>
        <p className="mt-3 text-slate-600">Tài khoản của bạn không có quyền vào trang này.</p>
        <Link
          to={homePath}
          className="mt-6 inline-flex rounded-md bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800"
        >
          {actionLabel}
        </Link>
      </section>
    </main>
  )
}
