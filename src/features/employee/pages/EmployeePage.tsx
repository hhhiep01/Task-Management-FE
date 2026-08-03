import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function EmployeePage() {
  useDocumentTitle(`Employee | ${env.appName}`)

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
        Employee page
      </p>
      <h1 className="mt-2 text-4xl font-bold text-slate-950">My tasks</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Employee can view assigned tasks, update progress, and submit work for review.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Assigned</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">6</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">In progress</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">3</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Pending review</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">2</p>
        </Card>
      </div>
    </section>
  )
}
