import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { env } from '@/config/env'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

import { TaskDetailContent } from '../components/TaskDetailContent'
import { useTask } from '../hooks/useTask'
import type { Task } from '../types/task.types'
import {
  getAssigneeName,
  getDueBadge,
  getPeriodName,
  getStatusVariant,
  getTaskStatusDisplay,
} from '../utils/taskPresentation'

function getTaskListPath(role?: string) {
  return role === 'employee' ? '/employee' : '/manager/tasks'
}

export function TaskDetailPage() {
  const { taskId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const taskQuery = useTask(taskId)
  const task = taskQuery.data
  const listPath = getTaskListPath(user?.role)

  useDocumentTitle(`${task?.title ?? 'Chi tiết công việc'} | ${env.appName}`)

  if (!taskId) {
    return (
      <TaskDetailShell
        title="Không tìm thấy công việc"
        description="Đường dẫn chi tiết công việc không có mã công việc hợp lệ."
        onBack={() => navigate(listPath)}
      >
        <StateCard tone="danger" message="Không thể tải chi tiết vì thiếu mã công việc." />
      </TaskDetailShell>
    )
  }

  if (taskQuery.isLoading) {
    return (
      <TaskDetailShell
        title="Đang tải chi tiết công việc"
        description="Hệ thống đang lấy dữ liệu mới nhất của công việc."
        onBack={() => navigate(listPath)}
      >
        <StateCard message="Đang tải chi tiết công việc..." />
      </TaskDetailShell>
    )
  }

  if (taskQuery.isError || !task) {
    const message =
      taskQuery.error instanceof Error
        ? taskQuery.error.message
        : 'Không tải được chi tiết công việc.'

    return (
      <TaskDetailShell
        title="Không tải được chi tiết công việc"
        description="Vui lòng kiểm tra kết nối hoặc quay lại danh sách công việc."
        onBack={() => navigate(listPath)}
      >
        <StateCard tone="danger" message={message} />
      </TaskDetailShell>
    )
  }

  return (
    <TaskDetailShell
      title={task.title}
      description={<TaskHeaderSummary task={task} />}
      onBack={() => navigate(listPath)}
    >
      <TaskDetailContent task={task} />
    </TaskDetailShell>
  )
}

function TaskDetailShell({
  title,
  description,
  actions,
  children,
  onBack,
}: {
  title: string
  description: ReactNode
  actions?: ReactNode
  children: ReactNode
  onBack: () => void
}) {
  return (
    <section className="grid gap-4">
      <PageHeader
        eyebrow="Chi tiết công việc"
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            <Button type="button" variant="secondary" size="sm" onClick={onBack}>
              Quay lại
            </Button>
          </div>
        }
      />
      {children}
    </section>
  )
}

function TaskHeaderSummary({ task }: { task: Task }) {
  const dueBadge = getDueBadge(task)

  return (
    <span className="grid gap-2">
      <span className="flex flex-wrap gap-2">
        <Badge variant={getStatusVariant(task)}>{getTaskStatusDisplay(task)}</Badge>
        <Badge variant={dueBadge.variant}>{dueBadge.label}</Badge>
      </span>
      <span className="flex flex-wrap gap-x-5 gap-y-1">
        <span>Kỳ đánh giá: <strong className="font-semibold text-[var(--color-text)]">{getPeriodName(task)}</strong></span>
        <span>Người nhận: <strong className="font-semibold text-[var(--color-text)]">{getAssigneeName(task)}</strong></span>
      </span>
    </span>
  )
}

function StateCard({ message, tone = 'neutral' }: { message: string; tone?: 'neutral' | 'danger' }) {
  return (
    <Card
      className={`px-4 py-6 text-sm ${
        tone === 'danger' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'
      }`}
    >
      {message}
    </Card>
  )
}
