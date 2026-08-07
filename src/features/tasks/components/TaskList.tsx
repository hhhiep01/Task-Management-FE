import { Badge } from '@/components/ui/Badge'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'

import { WorkTaskStatus, getTaskStatusLabel, type Task } from '../types/task.types'

type TaskListProps = {
  tasks: Task[]
}

const dashboardToday = new Date('2026-08-07T00:00:00')

function getAssigneeName(task: Task) {
  return task.assignee?.fullName ?? task.assigneeName ?? task.owner ?? '-'
}

function getProgress(task: Task) {
  return Math.min(100, Math.max(0, task.progressPercent ?? 0))
}

function getDaysUntilDue(task: Task) {
  if (!task.dueDate) {
    return null
  }

  const dueDate = new Date(`${task.dueDate.slice(0, 10)}T00:00:00`)
  return Math.round((dueDate.getTime() - dashboardToday.getTime()) / 86_400_000)
}

function isClosedTask(task: Task) {
  return task.status === WorkTaskStatus.COMPLETED || task.status === WorkTaskStatus.CANCELLED
}

function getTaskTiming(task: Task) {
  const daysUntilDue = getDaysUntilDue(task)

  if (isClosedTask(task)) {
    return { label: task.due ?? 'Đã xử lý', variant: 'neutral' as const }
  }

  if (daysUntilDue === null) {
    return { label: task.due ?? 'Chưa có hạn', variant: 'neutral' as const }
  }

  if (daysUntilDue < 0) {
    return { label: `Quá hạn ${Math.abs(daysUntilDue)} ngày`, variant: 'danger' as const }
  }

  if (daysUntilDue === 0) {
    return { label: 'Hạn hôm nay', variant: 'warning' as const }
  }

  if (daysUntilDue <= 2) {
    return { label: `Còn ${daysUntilDue} ngày`, variant: 'warning' as const }
  }

  return { label: task.due ?? `Còn ${daysUntilDue} ngày`, variant: 'info' as const }
}

function getStatusVariant(task: Task) {
  if (task.status === WorkTaskStatus.COMPLETED) {
    return 'success' as const
  }

  if (task.status === WorkTaskStatus.CANCELLED) {
    return 'neutral' as const
  }

  if (task.status === WorkTaskStatus.IN_PROGRESS) {
    return 'primary' as const
  }

  return 'info' as const
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="grid min-w-36 gap-2">
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-200"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-[var(--color-text-muted)]">{value}%</span>
    </div>
  )
}

const columns: DataTableColumn<Task>[] = [
  {
    key: 'task',
    header: 'Công việc',
    className: 'min-w-72',
    render: (task) => (
      <div>
        <p className="font-semibold text-[var(--color-text-strong)]">{task.title}</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {task.workTemplateName ?? 'Danh mục chưa xác định'}
        </p>
      </div>
    ),
  },
  {
    key: 'assignee',
    header: 'Người phụ trách',
    className: 'whitespace-nowrap text-[var(--color-text)]',
    render: getAssigneeName,
  },
  {
    key: 'status',
    header: 'Trạng thái',
    className: 'whitespace-nowrap',
    render: (task) => (
      <Badge variant={getStatusVariant(task)}>{getTaskStatusLabel(task.status)}</Badge>
    ),
  },
  {
    key: 'progress',
    header: 'Tiến độ',
    render: (task) => <ProgressBar value={getProgress(task)} />,
  },
  {
    key: 'due',
    header: 'Hạn xử lý',
    className: 'whitespace-nowrap',
    render: (task) => {
      const timing = getTaskTiming(task)

      return <Badge variant={timing.variant}>{timing.label}</Badge>
    },
  },
  {
    key: 'period',
    header: 'Kỳ',
    className: 'whitespace-nowrap text-[var(--color-text-muted)]',
    render: (task) => task.periodName ?? '-',
  },
]

export function TaskList({ tasks }: TaskListProps) {
  return (
    <DataTable
      title="Danh sách công việc cần theo dõi"
      items={tasks}
      columns={columns}
      getRowKey={(task) => task.id}
      countLabel={`${tasks.length} công việc đang hiển thị`}
      minWidthClassName="min-w-[1080px]"
      emptyMessage="Chưa có công việc nào cần theo dõi."
    />
  )
}
