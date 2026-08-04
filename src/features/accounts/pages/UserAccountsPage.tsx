import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useRoles } from '@/features/roles/hooks/useRoles'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { Role } from '@/features/roles/types/role.types'
import { formatDate } from '@/utils/formatDate'

import {
  useCreateUserAccount,
  useDeleteUserAccount,
  useUpdateUserAccount,
  useUserAccounts,
} from '../hooks/useUserAccounts'
import type { UserAccount, UserAccountForm } from '../types/account.types'

const initialForm: UserAccountForm = {
  fullName: '',
  email: '',
  password: '',
  roleId: '',
}

export function UserAccountsPage() {
  useDocumentTitle(`Quản lý tài khoản | ${env.appName}`)

  const { user } = useAuth()
  const [form, setForm] = useState<UserAccountForm>(initialForm)
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null)
  const [formError, setFormError] = useState('')
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)

  const accountsQuery = useUserAccounts()
  const rolesQuery = useRoles()
  const createAccountMutation = useCreateUserAccount()
  const updateAccountMutation = useUpdateUserAccount()
  const deleteAccountMutation = useDeleteUserAccount()

  const isSubmitting = createAccountMutation.isPending || updateAccountMutation.isPending
  const isManager = user?.role === 'manager'
  const canEditPassword = !editingAccount || !isManager
  const modalTitle = editingAccount ? 'Cập nhật tài khoản' : 'Tạo tài khoản'
  const roleOptions = useMemo(
    () =>
      rolesQuery.data?.filter((role) => {
        const roleCode = getRoleText(role.code)
        const roleName = getRoleText(role.name)

        return roleCode !== 'ADMIN' && roleName !== 'ADMIN'
      }) ?? [],
    [rolesQuery.data],
  )
  const formApiError = useMemo(() => {
    const error = createAccountMutation.error || updateAccountMutation.error
    return error instanceof Error ? error.message : ''
  }, [createAccountMutation.error, updateAccountMutation.error])
  const deleteError =
    deleteAccountMutation.error instanceof Error ? deleteAccountMutation.error.message : ''

  const closeModal = () => {
    setForm(initialForm)
    setEditingAccount(null)
    setFormError('')
    setIsAccountModalOpen(false)
  }

  const openCreateModal = () => {
    setForm(initialForm)
    setEditingAccount(null)
    setFormError('')
    setIsAccountModalOpen(true)
  }

  const openEditModal = (account: UserAccount) => {
    setEditingAccount(account)
    setForm({
      fullName: account.fullName,
      email: account.email,
      password: '',
      roleId: account.role.id,
    })
    setFormError('')
    setIsAccountModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      roleId: form.roleId,
    }

    if (!payload.fullName || !payload.email || !payload.roleId) {
      setFormError('Vui lòng nhập họ tên, email và vai trò.')
      return
    }

    if (!editingAccount && !payload.password) {
      setFormError('Vui lòng nhập mật khẩu cho tài khoản mới.')
      return
    }

    setFormError('')

    if (editingAccount) {
      await updateAccountMutation.mutateAsync({
        accountId: editingAccount.id,
        payload: {
          fullName: payload.fullName,
          email: payload.email,
          roleId: payload.roleId,
          ...(canEditPassword && payload.password ? { password: payload.password } : {}),
        },
      })
    } else {
      await createAccountMutation.mutateAsync(payload)
    }

    closeModal()
  }

  const handleDelete = async (account: UserAccount) => {
    const confirmed = window.confirm(`Xóa tài khoản "${account.email}"?`)

    if (!confirmed) {
      return
    }

    await deleteAccountMutation.mutateAsync(account.id)
  }

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
            {user?.role === 'admin' ? 'Quản trị' : 'Trưởng phòng'}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Quản lý tài khoản</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Tạo, cập nhật và xóa tài khoản người dùng trong hệ thống.
          </p>
        </div>

        <Button type="button" onClick={openCreateModal}>
          Tạo tài khoản
        </Button>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold text-slate-950">Danh sách tài khoản</h2>
          {accountsQuery.data?.length ? (
            <span className="text-sm font-medium text-slate-500">
              {accountsQuery.data.length} tài khoản
            </span>
          ) : null}
        </div>

        {deleteError && (
          <p className="mx-5 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {deleteError}
          </p>
        )}

        {accountsQuery.isLoading ? (
          <p className="px-5 py-6 text-sm text-slate-600">Đang tải tài khoản...</p>
        ) : accountsQuery.isError ? (
          <p className="px-5 py-6 text-sm text-red-700">Không tải được danh sách tài khoản.</p>
        ) : accountsQuery.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Họ tên</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Vai trò</th>
                  <th className="px-5 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {accountsQuery.data.map((account) => (
                  <tr key={account.id} className="bg-white">
                    <td className="px-5 py-4 font-semibold text-slate-950">
                      {account.fullName}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{account.email}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {account.role.name || account.role.code}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(account.createdDate)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(account)}
                          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(account)}
                          disabled={deleteAccountMutation.isPending}
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
            Chưa có tài khoản nào.
            <button
              type="button"
              onClick={openCreateModal}
              className="ml-2 font-semibold text-cyan-700 hover:text-cyan-800"
            >
              Tạo tài khoản đầu tiên
            </button>
          </div>
        )}
      </Card>

      {isAccountModalOpen && (
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
                <span className="text-sm font-medium text-slate-700">Họ tên</span>
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Nguyen Van A"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  placeholder="user@example.com"
                />
              </label>

              {canEditPassword && (
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Mật khẩu {editingAccount ? '(để trống nếu không đổi)' : ''}
                  </span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, password: event.target.value }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                    placeholder="Nhập mật khẩu"
                  />
                </label>
              )}

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Vai trò</span>
                <select
                  value={form.roleId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, roleId: event.target.value }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">Chọn vai trò</option>
                  {roleOptions.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>

              {rolesQuery.isError && (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Không tải được danh sách vai trò.
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
                  {isSubmitting ? 'Đang lưu...' : editingAccount ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

function getRoleText(value: Role[keyof Pick<Role, 'code' | 'name'>]) {
  return value.trim().toUpperCase()
}
