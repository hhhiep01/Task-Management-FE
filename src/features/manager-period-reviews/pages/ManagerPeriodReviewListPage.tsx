import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { env } from '@/config/env'
import { useEvaluationPeriods } from '@/features/evaluation-periods/hooks/useEvaluationPeriods'
import { PeriodStatus, type EvaluationPeriod } from '@/features/evaluation-periods/types/evaluationPeriod.types'
import { selfProposedRatingLabels } from '@/features/period-results/types/periodResult.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

import { usePeriodReviewEmployees } from '../hooks/useManagerPeriodReviews'
import {
  PeriodReviewStatus,
  type PeriodReviewEmployee,
} from '../types/managerPeriodReview.types'
import {
  formatReviewDate,
  formatReviewScore,
  getPeriodReviewEmployeeName,
  getPeriodReviewErrorMessage,
} from '../utils/managerPeriodReviewPresentation'

const selectClassName =
  'h-10 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 text-sm font-medium text-[var(--color-text-strong)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-text-muted)] sm:min-w-64'

function getInitialPeriodId(periods: EvaluationPeriod[]) {
  return periods.find((period) => period.status === PeriodStatus.ACTIVE)?.id ?? periods[0]?.id ?? ''
}

function getReviewStatusBadge(status: string) {
  if (status === PeriodReviewStatus.REVIEWED) {
    return <Badge variant="success">Đã đánh giá</Badge>
  }

  return <Badge variant="warning">Chờ đánh giá</Badge>
}

function getRatingLabel(rating: PeriodReviewEmployee['selfProposedRating']) {
  return rating ? selfProposedRatingLabels[rating] ?? '-' : '-'
}

