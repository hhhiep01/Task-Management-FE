import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { env } from '@/config/env'
import { useEvaluationPeriods } from '@/features/evaluation-periods/hooks/useEvaluationPeriods'
import { PeriodStatus, type EvaluationPeriod } from '@/features/evaluation-periods/types/evaluationPeriod.types'
import {
  selfProposedRatingLabels,
  type SelfProposedRating,
} from '@/features/period-results/types/periodResult.types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePagedListState } from '@/hooks/usePagedListState'
import { downloadBlob } from '@/utils/downloadFile'

import { getExportErrorMessage } from '../api/periodEvaluationExportApi'
import { usePeriodEvaluationSummary } from '../hooks/usePeriodEvaluationSummary'
import { useExportPeriodExcel } from '../hooks/usePeriodEvaluationExport'
import {
  PeriodEvaluationSummaryStatus,
  type PeriodEvaluationSummaryEmployee,
} from '../types/periodEvaluationSummary.types'

const filterKeys = ['status', 'rating'] as const
const selectClassName =
  'h-10 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 text-sm font-medium text-[var(--color-text-strong)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-text-muted)]'

const statusLabels: Record<string, string> = {
  [PeriodEvaluationSummaryStatus.DRAFT]: 'Bản nháp',
  [PeriodEvaluationSummaryStatus.SUBMITTED]: 'Đã gửi',
  [PeriodEvaluationSummaryStatus.REVIEWED]: 'Đã đánh giá',
  [PeriodEvaluationSummaryStatus.LOCKED]: 'Đã khóa',
}

const periodStatusLabels: Record<string, string> = {
  DRAFT: 'Bản nháp',
  ACTIVE: 'Đang hoạt động',
  CLOSED: 'Đã đóng',
  EVALUATING: 'Đang đánh giá',
  LOCKED: 'Đã khóa',
}

const ratingOptions = Object.entries(selfProposedRatingLabels) as [SelfProposedRating, string][]

function getInitialPeriodId(periods: EvaluationPeriod[]) {
  return periods.find((period) => period.status === PeriodStatus.ACTIVE)?.id ?? periods[0]?.id ?? ''
}

function getRatingLabel(rating: SelfProposedRating | null) {
  return rating ? selfProposedRatingLabels[rating] ?? '-' : '-'
}

function getStatusVariant(status: string) {
  if (status === PeriodEvaluationSummaryStatus.LOCKED) return 'neutral' as const
  if (status === PeriodEvaluationSummaryStatus.REVIEWED) return 'success' as const
  if (status === PeriodEvaluationSummaryStatus.SUBMITTED) return 'info' as const
  return 'warning' as const
}

function formatScore(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-'
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : 'Không thể tải kết quả đánh giá.'
}

