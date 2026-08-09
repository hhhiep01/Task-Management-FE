import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

import { useTaskEvaluationHistory } from '../hooks/useTaskEvaluations'
import type { TaskEvaluation } from '../types/taskEvaluation.types'
import { TaskEvaluationDecision } from '../types/taskEvaluation.types'

export function TaskEvaluationHistory({ taskId }: { taskId: string }) {
  const historyQuery = useTaskEvaluationHistory(taskId)
  const evaluations = [...(historyQuery.data ?? [])].sort((left, right) => left.evaluationRound - right.evaluationRound)
  const latest = evaluations.at(-1)
  const latestNeedsRevision = latest?.decision === TaskEvaluationDecision.REVISION_REQUIRED

  return (
    <Card className="min-w-0 p-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--color-text-strong)]">Lịch sử đánh giá</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Điểm và nhận xét do backend ghi nhận theo từng lần đánh giá.</p>
      </div>

      {latestNeedsRevision && latest.comment ? (
        <div className="mt-3 border-l-4 border-amber-400 bg-[var(--color-warning-soft)] px-3 py-2.5 text-sm leading-6 text-[var(--color-warning)]">
          <strong>Phản hồi mới nhất:</strong> {latest.comment}
        </div>
      ) : null}

      {historyQuery.isLoading ? <StateMessage>Đang tải lịch sử đánh giá...</StateMessage> : null}
      {historyQuery.isError ? <StateMessage tone="danger">{historyQuery.error instanceof Error ? historyQuery.error.message : 'Không tải được lịch sử đánh giá.'}</StateMessage> : null}
      {!historyQuery.isLoading && !historyQuery.isError && !evaluations.length ? <StateMessage>Chưa có lần đánh giá nào.</StateMessage> : null}

      {evaluations.length ? (
        <div className="mt-3 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {evaluations.map((evaluation) => <EvaluationRow key={evaluation.id} evaluation={evaluation} />)}
        </div>
      ) : null}
    </Card>
  )
}

function EvaluationRow({ evaluation }: { evaluation: TaskEvaluation }) {
  const approved = evaluation.decision === TaskEvaluationDecision.APPROVED
  return (
    <article className="grid gap-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h3 className="font-semibold text-[var(--color-text-strong)]">Lần đánh giá {evaluation.evaluationRound}</h3><p className="mt-1 text-xs text-[var(--color-text-muted)]">{evaluation.evaluatorName || 'Người đánh giá'} · {formatDateTime(evaluation.evaluatedAt)}</p></div>
        <div className="flex flex-wrap gap-2"><Badge variant={approved ? 'success' : 'warning'}>{approved ? 'Duyệt' : 'Yêu cầu chỉnh sửa'}</Badge>{evaluation.isFinal ? <Badge variant="neutral">Kết quả cuối cùng</Badge> : null}</div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        <Metric label="Hoàn thành" value={`${formatNumber(evaluation.progressPercent)}%`} />
        <Metric label="Chất lượng" value={`${formatNumber(evaluation.qualityPercent)}%`} />
        <Metric label="Điểm thực tế" value={formatNumber(evaluation.actualScore)} />
        <Metric label="Điểm quy đổi" value={formatNumber(evaluation.convertedScore)} />
      </dl>
      {evaluation.comment ? <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text)]"><span className="font-medium">Nhận xét:</span> {evaluation.comment}</p> : null}
    </article>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-[var(--color-text-muted)]">{label}</dt><dd className="mt-0.5 text-sm font-semibold text-[var(--color-text-strong)]">{value}</dd></div>
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function StateMessage({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'danger' }) {
  return <div className={`mt-3 border-t border-[var(--color-border)] pt-4 text-sm ${tone === 'danger' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}`}>{children}</div>
}
