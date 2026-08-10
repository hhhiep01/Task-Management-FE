import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { env } from '@/config/env'
import { useEvaluationPeriods } from '@/features/evaluation-periods/hooks/useEvaluationPeriods'
import { PeriodStatus } from '@/features/evaluation-periods/types/evaluationPeriod.types'
import type { EvaluationPeriod } from '@/features/evaluation-periods/types/evaluationPeriod.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate } from '@/utils/formatDate'
import {
  useMyPeriodResult,
  useSubmitPeriodResult,
  useUpdateSelfProposal,
} from '@/features/period-results/hooks/usePeriodResult'
import {
  SelfProposedRating,
  selfProposedRatingLabels,
} from '@/features/period-results/types/periodResult.types'
import type { SelfProposedRating as SelfProposedRatingValue } from '@/features/period-results/types/periodResult.types'

import {
  useSelfEvaluation,
  useUpdateSelfEvaluation,
} from '../hooks/useSelfEvaluation'
import {
  SelfEvaluationCriterionType,
  type SelfEvaluation,
  type SelfEvaluationCriterion,
  type SelfEvaluationCriterionRequest,
} from '../types/selfEvaluation.types'

type ItemFormState = {
  isMet: boolean
  selfScore: number
  selfNote: string
  maxScore: number
}

type ItemErrors = Record<string, string>

const fieldClassName =
  'w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-text-strong)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-text-muted)]'

const textAreaClassName =
  'min-h-20 w-full min-w-0 resize-y rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm leading-6 text-[var(--color-text-strong)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]'

function formatScore(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
}

function isItem(criterion: SelfEvaluationCriterion) {
  return criterion.criterionType === SelfEvaluationCriterionType.ITEM
}

function getItems(criteria: SelfEvaluationCriterion[]): SelfEvaluationCriterion[] {
  return criteria.flatMap((criterion) =>
    isItem(criterion) ? [criterion] : getItems(criterion.children ?? []),
  )
}

function buildFormState(data?: SelfEvaluation): Record<string, ItemFormState> {
  if (!data) return {}

  return Object.fromEntries(
    getItems(data.criteria).map((criterion) => {
      const isMet = criterion.isMet ?? true
      return [
        criterion.id,
        {
          isMet,
          selfScore: isMet ? Number(criterion.selfScore ?? 0) : 0,
          selfNote: criterion.selfNote ?? '',
          maxScore: criterion.maxScore,
        },
      ]
    }),
  )
}

function getInitialPeriodId(periods: EvaluationPeriod[]) {
  return (
    periods.find((period) => period.status === PeriodStatus.ACTIVE)?.id ??
    periods[0]?.id ??
    ''
  )
}

function getPeriodLabel(period: EvaluationPeriod) {
  return `${period.name} (${formatDate(period.startDate)} - ${formatDate(period.endDate)})`
}

function validateItems(formState: Record<string, ItemFormState>) {
  const errors: ItemErrors = {}

  Object.entries(formState).forEach(([criterionId, item]) => {
    if (!Number.isFinite(item.selfScore)) {
      errors[criterionId] = 'Điểm tự đánh giá không hợp lệ.'
      return
    }

    if (item.selfScore < 0) {
      errors[criterionId] = 'Điểm tự đánh giá không được nhỏ hơn 0.'
      return
    }

    if (item.selfScore > item.maxScore) {
      errors[criterionId] = `Điểm tự đánh giá không được vượt quá ${formatScore(item.maxScore)}.`
    }
  })

  return errors
}

