import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { env } from '@/config/env'
import { useEvaluationPeriod } from '@/features/evaluation-periods/hooks/useEvaluationPeriods'
import { PeriodStatus } from '@/features/evaluation-periods/types/evaluationPeriod.types'
import {
  SelfProposedRating,
  selfProposedRatingLabels,
} from '@/features/period-results/types/periodResult.types'
import { TaskEvaluationDecision } from '@/features/tasks/types/taskEvaluation.types'
import { getTaskStatusLabel } from '@/features/tasks/types/task.types'
import { getWorkTypeLabel } from '@/features/work-templates/types/workTemplate.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

import {
  useManagerPeriodReview,
  useUpdateManagerPeriodReview,
} from '../hooks/useManagerPeriodReviews'
import {
  PeriodReviewStatus,
  type ManagerPeriodReview,
  type PeriodReviewCriterion,
  type PeriodReviewRating,
  type PeriodReviewTask,
  type PeriodReviewTaskEvaluation,
} from '../types/managerPeriodReview.types'
import {
  formatReviewDate,
  formatReviewScore,
  getEvaluatorName,
  getPeriodReviewEmployeeName,
  getPeriodReviewErrorMessage,
  getTaskFinalEvaluation,
  getTaskMaxConvertedScore,
  getTaskName,
} from '../utils/managerPeriodReviewPresentation'

type ManagerReviewFormState = {
  managerScore: number | ''
  managerProposedRating: PeriodReviewRating | ''
  keyTaskAssessment: string
}

type ManagerReviewFormErrors = {
  managerScore?: string
  managerProposedRating?: string
}

const fieldClassName =
  'h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 text-sm text-[var(--color-text-strong)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)] disabled:cursor-not-allowed disabled:border-[var(--color-border)] disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-text-muted)]'

const textAreaClassName =
  'min-h-28 w-full min-w-0 resize-y rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 py-2.5 text-sm leading-6 text-[var(--color-text-strong)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)] disabled:cursor-not-allowed disabled:border-[var(--color-border)] disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-text-muted)]'

function buildFormState(review?: ManagerPeriodReview): ManagerReviewFormState {
  return {
    managerScore: review?.managerScore ?? '',
    managerProposedRating: review?.managerProposedRating ?? '',
    keyTaskAssessment: review?.keyTaskAssessment ?? '',
  }
}

function validateReviewForm(form: ManagerReviewFormState): ManagerReviewFormErrors {
  const errors: ManagerReviewFormErrors = {}

  if (form.managerScore === '' || !Number.isFinite(form.managerScore)) {
    errors.managerScore = 'Vui lòng nhập điểm đánh giá.'
  } else if (form.managerScore < 0 || form.managerScore > 100) {
    errors.managerScore = 'Điểm đánh giá phải nằm trong khoảng từ 0 đến 100.'
  }

  if (!form.managerProposedRating) {
    errors.managerProposedRating = 'Vui lòng chọn mức xếp loại đề xuất.'
  }

  return errors
}

function getStatusBadge(status: string) {
  return status === PeriodReviewStatus.REVIEWED ? (
    <Badge variant="success">Đã đánh giá</Badge>
  ) : (
    <Badge variant="warning">Chờ đánh giá</Badge>
  )
}

