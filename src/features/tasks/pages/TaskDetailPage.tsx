import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

import { TaskDetailContent } from '../components/TaskDetailContent'
import { useTask } from '../hooks/useTask'
import { useTaskEvaluationHistory } from '../hooks/useTaskEvaluations'
import type { Task } from '../types/task.types'
import {
  getPeriodName,
  getStatusVariant,
  getTaskStatusSecondaryText,
  getTaskStatusDisplay,
} from '../utils/taskPresentation'

function getTaskListPath(role?: string, fromWaitingEvaluation = false) {
  if (fromWaitingEvaluation && role === 'manager') return '/manager/waiting-evaluation'
  return role === 'employee' ? '/employee' : '/manager/tasks'
}

export function TaskDetailPage() {
  const { taskId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const taskQuery = useTask(taskId)
  const evaluationHistoryQuery = useTaskEvaluationHistory(taskId)
  const task = taskQuery.data
  const listPath = getTaskListPath(
    user?.role,
    new URLSearchParams(location.search).get('from') === 'waiting-evaluation',
  )
  const latestEvaluation = useMemo(
    () =>
      [...(evaluationHistoryQuery.data ?? [])].sort(
        (left, right) => right.evaluationRound - left.evaluationRound,
      )[0],
    [evaluationHistoryQuery.data],
  )

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
        <TaskDetailLoading />
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
        title="Không thể tải chi tiết công việc"
        description="Vui lòng kiểm tra kết nối hoặc thử tải lại dữ liệu."
        onBack={() => navigate(listPath)}
        actions={
          <Button
            type="button"
            size="sm"
            onClick={() => void taskQuery.refetch()}
            disabled={taskQuery.isFetching}
          >
            {taskQuery.isFetching ? 'Đang tải...' : 'Thử lại'}
          </Button>
        }
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
      <TaskDetailContent task={task} latestEvaluation={latestEvaluation} />
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
    <section className="grid min-w-0 gap-5">
      <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            Công việc / Chi tiết công việc
          </p>
          <h1 className="mt-2 max-w-4xl break-words text-2xl font-bold leading-tight text-[var(--color-text-strong)] sm:text-3xl">
            {title}
          </h1>
          <div className="mt-3 min-w-0">{description}</div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
          <Button type="button" variant="secondary" size="sm" onClick={onBack}>
            Quay lại
          </Button>
        </div>
      </div>
      {children}
    </section>
  )
}

function TaskHeaderSummary({ task }: { task: Task }) {
  const secondaryText = getTaskStatusSecondaryText(task)

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Badge variant={getStatusVariant(task)}>{getTaskStatusDisplay(task)}</Badge>
      {secondaryText ? (
        <span
          className={`text-sm font-medium ${
            task.status === 'REVISION_REQUIRED'
              ? 'text-[var(--color-warning)]'
              : 'text-[var(--color-text-muted)]'
          }`}
        >
          {secondaryText}
        </span>
      ) : null}
      <Badge variant="info">{getWorkTypeLabel(task.workType)}</Badge>
      <Badge variant="neutral">{getPeriodName(task)}</Badge>
    </div>
  )
}

function getWorkTypeLabel(workType?: string | null) {
  if (workType === 'AD_HOC') return 'Đột xuất'
  if (workType === 'REGULAR') return 'Thường xuyên'
  return '-'
}

function TaskDetailLoading() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Đang tải chi tiết công việc">
      <Card className="grid gap-4 p-5">
        <div className="h-5 w-48 max-w-full animate-pulse rounded bg-[var(--color-surface-muted)]" />
        <div className="h-20 w-full animate-pulse rounded bg-[var(--color-surface-muted)]" />
      </Card>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="h-64 animate-pulse bg-[var(--color-surface-muted)]" />
        <Card className="h-64 animate-pulse bg-[var(--color-surface-muted)]" />
      </div>
    </div>
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