export function SelfEvaluationPage() {
  useDocumentTitle(`Tự đánh giá | ${env.appName}`)

  const periodsQuery = useEvaluationPeriods({ pageNumber: 1, pageSize: 100 })
  const periods = useMemo(() => periodsQuery.data?.items ?? [], [periodsQuery.data])
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const [formState, setFormState] = useState<Record<string, ItemFormState>>({})
  const [showErrors, setShowErrors] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [periodResultRefreshVersion, setPeriodResultRefreshVersion] = useState(0)

  const selfEvaluationQuery = useSelfEvaluation(selectedPeriodId)
  const updateSelfEvaluationMutation = useUpdateSelfEvaluation(selectedPeriodId)
  const resetUpdateSelfEvaluation = updateSelfEvaluationMutation.reset

  useEffect(() => {
    if (!selectedPeriodId && periods.length) {
      setSelectedPeriodId(getInitialPeriodId(periods))
    }
  }, [periods, selectedPeriodId])

  useEffect(() => {
    setFormState(buildFormState(selfEvaluationQuery.data))
    setShowErrors(false)
    setStatusMessage('')
    resetUpdateSelfEvaluation()
  }, [selfEvaluationQuery.data, resetUpdateSelfEvaluation])

  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId)
  const items = useMemo(
    () => getItems(selfEvaluationQuery.data?.criteria ?? []),
    [selfEvaluationQuery.data],
  )
  const itemMaxTotal = useMemo(
    () => items.reduce((total, item) => total + item.maxScore, 0),
    [items],
  )
  const currentTotal = useMemo(
    () =>
      Object.values(formState).reduce(
        (total, item) => total + (Number.isFinite(item.selfScore) ? item.selfScore : 0),
        0,
      ),
    [formState],
  )
  const totalMaxScore = itemMaxTotal || selfEvaluationQuery.data?.totalMaxScore || 0
  const itemErrors = showErrors ? validateItems(formState) : {}
  const formError =
    updateSelfEvaluationMutation.error instanceof Error
      ? updateSelfEvaluationMutation.error.message
      : ''

  const updateItem = (criterionId: string, nextState: Partial<ItemFormState>) => {
    setStatusMessage('')
    setFormState((current) => {
      const currentItem = current[criterionId]
      if (!currentItem) return current

      return {
        ...current,
        [criterionId]: {
          ...currentItem,
          ...nextState,
        },
      }
    })
  }

  const handleMetChange = (criterionId: string, isMet: boolean) => {
    updateItem(criterionId, {
      isMet,
      selfScore: isMet ? formState[criterionId]?.selfScore ?? 0 : 0,
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedPeriodId || updateSelfEvaluationMutation.isPending) return

    setShowErrors(true)
    const errors = validateItems(formState)
    if (Object.keys(errors).length) return

    const payload: SelfEvaluationCriterionRequest[] = items.map((item) => {
      const state = formState[item.id]
      return {
        criterionId: item.id,
        isMet: state?.isMet ?? false,
        selfScore: state?.isMet ? state.selfScore : 0,
        selfNote: state?.selfNote.trim() || null,
      }
    })

    try {
      await updateSelfEvaluationMutation.mutateAsync({ criteria: payload })
      await selfEvaluationQuery.refetch()
      setPeriodResultRefreshVersion((current) => current + 1)
      setStatusMessage('Đã lưu tự đánh giá.')
    } catch {
      // API error is shown below the summary.
    }
  }

  return (
    <section className="grid w-full min-w-0 gap-6">
      <PageHeader
        eyebrow="Nhóm tiêu chí chung"
        title="Tự đánh giá"
        description="Đánh giá các tiêu chí chung trong kỳ đánh giá."
        actions={
          <label className="grid min-w-0 gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Kỳ đánh giá
            </span>
            <select
              value={selectedPeriodId}
              onChange={(event) => setSelectedPeriodId(event.target.value)}
              className={`${fieldClassName} min-w-64`}
              disabled={periodsQuery.isLoading || !periods.length}
            >
              <option value="">Chọn kỳ đánh giá</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {getPeriodLabel(period)}
                </option>
              ))}
            </select>
          </label>
        }
      />

      {!selectedPeriodId ? (
        <SelfEvaluationState title="Chọn kỳ đánh giá để bắt đầu tự đánh giá." />
      ) : selfEvaluationQuery.isLoading ? (
        <SelfEvaluationLoadingState />
      ) : selfEvaluationQuery.isError ? (
        <SelfEvaluationState
          title="Không thể tải dữ liệu tự đánh giá."
          description="Dữ liệu tiêu chí hoặc điểm đã lưu chưa sẵn sàng."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => void selfEvaluationQuery.refetch()}
              disabled={selfEvaluationQuery.isFetching}
            >
              {selfEvaluationQuery.isFetching ? 'Đang tải...' : 'Thử lại'}
            </Button>
          }
        />
      ) : selfEvaluationQuery.data && selfEvaluationQuery.data.criteria.length ? (
        <>
          <form className="grid min-w-0 gap-5" onSubmit={handleSubmit} noValidate>
            <Card className="sticky top-4 z-10 grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--color-text-strong)]">
                  Tổng điểm tự đánh giá
                </h2>
                {selectedPeriod ? (
                  <Badge variant={selectedPeriod.status === PeriodStatus.ACTIVE ? 'success' : 'neutral'}>
                    {selectedPeriod.name}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Điểm được tính từ các tiêu chí ITEM đang hiển thị.
              </p>
            </div>
            <div className="flex items-end justify-between gap-4 sm:justify-end">
              <p className="text-3xl font-bold tabular-nums text-[var(--color-text-strong)]">
                {formatScore(currentTotal)}
                <span className="text-lg text-[var(--color-text-muted)]">
                  {' / '}{formatScore(totalMaxScore)}
                </span>
              </p>
              <Button type="submit" disabled={updateSelfEvaluationMutation.isPending}>
                {updateSelfEvaluationMutation.isPending ? 'Đang lưu...' : 'Lưu tự đánh giá'}
              </Button>
            </div>
            </Card>

            {statusMessage ? (
            <p role="status" className="rounded-[var(--radius-md)] bg-[var(--color-success-soft)] px-4 py-3 text-sm font-medium text-[var(--color-success)]">
              {statusMessage}
            </p>
            ) : null}
            {formError ? (
            <p role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm font-medium text-[var(--color-danger)]">
              {formError}
            </p>
            ) : null}

            <div className="grid min-w-0 gap-4">
            {selfEvaluationQuery.data.criteria.map((criterion) => (
              <CriterionGroup
                key={criterion.id}
                criterion={criterion}
                formState={formState}
                errors={itemErrors}
                onMetChange={handleMetChange}
                onItemChange={updateItem}
              />
            ))}
            </div>
          </form>
          <PeriodResultSection
            periodId={selectedPeriodId}
            refreshVersion={periodResultRefreshVersion}
          />
        </>
      ) : (
        <SelfEvaluationState title="Chưa có bộ tiêu chí chung cho kỳ đánh giá này." />
      )}
    </section>
  )
}

