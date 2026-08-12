import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { env } from '@/config/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { downloadBlob } from '@/utils/downloadFile'

import { useManagerPeriodReview } from '@/features/manager-period-reviews/hooks/useManagerPeriodReviews'
import type {
  ManagerPeriodReview,
  PeriodReviewCriterion,
  PeriodReviewTask,
} from '@/features/manager-period-reviews/types/managerPeriodReview.types'
import {
  formatReviewDate,
  formatReviewScore,
  getPeriodReviewEmployeeName,
  getTaskFinalEvaluation,
  getTaskMaxConvertedScore,
  getTaskName,
} from '@/features/manager-period-reviews/utils/managerPeriodReviewPresentation'
import { selfProposedRatingLabels } from '@/features/period-results/types/periodResult.types'
import { getTaskStatusLabel } from '@/features/tasks/types/task.types'
import { getExportErrorMessage } from '../api/periodEvaluationExportApi'
import { useExportEmployeeExcel } from '../hooks/usePeriodEvaluationExport'

export function PeriodEvaluationSummaryDetailPage() {
  const { periodId = '', userId = '' } = useParams()
  const navigate = useNavigate()
  const reviewQuery = useManagerPeriodReview(periodId, userId)
  const exportMutation = useExportEmployeeExcel()
  const [exportNotice, setExportNotice] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null)
  const review = reviewQuery.data

  useEffect(() => {
    if (!exportNotice) return
    const timeoutId = window.setTimeout(() => setExportNotice(null), 4500)
    return () => window.clearTimeout(timeoutId)
  }, [exportNotice])

  useDocumentTitle(`${review ? getPeriodReviewEmployeeName(review) : 'Chi tiết kết quả'} | ${env.appName}`)

  if (reviewQuery.isLoading) {
    return <DetailShell title="Đang tải kết quả" onBack={() => navigate(-1)}><LoadingState /></DetailShell>
  }

  if (reviewQuery.isError || !review) {
    return <DetailShell title="Không thể tải kết quả" onBack={() => navigate(-1)}><ErrorState message={reviewQuery.error instanceof Error ? reviewQuery.error.message : 'Không thể tải chi tiết kết quả đánh giá.'} onRetry={() => void reviewQuery.refetch()} /></DetailShell>
  }

  const canExport = review.status === 'REVIEWED' || review.status === 'LOCKED'
  const handleExport = async () => {
    if (!periodId || !userId || !canExport || exportMutation.isPending) return

    setExportNotice(null)
    try {
      const file = await exportMutation.mutateAsync({ periodId, userId })
      downloadBlob(file.blob, file.fileName)
      setExportNotice({ message: 'Xuất Excel thành công.', tone: 'success' })
    } catch (error) {
      setExportNotice({ message: await getExportErrorMessage(error), tone: 'danger' })
    }
  }

  return <DetailShell title={getPeriodReviewEmployeeName(review)} onBack={() => navigate(-1)} actions={<Button variant="secondary" onClick={() => void handleExport()} disabled={!canExport || exportMutation.isPending} title={!canExport ? 'Chỉ có thể xuất báo cáo khi kỳ đã được đánh giá hoặc khóa.' : 'Xuất Excel đánh giá'}>{exportMutation.isPending ? <SpinnerIcon /> : <ExcelIcon />}{exportMutation.isPending ? 'Đang tạo file Excel...' : 'Xuất Excel đánh giá'}</Button>}>
    <div className="grid min-w-0 gap-5">
      <Card className="flex min-w-0 flex-wrap items-start justify-between gap-4 border-l-4 border-l-[var(--color-primary)] p-4 sm:p-5">
        <div><p className="text-sm text-[var(--color-text-muted)]">{review.periodName}</p><p className="mt-1 text-sm text-[var(--color-text-muted)]">Kết quả cuối kỳ, chỉ đọc</p></div>
        <Badge variant={review.status === 'LOCKED' ? 'neutral' : 'success'}>{getPeriodStatusLabel(review.status)}</Badge>
      </Card>

      <section className="grid gap-4 sm:grid-cols-3">
        <ScoreCard label="Tiêu chí chung" score={review.commonScore} max={review.commonMaxScore} />
        <ScoreCard label="KPI công việc" score={review.taskScore} max={review.taskMaxScore} />
        <ScoreCard label="Tổng điểm" score={review.totalScore} max={review.totalMaxScore} strong />
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="grid min-w-0 gap-5">
          <ReadOnlyCriteria criteria={review.commonCriteria ?? []} />
          <ReadOnlyTasks tasks={review.tasks ?? []} />
        </main>
        <aside className="order-first grid min-w-0 gap-4 xl:order-last">
          <Card className="grid gap-4 p-4" variant="flat">
            <h2 className="text-base font-semibold text-[var(--color-text-strong)]">Đánh giá cuối kỳ</h2>
            <SummaryValue label="Cá nhân tự đề xuất" value={getRatingLabel(review.selfProposedRating)} />
            <SummaryValue label="Điểm quản lý" value={formatReviewScore(review.managerScore)} />
            <SummaryValue label="Xếp loại quản lý" value={getRatingLabel(review.managerProposedRating)} />
            <SummaryValue label="Người đánh giá" value={review.reviewedByName} />
            <SummaryValue label="Ngày đánh giá" value={formatReviewDate(review.reviewedAt)} />
          </Card>
          <Card className="grid gap-2 p-4" variant="flat">
            <h2 className="text-base font-semibold text-[var(--color-text-strong)]">Đánh giá nhiệm vụ then chốt</h2>
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text)]">{review.keyTaskAssessment?.trim() || 'Chưa có nhận xét.'}</p>
          </Card>
        </aside>
      </div>
    </div>
    {exportNotice ? <ExportToast message={exportNotice.message} tone={exportNotice.tone} /> : null}
  </DetailShell>
}

