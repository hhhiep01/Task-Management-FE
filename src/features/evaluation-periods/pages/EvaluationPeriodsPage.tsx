import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { env } from '@/config/env'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOrganizations } from '@/features/organizations/hooks/useOrganizations'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePagedListState } from '@/hooks/usePagedListState'
import { formatDate } from '@/utils/formatDate'

import {
  useCreateEvaluationPeriod,
  useDeleteEvaluationPeriod,
  useEvaluationPeriods,
  useLockEvaluationPeriod,
  useUpdateEvaluationPeriod,
} from '../hooks/useEvaluationPeriods'
import {
  PeriodStatus,
  PeriodType,
  toEvaluationPeriodPayload,
  type EvaluationPeriod,
  type EvaluationPeriodPayload,
} from '../types/evaluationPeriod.types'

const periodTypeLabels: Record<PeriodType, string> = {
  [PeriodType.MONTH]: 'Tháng',
  [PeriodType.QUARTER]: 'Quý',
  [PeriodType.YEAR]: 'Năm',
}

const periodStatusLabels: Record<PeriodStatus, string> = {
  [PeriodStatus.DRAFT]: 'Nháp',
  [PeriodStatus.ACTIVE]: 'Đang hoạt động',
  [PeriodStatus.CLOSED]: 'Đã đóng',
  [PeriodStatus.EVALUATING]: 'Đang đánh giá',
  [PeriodStatus.LOCKED]: 'Đã khóa',
}

function getPeriodStatusVariant(status: PeriodStatus) {
  if (status === PeriodStatus.LOCKED) return 'neutral' as const
  if (status === PeriodStatus.EVALUATING) return 'warning' as const
  if (status === PeriodStatus.ACTIVE) return 'success' as const
  return 'neutral' as const
}

const initialForm: EvaluationPeriodPayload = {
  organizationId: '',
  name: '',
  periodType: PeriodType.MONTH,
  startDate: '',
  endDate: '',
  status: PeriodStatus.DRAFT,
}

const filterKeys = ['organizationId', 'periodType', 'status', 'fromDate', 'toDate'] as const

