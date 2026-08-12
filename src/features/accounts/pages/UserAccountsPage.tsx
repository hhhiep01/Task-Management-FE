import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { PasswordField } from '@/components/ui/PasswordField'
import { PasswordRequirements } from '@/components/ui/PasswordRequirements'
import { env } from '@/config/env'
import { AdminTabs } from '@/features/admin/components/AdminTabs'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOrganizations } from '@/features/organizations/hooks/useOrganizations'
import { useRoles } from '@/features/roles/hooks/useRoles'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePagedListState } from '@/hooks/usePagedListState'
import type { Role } from '@/features/roles/types/role.types'
import { formatDate } from '@/utils/formatDate'
import {
  getTemporaryPasswordRequirements,
  hasPasswordErrors,
  validatePasswordFields,
} from '@/utils/passwordValidation'
import type { PasswordFieldErrors } from '@/utils/passwordValidation'

import {
  useCreateUserAccount,
  useDeleteUserAccount,
  useResetUserPassword,
  useUpdateUserAccount,
  useUserAccounts,
} from '../hooks/useUserAccounts'
import type { UserAccount, UserAccountForm } from '../types/account.types'

const initialForm: UserAccountForm = {
  fullName: '',
  email: '',
  password: '',
  roleId: '',
  organizationId: '',
}

const filterKeys = ['roleId', 'organizationId'] as const

const initialResetPasswordForm = {
  newPassword: '',
  confirmNewPassword: '',
}