export function ManagerPeriodReviewDetailPage() {
  const { periodId = '', userId = '' } = useParams()
  const detailQuery = useManagerPeriodReview(periodId, userId)
  const periodQuery = useEvaluationPeriod(periodId)
  const updateMutation = useUpdateManagerPeriodReview(periodId, userId)
  const [form, setForm] = useState<ManagerReviewFormState>(() => buildFormState())
  const [formErrors, setFormErrors] = useState<ManagerReviewFormErrors>({})
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const review = detailQuery.data
  const employeeName = review ? getPeriodReviewEmployeeName(review) : 'Đánh giá nhân viên'
  const isSubmitted = review?.status === PeriodReviewStatus.SUBMITTED
  const isReviewed = review?.status === PeriodReviewStatus.REVIEWED
  const isPeriodLocked = periodQuery.data?.status === PeriodStatus.LOCKED
  const savedManagerScore = review?.managerScore
  const savedManagerRating = review?.managerProposedRating
  const savedKeyTaskAssessment = review?.keyTaskAssessment
  const savedReviewStatus = review?.status

  useDocumentTitle(`${employeeName} | ${env.appName}`)

  useEffect(() => {
    setForm({
      managerScore: savedManagerScore ?? '',
      managerProposedRating: savedManagerRating ?? '',
      keyTaskAssessment: savedKeyTaskAssessment ?? '',
    })
    setFormErrors({})
  }, [
    savedKeyTaskAssessment,
    savedManagerRating,
    savedManagerScore,
    savedReviewStatus,
  ])

  useEffect(() => {
    if (!successMessage) return

    const timeoutId = window.setTimeout(() => setSuccessMessage(''), 4500)
    return () => window.clearTimeout(timeoutId)
  }, [successMessage])

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isSubmitted || isPeriodLocked || updateMutation.isPending) return

    const errors = validateReviewForm(form)
    setFormErrors(errors)
    if (Object.keys(errors).length) return

    updateMutation.reset()
    setIsConfirmationOpen(true)
  }

  const handleConfirm = async () => {
    if (
      !isSubmitted ||
      isPeriodLocked ||
      updateMutation.isPending ||
      form.managerScore === '' ||
      !form.managerProposedRating
    ) {
      return
    }

    try {
      await updateMutation.mutateAsync({
        managerScore: form.managerScore,
        managerProposedRating: form.managerProposedRating,
        keyTaskAssessment: form.keyTaskAssessment.trim(),
      })
      await detailQuery.refetch()
      setIsConfirmationOpen(false)
      setSuccessMessage('Review period result successfully')
    } catch {
      setIsConfirmationOpen(false)
    }
  }

  const queryError = getPeriodReviewErrorMessage(
    detailQuery.error,
    'Không tải được dữ liệu đánh giá nhân viên.',
  )
  const mutationError = getPeriodReviewErrorMessage(
    updateMutation.error,
    'Không thể hoàn tất đánh giá nhân viên.',
  )

  if (!periodId || !userId) {
    return (
      <PageState
        title="Đường dẫn đánh giá không hợp lệ."
        description="Không xác định được nhân viên hoặc kỳ đánh giá."
        backLink="/manager/period-reviews"
      />
    )
  }

  if (detailQuery.isLoading) return <DetailLoadingState />

  if (detailQuery.isError || !review) {
    return (
      <PageState
        title="Không thể tải đánh giá nhân viên."
        description={queryError}
        backLink={`/manager/period-reviews?periodId=${periodId}`}
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={() => void detailQuery.refetch()}
            disabled={detailQuery.isFetching}
          >
            {detailQuery.isFetching ? 'Đang tải...' : 'Thử lại'}
          </Button>
        }
      />
    )
  }

  return (
    <section className="grid w-full min-w-0 gap-5">
      <div>
        <Link
          to={`/manager/period-reviews?periodId=${periodId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
        >
          <ArrowLeftIcon />
          Danh sách đánh giá
        </Link>
      </div>

      <PageHeader
        eyebrow="Đánh giá nhân viên"
        title={employeeName}
        description="Đối chiếu kết quả tự đánh giá, KPI công việc và hoàn tất nhận xét của cấp có thẩm quyền."
        actions={getStatusBadge(review.status)}
      />

      <EmployeeSummary review={review} />
      {isPeriodLocked ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-info-soft)] px-4 py-3 text-sm font-medium text-[var(--color-info)]" role="status">
          Đánh giá đã được khóa cùng kỳ đánh giá. Dữ liệu chỉ được xem và không thể chỉnh sửa.
        </p>
      ) : null}
      <CommonCriteriaSection criteria={review.commonCriteria ?? []} />
      <TaskKpiSection tasks={review.tasks ?? []} />

      <ManagerReviewForm
        review={review}
        form={form}
        errors={formErrors}
        isEditable={isSubmitted && !isPeriodLocked}
        isReviewed={isReviewed}
        isSubmitting={updateMutation.isPending}
        apiError={updateMutation.isError ? mutationError : ''}
        onChange={setForm}
        onSubmit={handleFormSubmit}
      />

      <Modal
        open={isConfirmationOpen}
        onClose={() => !updateMutation.isPending && setIsConfirmationOpen(false)}
        title="Xác nhận đánh giá"
        description="Xác nhận hoàn tất đánh giá nhân viên này?"
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsConfirmationOpen(false)}
              disabled={updateMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Đang xác nhận...' : 'Xác nhận đánh giá'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-3 text-sm">
          <SummaryValue label="Nhân viên" value={employeeName} />
          <SummaryValue
            label="Điểm đánh giá"
            value={form.managerScore === '' ? '-' : `${formatReviewScore(form.managerScore)} / 100`}
          />
        </div>
      </Modal>

      {successMessage ? <SuccessToast message={successMessage} /> : null}
    </section>
  )
}

function EmployeeSummary({ review }: { review: ManagerPeriodReview }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
        <h2 className="text-base font-semibold text-[var(--color-text-strong)]">Thông tin nhân viên</h2>
      </div>
      <div className="grid gap-5 p-4 sm:p-5">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryValue label="Tên nhân viên" value={getPeriodReviewEmployeeName(review)} />
          <SummaryValue label="Kỳ đánh giá" value={review.periodName} />
          <SummaryValue label="Ngày gửi" value={formatReviewDate(review.submittedAt, true)} />
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
              Trạng thái
            </dt>
            <dd className="mt-1.5">{getStatusBadge(review.status)}</dd>
          </div>
          <SummaryValue
            label="Mức tự đề xuất"
            value={
              review.selfProposedRating
                ? selfProposedRatingLabels[review.selfProposedRating]
                : '-'
            }
          />
        </dl>

        <div className="grid gap-3 sm:grid-cols-3">
          <ScoreCard
            label="Tiêu chí chung"
            score={review.commonScore}
            maxScore={review.commonMaxScore}
          />
          <ScoreCard
            label="KPI công việc"
            score={review.taskScore}
            maxScore={review.taskMaxScore}
          />
          <ScoreCard
            label="Tổng điểm"
            score={review.totalScore}
            maxScore={review.totalMaxScore}
            emphasized
          />
        </div>
      </div>
    </Card>
  )
}

function ScoreCard({
  label,
  score,
  maxScore,
  emphasized = false,
}: {
  label: string
  score: number
  maxScore: number
  emphasized?: boolean
}) {
  return (
    <div
      className={`flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-md)] border px-4 py-3 ${
        emphasized
          ? 'border-teal-200 bg-[var(--color-primary-subtle)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface-subtle)]'
      }`}
    >
      <p
        className={`text-sm font-medium ${
          emphasized ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
        }`}
      >
        {label}
      </p>
      <p
        className={`shrink-0 tabular-nums ${
          emphasized
            ? 'text-xl font-bold text-[var(--color-primary)]'
            : 'text-lg font-semibold text-[var(--color-text-strong)]'
        }`}
      >
        {formatReviewScore(score)}
        <span className="text-sm font-medium"> / {formatReviewScore(maxScore)}</span>
      </p>
    </div>
  )
}

function CommonCriteriaSection({ criteria }: { criteria: PeriodReviewCriterion[] }) {
  return (
    <Card className="min-w-0 overflow-hidden" variant="flat">
      <SectionHeader
        title="A. Tiêu chí chung"
        description="Kết quả nhân viên tự đánh giá — chỉ đọc."
      />
      {criteria.length ? (
        <div className="grid min-w-0 gap-3 p-3 sm:p-4">
          {criteria.map((criterion) => (
            <CriterionNode key={criterion.id} criterion={criterion} depth={0} />
          ))}
        </div>
      ) : (
        <SectionEmptyState message="Chưa có dữ liệu tiêu chí chung." />
      )}
    </Card>
  )
}

function CriterionNode({
  criterion,
  depth,
}: {
  criterion: PeriodReviewCriterion
  depth: number
}) {
  if (criterion.criterionType === 'ITEM') {
    return <CriterionItem criterion={criterion} nested={depth > 0} />
  }

  return (
    <article
      className={`min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] ${
        depth ? 'ml-2 sm:ml-4' : ''
      }`}
    >
      <div className="flex min-w-0 flex-col justify-between gap-2 bg-[var(--color-surface-subtle)] px-4 py-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]">
            {criterion.code}
          </p>
          <h3 className="mt-1 break-words text-sm font-bold leading-6 text-[var(--color-text-strong)]">
            {criterion.content}
          </h3>
        </div>
        <Badge variant="neutral" className="shrink-0">
          Tối đa {formatReviewScore(criterion.maxScore)} điểm
        </Badge>
      </div>
      {criterion.children?.length ? (
        <div className="grid min-w-0 gap-3 border-t border-[var(--color-border)] p-3 sm:p-4">
          {criterion.children.map((child) => (
            <CriterionNode key={child.id} criterion={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </article>
  )
}

function CriterionItem({
  criterion,
  nested,
}: {
  criterion: PeriodReviewCriterion
  nested: boolean
}) {
  const metLabel = criterion.isMet === true ? 'Đảm bảo' : criterion.isMet === false ? 'Không đảm bảo' : 'Chưa đánh giá'
  const metVariant = criterion.isMet === true ? 'success' : criterion.isMet === false ? 'danger' : 'neutral'

  return (
    <article
      className={`grid min-w-0 gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)] ${
        nested ? 'border-l-4 border-l-slate-300' : ''
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{criterion.code}</Badge>
          <span className="text-xs font-medium text-[var(--color-text-muted)]">
            Điểm tối đa: {formatReviewScore(criterion.maxScore)}
          </span>
        </div>
        <p className="mt-2 break-words text-sm font-medium leading-6 text-[var(--color-text-strong)]">
          {criterion.content}
        </p>
      </div>

      <dl className="grid min-w-0 grid-cols-2 gap-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
            Kết quả
          </dt>
          <dd className="mt-1.5"><Badge variant={metVariant}>{metLabel}</Badge></dd>
        </div>
        <SummaryValue
          label="Điểm tự đánh giá"
          value={`${formatReviewScore(criterion.selfScore ?? 0)} / ${formatReviewScore(criterion.maxScore)}`}
          strong
        />
        <div className="col-span-2 min-w-0 border-t border-[var(--color-border)] pt-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
            Ghi chú
          </dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text)]">
            {criterion.selfNote?.trim() || 'Không có'}
          </dd>
        </div>
      </dl>
    </article>
  )
}