function DetailShell({ title, children, onBack, actions }: { title: string; children: ReactNode; onBack: () => void; actions?: ReactNode }) {
  return <section className="grid min-w-0 gap-5"><PageHeader eyebrow="Kết quả đánh giá" title={title} description="Thông tin tổng hợp của nhân viên trong kỳ đánh giá." actions={<>{actions}<Button variant="secondary" onClick={onBack}>Quay lại</Button></>} />{children}</section>
}

function ScoreCard({ label, score, max, strong = false }: { label: string; score: number; max: number; strong?: boolean }) {
  return <Card className={strong ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] p-4' : 'p-4'} variant="flat"><p className="text-sm font-medium text-[var(--color-text-muted)]">{label}</p><p className={`mt-2 tabular-nums ${strong ? 'text-2xl font-bold text-[var(--color-primary)]' : 'text-xl font-semibold text-[var(--color-text-strong)]'}`}>{formatReviewScore(score)} <span className="text-sm font-normal text-[var(--color-text-muted)]">/ {formatReviewScore(max)}</span></p></Card>
}

function ReadOnlyCriteria({ criteria }: { criteria: PeriodReviewCriterion[] }) {
  return <Card className="grid min-w-0 gap-4 p-4 sm:p-5" variant="flat"><div><h2 className="text-base font-semibold text-[var(--color-text-strong)]">Tiêu chí chung</h2><p className="mt-1 text-sm text-[var(--color-text-muted)]">Kết quả tự đánh giá đã ghi nhận.</p></div>{criteria.length ? <div className="grid gap-3">{criteria.map((criterion) => <CriterionRow key={criterion.id} criterion={criterion} />)}</div> : <p className="text-sm text-[var(--color-text-muted)]">Chưa có tiêu chí chung.</p>}</Card>
}

function CriterionRow({ criterion, nested = false }: { criterion: PeriodReviewCriterion; nested?: boolean }) {
  return <div className={`${nested ? 'ml-4 border-l border-[var(--color-border)] pl-4' : ''} grid gap-2`}><div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="text-sm font-semibold text-[var(--color-text-strong)]">{criterion.code} · {criterion.content}</p></div><span className="whitespace-nowrap text-sm font-semibold tabular-nums text-[var(--color-text)]">{criterion.selfScore ?? 0} / {formatReviewScore(criterion.maxScore)}</span></div>{criterion.selfNote ? <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text-muted)]">{criterion.selfNote}</p> : null}{criterion.children?.map((child) => <CriterionRow key={child.id} criterion={child} nested />)}</div>
}

