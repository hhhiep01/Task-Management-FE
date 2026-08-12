import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

import { useTaskEvaluationHistory } from '../hooks/useTaskEvaluations'
import type { TaskEvaluation } from '../types/taskEvaluation.types'
import { TaskEvaluationDecision } from '../types/taskEvaluation.types'

export function TaskEvaluationHistory({ taskId }: { taskId: string }) {
  const historyQuery = useTaskEvaluationHistory(taskId)
  const evaluations = [...(historyQuery.data ?? [])].sort(
    (left, right) => right.evaluationRound - left.evaluationRound,
  )
  const latest = evaluations[0]

  return (
    <Card className="min-w-0 p-4 sm:p-5" variant="flat">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--color-text-strong)]">Kết quả đánh giá</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Kết quả đánh giá cuối cùng và các lần phản hồi trước đó.
          </p>
        </div>
        {latest ? <Badge variant={isApproved(latest) ? 'success' : 'warning'}>{getDecisionLabel(latest.decision)}</Badge> : null}
      </div>

      {historyQuery.isLoading ? <StateMessage>Đang tải kết quả đánh giá...</StateMessage> : null}
      {historyQuery.isError ? (
        <StateMessage tone="danger">
          {historyQuery.error instanceof Error ? historyQuery.error.message : 'Không tải được kết quả đánh giá.'}
        </StateMessage>
      ) : null}
      {!historyQuery.isLoading && !historyQuery.isError && !latest ? (
        <StateMessage>Chưa có đánh giá.</StateMessage>
      ) : null}

      {latest ? <EvaluationSummary evaluation={latest} /> : null}

      {evaluations.length > 1 ? (
        <details className="mt-4 border-t border-[var(--color-border)] pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[var(--color-text-strong)] [&::-webkit-details-marker]:hidden">
            <span>Lịch sử đánh giá ({evaluations.length - 1})</span>
            <ChevronDownIcon />
          </summary>
          <div className="mt-3 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {evaluations.slice(1).map((evaluation) => (
              <EvaluationHistoryRow key={evaluation.id} evaluation={evaluation} />
            ))}
          </div>
        </details>
      ) : null}
    </Card>
  )
}

function EvaluationSummary({ evaluation }: { evaluation: TaskEvaluation }) {
  return (
    <div className="mt-4 min-w-0 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-strong)]">
            {evaluation.isFinal ? 'Kết quả cuối cùng' : `Lần đánh giá ${evaluation.evaluationRound}`}
          </p>
          <p className="mt-1 break-words text-xs text-[var(--color-text-muted)]">
            {evaluation.evaluatorName || 'Người đánh giá'} · {formatDateTime(evaluation.evaluatedAt)}
          </p>
        </div>
        <Badge variant={isApproved(evaluation) ? 'success' : 'warning'}>
          {getDecisionLabel(evaluation.decision)}
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Metric label="Tiến độ" value={`${formatNumber(evaluation.progressPercent)}%`} />
        <Metric label="Chất lượng" value={`${formatNumber(evaluation.qualityPercent)}%`} />
        <Metric label="Điểm thực hiện" value={formatNumber(evaluation.actualScore)} />
        <Metric label="Điểm quy đổi" value={formatNumber(evaluation.convertedScore)} />
      </dl>

      {evaluation.comment ? (
        <p className="mt-4 whitespace-pre-wrap break-words border-t border-[var(--color-border)] pt-3 text-sm leading-6 text-[var(--color-text)]">
          <span className="font-semibold">Nhận xét:</span> {evaluation.comment}
        </p>
      ) : null}
    </div>
  )
}

function EvaluationHistoryRow({ evaluation }: { evaluation: TaskEvaluation }) {
  return (
    <article className="grid min-w-0 gap-2 py-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-strong)]">Lần đánh giá {evaluation.evaluationRound}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {evaluation.evaluatorName || 'Người đánh giá'} · {formatDateTime(evaluation.evaluatedAt)}
          </p>
        </div>
        <Badge variant={isApproved(evaluation) ? 'success' : 'warning'}>{getDecisionLabel(evaluation.decision)}</Badge>
      </div>
      <p className="text-sm text-[var(--color-text)]">
        Tiến độ {formatNumber(evaluation.progressPercent)}% · Chất lượng {formatNumber(evaluation.qualityPercent)}% · Điểm quy đổi {formatNumber(evaluation.convertedScore)}
      </p>
      {evaluation.comment ? <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text-muted)]">{evaluation.comment}</p> : null}
    </article>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--color-text-muted)]">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-[var(--color-text-strong)]">{value}</dd>
    </div>
  )
}

function StateMessage({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'danger' }) {
  return <div className={`mt-4 border-t border-[var(--color-border)] pt-4 text-sm ${tone === 'danger' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}`}>{children}</div>
}

function isApproved(evaluation: TaskEvaluation) {
  return evaluation.decision === TaskEvaluationDecision.APPROVED
}

function getDecisionLabel(decision: TaskEvaluationDecision) {
  return decision === TaskEvaluationDecision.APPROVED ? 'Hoàn thành' : 'Yêu cầu chỉnh sửa'
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-[var(--color-text-muted)]">
      <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
