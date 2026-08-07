import { useState } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { getWorkTypeLabel } from '@/features/work-templates/types/workTemplate.types'
import { formatDate } from '@/utils/formatDate'

import { useMyTasks } from '../hooks/useTasks'
import { WorkTaskStatus, getTaskStatusLabel, type Task } from '../types/task.types'

function getProgress(task: Task) {
  return Math.min(100, Math.max(0, task.progressPercent ?? 0))
}

function isClosedTask(task: Task) {
  return task.status === WorkTaskStatus.COMPLETED || task.status === WorkTaskStatus.CANCELLED
}

function getDaysUntilDue(task: Task) {
  if (!task.dueDate) return null

  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`)
  const dueDate = new Date(`${task.dueDate.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(dueDate.getTime())) return null

  return Math.round((dueDate.getTime() - today.getTime()) / 86_400_000)
}

function isRevisionRequired(task: Task) {
  const text = `${task.status} ${task.resultDescription ?? ''}`.toLowerCase()
  return text.includes('revision_required') || text.includes('revision') || text.includes('revise') || text.includes('sửa')
}

function getStatusVariant(task: Task) {
  if (isRevisionRequired(task)) return 'warning' as const
  if (task.status === WorkTaskStatus.COMPLETED) return 'success' as const
  if (task.status === WorkTaskStatus.CANCELLED) return 'neutral' as const
  if (task.status === WorkTaskStatus.IN_PROGRESS) return 'primary' as const
  return 'info' as const
}

function getDueBadge(task: Task) {
  const daysUntilDue = getDaysUntilDue(task)

  if (isClosedTask(task)) return { label: formatDate(task.dueDate), variant: 'neutral' as const }
  if (daysUntilDue === null) return { label: 'Chưa có hạn', variant: 'neutral' as const }
  if (daysUntilDue < 0) return { label: `Quá hạn ${Math.abs(daysUntilDue)} ngày`, variant: 'danger' as const }
  if (daysUntilDue === 0) return { label: 'Hạn hôm nay', variant: 'warning' as const }
  if (daysUntilDue <= 3) return { label: `Còn ${daysUntilDue} ngày`, variant: 'warning' as const }

  return { label: formatDate(task.dueDate), variant: 'info' as const }
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="grid gap-2">
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-200"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-[var(--color-text-muted)]">{value}% hoàn thành</span>
    </div>
  )
}

