import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { getWorkTypeLabel } from '@/features/work-templates/types/workTemplate.types'
import { formatDate } from '@/utils/formatDate'

import type { Task } from '../types/task.types'
import {
  getAssigneeName,
  getAssignerName,
  getDueBadge,
  getPeriodName,
  getProgress,
  getTemplateName,
  isRevisionRequired,
} from '../utils/taskPresentation'
import { TaskEvidenceSection } from './TaskEvidenceSection'
import { TaskEvaluationHistory } from './TaskEvaluationHistory'
import { TaskProgress } from './TaskProgress'
import { TaskWorkflowActions } from './TaskWorkflowActions'

export function TaskDetailContent({ task }: { task: Task }) {
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
      <main className="grid min-w-0 gap-4">
        <TaskContent task={task} />
        <TaskWorkflowActions task={task} />
        <TaskEvidenceSection task={task} />
        <TaskEvaluationHistory taskId={task.id} />
      </main>
      <aside className="order-first min-w-0 xl:order-last">
        <TaskOverview task={task} />
      </aside>
    </div>
  )
}

function TaskOverview({ task }: { task: Task }) {
  const dueBadge = getDueBadge(task)
  const revisionRequired = isRevisionRequired(task)

  return (
    <Card className="min-w-0 p-4">
      <h2 className="text-base font-semibold text-[var(--color-text-strong)]">Tổng quan</h2>

      {revisionRequired ? (
        <div className="mt-3 rounded-[var(--radius-md)] border border-amber-200 bg-[var(--color-warning-soft)] px-3 py-2.5 text-sm leading-5 text-[var(--color-warning)]">
          Kết quả cần được chỉnh sửa trước khi gửi lại để đánh giá.
        </div>
      ) : null}

      <div className="mt-4 border-b border-[var(--color-border)] pb-4">
        <TaskProgress value={getProgress(task)} />
      </div>

      <dl className="divide-y divide-[var(--color-border)]">
        <SummaryItem label="Hạn hoàn thành" value={formatDate(task.dueDate ?? task.due)} badge={<Badge variant={dueBadge.variant}>{dueBadge.label}</Badge>} />
        <SummaryItem label="Người nhận" value={getAssigneeName(task)} />
        <SummaryItem label="Người giao" value={getAssignerName(task)} />
        <SummaryItem label="Kỳ đánh giá" value={getPeriodName(task)} />
        <SummaryItem label="Ngày giao" value={formatDate(task.assignedDate)} />
        {task.completedDate ? <SummaryItem label="Ngày hoàn thành" value={formatDate(task.completedDate)} /> : null}
        <SummaryItem label="Loại công việc" value={getWorkTypeLabel(task.workType)} />
        <SummaryItem label="Mẫu công việc" value={getTemplateName(task)} />
        {task.workTemplate?.workCategory?.name ? <SummaryItem label="Nhóm công việc" value={task.workTemplate.workCategory.name} /> : null}
      </dl>
    </Card>
  )
}

function TaskContent({ task }: { task: Task }) {
  return (
    <Card className="min-w-0 p-4">
      <SectionTitle title="Nội dung công việc" />
      <div className="mt-4 divide-y divide-[var(--color-border)]">
        <ContentBlock label="Mô tả công việc" value={task.description} />
        <ContentBlock label="Kết quả mong đợi" value={task.expectedOutput} />
      </div>
    </Card>
  )
}


function SummaryItem({ label, value, badge }: { label: string; value?: string | number | null; badge?: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 first:pt-4 last:pb-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{label}</dt>
      <dd className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-sm font-medium text-[var(--color-text-strong)]">
        <span className="min-w-0 break-words">{value || '-'}</span>
        {badge}
      </dd>
    </div>
  )
}

function ContentBlock({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <section className="py-4 first:pt-0 last:pb-0">
      <h3 className="text-sm font-semibold text-[var(--color-text)]">{label}</h3>
      {value ? (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text)]">{value}</p>
      ) : (
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Chưa có thông tin.</p>
      )}
    </section>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-base font-semibold text-[var(--color-text-strong)]">{title}</h2>
}