export function EvaluationPeriodsPage() {
  useDocumentTitle(`Quản lý kỳ đánh giá | ${env.appName}`)

  const [form, setForm] = useState<EvaluationPeriodPayload>(initialForm)
  const [editingPeriod, setEditingPeriod] = useState<EvaluationPeriod | null>(null)
  const [formError, setFormError] = useState('')
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false)
  const [periodToLock, setPeriodToLock] = useState<EvaluationPeriod | null>(null)
  const [lockSuccess, setLockSuccess] = useState('')
  const { user } = useAuth()

  const listState = usePagedListState(filterKeys)
  const periodsQuery = useEvaluationPeriods(listState.query)
  const organizationsQuery = useOrganizations()
  const createPeriodMutation = useCreateEvaluationPeriod()
  const updatePeriodMutation = useUpdateEvaluationPeriod()
  const deletePeriodMutation = useDeleteEvaluationPeriod()
  const lockPeriodMutation = useLockEvaluationPeriod()

  const isSubmitting = createPeriodMutation.isPending || updatePeriodMutation.isPending
  const modalTitle = editingPeriod ? 'Cập nhật kỳ đánh giá' : 'Tạo kỳ đánh giá'
  const formApiError = useMemo(() => {
    const error = createPeriodMutation.error || updatePeriodMutation.error
    return error instanceof Error ? error.message : ''
  }, [createPeriodMutation.error, updatePeriodMutation.error])
  const deleteError =
    deletePeriodMutation.error instanceof Error ? deletePeriodMutation.error.message : ''
  const lockError = lockPeriodMutation.error instanceof Error ? lockPeriodMutation.error.message : ''
  const canLockPeriods = ['ADMIN', 'TP'].includes(user?.roleCode?.toUpperCase() ?? '')

  const closeModal = () => {
    setForm(initialForm)
    setEditingPeriod(null)
    setFormError('')
    setIsPeriodModalOpen(false)
  }

  const openCreateModal = () => {
    setForm(initialForm)
    setEditingPeriod(null)
    setFormError('')
    setIsPeriodModalOpen(true)
  }

  const openEditModal = (period: EvaluationPeriod) => {
    const payload = toEvaluationPeriodPayload(period)

    setEditingPeriod(period)
    setForm(payload)
    setFormError('')
    setIsPeriodModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      organizationId: form.organizationId,
      name: form.name.trim(),
      periodType: form.periodType,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
    }

    if (!payload.organizationId || !payload.name || !payload.startDate || !payload.endDate) {
      setFormError('Vui lòng nhập đầy đủ phòng ban, tên kỳ, ngày bắt đầu và ngày kết thúc.')
      return
    }

    setFormError('')

    if (editingPeriod) {
      await updatePeriodMutation.mutateAsync({
        periodId: editingPeriod.id,
        payload,
      })
    } else {
      await createPeriodMutation.mutateAsync(payload)
    }

    closeModal()
  }

  const handleDelete = async (period: EvaluationPeriod) => {
    const confirmed = window.confirm(`Xóa kỳ đánh giá "${period.name}"?`)

    if (!confirmed) {
      return
    }

    await deletePeriodMutation.mutateAsync(period.id)
  }

  const handleStatusChange = async (period: EvaluationPeriod, status: PeriodStatus) => {
    if (period.status === PeriodStatus.LOCKED) return
    await updatePeriodMutation.mutateAsync({
      periodId: period.id,
      payload: toEvaluationPeriodPayload(period, { status }),
    })
  }

  const handleLock = async () => {
    if (!periodToLock || periodToLock.status !== PeriodStatus.EVALUATING || lockPeriodMutation.isPending) return

    try {
      await lockPeriodMutation.mutateAsync(periodToLock.id)
      setPeriodToLock(null)
      setLockSuccess('Khóa kỳ đánh giá thành công.')
      window.setTimeout(() => setLockSuccess(''), 4500)
    } catch {
      // The backend error is rendered in the confirmation dialog.
    }
  }

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
            Trưởng phòng
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Quản lý kỳ đánh giá</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Tạo, cập nhật và theo dõi các kỳ đánh giá theo từng phòng ban.
          </p>
        </div>

      <Button type="button" onClick={openCreateModal}>
        Tạo kỳ đánh giá
      </Button>
      </div>

      {lockSuccess ? (
        <p className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-success-soft)] px-4 py-3 text-sm font-medium text-[var(--color-success)]" role="status">
          {lockSuccess}
        </p>
      ) : null}

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold text-slate-950">Danh sách kỳ đánh giá</h2>
          {periodsQuery.data ? (
            <span className="text-sm font-medium text-slate-500">
              {periodsQuery.data.totalCount} kỳ
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <FilterInput label="Tìm kiếm" value={listState.searchInput} onChange={listState.setSearchInput} placeholder="Tên kỳ đánh giá" />
          <FilterSelect label="Phòng ban" value={listState.filters.organizationId} onChange={(value) => listState.setFilter('organizationId', value)} options={organizationsQuery.data?.items.map((item) => ({ value: item.id, label: item.name })) ?? []} />
          <FilterSelect label="Loại kỳ" value={listState.filters.periodType} onChange={(value) => listState.setFilter('periodType', value)} options={Object.values(PeriodType).map((value) => ({ value, label: periodTypeLabels[value] }))} />
          <FilterSelect label="Trạng thái" value={listState.filters.status} onChange={(value) => listState.setFilter('status', value)} options={Object.values(PeriodStatus).map((value) => ({ value, label: periodStatusLabels[value] }))} />
          <FilterInput label="Từ ngày" type="date" value={listState.filters.fromDate} onChange={(value) => listState.setFilter('fromDate', value)} />
          <FilterInput label="Đến ngày" type="date" value={listState.filters.toDate} onChange={(value) => listState.setFilter('toDate', value)} />
          {listState.hasActiveFilters ? <Button variant="secondary" className="self-end" onClick={listState.clearFilters}>Xóa bộ lọc</Button> : null}
        </div>

        {deleteError && (
          <p className="mx-5 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {deleteError}
          </p>
        )}

        {periodsQuery.isLoading ? (
          <p className="px-5 py-6 text-sm text-slate-600">Đang tải kỳ đánh giá...</p>
        ) : periodsQuery.isError ? (
          <p className="px-5 py-6 text-sm text-red-700">{periodsQuery.error instanceof Error ? periodsQuery.error.message : 'Không tải được danh sách kỳ đánh giá.'}</p>
        ) : periodsQuery.data?.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Tên kỳ</th>
                  <th className="px-5 py-3 font-semibold">Phòng ban</th>
                  <th className="px-5 py-3 font-semibold">Loại kỳ</th>
                  <th className="px-5 py-3 font-semibold">Bắt đầu</th>
                  <th className="px-5 py-3 font-semibold">Kết thúc</th>
                  <th className="px-5 py-3 font-semibold">Trạng thái</th>
                  <th className="px-5 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {periodsQuery.data.items.map((period) => (
                  <tr key={period.id} className="bg-white">
                    <td className="px-5 py-4 font-semibold text-slate-950">{period.name}</td>
                    <td className="px-5 py-4 text-slate-700">{period.organization.name}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {periodTypeLabels[period.periodType]}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(period.startDate)}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(period.endDate)}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {period.status === PeriodStatus.EVALUATING || period.status === PeriodStatus.LOCKED ? (
                        <Badge variant={getPeriodStatusVariant(period.status)}>
                          {periodStatusLabels[period.status]}
                        </Badge>
                      ) : (
                        <select
                          value={period.status}
                          onChange={(event) =>
                            void handleStatusChange(period, event.target.value as PeriodStatus)
                          }
                          disabled={updatePeriodMutation.isPending}
                          className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
                        >
                          <option value={PeriodStatus.DRAFT}>{periodStatusLabels[PeriodStatus.DRAFT]}</option>
                          <option value={PeriodStatus.ACTIVE}>{periodStatusLabels[PeriodStatus.ACTIVE]}</option>
                          <option value={PeriodStatus.CLOSED}>{periodStatusLabels[PeriodStatus.CLOSED]}</option>
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(period.createdDate)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {period.status !== PeriodStatus.LOCKED ? (
                          <>
                            <button type="button" onClick={() => openEditModal(period)} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                              Sửa
                            </button>
                            <button type="button" onClick={() => void handleDelete(period)} disabled={deletePeriodMutation.isPending} className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60">
                              Xóa
                            </button>
                          </>
                        ) : null}
                        {canLockPeriods && period.status === PeriodStatus.EVALUATING ? (
                          <button type="button" onClick={() => { lockPeriodMutation.reset(); setPeriodToLock(period) }} disabled={lockPeriodMutation.isPending} className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60" title="Khóa kỳ đánh giá">
                            <LockIcon />
                            Khóa kỳ
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-8 text-sm text-slate-600">
            {listState.hasActiveFilters ? 'Không có kỳ đánh giá phù hợp.' : 'Chưa có kỳ đánh giá nào.'}
            <button
              type="button"
              onClick={openCreateModal}
              className="ml-2 font-semibold text-cyan-700 hover:text-cyan-800"
            >
              Tạo kỳ đánh giá đầu tiên
            </button>
          </div>
        )}
        {periodsQuery.data ? <Pagination {...periodsQuery.data} onPageChange={listState.setPageNumber} onPageSizeChange={listState.setPageSize} disabled={periodsQuery.isFetching} /> : null}
      </Card>

      <Modal
        open={Boolean(periodToLock)}
        onClose={() => !lockPeriodMutation.isPending && setPeriodToLock(null)}
        title="Khóa kỳ đánh giá?"
        description="Sau khi khóa, toàn bộ dữ liệu công việc và đánh giá thuộc kỳ này sẽ chuyển sang chế độ chỉ xem và không thể chỉnh sửa."
        size="md"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setPeriodToLock(null)} disabled={lockPeriodMutation.isPending}>
              Hủy
            </Button>
            <Button type="button" variant="danger" onClick={() => void handleLock()} disabled={lockPeriodMutation.isPending}>
              <LockIcon />
              {lockPeriodMutation.isPending ? 'Đang khóa...' : 'Khóa kỳ đánh giá'}
            </Button>
          </>
        }
      >
        {periodToLock ? (
          <div className="grid gap-3 text-sm">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">Kỳ đánh giá</p>
              <p className="mt-1 font-semibold text-[var(--color-text-strong)]">{periodToLock.name}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[var(--color-text-muted)]">Trạng thái:</span>
              <Badge variant="warning">{periodStatusLabels[PeriodStatus.EVALUATING]}</Badge>
            </div>
            {lockError ? <p className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2.5 text-sm text-[var(--color-danger)]" role="alert">{lockError}</p> : null}
          </div>
        ) : null}
      </Modal>

      {isPeriodModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">{modalTitle}</h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md px-2 py-1 text-xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Đóng"
              >
                x
              </button>
            </div>

            <form className="grid gap-4 p-5" onSubmit={handleSubmit}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Phòng ban</span>
                <select
                  value={form.organizationId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, organizationId: event.target.value }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">Chọn phòng ban</option>
                  {organizationsQuery.data?.items.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Tên kỳ</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Kỳ đánh giá tháng 08"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Loại kỳ</span>
                  <select
                    value={form.periodType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        periodType: event.target.value as PeriodType,
                      }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value={PeriodType.MONTH}>Tháng</option>
                    <option value={PeriodType.QUARTER}>Quý</option>
                    <option value={PeriodType.YEAR}>Năm</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Trạng thái</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as PeriodStatus,
                      }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value={PeriodStatus.DRAFT}>Nháp</option>
                    <option value={PeriodStatus.ACTIVE}>Đang hoạt động</option>
                    <option value={PeriodStatus.CLOSED}>Đã đóng</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Ngày bắt đầu</span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, startDate: event.target.value }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Ngày kết thúc</span>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, endDate: event.target.value }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
              </div>

              {organizationsQuery.isError && (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Không tải được danh sách phòng ban.
                </p>
              )}

              {(formError || formApiError) && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError || formApiError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Hủy
                </button>
                <Button type="submit" disabled={isSubmitting} className="disabled:opacity-60">
                  {isSubmitting ? 'Đang lưu...' : editingPeriod ? 'Lưu thay đổi' : 'Tạo kỳ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

function FilterInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="grid gap-1.5"><span className="text-sm font-medium text-slate-700">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100" /></label>
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="grid gap-1.5"><span className="text-sm font-medium text-slate-700">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"><option value="">Tất cả</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
      <rect x="4" y="8" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 8V6a3.5 3.5 0 0 1 7 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