export function PeriodEvaluationSummaryPage() {
  useDocumentTitle(`Kết quả đánh giá | ${env.appName}`)

  const [searchParams, setSearchParams] = useSearchParams()
  const selectedPeriodId = searchParams.get('periodId') ?? ''
  const periodsQuery = useEvaluationPeriods({ pageNumber: 1, pageSize: 100 })
  const periods = useMemo(() => periodsQuery.data?.items ?? [], [periodsQuery.data])
  const listState = usePagedListState(filterKeys)
  const summaryQuery = usePeriodEvaluationSummary(selectedPeriodId, listState.query)
  const exportMutation = useExportPeriodExcel()
  const [exportNotice, setExportNotice] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null)
  const summary = summaryQuery.data

  useEffect(() => {
    if (!periods.length || periods.some((period) => period.id === selectedPeriodId)) return

    const initialPeriodId = getInitialPeriodId(periods)
    if (initialPeriodId) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        next.set('periodId', initialPeriodId)
        next.set('pageNumber', '1')
        return next
      }, { replace: true })
    }
  }, [periods, selectedPeriodId, setSearchParams])

  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId)
  const totalEmployees = summary?.totalEmployees ?? 0
  const totalPages = Math.max(1, Math.ceil(totalEmployees / listState.query.pageSize))
  const hasPreviousPage = listState.query.pageNumber > 1
  const hasNextPage = listState.query.pageNumber < totalPages
  const employees = summary?.results ?? []
  const isFilteredEmpty = Boolean(listState.hasActiveFilters && !employees.length && !summaryQuery.isLoading)
  const currentPeriodStatus = summary?.periodStatus ?? selectedPeriod?.status
  const canExport = currentPeriodStatus === 'REVIEWED' || currentPeriodStatus === PeriodStatus.LOCKED

  useEffect(() => {
    if (!exportNotice) return
    const timeoutId = window.setTimeout(() => setExportNotice(null), 4500)
    return () => window.clearTimeout(timeoutId)
  }, [exportNotice])

  const handleExport = async () => {
    if (!selectedPeriodId || !canExport || exportMutation.isPending) return

    setExportNotice(null)
    try {
      const file = await exportMutation.mutateAsync(selectedPeriodId)
      downloadBlob(file.blob, file.fileName)
      setExportNotice({ message: 'Xuất Excel thành công.', tone: 'success' })
    } catch (error) {
      setExportNotice({ message: await getExportErrorMessage(error), tone: 'danger' })
    }
  }

  const handlePeriodChange = (periodId: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('pageNumber', '1')
      if (periodId) next.set('periodId', periodId)
      else next.delete('periodId')
      return next
    }, { replace: true })
  }

  const columns: DataTableColumn<PeriodEvaluationSummaryEmployee>[] = [
    {
      key: 'employee',
      header: 'Nhân viên',
      className: 'min-w-48',
      render: (employee) => (
        <Link
          to={`/period-evaluation-summary/${selectedPeriodId}/employees/${employee.userId}`}
          className="font-semibold text-[var(--color-text-strong)] transition-colors hover:text-[var(--color-primary)]"
        >
          {employee.fullName}
        </Link>
      ),
    },
    {
      key: 'commonScore',
      header: 'Tiêu chí chung',
      className: 'whitespace-nowrap tabular-nums',
      render: (employee) => <ScoreFraction score={employee.commonScore} max={employee.commonMaxScore} />,
    },
    {
      key: 'taskScore',
      header: 'KPI công việc',
      className: 'whitespace-nowrap tabular-nums',
      render: (employee) => <ScoreFraction score={employee.taskScore} max={employee.taskMaxScore} />,
    },
    {
      key: 'totalScore',
      header: 'Tổng điểm',
      className: 'whitespace-nowrap',
      render: (employee) => (
        <span className="inline-flex items-baseline gap-1 rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] px-2.5 py-1.5 tabular-nums text-[var(--color-primary)] ring-1 ring-inset ring-teal-200">
          <strong className="text-base">{formatScore(employee.totalScore)}</strong>
          <span className="text-xs font-semibold">/ {formatScore(employee.totalMaxScore)}</span>
        </span>
      ),
    },
    {
      key: 'selfRating',
      header: 'Cá nhân tự đề xuất',
      className: 'min-w-56',
      render: (employee) => <RatingCell label="Cá nhân" rating={employee.selfProposedRating} />,
    },
    {
      key: 'managerScore',
      header: 'Điểm quản lý',
      className: 'whitespace-nowrap tabular-nums',
      render: (employee) => formatScore(employee.managerScore),
    },
    {
      key: 'managerRating',
      header: 'Xếp loại quản lý',
      className: 'min-w-56',
      render: (employee) => <RatingCell label="Quản lý" rating={employee.managerProposedRating} />,
    },
    {
      key: 'assessment',
      header: 'Đánh giá nhiệm vụ then chốt',
      className: 'max-w-64 min-w-56',
      render: (employee) => (
        <p className="line-clamp-2 max-w-64 text-sm leading-5 text-[var(--color-text)]" title={employee.keyTaskAssessment ?? undefined}>
          {employee.keyTaskAssessment?.trim() || '-'}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      className: 'whitespace-nowrap',
      render: (employee) => <Badge variant={getStatusVariant(employee.status)}>{statusLabels[employee.status] ?? 'Không xác định'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      headerClassName: 'text-right',
      className: 'whitespace-nowrap text-right',
      render: (employee) => (
        <Link
          to={`/period-evaluation-summary/${selectedPeriodId}/employees/${employee.userId}`}
          className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 text-sm font-semibold text-[var(--color-text-strong)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          Xem chi tiết
        </Link>
      ),
    },
  ]

  const pagination = (
    <Pagination
      pageNumber={listState.query.pageNumber}
      pageSize={listState.query.pageSize}
      totalCount={totalEmployees}
      totalPages={totalPages}
      hasPreviousPage={hasPreviousPage}
      hasNextPage={hasNextPage}
      onPageChange={listState.setPageNumber}
      onPageSizeChange={listState.setPageSize}
      disabled={summaryQuery.isFetching}
    />
  )

  return (
    <section className="grid w-full min-w-0 gap-5">
      <PageHeader
        eyebrow="Kỳ đánh giá"
        title="Kết quả đánh giá"
        description="Tổng hợp kết quả đánh giá nhân viên theo kỳ."
        actions={<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
          <label className="grid w-full min-w-0 gap-1.5 sm:w-auto">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Kỳ đánh giá</span>
            <select value={selectedPeriodId} onChange={(event) => handlePeriodChange(event.target.value)} className={selectClassName} disabled={periodsQuery.isLoading || !periods.length}>
              <option value="">Chọn kỳ đánh giá</option>
              {periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}
            </select>
          </label>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => void handleExport()}
            disabled={!summary || !canExport || exportMutation.isPending}
            title={!canExport ? 'Chỉ có thể xuất báo cáo khi kỳ đã được đánh giá hoặc khóa.' : 'Xuất tổng hợp Excel'}
          >
            {exportMutation.isPending ? <SpinnerIcon /> : <ExcelIcon />}
            {exportMutation.isPending ? 'Đang tạo file Excel...' : 'Xuất tổng hợp Excel'}
          </Button>
        </div>}
      />

      {periodsQuery.isError ? <AlertMessage>{getErrorMessage(periodsQuery.error)}</AlertMessage> : null}

      {selectedPeriodId && summary ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-[var(--color-primary)] px-4 py-4 sm:px-5">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-[var(--color-text-strong)]">{summary.periodName}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{totalEmployees} nhân viên</p>
            </div>
            <Badge variant={summary.periodStatus === PeriodStatus.LOCKED ? 'neutral' : 'info'}>
              {periodStatusLabels[summary.periodStatus] ?? 'Không xác định'}
            </Badge>
          </div>
          {selectedPeriod ? <p className="text-sm text-[var(--color-text-muted)]">{formatPeriodRange(selectedPeriod)}</p> : null}
        </Card>
      ) : null}

      {selectedPeriodId ? (
        <>
          <Card className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(10rem,0.7fr)_minmax(12rem,0.9fr)_auto] sm:items-end">
            <FilterInput label="Tìm nhân viên" placeholder="Tìm theo tên nhân viên..." value={listState.searchInput} onChange={listState.setSearchInput} />
            <FilterSelect label="Trạng thái" value={listState.filters.status} onChange={(value) => listState.setFilter('status', value)} options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} />
            <FilterSelect label="Xếp loại" value={listState.filters.rating} onChange={(value) => listState.setFilter('rating', value)} options={ratingOptions.map(([value, label]) => ({ value, label }))} />
            {listState.hasActiveFilters ? <Button variant="secondary" className="w-full sm:w-auto" onClick={listState.clearFilters}>Xóa lọc</Button> : <span />}
          </Card>

          <div className="hidden min-w-0 lg:block">
            <DataTable
              title="Danh sách kết quả"
              countLabel={`${totalEmployees} nhân viên`}
              items={employees}
              columns={columns}
              getRowKey={(employee) => employee.userId}
              isLoading={summaryQuery.isLoading}
              isError={summaryQuery.isError}
              loadingMessage="Đang tải kết quả đánh giá..."
              errorMessage={getErrorMessage(summaryQuery.error)}
              emptyMessage={isFilteredEmpty ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có kết quả đánh giá.'}
              emptyContent={isFilteredEmpty ? <EmptyState filtered onClear={listState.clearFilters} /> : undefined}
              minWidthClassName="min-w-[1680px]"
              rowClassName="transition-colors hover:bg-[var(--color-surface-subtle)]"
              footer={summaryQuery.isLoading || summaryQuery.isError || !employees.length ? null : pagination}
            />
          </div>

          <div className="grid min-w-0 gap-3 lg:hidden">
            {summaryQuery.isLoading ? <SummaryLoadingState /> : summaryQuery.isError ? <AlertMessage>{getErrorMessage(summaryQuery.error)}</AlertMessage> : employees.length ? employees.map((employee) => <SummaryEmployeeCard key={employee.userId} employee={employee} periodId={selectedPeriodId} />) : <EmptyState filtered={isFilteredEmpty} onClear={listState.clearFilters} />}
            {!summaryQuery.isLoading && !summaryQuery.isError && employees.length ? <Card className="overflow-hidden">{pagination}</Card> : null}
          </div>
        </>
      ) : !periodsQuery.isLoading ? <EmptyState message="Chọn kỳ đánh giá để xem kết quả nhân viên." /> : null}
      {exportNotice ? <ExportToast message={exportNotice.message} tone={exportNotice.tone} /> : null}
    </section>
  )
}

