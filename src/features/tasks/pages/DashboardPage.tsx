import { Button } from '@/components/ui/Button'
import { env } from '@/config/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

import { TaskList } from '../components/TaskList'
import { TaskSummaryCard } from '../components/TaskSummaryCard'
import { recentTasks, taskSummaries } from '../data/task.data'

export function DashboardPage() {
  useDocumentTitle(`Dashboard | ${env.appName}`)

  return (
    <section>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
            {env.appName}
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">Task dashboard</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Clean frontend structure for pages, shared UI, hooks, services, and
            feature modules.
          </p>
        </div>
        <Button>New task</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {taskSummaries.map((summary) => (
          <TaskSummaryCard key={summary.label} {...summary} />
        ))}
      </div>

      <div className="mt-6">
        <TaskList tasks={recentTasks} />
      </div>
    </section>
  )
}
