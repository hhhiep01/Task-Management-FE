import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-6">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">404</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Không tìm thấy trang</h1>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800"
        >
          Về trang chính
        </Link>
      </section>
    </main>
  )
}