export function MyTasksPanel() {
  const myTasksQuery = useMyTasks()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const tasks = myTasksQuery.data ?? []
  const reviewCount = tasks.filter((task) => isRevisionRequired(task)).length
  const completedCount = tasks.filter((task) => task.status === WorkTaskStatus.COMPLETED).length

  const columns: DataTableColumn<Task>[] = [
    {
      key: 'task',
      header: 'Công việc',
      className: 'min-w-72',
      render: (task) => (
        <div>
          <p className="font-semibold text-[var(--color-text-strong)]">{task.title}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {task.workTemplate?.name ?? 'Không có danh mục'}
          </p>
        </div>
      ),
    },
    {
      key: 'assigner',
      header: 'Người giao',
      className: 'whitespace-nowrap text-[var(--color-text)]',
      render: (task) => task.assigner?.fullName ?? '-',
    },
    {
      key: 'period',
      header: 'Kỳ đánh giá',
      className: 'whitespace-nowrap text-[var(--color-text-muted)]',
      render: (task) => task.period?.name ?? '-',
    },
    {
      key: 'due',
      header: 'Hạn xử lý',
      className: 'whitespace-nowrap',
      render: (task) => {
        const dueBadge = getDueBadge(task)
        return <Badge variant={dueBadge.variant}>{dueBadge.label}</Badge>
      },
    },
    {
      key: 'progress',
      header: 'Tiến độ',
      render: (task) => <ProgressBar value={getProgress(task)} />,
    },
    {
      key: 'status',
      header: 'Trạng thái hiện tại',
      className: 'whitespace-nowrap',
      render: (task) => (
        <div className="grid justify-items-start gap-1.5">
          <Badge variant={getStatusVariant(task)}>{getTaskStatusLabel(task.status)}</Badge>
          {isRevisionRequired(task) ? (
            <span className="text-xs font-medium text-[var(--color-warning)]">Cần xem lại kết quả</span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      headerClassName: 'text-right',
      className: 'whitespace-nowrap text-right',
      render: (task) => (
        <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedTask(task)}>
          Xem đánh giá
        </Button>
      ),
    },
  ]

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <EvaluationMetric label="Tổng công việc" value={tasks.length} />
        <EvaluationMetric label="Đã hoàn thành" value={completedCount} tone="success" />
        <EvaluationMetric label="Cần xem lại" value={reviewCount} tone={reviewCount ? 'warning' : 'neutral'} />
      </div>

      <div className="mt-6 hidden md:block">
        <DataTable
          title="Kết quả và trạng thái công việc"
          items={tasks}
          columns={columns}
          getRowKey={(task) => task.id}
          countLabel={tasks.length ? `${tasks.length} công việc` : undefined}
          isLoading={myTasksQuery.isLoading}
          isError={myTasksQuery.isError}
          loadingMessage="Đang tải kết quả công việc..."
          errorMessage={myTasksQuery.error instanceof Error ? myTasksQuery.error.message : 'Không tải được danh sách công việc.'}
          emptyMessage="Chưa có công việc để đánh giá."
          minWidthClassName="min-w-[1120px]"
        />
      </div>

      <div className="mt-6 grid gap-3 md:hidden">
        {myTasksQuery.isLoading ? (
          <Card className="px-5 py-6 text-sm text-[var(--color-text-muted)]">Đang tải kết quả công việc...</Card>
        ) : myTasksQuery.isError ? (
          <Card className="border-[var(--color-danger)] px-5 py-6 text-sm text-[var(--color-danger)]">
            {myTasksQuery.error instanceof Error ? myTasksQuery.error.message : 'Không tải được danh sách công việc.'}
          </Card>
        ) : tasks.length ? (
          tasks.map((task) => <MobileTaskCard key={task.id} task={task} onOpen={() => setSelectedTask(task)} />)
        ) : (
          <Card className="px-5 py-8 text-sm text-[var(--color-text-muted)]">Chưa có công việc để đánh giá.</Card>
        )}
      </div>

      {selectedTask ? <TaskEvaluationModal task={selectedTask} onClose={() => setSelectedTask(null)} /> : null}
    </>
  )
}

function EvaluationMetric({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'success' | 'warning' }) {
  const valueClass = tone === 'success' ? 'text-[var(--color-success)]' : tone === 'warning' ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-strong)]'

  return (
    <Card variant="flat" className="p-4">
      <p className="text-sm font-medium text-[var(--color-text-muted)]">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</p>
    </Card>
  )
}

function MobileTaskCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const dueBadge = getDueBadge(task)

  return (
    <Card className="grid gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-[var(--color-text-strong)]">{task.title}</h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{task.workTemplate?.name ?? 'Không có danh mục'}</p>
        </div>
        <Badge variant={getStatusVariant(task)}>{getTaskStatusLabel(task.status)}</Badge>
      </div>
      {isRevisionRequired(task) ? (
        <div className="rounded-[var(--radius-md)] border border-amber-200 bg-[var(--color-warning-soft)] px-3 py-2 text-sm font-medium text-[var(--color-warning)]">
          Cần xem lại kết quả theo phản hồi hiện có.
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <DetailItem label="Người giao" value={task.assigner?.fullName} />
        <DetailItem label="Kỳ đánh giá" value={task.period?.name} />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <Badge variant={dueBadge.variant}>{dueBadge.label}</Badge>
          <span className="text-xs font-semibold text-[var(--color-text-muted)]">{getProgress(task)}%</span>
        </div>
        <ProgressBar value={getProgress(task)} />
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={onOpen}>Xem kết quả và đánh giá</Button>
    </Card>
  )
}

function TaskEvaluationModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const dueBadge = getDueBadge(task)
  const revisionRequired = isRevisionRequired(task)
  const progress = getProgress(task)

  return (
    <Modal open title="Xem kết quả công việc" description={task.title} onClose={onClose} size="xl">
      <div className="grid gap-5">
        <section className={`rounded-[var(--radius-lg)] border px-4 py-4 ${revisionRequired ? 'border-amber-200 bg-[var(--color-warning-soft)]' : task.status === WorkTaskStatus.COMPLETED ? 'border-emerald-200 bg-[var(--color-success-soft)]' : 'border-[var(--color-border)] bg-[var(--color-surface-subtle)]'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Trạng thái công việc</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={getStatusVariant(task)}>{getTaskStatusLabel(task.status)}</Badge>
                <Badge variant={dueBadge.variant}>{dueBadge.label}</Badge>
                {revisionRequired ? <Badge variant="warning">Cần chỉnh sửa</Badge> : null}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Tiến độ</p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-strong)]">{progress}%</p>
            </div>
          </div>
          <div className="mt-4"><ProgressBar value={progress} /></div>
          {revisionRequired ? <p className="mt-3 text-sm font-medium text-[var(--color-warning)]">Kết quả hiện tại cần được xem lại trước khi được ghi nhận hoàn tất.</p> : null}
        </section>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card variant="muted" className="p-4">
            <SectionTitle title="Thông tin công việc" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailItem label="Người giao" value={task.assigner?.fullName} />
              <DetailItem label="Người thực hiện" value={task.assignee?.fullName} />
              <DetailItem label="Người đánh giá" value="Chưa có dữ liệu" />
              <DetailItem label="Kỳ đánh giá" value={task.period?.name} />
              <DetailItem label="Phòng ban" value={task.period?.organization?.name} />
              <DetailItem label="Ngày giao" value={formatDate(task.assignedDate)} />
              <DetailItem label="Hạn hoàn thành" value={formatDate(task.dueDate)} />
            </div>
          </Card>

          <Card variant="muted" className="p-4">
            <SectionTitle title="Tiến độ và mốc hoàn thành" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailItem label="Tiến độ hiện tại" value={`${progress}%`} />
              <DetailItem label="Ngày hoàn thành" value={formatDate(task.completedDate)} />
              <DetailItem label="Loại công việc" value={getWorkTypeLabel(task.workType)} />
              <DetailItem label="Trạng thái" value={getTaskStatusLabel(task.status)} />
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <SectionTitle title="Thông tin cần đối chiếu" />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <DetailBlock label="Mô tả công việc" value={task.description} />
            <DetailBlock label="Kết quả mong đợi" value={task.expectedOutput} />
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <SectionTitle title="Kết quả nhân viên gửi" />
            <div className="mt-4 grid gap-4">
              <DetailBlock label="Mô tả kết quả" value={task.resultDescription} />
              <div className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Mức độ hoàn tất</span>
                <ProgressBar value={progress} />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle title="Minh chứng và điểm tham chiếu" />
            <div className="mt-4 grid gap-3">
              <DetailBlock label="Yêu cầu minh chứng" value={task.workTemplate?.evidenceRequirement} />
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)] px-3 py-4 text-sm leading-6 text-[var(--color-text-muted)]">
                Chưa có danh sách tệp đính kèm trong dữ liệu hiện tại.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DetailItem label="Điểm cơ bản" value={task.baseScore} />
                <DetailItem label="Độ khó" value={`${task.difficultyPercent ?? 0}%`} />
              </div>
              <p className="text-xs leading-5 text-[var(--color-text-muted)]">Đây là thông tin tham chiếu của công việc, không phải điểm đánh giá cuối cùng.</p>
            </div>
          </Card>
        </div>

        <Card variant="muted" className="p-4">
          <SectionTitle title="Phản hồi đánh giá" />
          <div className="mt-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-4 text-sm leading-6 text-[var(--color-text-muted)]">
            Chưa có thông tin người đánh giá, nhận xét hoặc lịch sử đánh giá trong dữ liệu hiện tại.
          </div>
        </Card>

        <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Đóng</Button>
          <p className="mr-auto self-center text-xs leading-5 text-[var(--color-text-muted)]">Các thao tác phê duyệt, yêu cầu chỉnh sửa và hoàn tất chưa được API hỗ trợ.</p>
        </div>
      </div>
    </Modal>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="text-base font-semibold text-[var(--color-text-strong)]">{title}</h3>
}

function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--color-text-strong)]">{value || '-'}</p>
    </div>
  )
}

function DetailBlock({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-sm font-semibold text-[var(--color-text)]">{label}</p>
      <p className="mt-2 min-h-16 whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-3 text-sm leading-6 text-[var(--color-text)]">{value || '-'}</p>
    </div>
  )
}
