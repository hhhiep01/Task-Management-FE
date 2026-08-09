import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { AdminTabs } from '@/features/admin/components/AdminTabs'
import { env } from '@/config/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePagedListState } from '@/hooks/usePagedListState'
import { formatDate } from '@/utils/formatDate'

import { useCreateRole, useDeleteRole, useRoles, useUpdateRole } from '../hooks/useRoles'
import type { Role, RolePayload } from '../types/role.types'

const initialForm: RolePayload = {
  code: '',
  name: '',
}

const filterKeys = [] as const

export function RolesPage() {
  useDocumentTitle(`Quản lý vai trò | ${env.appName}`)

  const [form, setForm] = useState<RolePayload>(initialForm)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formError, setFormError] = useState('')
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)

  const listState = usePagedListState(filterKeys)
  const rolesQuery = useRoles(listState.query)
  const createRoleMutation = useCreateRole()
  const updateRoleMutation = useUpdateRole()
  const deleteRoleMutation = useDeleteRole()

  const isSubmitting = createRoleMutation.isPending || updateRoleMutation.isPending
  const modalTitle = editingRole ? 'Cập nhật vai trò' : 'Tạo vai trò mới'
  const formApiError = useMemo(() => {
    const error = createRoleMutation.error || updateRoleMutation.error
    return error instanceof Error ? error.message : ''
  }, [createRoleMutation.error, updateRoleMutation.error])
  const deleteError =
    deleteRoleMutation.error instanceof Error ? deleteRoleMutation.error.message : ''

  const closeModal = () => {
    setForm(initialForm)
    setEditingRole(null)
    setFormError('')
    setIsRoleModalOpen(false)
  }

  const openCreateModal = () => {
    setForm(initialForm)
    setEditingRole(null)
    setFormError('')
    setIsRoleModalOpen(true)
  }

  const openEditModal = (role: Role) => {
    setEditingRole(role)
    setForm({
      code: role.code,
      name: role.name,
    })
    setFormError('')
    setIsRoleModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
    }

    if (!payload.code || !payload.name) {
      setFormError('Vui lòng nhập đầy đủ mã vai trò và tên vai trò.')
      return
    }

    setFormError('')

    if (editingRole) {
      await updateRoleMutation.mutateAsync({ roleId: editingRole.id, payload })
    } else {
      await createRoleMutation.mutateAsync(payload)
    }

    closeModal()
  }

  const handleDelete = async (role: Role) => {
    const confirmed = window.confirm(`Xóa vai trò "${role.name}"?`)

    if (!confirmed) {
      return
    }

    await deleteRoleMutation.mutateAsync(role.id)
  }

  return (
    <section>
      <AdminTabs />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
            Vai trò
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Quản lý vai trò</h1>
        </div>

        <Button type="button" onClick={openCreateModal}>
          Tạo vai trò
        </Button>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold text-slate-950">Danh sách vai trò</h2>
          {rolesQuery.data ? (
            <span className="text-sm font-medium text-slate-500">
              {rolesQuery.data.totalCount} vai trò
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
              placeholder="Mã hoặc tên vai trò"
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

        {rolesQuery.isLoading ? (
          <p className="px-5 py-6 text-sm text-slate-600">Đang tải vai trò...</p>
        ) : rolesQuery.isError ? (
          <p className="px-5 py-6 text-sm text-red-700">
            {rolesQuery.error instanceof Error ? rolesQuery.error.message : 'Không tải được danh sách vai trò.'}
          </p>
        ) : rolesQuery.data?.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Mã vai trò</th>
                  <th className="px-5 py-3 font-semibold">Tên vai trò</th>
                  <th className="px-5 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-5 py-3 font-semibold">Ngày cập nhật</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rolesQuery.data.items.map((role) => (
                  <tr key={role.id} className="bg-white">
                    <td className="px-5 py-4 font-semibold text-slate-950">{role.code}</td>
                    <td className="px-5 py-4 text-slate-700">{role.name}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(role.createdDate)}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(role.modifiedDate)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(role)}
                          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(role)}
                          disabled={deleteRoleMutation.isPending}
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
            {listState.hasActiveFilters ? 'Không có vai trò phù hợp.' : 'Chưa có vai trò nào.'}
            <button
              type="button"
              onClick={openCreateModal}
              className="ml-2 font-semibold text-cyan-700 hover:text-cyan-800"
            >
              Tạo vai trò đầu tiên
            </button>
          </div>
        )}
        {rolesQuery.data ? (
          <Pagination
            {...rolesQuery.data}
            onPageChange={listState.setPageNumber}
            onPageSizeChange={listState.setPageSize}
            disabled={rolesQuery.isFetching}
          />
        ) : null}
      </Card>

      {isRoleModalOpen && (
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
                <span className="text-sm font-medium text-slate-700">Mã vai trò</span>
                <input
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, code: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  placeholder="MANAGER"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Tên vai trò</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Trưởng phòng"
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
                  {isSubmitting ? 'Đang lưu...' : editingRole ? 'Lưu thay đổi' : 'Tạo vai trò'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