function PeriodResultSection({ periodId, refreshVersion }: { periodId: string; refreshVersion: number }) {
  const [selectedRating, setSelectedRating] = useState<SelfProposedRatingValue | ''>('')
  const [isSubmitConfirmationOpen, setIsSubmitConfirmationOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [localError, setLocalError] = useState('')
  const periodResultQuery = useMyPeriodResult(periodId)
  const refetchPeriodResult = periodResultQuery.refetch
  const updateProposalMutation = useUpdateSelfProposal(periodId)
  const submitPeriodResultMutation = useSubmitPeriodResult(periodId)

  useEffect(() => {
    setSelectedRating(periodResultQuery.data?.selfProposedRating ?? '')
  }, [periodResultQuery.data?.selfProposedRating])

  useEffect(() => {
    if (refreshVersion > 0) {
      void refetchPeriodResult()
    }
  }, [refetchPeriodResult, refreshVersion])

  const result = periodResultQuery.data
  const isSubmitted = result?.status === 'SUBMITTED'
  const isDraft = result?.status === 'DRAFT'
  const hasSavedRating = Boolean(
    selectedRating && result?.selfProposedRating === selectedRating,
  )
  const isSavingProposal = updateProposalMutation.isPending
  const isSubmitting = submitPeriodResultMutation.isPending
  const mutationError = updateProposalMutation.error || submitPeriodResultMutation.error
  const apiError = mutationError instanceof Error ? mutationError.message : ''

  const handleSaveProposal = async () => {
    if (!selectedRating || isSavingProposal || !isDraft) {
      if (!selectedRating) setLocalError('Vui lòng chọn mức xếp loại tự đề xuất.')
      return
    }

    setLocalError('')
    setStatusMessage('')
    updateProposalMutation.reset()

    try {
      await updateProposalMutation.mutateAsync({ selfProposedRating: selectedRating })
      await periodResultQuery.refetch()
      setStatusMessage('Đã lưu mức xếp loại tự đề xuất.')
    } catch {
      // The backend error message is shown below the controls.
    }
  }

  const handleSubmitResult = async () => {
    if (isSubmitting || !isDraft) return

    setStatusMessage('')
    setLocalError('')
    submitPeriodResultMutation.reset()

    try {
      await submitPeriodResultMutation.mutateAsync()
      await periodResultQuery.refetch()
      setIsSubmitConfirmationOpen(false)
      setStatusMessage('Đã gửi bản tự đánh giá.')
    } catch {
      // The backend error message is shown below the controls.
    }
  }

  if (periodResultQuery.isLoading) {
    return <PeriodResultLoadingState />
  }

  if (periodResultQuery.isError) {
    return (
      <SelfEvaluationState
        title="Không thể tải kết quả tự đánh giá."
        description="Đã xảy ra lỗi khi tải điểm tổng hợp của kỳ đánh giá."
        action={
          <Button type="button" variant="secondary" onClick={() => void periodResultQuery.refetch()} disabled={periodResultQuery.isFetching}>
            {periodResultQuery.isFetching ? 'Đang tải...' : 'Thử lại'}
          </Button>
        }
      />
    )
  }

  if (!result) return null

  return (
    <section className="grid min-w-0 gap-4" aria-labelledby="period-result-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="period-result-title" className="text-lg font-semibold text-[var(--color-text-strong)]">Kết quả tự đánh giá</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Điểm tổng hợp được tính từ dữ liệu đã lưu của kỳ {result.periodName}.</p>
        </div>
        {isSubmitted ? <Badge variant="success">Đã gửi</Badge> : <Badge variant="neutral">Bản nháp</Badge>}
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        <ScoreBlock label="Tiêu chí chung" score={result.commonScore} maxScore={result.commonMaxScore} />
        <ScoreBlock label="KPI công việc" score={result.taskScore} maxScore={result.taskMaxScore} />
        <ScoreBlock label="Tổng điểm" score={result.totalScore} maxScore={result.totalMaxScore} prominent />
      </div>

      <Card className="grid min-w-0 gap-4 p-4" variant="flat">
        {isSubmitted ? (
          <div className="grid gap-2">
            <p className="text-sm font-medium text-[var(--color-text-muted)]">Mức xếp loại tự đề xuất</p>
            <p className="text-base font-semibold text-[var(--color-text-strong)]">
              {getRatingLabel(result.selfProposedRating)}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">Đã gửi lúc: {formatDateTime(result.submittedAt)}</p>
          </div>
        ) : (
          <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="grid min-w-0 gap-2" htmlFor="self-proposed-rating">
              <span className="text-sm font-medium text-[var(--color-text)]">Mức xếp loại tự đề xuất</span>
              <select
                id="self-proposed-rating"
                value={selectedRating}
                onChange={(event) => {
                  setSelectedRating(event.target.value as SelfProposedRatingValue | '')
                  setLocalError('')
                  setStatusMessage('')
                }}
                className={fieldClassName}
                disabled={!isDraft || isSavingProposal}
              >
                <option value="">Chọn mức xếp loại</option>
                {Object.values(SelfProposedRating).map((rating) => <option key={rating} value={rating}>{selfProposedRatingLabels[rating]}</option>)}
              </select>
            </label>
            <Button type="button" variant="secondary" onClick={() => void handleSaveProposal()} disabled={!isDraft || !selectedRating || isSavingProposal}>
              {isSavingProposal ? 'Đang lưu...' : 'Lưu mức đề xuất'}
            </Button>
          </div>
        )}

        {isDraft ? <div className="flex justify-end"><Button type="button" onClick={() => setIsSubmitConfirmationOpen(true)} disabled={!hasSavedRating || isSavingProposal || isSubmitting}>Gửi bản tự đánh giá</Button></div> : null}
        {statusMessage ? <p role="status" className="rounded-[var(--radius-md)] bg-[var(--color-success-soft)] px-3 py-2 text-sm font-medium text-[var(--color-success)]">{statusMessage}</p> : null}
        {localError || apiError ? <p role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm font-medium text-[var(--color-danger)]">{localError || apiError}</p> : null}
      </Card>

      <Modal
        open={isSubmitConfirmationOpen}
        onClose={() => setIsSubmitConfirmationOpen(false)}
        title="Gửi bản tự đánh giá"
        description="Sau khi gửi, bạn sẽ không thể chỉnh sửa mức xếp loại tự đề xuất."
        size="sm"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setIsSubmitConfirmationOpen(false)} disabled={isSubmitting}>Hủy</Button>
            <Button type="button" onClick={() => void handleSubmitResult()} disabled={isSubmitting}>{isSubmitting ? 'Đang gửi...' : 'Xác nhận gửi'}</Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-[var(--color-text)]">Mức xếp loại đã chọn: <strong className="font-semibold text-[var(--color-text-strong)]">{getRatingLabel(selectedRating)}</strong></p>
      </Modal>
    </section>
  )
}

function ScoreBlock({ label, score, maxScore, prominent = false }: { label: string; score: number; maxScore: number; prominent?: boolean }) {
  return (
    <Card className={`min-w-0 p-4 ${prominent ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]' : ''}`} variant={prominent ? 'default' : 'flat'}>
      <p className="text-sm font-medium text-[var(--color-text-muted)]">{label}</p>
      <p className={`${prominent ? 'text-3xl text-[var(--color-primary)]' : 'text-2xl text-[var(--color-text-strong)]'} mt-2 font-bold tabular-nums`}>
        {formatPeriodResultScore(score)}
        <span className="text-base font-medium text-[var(--color-text-muted)]"> {' / '}{formatPeriodResultScore(maxScore)}</span>
      </p>
    </Card>
  )
}

function getRatingLabel(value: SelfProposedRatingValue | null | '') {
  return value && value in selfProposedRatingLabels
    ? selfProposedRatingLabels[value as SelfProposedRatingValue]
    : 'Chưa đề xuất'
}

function formatPeriodResultScore(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 6 }).format(value)
}