function ScoreFraction({ score, max }: { score: number; max: number }) {
  return <span className="font-semibold tabular-nums text-[var(--color-text-strong)]">{formatScore(score)} <span className="font-normal text-[var(--color-text-muted)]">/ {formatScore(max)}</span></span>
}

function RatingCell({ label, rating }: { label: string; rating: SelfProposedRating | null }) {
  return <div className="grid gap-1"><span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{label}</span><span className="text-sm font-medium text-[var(--color-text)]">{getRatingLabel(rating)}</span></div>
}

function SummaryEmployeeCard({ employee, periodId }: { employee: PeriodEvaluationSummaryEmployee; periodId: string }) {
  return <Card className="grid min-w-0 gap-4 p-4">
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0"><h2 className="break-words font-semibold text-[var(--color-text-strong)]">{employee.fullName}</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Kết quả tổng hợp</p></div>
      <Badge variant={getStatusVariant(employee.status)}>{statusLabels[employee.status] ?? 'Không xác định'}</Badge>
    </div>
    <div className="grid grid-cols-2 gap-2"><MobileScore label="Tiêu chí chung" value={`${formatScore(employee.commonScore)} / ${formatScore(employee.commonMaxScore)}`} /><MobileScore label="KPI công việc" value={`${formatScore(employee.taskScore)} / ${formatScore(employee.taskMaxScore)}`} /></div>
    <div className="flex items-baseline justify-between gap-3 rounded-[var(--radius-md)] border border-teal-200 bg-[var(--color-primary-subtle)] px-3 py-2.5"><span className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-primary)]">Tổng điểm</span><strong className="text-lg tabular-nums text-[var(--color-primary)]">{formatScore(employee.totalScore)} <span className="text-sm">/ {formatScore(employee.totalMaxScore)}</span></strong></div>
    <RatingCell label="Cá nhân tự đề xuất" rating={employee.selfProposedRating} />
    <div className="grid gap-1"><span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Đánh giá quản lý</span><span className="text-sm font-medium text-[var(--color-text)]">{formatScore(employee.managerScore)} · {getRatingLabel(employee.managerProposedRating)}</span></div>
    <Link to={`/period-evaluation-summary/${periodId}/employees/${employee.userId}`} className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 text-sm font-semibold text-[var(--color-text-strong)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] hover:text-[var(--color-primary)]">Xem chi tiết</Link>
  </Card>
}

