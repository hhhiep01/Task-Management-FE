import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { useEvaluationPeriods } from '@/features/evaluation-periods/hooks/useEvaluationPeriods'
import { MyTasksPanel } from '@/features/tasks/components/MyTasksPanel'
import { WorkTaskStatus } from '@/features/tasks/types/task.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate } from '@/utils/formatDate'

import { usePersonalAttentionTasks, usePersonalDashboardOverview } from '../hooks/usePersonalDashboard'
import type { PersonalAttentionTask, PersonalDashboardOverview } from '../types/personalDashboard.types'

const statusLabels: Record<WorkTaskStatus, string> = {
  [WorkTaskStatus.NEW]: 'Được giao',
  [WorkTaskStatus.IN_PROGRESS]: 'Đang thực hiện',
  [WorkTaskStatus.WAITING_EVALUATION]: 'Chờ đánh giá',
  [WorkTaskStatus.REVISION_REQUIRED]: 'Cần chỉnh sửa',
  [WorkTaskStatus.COMPLETED]: 'Đã hoàn thành',
  [WorkTaskStatus.CANCELLED]: 'Đã hủy',
}

const statusVariants: Record<WorkTaskStatus, 'neutral' | 'primary' | 'info' | 'warning' | 'success' | 'danger'> = {
  [WorkTaskStatus.NEW]: 'info',
  [WorkTaskStatus.IN_PROGRESS]: 'primary',
  [WorkTaskStatus.WAITING_EVALUATION]: 'warning',
  [WorkTaskStatus.REVISION_REQUIRED]: 'warning',
  [WorkTaskStatus.COMPLETED]: 'success',
  [WorkTaskStatus.CANCELLED]: 'neutral',
}

