import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

import { AdminTabs } from '../components/AdminTabs'

export function AdminPage() {
  useDocumentTitle(`Quản trị | ${env.appName}`)

  return (
    <section>
      <AdminTabs />

      <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
        Trang quản trị
      </p>
      <h1 className="mt-2 text-4xl font-bold text-slate-950">Quản trị hệ thống</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Quản trị viên có thể quản lý người dùng, vai trò, cấu hình và dữ liệu toàn hệ thống.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-950">Tài khoản người dùng</h2>
          <p className="mt-2 text-slate-600">Tạo, cập nhật và quản lý tài khoản truy cập.</p>
          <Link
            to="/admin/accounts"
            className="mt-4 inline-flex rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
          >
            Quản lý tài khoản
          </Link>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-950">Phòng ban</h2>
          <p className="mt-2 text-slate-600">Quản lý cơ cấu phòng ban trong hệ thống.</p>
          <Link
            to="/admin/organizations"
            className="mt-4 inline-flex rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
          >
            Quản lý phòng ban
          </Link>
        </Card>
      </div>
    </section>
  )
}