function ReadOnlyTasks({ tasks }: { tasks: PeriodReviewTask[] }) {
  return <Card className="grid min-w-0 gap-4 p-4 sm:p-5" variant="flat"><div><h2 className="text-base font-semibold text-[var(--color-text-strong)]">Kết quả công việc</h2><p className="mt-1 text-sm text-[var(--color-text-muted)]">Kết quả và đánh giá từng công việc trong kỳ.</p></div>{tasks.length ? <div className="grid gap-3">{tasks.map((task) => <TaskResultRow key={task.id} task={task} />)}</div> : <p className="text-sm text-[var(--color-text-muted)]">Chưa có công việc được tổng hợp.</p>}</Card>
}

function TaskResultRow({ task }: { task: PeriodReviewTask }) {
  const evaluation = getTaskFinalEvaluation(task)
  return <article className="grid min-w-0 gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"><div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words font-semibold text-[var(--color-text-strong)]">{getTaskName(task)}</h3><p className="mt-1 text-xs text-[var(--color-text-muted)]">Hạn {formatReviewDate(task.dueDate)} · Tiến độ {formatReviewScore(task.progressPercent)}%</p></div>{task.status ? <Badge variant={task.status === 'COMPLETED' ? 'success' : 'neutral'}>{getTaskStatusLabel(task.status)}</Badge> : null}</div><div className="grid gap-3 sm:grid-cols-3"><SummaryValue label="Kết quả" value={task.resultDescription} /><SummaryValue label="Điểm tối đa" value={formatReviewScore(getTaskMaxConvertedScore(task))} /><SummaryValue label="Điểm quy đổi" value={formatReviewScore(evaluation?.convertedScore)} /></div>{evaluation?.comment ? <p className="whitespace-pre-wrap break-words border-t border-[var(--color-border)] pt-3 text-sm leading-6 text-[var(--color-text-muted)]"><span className="font-semibold text-[var(--color-text)]">Nhận xét:</span> {evaluation.comment}</p> : null}</article>
}

function SummaryValue({ label, value }: { label: string; value?: string | number | null }) { return <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">{label}</p><p className="mt-1 break-words text-sm font-medium text-[var(--color-text-strong)]">{value || '-'}</p></div> }
function getRatingLabel(rating: ManagerPeriodReview['selfProposedRating'] | undefined) { return rating ? selfProposedRatingLabels[rating] ?? '-' : '-' }
function getPeriodStatusLabel(status?: string | null) { return status === 'LOCKED' ? 'Đã khóa' : status === 'REVIEWED' ? 'Đã đánh giá' : status === 'SUBMITTED' ? 'Đã gửi' : status === 'DRAFT' ? 'Bản nháp' : 'Không xác định' }
function LoadingState() { return <div className="grid gap-4"><Card className="h-24 animate-pulse bg-[var(--color-surface-muted)]" /><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]"><Card className="h-96 animate-pulse bg-[var(--color-surface-muted)]" /><Card className="h-64 animate-pulse bg-[var(--color-surface-muted)]" /></div></div> }
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { return <Card className="grid gap-4 p-5 text-sm text-[var(--color-danger)]"><p>{message}</p><Button className="w-fit" onClick={onRetry}>Thử lại</Button></Card> }
function ExportToast({ message, tone }: { message: string; tone: 'success' | 'danger' }) { return <div role={tone === 'danger' ? 'alert' : 'status'} aria-live="polite" className={`fixed bottom-4 left-4 z-50 max-w-sm rounded-[var(--radius-md)] border bg-white px-4 py-3 text-sm font-semibold shadow-[var(--shadow-modal)] sm:left-auto sm:right-4 ${tone === 'danger' ? 'border-red-200 text-[var(--color-danger)]' : 'border-emerald-200 text-[var(--color-success)]'}`}>{message}</div> }
function SpinnerIcon() { return <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> }
function ExcelIcon() { return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="M5.5 2.5h6l3 3v12h-9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M11.5 2.5v3h3M7.5 9l3 4m0-4-3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg> }