export function UserAccountsPage() {
  useDocumentTitle(`Quản lý tài khoản | ${env.appName}`)

  const { user } = useAuth()
  const [form, setForm] = useState<UserAccountForm>(initialForm)
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null)
  const [formError, setFormError] = useState('')
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [resettingAccount, setResettingAccount] = useState<UserAccount | null>(null)
  const [resetPasswordForm, setResetPasswordForm] = useState(initialResetPasswordForm)
  const [resetPasswordErrors, setResetPasswordErrors] = useState<PasswordFieldErrors>({})
  const [successMessage, setSuccessMessage] = useState('')

  const listState = usePagedListState(filterKeys)
  const accountsQuery = useUserAccounts(listState.query)
  const rolesQuery = useRoles()
  const organizationsQuery = useOrganizations()
  const createAccountMutation = useCreateUserAccount()
  const updateAccountMutation = useUpdateUserAccount()
  const deleteAccountMutation = useDeleteUserAccount()
  const resetPasswordMutation = useResetUserPassword()

  const isSubmitting = createAccountMutation.isPending || updateAccountMutation.isPending
  const canResetPassword = user?.roleCode.toUpperCase() === 'ADMIN'
  const modalTitle = editingAccount ? 'Cập nhật tài khoản' : 'Tạo tài khoản'
  const roleOptions = useMemo(
    () =>
      rolesQuery.data?.items.filter((role) => {
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
  const resetPasswordApiError =
    resetPasswordMutation.error instanceof Error ? resetPasswordMutation.error.message : ''

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
      organizationId: account.organization?.id ?? '',
    })
    setFormError('')
    setIsAccountModalOpen(true)
  }

  const closeResetPasswordModal = () => {
    if (resetPasswordMutation.isPending) return

    setResettingAccount(null)
    setResetPasswordForm(initialResetPasswordForm)
    setResetPasswordErrors({})
    resetPasswordMutation.reset()
  }

  const openResetPasswordModal = (account: UserAccount) => {
    setResettingAccount(account)
    setResetPasswordForm(initialResetPasswordForm)
    setResetPasswordErrors({})
    setSuccessMessage('')
    resetPasswordMutation.reset()
  }

  const setResetPasswordField = (
    field: keyof typeof initialResetPasswordForm,
    value: string,
  ) => {
    setResetPasswordForm((current) => ({ ...current, [field]: value }))
    setResetPasswordErrors((current) => ({ ...current, [field]: undefined }))
    resetPasswordMutation.reset()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      roleId: form.roleId,
      organizationId: form.organizationId,
    }

    if (!payload.fullName || !payload.email || !payload.roleId || !payload.organizationId) {
      setFormError('Vui lòng nhập họ tên, email, vai trò và phòng ban.')
      return
    }

    if (!editingAccount && !payload.password) {
      setFormError('Vui lòng nhập mật khẩu cho tài khoản mới.')
      return
    }

    if (
      !editingAccount &&
      getTemporaryPasswordRequirements(payload.password).some(
        (requirement) => !requirement.met,
      )
    ) {
      setFormError('Mật khẩu tạm phải có ít nhất 5 ký tự.')
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
          organizationId: payload.organizationId,
        },
      })
    } else {
      await createAccountMutation.mutateAsync(payload)
    }

    closeModal()
  }

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!resettingAccount || !canResetPassword) return

    const payload = {
      newPassword: resetPasswordForm.newPassword.trim(),
      confirmNewPassword: resetPasswordForm.confirmNewPassword.trim(),
    }
    const errors = validatePasswordFields({ ...payload, policy: 'temporary' })
    setResetPasswordErrors(errors)

    if (hasPasswordErrors(errors)) return

    try {
      await resetPasswordMutation.mutateAsync({
        accountId: resettingAccount.id,
        payload,
      })

      setResettingAccount(null)
      setResetPasswordForm(initialResetPasswordForm)
      setResetPasswordErrors({})
      setSuccessMessage(
        'Đặt lại mật khẩu thành công. Nhân viên phải đổi mật khẩu tạm thời sau lần đăng nhập tiếp theo.',
      )
    } catch {
      // React Query exposes the backend error through resetPasswordMutation.error.
    }
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
      <AdminTabs />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
            Quản trị
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

      {successMessage ? (
        <p
          className="mt-4 rounded-[var(--radius-md)] border border-emerald-200 bg-[var(--color-success-soft)] px-4 py-3 text-sm font-medium text-[var(--color-success)]"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold text-slate-950">Danh sách tài khoản</h2>
          {accountsQuery.data ? (
            <span className="text-sm font-medium text-slate-500">
              {accountsQuery.data.totalCount} tài khoản
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_220px_220px_auto]">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">Tìm kiếm</span>
            <input
              value={listState.searchInput}
              onChange={(event) => listState.setSearchInput(event.target.value)}
              className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
              placeholder="Họ tên hoặc email"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">Vai trò</span>
            <select
              value={listState.filters.roleId}
              onChange={(event) => listState.setFilter('roleId', event.target.value)}
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="">Tất cả</option>
              {rolesQuery.data?.items.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">Phòng ban</span>
            <select
              value={listState.filters.organizationId}
              onChange={(event) => listState.setFilter('organizationId', event.target.value)}
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="">Tất cả</option>
              {organizationsQuery.data?.items.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
            </select>
          </label>
          {listState.hasActiveFilters ? (
            <Button variant="secondary" className="self-end" onClick={listState.clearFilters}>Xóa bộ lọc</Button>
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
          <p className="px-5 py-6 text-sm text-red-700">
            {accountsQuery.error instanceof Error ? accountsQuery.error.message : 'Không tải được danh sách tài khoản.'}
          </p>
        ) : accountsQuery.data?.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Họ tên</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Vai trò</th>
                  <th className="px-5 py-3 font-semibold">Phòng ban</th>
                  <th className="px-5 py-3 font-semibold">Mật khẩu</th>
                  <th className="px-5 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {accountsQuery.data.items.map((account) => (
                  <tr key={account.id} className="bg-white">
                    <td className="px-5 py-4 font-semibold text-slate-950">
                      {account.fullName}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{account.email}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {account.role.name || account.role.code}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {account.organization?.name ?? '-'}
                    </td>
                    <td className="px-5 py-4">
                      <PasswordStatusBadge account={account} />
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
                        {canResetPassword ? (
                          <button
                            type="button"
                            onClick={() => openResetPasswordModal(account)}
                            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
                          >
                            Đặt lại mật khẩu
                          </button>
                        ) : null}
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
            {listState.hasActiveFilters ? 'Không có tài khoản phù hợp.' : 'Chưa có tài khoản nào.'}
            <button
              type="button"
              onClick={openCreateModal}
              className="ml-2 font-semibold text-cyan-700 hover:text-cyan-800"
            >
              Tạo tài khoản đầu tiên
            </button>
          </div>
        )}
        {accountsQuery.data ? (
          <Pagination
            {...accountsQuery.data}
            onPageChange={listState.setPageNumber}
            onPageSizeChange={listState.setPageSize}
            disabled={accountsQuery.isFetching}
          />
        ) : null}
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

              {!editingAccount ? (
                <>
                  <PasswordField
                    id="create-account-password"
                    label="Mật khẩu tạm"
                    value={form.password}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, password: event.target.value }))
                      setFormError('')
                    }}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                  <PasswordRequirements password={form.password.trim()} policy="temporary" />
                  <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                    Nhân viên dùng mật khẩu này để đăng nhập lần đầu và sẽ được yêu cầu đổi
                    mật khẩu ngay sau đó.
                  </p>
                </>
              ) : null}

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

      <Modal
        open={Boolean(resettingAccount)}
        title="Đặt lại mật khẩu"
        description="Tạo mật khẩu tạm thời cho tài khoản người dùng."
        onClose={closeResetPasswordModal}
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={closeResetPasswordModal}
              disabled={resetPasswordMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="reset-password-form"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
            </Button>
          </>
        }
      >
        {resettingAccount ? (
          <form
            id="reset-password-form"
            className="grid gap-4"
            onSubmit={(event) => void handleResetPassword(event)}
            noValidate
          >
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-3">
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Nhân viên</p>
              <p className="mt-1 font-semibold text-[var(--color-text-strong)]">
                {resettingAccount.fullName}
              </p>
              <p className="mt-0.5 break-all text-sm text-[var(--color-text-muted)]">
                {resettingAccount.email}
              </p>
            </div>

            <PasswordField
              id="reset-new-password"
              label="Mật khẩu tạm mới"
              value={resetPasswordForm.newPassword}
              onChange={(event) => setResetPasswordField('newPassword', event.target.value)}
              autoComplete="new-password"
              error={resetPasswordErrors.newPassword}
              disabled={resetPasswordMutation.isPending}
            />

            <PasswordRequirements
              password={resetPasswordForm.newPassword.trim()}
              policy="temporary"
            />

            <PasswordField
              id="reset-confirm-password"
              label="Xác nhận mật khẩu"
              value={resetPasswordForm.confirmNewPassword}
              onChange={(event) =>
                setResetPasswordField('confirmNewPassword', event.target.value)
              }
              autoComplete="new-password"
              error={resetPasswordErrors.confirmNewPassword}
              disabled={resetPasswordMutation.isPending}
            />

            <p className="text-sm leading-6 text-[var(--color-text-muted)]">
              Mật khẩu này chỉ sử dụng tạm thời. Nhân viên sẽ được yêu cầu đổi mật khẩu sau
              khi đăng nhập.
            </p>

            {resetPasswordApiError ? (
              <p
                className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]"
                role="alert"
              >
                {resetPasswordApiError}
              </p>
            ) : null}
          </form>
        ) : null}
      </Modal>
    </section>
  )
}

function getRoleText(value: Role[keyof Pick<Role, 'code' | 'name'>]) {
  return value.trim().toUpperCase()
}

function PasswordStatusBadge({ account }: { account: UserAccount }) {
  if (account.mustChangePassword === undefined) {
    return <span className="text-sm text-slate-500">-</span>
  }

  return (
    <Badge variant="neutral" title={account.mustChangePassword ? 'Yêu cầu đổi mật khẩu' : undefined}>
      {account.mustChangePassword ? 'Mật khẩu tạm' : 'Đã đổi mật khẩu'}
    </Badge>
  )
}