function formatDateTime(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function PeriodResultLoadingState() {
  return (
    <section className="grid gap-4" aria-busy="true" aria-label="Đang tải kết quả tự đánh giá">
      <div><SkeletonBar className="h-6 w-48" /><SkeletonBar className="mt-2 h-4 w-80 max-w-full" /></div>
      <div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Card key={index} className="grid gap-3 p-4" variant="flat"><SkeletonBar className="h-4 w-28" /><SkeletonBar className="h-8 w-32" /></Card>)}</div>
      <Card className="grid gap-3 p-4" variant="flat"><SkeletonBar className="h-4 w-52" /><SkeletonBar className="h-11 w-full" /><SkeletonBar className="h-11 w-48 justify-self-end" /></Card>
    </section>
  )
}

function CriterionGroup({
  criterion,
  formState,
  errors,
  onMetChange,
  onItemChange,
}: {
  criterion: SelfEvaluationCriterion
  formState: Record<string, ItemFormState>
  errors: ItemErrors
  onMetChange: (criterionId: string, isMet: boolean) => void
  onItemChange: (criterionId: string, nextState: Partial<ItemFormState>) => void
}) {
  if (isItem(criterion)) {
    return (
      <CriterionItem
        criterion={criterion}
        state={formState[criterion.id]}
        error={errors[criterion.id]}
        onMetChange={onMetChange}
        onItemChange={onItemChange}
      />
    )
  }

  return (
    <Card className="overflow-hidden" variant="flat">
      <div className="grid gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="min-w-0">
          <p className="text-sm font-semibold tabular-nums text-[var(--color-primary)]">
            {criterion.code}
          </p>
          <h2 className="mt-1 text-base font-semibold leading-6 text-[var(--color-text-strong)]">
            {criterion.content}
          </h2>
        </div>
        <Badge variant="primary" className="sm:mt-1">
          {formatScore(criterion.maxScore)} điểm
        </Badge>
      </div>
      <div className="grid gap-0 divide-y divide-[var(--color-border)]">
        {(criterion.children ?? []).map((child) => (
          <CriterionGroup
            key={child.id}
            criterion={child}
            formState={formState}
            errors={errors}
            onMetChange={onMetChange}
            onItemChange={onItemChange}
          />
        ))}
      </div>
    </Card>
  )
}

