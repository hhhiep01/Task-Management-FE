import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { useOrganizations } from '@/features/organizations/hooks/useOrganizations'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate } from '@/utils/formatDate'

import {
  useCreateEvaluationPeriod,
  useDeleteEvaluationPeriod,
  useEvaluationPeriods,
  useUpdateEvaluationPeriod,
} from '../hooks/useEvaluationPeriods'
import {
  PeriodStatus,
  PeriodType,
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
}

const initialForm: EvaluationPeriodPayload = {
  organizationId: '',
  name: '',
  periodType: PeriodType.MONTH,
  startDate: '',
  endDate: '',
  status: PeriodStatus.DRAFT,
}

export function EvaluationPeriodsPage() {
  useDocumentTitle(`Quản lý kỳ đánh giá | ${env.appName}`)

  const [form, setForm] = useState<EvaluationPeriodPayload>(initialForm)
  const [editingPeriod, setEditingPeriod] = useState<EvaluationPeriod | null>(null)
  const [formError, setFormError] = useState('')
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false)

  const periodsQuery = useEvaluationPeriods()
  const organizationsQuery = useOrganizations()
  const createPeriodMutation = useCreateEvaluationPeriod()
  const updatePeriodMutation = useUpdateEvaluationPeriod()
  const deletePeriodMutation = useDeleteEvaluationPeriod()

  const isSubmitting = createPeriodMutation.isPending || updatePeriodMutation.isPending
  const modalTitle = editingPeriod ? 'Cập nhật kỳ đánh giá' : 'Tạo kỳ đánh giá'
  const formApiError = useMemo(() => {
    const error = createPeriodMutation.error || updatePeriodMutation.error
    return error instanceof Error ? error.message : ''
  }, [createPeriodMutation.error, updatePeriodMutation.error])
  const deleteError =
    deletePeriodMutation.error instanceof Error ? deletePeriodMutation.error.message : ''

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
    setEditingPeriod(period)
    setForm({
      organizationId: period.organization.id,
      name: period.name,
      periodType: period.periodType,
      startDate: toDateInputValue(period.startDate),
      endDate: toDateInputValue(period.endDate),
      status: period.status,
    })
    setFormError('')
    setIsPeriodModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      organizationId: form.organizationId,
      name: form.name.trim(),
      periodType: Number(form.periodType) as PeriodType,
      startDate: form.startDate,
      endDate: form.endDate,
      status: Number(form.status) as PeriodStatus,
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

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold text-slate-950">Danh sách kỳ đánh giá</h2>
          {periodsQuery.data?.length ? (
            <span className="text-sm font-medium text-slate-500">
              {periodsQuery.data.length} kỳ
            </span>
          ) : null}
        </div>

        {deleteError && (
          <p className="mx-5 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {deleteError}
          </p>
        )}

        {periodsQuery.isLoading ? (
          <p className="px-5 py-6 text-sm text-slate-600">Đang tải kỳ đánh giá...</p>
        ) : periodsQuery.isError ? (
          <p className="px-5 py-6 text-sm text-red-700">Không tải được danh sách kỳ đánh giá.</p>
        ) : periodsQuery.data?.length ? (
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
                {periodsQuery.data.map((period) => (
                  <tr key={period.id} className="bg-white">
                    <td className="px-5 py-4 font-semibold text-slate-950">{period.name}</td>
                    <td className="px-5 py-4 text-slate-700">{period.organization.name}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {periodTypeLabels[period.periodType]}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(period.startDate)}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(period.endDate)}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {periodStatusLabels[period.status]}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(period.createdDate)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(period)}
                          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(period)}
                          disabled={deletePeriodMutation.isPending}
                          className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-8 text-sm text-slate-600">
            Chưa có kỳ đánh giá nào.
            <button
              type="button"
              onClick={openCreateModal}
              className="ml-2 font-semibold text-cyan-700 hover:text-cyan-800"
            >
              Tạo kỳ đánh giá đầu tiên
            </button>
          </div>
        )}
      </Card>

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
                  {organizationsQuery.data?.map((organization) => (
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
                        periodType: Number(event.target.value) as PeriodType,
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
                        status: Number(event.target.value) as PeriodStatus,
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

function toDateInputValue(value: string) {
  return value.slice(0, 10)
}
