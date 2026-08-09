import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { env } from '@/config/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

import { TaskList } from '../components/TaskList'
import { TaskSummaryCard } from '../components/TaskSummaryCard'
import { recentTasks } from '../data/task.data'
import { WorkTaskStatus, getTaskStatusLabel, type Task } from '../types/task.types'

const dashboardToday = new Date('2026-08-07T00:00:00')

function isClosedTask(task: Task) {
  return task.status === WorkTaskStatus.COMPLETED || task.status === WorkTaskStatus.CANCELLED
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

function getTimingLabel(task: Task) {
  const daysUntilDue = getDaysUntilDue(task)

  if (isClosedTask(task)) {
    return task.due ?? 'Đã xử lý'
  }

  if (daysUntilDue === null) {
    return task.due ?? 'Chưa có hạn'
  }

  if (daysUntilDue < 0) {
    return `Quá hạn ${Math.abs(daysUntilDue)} ngày`
  }

  if (daysUntilDue === 0) {
    return 'Hạn hôm nay'
  }

  return `Còn ${daysUntilDue} ngày`
}

function getStatusTone(status: string) {
  if (status === WorkTaskStatus.COMPLETED) {
    return 'bg-[var(--color-success)]'
  }

  if (status === WorkTaskStatus.IN_PROGRESS) {
    return 'bg-[var(--color-primary)]'
  }

  if (status === WorkTaskStatus.WAITING_EVALUATION) {
    return 'bg-[var(--color-warning)]'
  }

  if (status === WorkTaskStatus.REVISION_REQUIRED) {
    return 'bg-[var(--color-warning)]'
  }

  if (status === WorkTaskStatus.CANCELLED) {
    return 'bg-slate-400'
  }

  return 'bg-[var(--color-info)]'
}

function DashboardProgress({ value }: { value: number }) {
  return (
    <div className="grid gap-2">
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-200"
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="flex justify-between text-xs font-semibold text-[var(--color-text-muted)]">
        <span>0%</span>
        <span>{value}%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

export function DashboardPage() {
  useDocumentTitle(`Dashboard | ${env.appName}`)

  const totalTasks = recentTasks.length
  const activeTasks = recentTasks.filter((task) => !isClosedTask(task))
  const completedTasks = recentTasks.filter((task) => task.status === WorkTaskStatus.COMPLETED)
  const overdueTasks = recentTasks.filter((task) => {
    const daysUntilDue = getDaysUntilDue(task)

    return !isClosedTask(task) && daysUntilDue !== null && daysUntilDue < 0
  })
  const urgentTasks = recentTasks.filter((task) => {
    const daysUntilDue = getDaysUntilDue(task)

    return !isClosedTask(task) && daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 2
  })
  const averageProgress = Math.round(
    recentTasks.reduce((total, task) => total + getProgress(task), 0) / totalTasks,
  )
  const completionRate = Math.round((completedTasks.length / totalTasks) * 100)
  const statusRows = [
    WorkTaskStatus.NEW,
    WorkTaskStatus.IN_PROGRESS,
    WorkTaskStatus.WAITING_EVALUATION,
    WorkTaskStatus.REVISION_REQUIRED,
    WorkTaskStatus.COMPLETED,
    WorkTaskStatus.CANCELLED,
  ].map((status) => {
    const count = recentTasks.filter((task) => task.status === status).length

    return {
      status,
      count,
      percent: Math.round((count / totalTasks) * 100),
    }
  })
  const riskTasks = [...overdueTasks, ...urgentTasks].slice(0, 4)

  return (
    <section className="grid gap-6">
      <PageHeader
        eyebrow={env.appName}
        title="Tổng quan công việc"
        description="Theo dõi tình trạng giao việc, tiến độ xử lý và các nhiệm vụ cần ưu tiên trong kỳ hiện tại."
        actions={
          <>
            <Button variant="secondary">Xuất báo cáo</Button>
            <Button>Giao công việc</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TaskSummaryCard
          label="Tổng công việc"
          value={totalTasks}
          description={`${activeTasks.length} công việc còn mở trong kỳ hiện tại`}
          tone="primary"
          badge="Live"
        />
        <TaskSummaryCard
          label="Hoàn thành"
          value={`${completionRate}%`}
          description={`${completedTasks.length} công việc đã hoàn thành đúng quy trình`}
          tone="success"
          badge={`${completedTasks.length}/${totalTasks}`}
        />
        <TaskSummaryCard
          label="Khẩn cấp"
          value={urgentTasks.length}
          description="Đến hạn trong hôm nay hoặc 2 ngày tới"
          tone="warning"
          badge="Ưu tiên"
        />
        <TaskSummaryCard
          label="Quá hạn"
          value={overdueTasks.length}
          description="Cần xử lý hoặc cập nhật trạng thái ngay"
          tone="danger"
          badge="Rủi ro"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-strong)]">
                Trạng thái công việc
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Phân bổ công việc theo trạng thái để phát hiện điểm nghẽn.
              </p>
            </div>
            <Badge variant="primary">{activeTasks.length} đang mở</Badge>
          </div>

          <div className="mt-5 grid gap-4">
            {statusRows.map((row) => (
              <div key={row.status} className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${getStatusTone(row.status)}`} />
                    <span className="text-sm font-semibold text-[var(--color-text-strong)]">
                      {getTaskStatusLabel(row.status)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-text-muted)]">
                    {row.count} công việc
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                  <div
                    className={`h-full rounded-full ${getStatusTone(row.status)}`}
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-strong)]">
                Tiến độ chung
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Mức hoàn thành trung bình trên toàn bộ danh sách theo dõi.
              </p>
            </div>
            <Badge variant="info">{averageProgress}% trung bình</Badge>
          </div>

          <div className="mt-6">
            <DashboardProgress value={averageProgress} />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-5">
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-strong)]">
                {activeTasks.length}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                Đang mở
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-strong)]">
                {completedTasks.length}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                Hoàn tất
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-danger)]">
                {overdueTasks.length}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                Rủi ro
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-strong)]">
                Cần chú ý
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Công việc quá hạn hoặc sắp đến hạn.
              </p>
            </div>
            <Badge variant={overdueTasks.length ? 'danger' : 'warning'}>
              {riskTasks.length} mục
            </Badge>
          </div>

          <div className="mt-5 divide-y divide-[var(--color-border)]">
            {riskTasks.map((task) => (
              <div key={task.id} className="grid gap-3 py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--color-text-strong)]">{task.title}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {task.assigneeName ?? task.owner} · {task.workTemplateName}
                    </p>
                  </div>
                  <Badge variant={getDaysUntilDue(task)! < 0 ? 'danger' : 'warning'}>
                    {getTimingLabel(task)}
                  </Badge>
                </div>
                <DashboardProgress value={getProgress(task)} />
              </div>
            ))}
          </div>
        </Card>

        <TaskList tasks={recentTasks} />
      </div>
    </section>
  )
}