function TaskKpiSection({ tasks }: { tasks: PeriodReviewTask[] }) {
  return (
    <Card className="min-w-0 overflow-hidden" variant="flat">
      <SectionHeader
        title="B. Kết quả thực hiện nhiệm vụ"
        description={`${tasks.length} công việc trong kỳ đánh giá.`}
      />
      {tasks.length ? (
        <div className="grid min-w-0 gap-3 p-3 sm:p-4">
          {tasks.map((task, index) => (
            <TaskReviewCard key={task.id} task={task} initiallyOpen={index === 0} />
          ))}
        </div>
      ) : (
        <SectionEmptyState message="Chưa có dữ liệu KPI công việc." />
      )}
    </Card>
  )
}

function TaskReviewCard({ task, initiallyOpen }: { task: PeriodReviewTask; initiallyOpen: boolean }) {
  const evaluation = getTaskFinalEvaluation(task)
  const progress = Math.min(100, Math.max(0, task.progressPercent ?? 0))

  return (
    <details
      open={initiallyOpen}
      className="group min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white"
    >
      <summary className="flex min-w-0 list-none items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface-subtle)] [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-semibold leading-6 text-[var(--color-text-strong)]">
            {getTaskName(task)}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <span>{getWorkTypeLabel(task.workType)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatReviewScore(getTaskMaxConvertedScore(task))} điểm tối đa</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={getTaskStatusVariant(task.status)}>{getTaskStatusLabel(task.status)}</Badge>
          <ChevronIcon />
        </div>
      </summary>

      <div className="grid min-w-0 gap-4 border-t border-[var(--color-border)] p-4">
        <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryValue label="Tên công việc" value={getTaskName(task)} />
          <SummaryValue label="Loại công việc" value={getWorkTypeLabel(task.workType)} />
          <SummaryValue label="Ngày giao" value={formatReviewDate(task.assignedDate)} />
          <SummaryValue label="Hạn hoàn thành" value={formatReviewDate(task.dueDate)} />
          <SummaryValue label="Ngày hoàn thành" value={formatReviewDate(task.completedDate)} />
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
              Tiến độ
            </dt>
            <dd className="mt-1.5">
              <div className="flex items-center gap-3">
                <div className="h-2 min-w-20 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--color-text-strong)]">
                  {formatReviewScore(progress)}%
                </span>
              </div>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
              Trạng thái
            </dt>
            <dd className="mt-1.5">
              <Badge variant={getTaskStatusVariant(task.status)}>{getTaskStatusLabel(task.status)}</Badge>
            </dd>
          </div>
          <SummaryValue
            label="Điểm quy đổi tối đa"
            value={formatReviewScore(getTaskMaxConvertedScore(task))}
            strong
          />
          <div className="min-w-0 sm:col-span-2 lg:col-span-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
              Kết quả thực hiện
            </dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text)]">
              {task.resultDescription?.trim() || 'Chưa có kết quả thực hiện.'}
            </dd>
          </div>
        </dl>

        <FinalTaskEvaluation evaluation={evaluation} />
      </div>
    </details>
  )
}

