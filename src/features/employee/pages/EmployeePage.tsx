import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { MyTasksPanel } from '@/features/tasks/components/MyTasksPanel'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function EmployeePage() {
  useDocumentTitle(`Nhân viên | ${env.appName}`)

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
        Trang nhân viên
      </p>
      <h1 className="mt-2 text-4xl font-bold text-slate-950">Công việc của tôi</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Nhân viên có thể xem công việc được giao, cập nhật tiến độ và gửi kết quả để xét duyệt.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Được giao</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">6</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Đang thực hiện</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">3</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Chờ xét duyệt</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">2</p>
        </Card>
      </div>

      <MyTasksPanel />
    </section>
  )
}
