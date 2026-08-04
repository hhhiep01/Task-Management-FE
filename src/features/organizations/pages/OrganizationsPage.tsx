import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate } from '@/utils/formatDate'

import {
  useCreateOrganization,
  useDeleteOrganization,
  useOrganizations,
  useUpdateOrganization,
} from '../hooks/useOrganizations'
import type { Organization, OrganizationPayload } from '../types/organization.types'

const initialForm: OrganizationPayload = {
  code: '',
  name: '',
}

export function OrganizationsPage() {
  useDocumentTitle(`Quản lý phòng ban | ${env.appName}`)

  const [form, setForm] = useState<OrganizationPayload>(initialForm)
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null)
  const [formError, setFormError] = useState('')
  const [isOrganizationModalOpen, setIsOrganizationModalOpen] = useState(false)

  const organizationsQuery = useOrganizations()
  const createOrganizationMutation = useCreateOrganization()
  const updateOrganizationMutation = useUpdateOrganization()
  const deleteOrganizationMutation = useDeleteOrganization()

  const isSubmitting =
    createOrganizationMutation.isPending || updateOrganizationMutation.isPending
  const modalTitle = editingOrganization ? 'Cập nhật phòng ban' : 'Tạo phòng ban'
  const formApiError = useMemo(() => {
    const error = createOrganizationMutation.error || updateOrganizationMutation.error
    return error instanceof Error ? error.message : ''
  }, [createOrganizationMutation.error, updateOrganizationMutation.error])
  const deleteError =
    deleteOrganizationMutation.error instanceof Error
      ? deleteOrganizationMutation.error.message
      : ''

  const closeModal = () => {
    setForm(initialForm)
    setEditingOrganization(null)
    setFormError('')
    setIsOrganizationModalOpen(false)
  }

  const openCreateModal = () => {
    setForm(initialForm)
    setEditingOrganization(null)
    setFormError('')
    setIsOrganizationModalOpen(true)
  }

  const openEditModal = (organization: Organization) => {
    setEditingOrganization(organization)
    setForm({
      code: organization.code,
      name: organization.name,
    })
    setFormError('')
    setIsOrganizationModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
    }

    if (!payload.code || !payload.name) {
      setFormError('Vui lòng nhập đầy đủ mã phòng ban và tên phòng ban.')
      return
    }

    setFormError('')

    if (editingOrganization) {
      await updateOrganizationMutation.mutateAsync({
        organizationId: editingOrganization.id,
        payload,
      })
    } else {
      await createOrganizationMutation.mutateAsync(payload)
    }

    closeModal()
  }

  const handleDelete = async (organization: Organization) => {
    const confirmed = window.confirm(`Xóa phòng ban "${organization.name}"?`)

    if (!confirmed) {
      return
    }

    await deleteOrganizationMutation.mutateAsync(organization.id)
  }

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
            Trưởng phòng
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Quản lý phòng ban</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Tạo, cập nhật và xóa thông tin phòng ban trong hệ thống.
          </p>
        </div>

        <Button type="button" onClick={openCreateModal}>
          Tạo phòng ban
        </Button>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold text-slate-950">Danh sách phòng ban</h2>
          {organizationsQuery.data?.length ? (
            <span className="text-sm font-medium text-slate-500">
              {organizationsQuery.data.length} phòng ban
            </span>
          ) : null}
        </div>

        {deleteError && (
          <p className="mx-5 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {deleteError}
          </p>
        )}

        {organizationsQuery.isLoading ? (
          <p className="px-5 py-6 text-sm text-slate-600">Đang tải phòng ban...</p>
        ) : organizationsQuery.isError ? (
          <p className="px-5 py-6 text-sm text-red-700">Không tải được danh sách phòng ban.</p>
        ) : organizationsQuery.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Mã phòng ban</th>
                  <th className="px-5 py-3 font-semibold">Tên phòng ban</th>
                  <th className="px-5 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-5 py-3 font-semibold">Ngày cập nhật</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {organizationsQuery.data.map((organization) => (
                  <tr key={organization.id} className="bg-white">
                    <td className="px-5 py-4 font-semibold text-slate-950">
                      {organization.code}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{organization.name}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(organization.createdDate)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(organization.modifiedDate)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(organization)}
                          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(organization)}
                          disabled={deleteOrganizationMutation.isPending}
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
            Chưa có phòng ban nào.
            <button
              type="button"
              onClick={openCreateModal}
              className="ml-2 font-semibold text-cyan-700 hover:text-cyan-800"
            >
              Tạo phòng ban đầu tiên
            </button>
          </div>
        )}
      </Card>

      {isOrganizationModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
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

            <form className="space-y-4 p-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Mã phòng ban</span>
                <input
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, code: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  placeholder="IT"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Tên phòng ban</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Phòng công nghệ"
                />
              </label>

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
                  {isSubmitting
                    ? 'Đang lưu...'
                    : editingOrganization
                      ? 'Lưu thay đổi'
                      : 'Tạo phòng ban'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