function FinalTaskEvaluation({
  evaluation,
}: {
  evaluation: PeriodReviewTaskEvaluation | null
}) {
  if (!evaluation) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
        Chưa có đánh giá cuối cùng.
      </div>
    )
  }

  const isApproved = evaluation.decision === TaskEvaluationDecision.APPROVED

  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-[var(--color-text-strong)]">Đánh giá cuối cùng</h4>
        <Badge variant={isApproved ? 'success' : 'warning'}>
          {isApproved ? 'Duyệt' : 'Yêu cầu chỉnh sửa'}
        </Badge>
      </div>
      <dl className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryValue label="Người đánh giá" value={getEvaluatorName(evaluation)} />
        <SummaryValue label="Tiến độ" value={`${formatReviewScore(evaluation.progressPercent)}%`} strong />
        <SummaryValue label="Chất lượng" value={`${formatReviewScore(evaluation.qualityPercent)}%`} strong />
        <SummaryValue label="Điểm thực hiện" value={formatReviewScore(evaluation.actualScore)} strong />
        <SummaryValue label="Điểm quy đổi" value={formatReviewScore(evaluation.convertedScore)} strong />
        <SummaryValue label="Quyết định" value={isApproved ? 'Duyệt' : 'Yêu cầu chỉnh sửa'} />
        <SummaryValue label="Ngày đánh giá" value={formatReviewDate(evaluation.evaluatedAt, true)} />
        <div className="min-w-0 sm:col-span-2 lg:col-span-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
            Nhận xét
          </dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text)]">
            {evaluation.comment?.trim() || 'Không có'}
          </dd>
        </div>
      </dl>
    </div>
  )
}

