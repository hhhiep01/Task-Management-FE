import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PeriodStatus } from '@/features/evaluation-periods/types/evaluationPeriod.types'

import { WorkTaskStatus, type Task } from '../types/task.types'
import type { TaskEvaluation } from '../types/taskEvaluation.types'
import {
  getAssigneeName,
  getAssignerName,
  getDueBadge,
  getPeriodName,
  getProgress,
  getTemplateName,
} from '../utils/taskPresentation'
import { TaskEvidenceSection } from './TaskEvidenceSection'
import { TaskEvaluationHistory } from './TaskEvaluationHistory'
import { TaskProgress } from './TaskProgress'
import { TaskWorkflowActions } from './TaskWorkflowActions'

export function TaskDetailContent({
  task,
  latestEvaluation,
}: {
  task: Task
  latestEvaluation?: TaskEvaluation
}) {
  return (
    <div className="grid min-w-0 gap-5">
      <TaskSummaryStrip task={task} />

      {task.period?.status === PeriodStatus.LOCKED ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-info-soft)] px-4 py-3 text-sm font-medium text-[var(--color-info)]" role="status">
          Kỳ đánh giá đã khóa. Dữ liệu trong kỳ này chỉ được xem và không thể chỉnh sửa.
        </div>
      ) : null}

      {task.status === WorkTaskStatus.REVISION_REQUIRED ? (
        <RevisionAlert evaluation={latestEvaluation} />
      ) : null}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <main className="grid min-w-0 gap-5">
          <TaskContent task={task} />
          <TaskEvidenceSection task={task} />
          <TaskWorkflowActions task={task} />
          <TaskEvaluationHistory taskId={task.id} />
        </main>
        <aside className="order-first grid min-w-0 gap-4 xl:order-last">
          <AssignmentInfo task={task} />
          <ScoringConfiguration task={task} />
        </aside>
      </div>
    </div>
  )
}

function TaskSummaryStrip({ task }: { task: Task }) {
  const dueBadge = getDueBadge(task)

  return (
    <Card className="min-w-0 overflow-hidden p-4 sm:p-5" variant="flat">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
        <SummaryValue label="Người thực hiện" value={getAssigneeName(task)} />
        <SummaryValue label="Người giao" value={getAssignerName(task)} />
        <SummaryValue label="Ngày giao" value={formatDate(task.assignedDate)} />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">Hạn hoàn thành</p>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-[var(--color-text-strong)]">
            <span>{formatDate(task.dueDate ?? task.due)}</span>
            {dueBadge.label && dueBadge.label !== formatDate(task.dueDate ?? task.due) ? (
              <Badge variant={dueBadge.variant}>{formatDueLabel(dueBadge.label)}</Badge>
            ) : null}
          </div>
        </div>
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <TaskProgress value={getProgress(task)} />
        </div>
      </div>
    </Card>
  )
}

function RevisionAlert({ evaluation }: { evaluation?: TaskEvaluation }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-[var(--radius-md)] border border-amber-200 bg-[var(--color-warning-soft)] px-4 py-3 text-sm text-[var(--color-warning)]" role="alert">
      <WarningIcon />
      <div className="min-w-0">
        <p className="font-semibold">Cần chỉnh sửa</p>
        <p className="mt-1 leading-6">Người đánh giá đã yêu cầu cập nhật lại kết quả công việc.</p>
        {evaluation?.comment ? (
          <p className="mt-2 whitespace-pre-wrap break-words border-t border-amber-200/80 pt-2 leading-6">
            <span className="font-semibold">Nhận xét:</span> {evaluation.comment}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function AssignmentInfo({ task }: { task: Task }) {
  return (
    <Card className="min-w-0 p-4" variant="flat">
      <SectionHeading title="Thông tin giao việc" />
      <dl className="mt-3 grid divide-y divide-[var(--color-border)]">
        <SummaryValue label="Kỳ đánh giá" value={getPeriodName(task)} />
        {task.workTemplate?.workCategory?.name ? (
          <SummaryValue label="Nhóm công việc" value={task.workTemplate.workCategory.name} />
        ) : null}
        <SummaryValue label="Danh mục công việc" value={getTemplateName(task)} />
        <SummaryValue label="Loại công việc" value={getWorkTypeLabel(task.workType)} />
        <SummaryValue label="Ngày giao" value={formatDate(task.assignedDate)} />
        <SummaryValue label="Hạn hoàn thành" value={formatDate(task.dueDate ?? task.due)} />
        {task.completedDate ? <SummaryValue label="Ngày hoàn thành" value={formatDate(task.completedDate)} /> : null}
        <SummaryValue label="Người giao" value={getAssignerName(task)} />
        <SummaryValue label="Người thực hiện" value={getAssigneeName(task)} />
      </dl>
    </Card>
  )
}

function ScoringConfiguration({ task }: { task: Task }) {
  const baseScore = task.baseScore ?? 0
  const difficulty = task.difficultyPercent ?? 100
  const convertedMaxScore = baseScore * difficulty / 100

  return (
    <Card className="min-w-0 p-4" variant="flat">
      <SectionHeading title="Thiết lập đánh giá" />
      <dl className="mt-3 grid divide-y divide-[var(--color-border)]">
        <SummaryValue label="Điểm chuẩn" value={formatScore(baseScore)} />
        <SummaryValue label="Hệ số độ khó" value={`${formatScore(difficulty)}%`} />
        <SummaryValue label="Điểm quy đổi tối đa" value={formatScore(convertedMaxScore)} strong />
      </dl>
    </Card>
  )
}

function TaskContent({ task }: { task: Task }) {
  return (
    <Card className="min-w-0 p-4 sm:p-5" variant="flat">
      <SectionHeading title="Nội dung công việc" />
      <div className="mt-4 grid min-w-0 gap-4">
        <ContentBlock label="Mô tả" value={task.description} emptyMessage="Chưa có mô tả." />
        <div className="rounded-[var(--radius-md)] border-l-4 border-[var(--color-primary)] bg-[var(--color-primary-subtle)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--color-primary)]">Kết quả đầu ra yêu cầu</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text-strong)]">
            {task.expectedOutput || 'Chưa có yêu cầu kết quả đầu ra.'}
          </p>
        </div>
      </div>
    </Card>
  )
}

function SummaryValue({
  label,
  value,
  strong = false,
}: {
  label: string
  value?: string | number | null
  strong?: boolean
}) {
  return (
    <div className="min-w-0 py-3 first:pt-0 last:pb-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">{label}</dt>
      <dd className={`mt-1 break-words text-sm ${strong ? 'font-bold text-[var(--color-primary)]' : 'font-medium text-[var(--color-text-strong)]'}`}>
        {value || '-'}
      </dd>
    </div>
  )
}

function ContentBlock({ label, value, emptyMessage }: { label: string; value?: string | number | null; emptyMessage: string }) {
  return (
    <section className="min-w-0">
      <h3 className="text-sm font-semibold text-[var(--color-text)]">{label}</h3>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text)]">
        {value || emptyMessage}
      </p>
    </section>
  )
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-base font-semibold text-[var(--color-text-strong)]">{title}</h2>
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function formatScore(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
}

function formatDueLabel(label: string) {
  return label.replace(/^(\d{2})-(\d{2})-(\d{4})$/, '$1/$2/$3')
}

function getWorkTypeLabel(value?: string | null) {
  if (value === 'REGULAR') return 'Thường xuyên'
  if (value === 'AD_HOC') return 'Đột xuất'
  return '-'
}

function WarningIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="mt-0.5 h-5 w-5 shrink-0">
      <path d="m10 3 7 13H3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 7.5v3.5M10 14h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