function MobileScore({ label, value }: { label: string; value: string }) { return <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2.5"><p className="truncate text-xs text-[var(--color-text-muted)]">{label}</p><p className="mt-1 font-semibold tabular-nums text-[var(--color-text-strong)]">{value}</p></div> }
function FilterInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="grid min-w-0 gap-1.5"><span className="text-sm font-medium text-[var(--color-text)]">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={selectClassName} /></label> }
function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <label className="grid min-w-0 gap-1.5"><span className="text-sm font-medium text-[var(--color-text)]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className={selectClassName}><option value="">Tất cả</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label> }
function EmptyState({ filtered, message, onClear }: { filtered?: boolean; message?: string; onClear?: () => void }) { return <Card className="grid min-h-48 place-items-center p-6 text-center"><div><p className="font-semibold text-[var(--color-text-strong)]">{filtered ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có kết quả đánh giá'}</p><p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{message ?? (filtered ? 'Thử thay đổi từ khóa hoặc bộ lọc.' : 'Chưa có dữ liệu đánh giá nhân viên trong kỳ này.')}</p>{filtered && onClear ? <Button variant="secondary" className="mt-4" onClick={onClear}>Xóa bộ lọc</Button> : null}</div></Card> }
function SummaryLoadingState() { return <div className="grid gap-3" aria-busy="true" aria-label="Đang tải kết quả đánh giá">{Array.from({ length: 3 }).map((_, index) => <Card key={index} className="grid gap-3 p-4"><div className="h-5 w-40 max-w-full animate-pulse rounded bg-[var(--color-surface-muted)]" /><div className="h-16 animate-pulse rounded bg-[var(--color-surface-muted)]" /></Card>)}</div> }
function AlertMessage({ children }: { children: ReactNode }) { return <p role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm font-medium text-[var(--color-danger)]">{children}</p> }
function ExportToast({ message, tone }: { message: string; tone: 'success' | 'danger' }) { return <div role={tone === 'danger' ? 'alert' : 'status'} aria-live="polite" className={`fixed bottom-4 left-4 z-50 max-w-sm rounded-[var(--radius-md)] border bg-white px-4 py-3 text-sm font-semibold shadow-[var(--shadow-modal)] sm:left-auto sm:right-4 ${tone === 'danger' ? 'border-red-200 text-[var(--color-danger)]' : 'border-emerald-200 text-[var(--color-success)]'}`}>{message}</div> }
function SpinnerIcon() { return <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> }
function ExcelIcon() { return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="M5.5 2.5h6l3 3v12h-9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M11.5 2.5v3h3M7.5 9l3 4m0-4-3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg> }
function formatPeriodRange(period: EvaluationPeriod) { return `${formatDate(period.startDate)} - ${formatDate(period.endDate)}` }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date) }