function ManagerReviewForm({
  review,
  form,
  errors,
  isEditable,
  isReviewed,
  isSubmitting,
  apiError,
  onChange,
  onSubmit,
}: {
  review: ManagerPeriodReview
  form: ManagerReviewFormState
  errors: ManagerReviewFormErrors
  isEditable: boolean
  isReviewed: boolean
  isSubmitting: boolean
  apiError: string
  onChange: (form: ManagerReviewFormState) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:flex-row sm:items-start sm:px-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-strong)]">
            III. Nhận xét, đánh giá của cấp có thẩm quyền
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
            {isReviewed
              ? 'Đánh giá đã hoàn tất. Các thông tin bên dưới chỉ được xem.'
              : 'Hoàn tất điểm, mức xếp loại và nhận xét cho nhân viên.'}
          </p>
        </div>
        {isReviewed ? <Badge variant="success">Đã đánh giá</Badge> : getStatusBadge(review.status)}
      </div>

      <form className="grid min-w-0 gap-4 p-4 sm:p-5" onSubmit={onSubmit} noValidate>
        {isReviewed && (review.reviewedByName || review.reviewedAt) ? (
          <p className="rounded-[var(--radius-md)] bg-[var(--color-success-soft)] px-3 py-2.5 text-sm text-[var(--color-success)]">
            {review.reviewedByName ? `Người đánh giá: ${review.reviewedByName}` : 'Đã hoàn tất đánh giá'}
            {review.reviewedAt ? ` · ${formatReviewDate(review.reviewedAt, true)}` : ''}
          </p>
        ) : null}

        {!isEditable && !isReviewed ? (
          <p className="rounded-[var(--radius-md)] bg-[var(--color-warning-soft)] px-3 py-2.5 text-sm text-[var(--color-warning)]">
            Chỉ có thể xác nhận khi kết quả đang ở trạng thái Chờ đánh giá.
          </p>
        ) : null}

        {apiError ? (
          <p role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2.5 text-sm font-medium text-[var(--color-danger)]">
            {apiError}
          </p>
        ) : null}

        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <label className="grid min-w-0 gap-1.5">
            <span className="text-sm font-semibold text-[var(--color-text)]">
              1. Điểm đánh giá <span className="text-[var(--color-danger)]">*</span>
            </span>
            <input
              type="number"
              min={0}
              max={100}
              step="any"
              value={form.managerScore}
              onChange={(event) =>
                onChange({
                  ...form,
                  managerScore: event.target.value === '' ? '' : Number(event.target.value),
                })
              }
              className={fieldClassName}
              placeholder="0 - 100"
              disabled={!isEditable}
              aria-invalid={Boolean(errors.managerScore)}
              aria-describedby={errors.managerScore ? 'manager-score-error' : undefined}
            />
            {errors.managerScore ? (
              <span id="manager-score-error" className="text-xs font-medium text-[var(--color-danger)]">
                {errors.managerScore}
              </span>
            ) : null}
          </label>

          <label className="grid min-w-0 gap-1.5">
            <span className="text-sm font-semibold text-[var(--color-text)]">
              2. Đề xuất xếp loại <span className="text-[var(--color-danger)]">*</span>
            </span>
            <select
              value={form.managerProposedRating}
              onChange={(event) =>
                onChange({
                  ...form,
                  managerProposedRating: event.target.value as PeriodReviewRating | '',
                })
              }
              className={fieldClassName}
              disabled={!isEditable}
              aria-invalid={Boolean(errors.managerProposedRating)}
              aria-describedby={errors.managerProposedRating ? 'manager-rating-error' : undefined}
            >
              <option value="">Chọn mức xếp loại</option>
              {Object.values(SelfProposedRating).map((rating) => (
                <option key={rating} value={rating}>
                  {selfProposedRatingLabels[rating]}
                </option>
              ))}
            </select>
            {errors.managerProposedRating ? (
              <span id="manager-rating-error" className="text-xs font-medium text-[var(--color-danger)]">
                {errors.managerProposedRating}
              </span>
            ) : null}
          </label>
        </div>

        <label className="grid min-w-0 gap-1.5">
          <span className="text-sm font-semibold leading-6 text-[var(--color-text)]">
            3. Mức độ đáp ứng đối với các mục tiêu, nhiệm vụ then chốt
          </span>
          <textarea
            value={form.keyTaskAssessment}
            onChange={(event) => onChange({ ...form, keyTaskAssessment: event.target.value })}
            className={textAreaClassName}
            placeholder="Nhập nhận xét về mức độ đáp ứng các mục tiêu, nhiệm vụ then chốt..."
            disabled={!isEditable}
          />
        </label>

        {isEditable ? (
          <div className="flex justify-stretch border-t border-[var(--color-border)] pt-4 sm:justify-end">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xác nhận...' : 'Xác nhận đánh giá'}
            </Button>
          </div>
        ) : null}
      </form>
    </Card>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-[var(--color-border)] bg-white px-4 py-4 sm:px-5">
      <h2 className="text-base font-semibold text-[var(--color-text-strong)]">{title}</h2>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
    </div>
  )
}

