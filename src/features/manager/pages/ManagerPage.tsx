import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { MyTasksPanel } from '@/features/tasks/components/MyTasksPanel'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function ManagerPage() {
  useDocumentTitle(`Trưởng phòng | ${env.appName}`)

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
        Trang trưởng phòng
      </p>
      <h1 className="mt-2 text-4xl font-bold text-slate-950">Tổng quan phòng ban</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Trưởng phòng có thể theo dõi khối lượng công việc, phê duyệt và tiến độ thực hiện.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to="/manager/accounts"
          className="inline-flex rounded-md bg-cyan-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
        >
          Quản lý tài khoản
        </Link>
        <Link
          to="/manager/organizations"
          className="inline-flex rounded-md bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          Quản lý phòng ban
        </Link>
        <Link
          to="/manager/evaluation-periods"
          className="inline-flex rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Quản lý kỳ đánh giá
        </Link>
        <Link
          to="/manager/work-categories"
          className="inline-flex rounded-md bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800"
        >
          Quản lý nhóm công việc
        </Link>
        <Link
          to="/manager/work-templates"
          className="inline-flex rounded-md bg-fuchsia-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-fuchsia-800"
        >
          Quản lý danh mục công việc
        </Link>
        <Link
          to="/manager/tasks"
          className="inline-flex rounded-md bg-cyan-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
        >
          Giao việc
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Công việc của phòng</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">18</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Chờ phê duyệt</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">5</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Có rủi ro</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">1</p>
        </Card>
      </div>

      <MyTasksPanel />
    </section>
  )
}
