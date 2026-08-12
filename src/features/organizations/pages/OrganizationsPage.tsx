import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { env } from '@/config/env'
import { AdminTabs } from '@/features/admin/components/AdminTabs'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePagedListState } from '@/hooks/usePagedListState'
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
  parentId: null,
}

const filterKeys = [] as const

function getOrganizationErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  const normalized = message.toLowerCase()

  if (normalized.includes('parent organization not found')) return 'Không tìm thấy đơn vị cha.'
  if (normalized.includes('organization cannot be its own parent')) return 'Đơn vị không thể là đơn vị cha của chính mình.'
  if (normalized.includes('organization hierarchy cannot contain a cycle')) return 'Cấu trúc đơn vị không thể tạo vòng lặp. Vui lòng chọn đơn vị cha khác.'
  if (normalized.includes('organization has child organizations and cannot be deleted')) return 'Không thể xóa đơn vị đang có đơn vị con. Hãy chuyển hoặc xóa các đơn vị con trước.'
  return message
}

function getDescendantIds(organizations: Organization[], organizationId: string) {
  const descendants = new Set<string>()
  const pending = [organizationId]

  while (pending.length) {
    const currentId = pending.pop()
    if (!currentId) continue

    organizations.forEach((organization) => {
      if (organization.parentId === currentId && !descendants.has(organization.id)) {
        descendants.add(organization.id)
        pending.push(organization.id)
      }
    })
  }

  return descendants
}

export function OrganizationsPage() {
  useDocumentTitle(`Quản lý phòng ban | ${env.appName}`)

  const [form, setForm] = useState<OrganizationPayload>(initialForm)
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null)
  const [formError, setFormError] = useState('')
  const [isOrganizationModalOpen, setIsOrganizationModalOpen] = useState(false)

  const listState = usePagedListState(filterKeys)
  const organizationsQuery = useOrganizations(listState.query)
  const organizationOptionsQuery = useOrganizations({ pageNumber: 1, pageSize: 1000 })
  const createOrganizationMutation = useCreateOrganization()
  const updateOrganizationMutation = useUpdateOrganization()
  const deleteOrganizationMutation = useDeleteOrganization()

  const isSubmitting =
    createOrganizationMutation.isPending || updateOrganizationMutation.isPending
  const modalTitle = editingOrganization ? 'Cập nhật phòng ban' : 'Tạo phòng ban'
  const formApiError = useMemo(() => {
    const error = createOrganizationMutation.error || updateOrganizationMutation.error
    return getOrganizationErrorMessage(error)
  }, [createOrganizationMutation.error, updateOrganizationMutation.error])
  const deleteError = getOrganizationErrorMessage(deleteOrganizationMutation.error)
  const allOrganizations = organizationOptionsQuery.data?.items ?? organizationsQuery.data?.items ?? []
  const excludedParentIds = editingOrganization
    ? new Set([editingOrganization.id, ...getDescendantIds(allOrganizations, editingOrganization.id)])
    : new Set<string>()
  const parentOptions = allOrganizations.filter((organization) => !excludedParentIds.has(organization.id))

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
      parentId: organization.parentId ?? null,
    })
    setFormError('')
    setIsOrganizationModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      parentId: form.parentId || null,
    }

    if (!payload.code || !payload.name) {
      setFormError('Vui lòng nhập đầy đủ mã phòng ban và tên phòng ban.')
      return
    }

    setFormError('')

    try {
      if (editingOrganization) {
        await updateOrganizationMutation.mutateAsync({
          organizationId: editingOrganization.id,
          payload,
        })
      } else {
        await createOrganizationMutation.mutateAsync(payload)
      }

      closeModal()
    } catch {
      // Keep the form open so the backend validation message can be reviewed.
    }
  }

  const handleDelete = async (organization: Organization) => {
    const confirmed = window.confirm(`Xóa phòng ban "${organization.name}"?`)

    if (!confirmed) {
      return
    }

    try {
      await deleteOrganizationMutation.mutateAsync(organization.id)
    } catch {
      // The mapped mutation error is rendered above.
    }
  }

  return (
    <section>
      <AdminTabs />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
            Quản trị
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
          {organizationsQuery.data ? (
            <span className="text-sm font-medium text-slate-500">
              {organizationsQuery.data.totalCount} phòng ban
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row">
          <label className="grid flex-1 gap-1.5">
            <span className="text-sm font-medium text-slate-700">Tìm kiếm</span>
            <input
              value={listState.searchInput}
              onChange={(event) => listState.setSearchInput(event.target.value)}
              className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
              placeholder="Mã hoặc tên phòng ban"
            />
          </label>
          {listState.hasActiveFilters ? (
            <Button variant="secondary" className="self-end" onClick={listState.clearFilters}>
              Xóa bộ lọc
            </Button>
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
          <p className="px-5 py-6 text-sm text-red-700">
            {organizationsQuery.error instanceof Error ? organizationsQuery.error.message : 'Không tải được danh sách phòng ban.'}
          </p>
        ) : organizationsQuery.data?.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Mã phòng ban</th>
                  <th className="px-5 py-3 font-semibold">Tên phòng ban</th>
                  <th className="px-5 py-3 font-semibold">Đơn vị cha</th>
                  <th className="px-5 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-5 py-3 font-semibold">Ngày cập nhật</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {organizationsQuery.data.items.map((organization) => (
                  <tr key={organization.id} className="bg-white">
                    <td className="px-5 py-4 font-semibold text-slate-950">
                      {organization.code}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{organization.name}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {organization.parentId ? organization.parentName || 'Chưa có tên đơn vị trực thuộc' : 'Đơn vị cấp gốc'}
                    </td>
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
            {listState.hasActiveFilters ? 'Không có phòng ban phù hợp.' : 'Chưa có phòng ban nào.'}
            <button
              type="button"
              onClick={openCreateModal}
              className="ml-2 font-semibold text-cyan-700 hover:text-cyan-800"
            >
              Tạo phòng ban đầu tiên
            </button>
          </div>
        )}
        {organizationsQuery.data ? (
          <Pagination
            {...organizationsQuery.data}
            onPageChange={listState.setPageNumber}
            onPageSizeChange={listState.setPageSize}
            disabled={organizationsQuery.isFetching}
          />
        ) : null}
      </Card>

      <Modal
        open={isOrganizationModalOpen}
        title={modalTitle}
        description="Thiết lập mã, tên và vị trí của đơn vị trong cơ cấu tổ chức."
        onClose={closeModal}
        size="md"
        mobileFullscreen
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={closeModal}>Hủy</Button>
            <Button type="submit" form="organization-form" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : editingOrganization ? 'Lưu thay đổi' : 'Tạo phòng ban'}
            </Button>
          </>
        )}
      >
            <form id="organization-form" className="space-y-5" onSubmit={handleSubmit}>
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
                <span className="text-sm font-medium text-slate-700">Đơn vị trực thuộc</span>
                <select
                  id="organization-parent"
                  value={form.parentId ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value || null }))}
                  aria-describedby="organization-parent-help"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">Không thuộc đơn vị nào (đơn vị cấp gốc)</option>
                  {parentOptions.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name} ({organization.code})
                    </option>
                  ))}
                </select>
                <span id="organization-parent-help" className="mt-1.5 block text-xs leading-5 text-slate-500">
                  Chọn đơn vị mà phòng ban này trực tiếp thuộc về. Chọn cấp gốc nếu đây là đơn vị cao nhất.
                </span>
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

            </form>
      </Modal>
    </section>
  )
}