export function EmployeePage() {
  useDocumentTitle(`Nhân viên | ${env.appName}`)

  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const periodsQuery = useEvaluationPeriods({ pageNumber: 1, pageSize: 100 })
  const overviewQuery = usePersonalDashboardOverview({ periodId: selectedPeriodId || undefined })
  const attentionQuery = usePersonalAttentionTasks({ periodId: selectedPeriodId || undefined, limit: 5 })
  const navigate = useNavigate()
  const overview = overviewQuery.data
  const hasTasks = Boolean(overview && overview.totalTasks > 0)

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
            Trang cá nhân
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-strong)] sm:text-4xl">
            Công việc của tôi
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-text-muted)]">
            Theo dõi tiến độ, hạn xử lý và những công việc cần bạn ưu tiên.
          </p>
        </div>
        <label className="grid w-full gap-1.5 sm:max-w-xs">
          <span className="text-sm font-semibold text-[var(--color-text)]">Kỳ đánh giá</span>
          <select
            value={selectedPeriodId}
            onChange={(event) => setSelectedPeriodId(event.target.value)}
            className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 text-sm text-[var(--color-text-strong)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]"
          >
            <option value="">Kỳ hiện tại</option>
            {periodsQuery.data?.items.map((period) => (
              <option key={period.id} value={period.id}>{period.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6">
        {overviewQuery.isError ? (
          <DashboardMessage variant="error">
            {overviewQuery.error instanceof Error ? overviewQuery.error.message : 'Không tải được tổng quan công việc.'}
          </DashboardMessage>
        ) : overviewQuery.isLoading ? (
          <OverviewLoading />
        ) : hasTasks ? (
          <OverviewCards overview={overview} />
        ) : (
          <DashboardMessage>
            <p className="font-semibold text-[var(--color-text-strong)]">Chưa có công việc</p>
            <p className="mt-1">Hiện chưa có công việc nào trong kỳ đánh giá này.</p>
          </DashboardMessage>
        )}
      </div>

      <AttentionTasks
        tasks={attentionQuery.data ?? []}
        isLoading={attentionQuery.isLoading}
        isError={attentionQuery.isError}
        error={attentionQuery.error instanceof Error ? attentionQuery.error.message : undefined}
        onOpen={(taskId) => navigate(`/employee/tasks/${taskId}`)}
      />

      <div id="my-tasks" className="mt-8 scroll-mt-24">
        <MyTasksPanel controlledPeriodId={selectedPeriodId} />
      </div>
    </section>
  )
}

function OverviewCards({ overview }: { overview?: PersonalDashboardOverview }) {
  if (!overview) return null

  const cards = [
    { label: 'Tổng công việc', value: overview.totalTasks, tone: 'neutral' as const },
    { label: 'Được giao', value: overview.newTasks, tone: 'info' as const },
    { label: 'Đang thực hiện', value: overview.inProgressTasks, tone: 'primary' as const },
    { label: 'Chờ đánh giá', value: overview.waitingEvaluationTasks, tone: 'warning' as const },
    { label: 'Cần chỉnh sửa', value: overview.revisionRequiredTasks, tone: 'warning' as const },
    { label: 'Đã hoàn thành', value: overview.completedTasks, tone: 'success' as const },
    { label: 'Quá hạn', value: overview.overdueTasks, tone: 'danger' as const },
    { label: 'Sắp đến hạn', value: overview.dueSoonTasks, tone: 'warning' as const },
  ]

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-strong)]">Tổng quan tiến độ</h2>
          {overview.periodName ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">{overview.periodName}</p> : null}
        </div>
        <Badge variant="info">Cập nhật theo kỳ đánh giá</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => <MetricCard key={card.label} {...card} />)}
      </div>
    </div>
  )
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: 'neutral' | 'info' | 'primary' | 'warning' | 'success' | 'danger' }) {
  const valueClasses = {
    neutral: 'text-[var(--color-text-strong)]',
    info: 'text-[var(--color-info)]',
    primary: 'text-[var(--color-primary)]',
    warning: 'text-[var(--color-warning)]',
    success: 'text-[var(--color-success)]',
    danger: 'text-[var(--color-danger)]',
  }

  return (
    <Card variant="flat" className="p-4 sm:p-5">
      <p className="text-sm font-medium text-[var(--color-text-muted)]">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClasses[tone]}`}>{value}</p>
    </Card>
  )
}

function AttentionTasks({ tasks, isLoading, isError, error, onOpen }: { tasks: PersonalAttentionTask[]; isLoading: boolean; isError: boolean; error?: string; onOpen: (taskId: string) => void }) {
  return (
    <Card className="mt-8 overflow-hidden">
      <div className="flex flex-col justify-between gap-2 border-b border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-strong)]">Công việc cần chú ý</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Ưu tiên xử lý các công việc sắp đến hạn hoặc cần chỉnh sửa.</p>
        </div>
        <Badge variant="warning">Tối đa 5 công việc</Badge>
      </div>
      {isLoading ? <p className="px-5 py-6 text-sm text-[var(--color-text-muted)]">Đang tải công việc cần chú ý...</p> : null}
      {isError ? <p className="px-5 py-6 text-sm text-[var(--color-danger)]">{error || 'Không tải được công việc cần chú ý.'}</p> : null}
      {!isLoading && !isError && !tasks.length ? <p className="px-5 py-8 text-sm text-[var(--color-text-muted)]">Không có công việc cần chú ý.</p> : null}
      {!isLoading && !isError && tasks.length ? (
        <div className="divide-y divide-[var(--color-border)]">
          {tasks.map((task) => (
            <div key={task.taskId} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-[var(--color-text-strong)]">{task.title}</h3>
                  <Badge variant={statusVariants[task.status]}>{statusLabels[task.status]}</Badge>
                  {task.isOverdue ? <Badge variant="danger">Quá hạn</Badge> : null}
                  {!task.isOverdue && task.isDueSoon ? <Badge variant="warning">Sắp đến hạn</Badge> : null}
                </div>
                <div className="mt-3 grid gap-2 text-sm text-[var(--color-text-muted)] sm:grid-cols-3">
                  <span>Kỳ: {task.periodName || '-'}</span>
                  <span>Hạn: {formatDate(task.dueDate)}</span>
                  <span>Tiến độ: {task.progressPercent}%</span>
                </div>
                <div className="mt-2 h-2 max-w-xl overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                  <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.min(100, Math.max(0, task.progressPercent))}%` }} />
                </div>
              </div>
              <Button type="button" variant="secondary" size="sm" className="w-full shrink-0 sm:w-auto" onClick={() => onOpen(task.taskId)}>
                Xem công việc
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  )
}

function DashboardMessage({ children, variant = 'neutral' }: { children: ReactNode; variant?: 'neutral' | 'error' }) {
  return <Card variant="muted" className={`px-5 py-6 text-sm ${variant === 'error' ? 'border-[var(--color-danger)] text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}`}>{children}</Card>
}

function OverviewLoading() {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <Card key={index} className="h-28 animate-pulse bg-[var(--color-surface-muted)]" />)}</div>
}