function CriterionItem({
  criterion,
  state,
  error,
  onMetChange,
  onItemChange,
}: {
  criterion: SelfEvaluationCriterion
  state?: ItemFormState
  error?: string
  onMetChange: (criterionId: string, isMet: boolean) => void
  onItemChange: (criterionId: string, nextState: Partial<ItemFormState>) => void
}) {
  const isMet = state?.isMet ?? true
  const score = state?.selfScore ?? 0

  return (
    <div className="grid min-w-0 gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.8fr)] lg:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{criterion.code}</Badge>
          <span className="text-xs font-medium text-[var(--color-text-muted)]">
            Điểm tối đa: {formatScore(criterion.maxScore)}
          </span>
        </div>
        <p className="mt-2 break-words text-sm leading-6 text-[var(--color-text-strong)]">
          {criterion.content}
        </p>
      </div>

      <div className="grid min-w-0 gap-3">
        <fieldset className="grid gap-2">
          <legend className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            Đánh giá
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <EvaluationChoice
              name={`criterion-${criterion.id}-met`}
              checked={isMet}
              label="Đảm bảo"
              onChange={() => onMetChange(criterion.id, true)}
            />
            <EvaluationChoice
              name={`criterion-${criterion.id}-met`}
              checked={!isMet}
              label="Không đảm bảo"
              onChange={() => onMetChange(criterion.id, false)}
            />
          </div>
        </fieldset>

        <div className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-start">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text)]">
              Điểm tự đánh giá
            </span>
            <input
              type="number"
              min={0}
              max={criterion.maxScore}
              step="any"
              value={score}
              onChange={(event) =>
                onItemChange(criterion.id, {
                  selfScore: Number(event.target.value),
                })
              }
              className={fieldClassName}
              disabled={!isMet}
              aria-invalid={Boolean(error)}
            />
            {error ? (
              <span className="text-xs font-medium text-[var(--color-danger)]">{error}</span>
            ) : null}
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text)]">Ghi chú</span>
            <textarea
              value={state?.selfNote ?? ''}
              onChange={(event) =>
                onItemChange(criterion.id, {
                  selfNote: event.target.value,
                })
              }
              className={textAreaClassName}
              placeholder="Nhập ghi chú nếu cần..."
            />
          </label>
        </div>
      </div>
    </div>
  )
}

