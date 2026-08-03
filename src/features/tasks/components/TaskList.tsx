import type { Task } from '../types/task.types'

type TaskListProps = {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-950">Recent tasks</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_120px_120px_100px] sm:items-center"
          >
            <p className="font-medium text-slate-900">{task.title}</p>
            <p className="text-sm text-slate-600">{task.owner}</p>
            <span className="w-fit rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
              {task.status}
            </span>
            <p className="text-sm text-slate-500 sm:text-right">{task.due}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