export function ManagerPeriodReviewListPage() {
  useDocumentTitle(`Đánh giá nhân viên | ${env.appName}`)

  const [searchParams, setSearchParams] = useSearchParams()
  const selectedPeriodId = searchParams.get('periodId') ?? ''
  const periodsQuery = useEvaluationPeriods({ pageNumber: 1, pageSize: 100 })
  const periods = useMemo(() => periodsQuery.data?.items ?? [], [periodsQuery.data])
  const employeesQuery = usePeriodReviewEmployees(selectedPeriodId)
  const employees = useMemo(
    () =>
      (employeesQuery.data ?? []).filter(
        (employee) => employee.status === PeriodReviewStatus.SUBMITTED,
      ),
    [employeesQuery.data],
  )

  useEffect(() => {
    if (!periods.length || periods.some((period) => period.id === selectedPeriodId)) return

    const initialPeriodId = getInitialPeriodId(periods)
    if (initialPeriodId) setSearchParams({ periodId: initialPeriodId }, { replace: true })
  }, [periods, selectedPeriodId, setSearchParams])

  const detailLink = (employee: PeriodReviewEmployee) =>
    `/manager/period-reviews/${selectedPeriodId}/employees/${employee.userId}`

  const columns: DataTableColumn<PeriodReviewEmployee>[] = [
    {
      key: 'employee',
      header: 'Nhân viên',
      className: 'min-w-48',
      render: (employee) => (
        <Link
          to={detailLink(employee)}
          className="font-semibold text-[var(--color-text-strong)] transition-colors hover:text-[var(--color-primary)]"
        >
          {getPeriodReviewEmployeeName(employee)}
        </Link>
      ),
    },
    {
      key: 'commonScore',
      header: 'Tiêu chí chung',
      className: 'whitespace-nowrap tabular-nums',
      render: (employee) => (
        <ScoreFraction score={employee.commonScore} maxScore={employee.commonMaxScore} />
      ),
    },
    {
      key: 'taskScore',
      header: 'KPI công việc',
      className: 'whitespace-nowrap tabular-nums',
      render: (employee) => (
        <ScoreFraction score={employee.taskScore} maxScore={employee.taskMaxScore} />
      ),
    },
    {
      key: 'totalScore',
      header: 'Tổng điểm',
      className: 'whitespace-nowrap',
      render: (employee) => (
        <span className="inline-flex items-baseline gap-1 rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] px-2.5 py-1.5 tabular-nums text-[var(--color-primary)] ring-1 ring-inset ring-teal-200">
          <strong className="text-base">{formatReviewScore(employee.totalScore)}</strong>
          <span className="text-xs font-semibold">/ {formatReviewScore(employee.totalMaxScore)}</span>
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Tự đề xuất xếp loại',
      className: 'min-w-56 text-[var(--color-text)]',
      render: (employee) => getRatingLabel(employee.selfProposedRating),
    },
    {
      key: 'submittedAt',
      header: 'Ngày gửi',
      className: 'whitespace-nowrap text-[var(--color-text-muted)]',
      render: (employee) => formatReviewDate(employee.submittedAt),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      className: 'whitespace-nowrap',
      render: (employee) => getReviewStatusBadge(employee.status),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      headerClassName: 'text-right',
      className: 'whitespace-nowrap text-right',
      render: (employee) => (
        <Link
          to={detailLink(employee)}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 text-sm font-semibold text-[var(--color-text-strong)] shadow-sm transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          Xem đánh giá
          <ArrowRightIcon />
        </Link>
      ),
    },
  ]

  const listError = getPeriodReviewErrorMessage(
    employeesQuery.error,
    'Không tải được danh sách nhân viên chờ đánh giá.',
  )

  return (
    <section className="grid w-full min-w-0 gap-5">
      <PageHeader
        eyebrow="Kỳ đánh giá"
        title="Đánh giá nhân viên"
        description="Xem và đánh giá kết quả tự đánh giá của nhân viên trong kỳ."
        actions={
          <label className="grid w-full min-w-0 gap-1.5 sm:w-auto">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Kỳ đánh giá
            </span>
            <select
              value={selectedPeriodId}
              onChange={(event) =>
                setSearchParams(event.target.value ? { periodId: event.target.value } : {}, {
                  replace: true,
                })
              }
              className={selectClassName}
              disabled={periodsQuery.isLoading || !periods.length}
            >
              <option value="">Chọn kỳ đánh giá</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </label>
        }
      />

      {periodsQuery.isError ? (
        <AlertMessage tone="danger">
          {getPeriodReviewErrorMessage(periodsQuery.error, 'Không tải được danh sách kỳ đánh giá.')}
        </AlertMessage>
      ) : null}

      {!selectedPeriodId && !periodsQuery.isLoading ? (
        <EmptyState message="Chọn kỳ đánh giá để xem nhân viên đang chờ đánh giá." />
      ) : (
        <>
          <div className="hidden min-w-0 lg:block">
            <DataTable
              title="Danh sách chờ đánh giá"
              countLabel={`${employees.length} nhân viên`}
              items={employees}
              columns={columns}
              getRowKey={(employee) => employee.userId}
              isLoading={employeesQuery.isLoading}
              isError={employeesQuery.isError}
              loadingMessage="Đang tải danh sách nhân viên..."
              errorMessage={listError}
              emptyMessage="Không có nhân viên nào đang chờ đánh giá trong kỳ này."
              minWidthClassName="min-w-[1180px]"
              rowClassName="transition-colors hover:bg-[var(--color-surface-subtle)]"
            />
          </div>

          <div className="grid min-w-0 gap-3 lg:hidden">
            {employeesQuery.isLoading ? (
              <ListLoadingState />
            ) : employeesQuery.isError ? (
              <AlertMessage tone="danger">{listError}</AlertMessage>
            ) : employees.length ? (
              employees.map((employee) => (
                <EmployeeReviewCard
                  key={employee.userId}
                  employee={employee}
                  detailLink={detailLink(employee)}
                />
              ))
            ) : (
              <EmptyState message="Không có nhân viên nào đang chờ đánh giá trong kỳ này." />
            )}
          </div>
        </>
      )}
    </section>
  )
}

function EmployeeReviewCard({
  employee,
  detailLink,
}: {
  employee: PeriodReviewEmployee
  detailLink: string
}) {
  return (
    <Card className="grid min-w-0 gap-4 p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={detailLink}
            className="break-words font-semibold text-[var(--color-text-strong)] transition-colors hover:text-[var(--color-primary)]"
          >
            {getPeriodReviewEmployeeName(employee)}
          </Link>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Gửi ngày {formatReviewDate(employee.submittedAt)}
          </p>
        </div>
        {getReviewStatusBadge(employee.status)}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MobileScore label="Tiêu chí chung" score={employee.commonScore} max={employee.commonMaxScore} />
        <MobileScore label="KPI công việc" score={employee.taskScore} max={employee.taskMaxScore} />
        <div className="col-span-2 flex items-center justify-between rounded-[var(--radius-md)] border border-teal-200 bg-[var(--color-primary-subtle)] px-3 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-primary)]">
            Tổng điểm
          </span>
          <strong className="text-lg tabular-nums text-[var(--color-primary)]">
            {formatReviewScore(employee.totalScore)}
            <span className="text-sm"> / {formatReviewScore(employee.totalMaxScore)}</span>
          </strong>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
          Tự đề xuất xếp loại
        </p>
        <p className="mt-1 break-words text-sm text-[var(--color-text)]">
          {getRatingLabel(employee.selfProposedRating)}
        </p>
      </div>

      <Link
        to={detailLink}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 text-sm font-semibold text-[var(--color-text-strong)] shadow-sm transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
      >
        Xem đánh giá
        <ArrowRightIcon />
      </Link>
    </Card>
  )
}

function ScoreFraction({ score, maxScore }: { score: number; maxScore: number }) {
  return (
    <span className="font-semibold text-[var(--color-text-strong)]">
      {formatReviewScore(score)}
      <span className="font-normal text-[var(--color-text-muted)]"> / {formatReviewScore(maxScore)}</span>
    </span>
  )
}

function MobileScore({ label, score, max }: { label: string; score: number; max: number }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2.5">
      <p className="truncate text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 font-semibold tabular-nums text-[var(--color-text-strong)]">
        {formatReviewScore(score)} / {formatReviewScore(max)}
      </p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="grid min-h-48 place-items-center p-6 text-center">
      <div>
        <p className="font-semibold text-[var(--color-text-strong)]">Chưa có dữ liệu</p>
        <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{message}</p>
      </div>
    </Card>
  )
}

function ListLoadingState() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Đang tải danh sách nhân viên">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="grid gap-3 p-4">
          <div className="h-5 w-40 max-w-full animate-pulse rounded bg-[var(--color-surface-muted)]" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-16 animate-pulse rounded bg-[var(--color-surface-muted)]" />
            <div className="h-16 animate-pulse rounded bg-[var(--color-surface-muted)]" />
          </div>
        </Card>
      ))}
    </div>
  )
}

function AlertMessage({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: 'danger' | 'success'
}) {
  return (
    <p
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium ${
        tone === 'danger'
          ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
          : 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
      }`}
    >
      {children}
    </p>
  )
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