function EvaluationChoice({
  name,
  checked,
  label,
  onChange,
}: {
  name: string
  checked: boolean
  label: string
  onChange: () => void
}) {
  return (
    <label className={`flex min-w-0 items-center gap-3 rounded-[var(--radius-md)] border px-3 py-2 text-sm font-medium transition-colors ${checked ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]' : 'border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]'}`}>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-[var(--color-primary)]"
      />
      <span>{label}</span>
    </label>
  )
}

function SelfEvaluationState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <Card className="grid min-h-64 place-items-center px-5 py-12 text-center">
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-[var(--color-text-strong)]">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
        ) : null}
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </Card>
  )
}

function SelfEvaluationLoadingState() {
  return (
    <div aria-busy="true" aria-label="Đang tải dữ liệu tự đánh giá" className="grid gap-4">
      <Card className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <SkeletonBar className="h-5 w-48" />
          <SkeletonBar className="mt-2 h-4 w-72 max-w-full" />
        </div>
        <SkeletonBar className="h-11 w-40" />
      </Card>
      {Array.from({ length: 2 }).map((_, groupIndex) => (
        <Card key={groupIndex} className="overflow-hidden" variant="flat">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-4">
            <SkeletonBar className="h-4 w-16" />
            <SkeletonBar className="mt-2 h-5 w-3/4" />
          </div>
          {Array.from({ length: 3 }).map((__, itemIndex) => (
            <div key={itemIndex} className="grid gap-4 border-b border-[var(--color-border)] px-4 py-4 last:border-b-0 lg:grid-cols-[1fr_24rem]">
              <div>
                <SkeletonBar className="h-5 w-24" />
                <SkeletonBar className="mt-3 h-4 w-full" />
                <SkeletonBar className="mt-2 h-4 w-5/6" />
              </div>
              <div>
                <SkeletonBar className="h-10 w-full" />
                <SkeletonBar className="mt-3 h-20 w-full" />
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  )
}

function SkeletonBar({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] ${className}`}
    />
  )
}
