import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function ManagerPage() {
  useDocumentTitle(`Manager | ${env.appName}`)

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
        Manager page
      </p>
      <h1 className="mt-2 text-4xl font-bold text-slate-950">Team overview</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Manager can review team workload, approve tasks, and monitor delivery progress.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Team tasks</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">18</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Waiting approval</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">5</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">At risk</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">1</p>
        </Card>
      </div>
    </section>
  )
}
