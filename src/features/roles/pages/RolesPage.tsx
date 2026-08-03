import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { AdminTabs } from '@/features/admin/components/AdminTabs'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

import { useCreateRole, useDeleteRole, useRoles, useUpdateRole } from '../hooks/useRoles'
import type { Role, RolePayload } from '../types/role.types'

const initialForm: RolePayload = {
  code: '',
  name: '',
}

export function RolesPage() {
  useDocumentTitle(`Roles | ${env.appName}`)

  const [form, setForm] = useState<RolePayload>(initialForm)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formError, setFormError] = useState('')
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)

  const rolesQuery = useRoles()
  const createRoleMutation = useCreateRole()
  const updateRoleMutation = useUpdateRole()
  const deleteRoleMutation = useDeleteRole()

  const isSubmitting = createRoleMutation.isPending || updateRoleMutation.isPending
  const modalTitle = editingRole ? 'Cập nhật role' : 'Tạo role mới'
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
      setFormError('Vui lòng nhập đầy đủ code và name.')
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
    const confirmed = window.confirm(`Xóa role "${role.name}"?`)

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
            Role
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Quản lý role</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Tạo, cập nhật và xóa role theo API <span className="font-medium">/api/Role</span>.
          </p>
        </div>

        <Button type="button" onClick={openCreateModal}>
          Tạo role
        </Button>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold text-slate-950">Danh sách role</h2>
          {rolesQuery.data?.length ? (
            <span className="text-sm font-medium text-slate-500">
              {rolesQuery.data.length} role
            </span>
          ) : null}
        </div>

        {deleteError && (
          <p className="mx-5 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {deleteError}
          </p>
        )}

        {rolesQuery.isLoading ? (
          <p className="px-5 py-6 text-sm text-slate-600">Đang tải role...</p>
        ) : rolesQuery.isError ? (
          <p className="px-5 py-6 text-sm text-red-700">Không tải được danh sách role.</p>
        ) : rolesQuery.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold">Modified</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rolesQuery.data.map((role) => (
                  <tr key={role.id} className="bg-white">
                    <td className="px-5 py-4 font-semibold text-slate-950">{role.code}</td>
                    <td className="px-5 py-4 text-slate-700">{role.name}</td>
                    <td className="px-5 py-4 text-slate-600">{role.createdDate}</td>
                    <td className="px-5 py-4 text-slate-600">{role.modifiedDate || '-'}</td>
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
            Chưa có role nào.
            <button
              type="button"
              onClick={openCreateModal}
              className="ml-2 font-semibold text-cyan-700 hover:text-cyan-800"
            >
              Tạo role đầu tiên
            </button>
          </div>
        )}
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
                aria-label="Close"
              >
                x
              </button>
            </div>

            <form className="space-y-4 p-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Code</span>
                <input
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, code: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  placeholder="ADMIN"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Name</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Administrator"
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
                  {isSubmitting ? 'Đang lưu...' : editingRole ? 'Lưu thay đổi' : 'Tạo role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