function SectionEmptyState({ message }: { message: string }) {
  return <p className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">{message}</p>
}

function SummaryValue({
  label,
  value,
  strong = false,
}: {
  label: string
  value?: ReactNode
  strong?: boolean
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd
        className={`mt-1 break-words text-sm leading-6 ${
          strong ? 'font-semibold text-[var(--color-text-strong)]' : 'text-[var(--color-text)]'
        }`}
      >
        {value || '-'}
      </dd>
    </div>
  )
}

function getTaskStatusVariant(status?: string | null) {
  if (status === 'COMPLETED') return 'success' as const
  if (status === 'WAITING_EVALUATION' || status === 'REVISION_REQUIRED') return 'warning' as const
  if (status === 'IN_PROGRESS') return 'primary' as const
  if (status === 'CANCELLED') return 'neutral' as const
  return 'info' as const
}

function PageState({
  title,
  description,
  backLink,
  action,
}: {
  title: string
  description: string
  backLink: string
  action?: ReactNode
}) {
  return (
    <Card className="grid min-h-72 place-items-center p-6 text-center">
      <div className="max-w-lg">
        <h1 className="text-lg font-semibold text-[var(--color-text-strong)]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            to={backLink}
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-5 text-sm font-semibold text-[var(--color-text-strong)] shadow-sm transition-colors hover:bg-[var(--color-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            Quay lại danh sách
          </Link>
          {action}
        </div>
      </div>
    </Card>
  )
}

function DetailLoadingState() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Đang tải đánh giá nhân viên">
      <div className="h-8 w-72 max-w-full animate-pulse rounded bg-[var(--color-surface-muted)]" />
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="grid gap-3 p-5">
          <div className="h-5 w-48 max-w-full animate-pulse rounded bg-[var(--color-surface-muted)]" />
          <div className="h-16 w-full animate-pulse rounded bg-[var(--color-surface-muted)]" />
        </Card>
      ))}
    </div>
  )
}

function SuccessToast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex max-w-sm items-center gap-3 rounded-[var(--radius-md)] border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-[var(--color-success)] shadow-[var(--shadow-modal)] sm:left-auto sm:right-4"
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.7" />
        <path d="m6.5 10 2.25 2.25 4.75-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{message}</span>
    </div>
  )
}

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M16 10H4m4-4-4 4 4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4 text-[var(--color-text-muted)] group-open:rotate-180"
    >
      <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
