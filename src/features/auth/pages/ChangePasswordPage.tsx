import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PasswordField } from '@/components/ui/PasswordField'
import { PasswordRequirements } from '@/components/ui/PasswordRequirements'
import { env } from '@/config/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  hasPasswordErrors,
  validatePasswordFields,
} from '@/utils/passwordValidation'
import type { PasswordFieldErrors } from '@/utils/passwordValidation'

import { changePasswordApi } from '../api/authApi'
import { useAuth } from '../hooks/useAuth'
import { getUserHomePath } from '../utils/redirects'

type PasswordForm = {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

const initialForm: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
}

export function ChangePasswordPage() {
  useDocumentTitle(`Đổi mật khẩu | ${env.appName}`)

  const { logout, mustChangePassword, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<PasswordForm>(initialForm)
  const [fieldErrors, setFieldErrors] = useState<PasswordFieldErrors>({})
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setField = (field: keyof PasswordForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setApiError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      currentPassword: form.currentPassword.trim(),
      newPassword: form.newPassword.trim(),
      confirmNewPassword: form.confirmNewPassword.trim(),
    }
    const errors = validatePasswordFields({
      ...payload,
      requireCurrentPassword: true,
    })
    setFieldErrors(errors)

    if (hasPasswordErrors(errors)) {
      return
    }

    try {
      setApiError('')
      setIsSubmitting(true)
      await changePasswordApi(payload)
      setForm(initialForm)
      logout()
      navigate('/login', {
        replace: true,
        state: {
          successMessage:
            'Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.',
        },
      })
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Không thể đổi mật khẩu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-app-bg)] px-4 py-8 sm:px-6">
      <Card className="w-full max-w-lg p-5 sm:p-6">
        <div className="border-b border-[var(--color-border)] pb-4">
          <h1 className="text-2xl font-bold text-[var(--color-text-strong)]">Đổi mật khẩu</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            {mustChangePassword
              ? 'Đây là lần đăng nhập đầu tiên. Vui lòng đổi mật khẩu tạm thời trước khi tiếp tục sử dụng hệ thống.'
              : 'Cập nhật mật khẩu đăng nhập của bạn. Sau khi đổi thành công, bạn cần đăng nhập lại.'}
          </p>
        </div>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit} noValidate>
          <PasswordField
            id="current-password"
            label="Mật khẩu hiện tại"
            value={form.currentPassword}
            onChange={(event) => setField('currentPassword', event.target.value)}
            autoComplete="current-password"
            error={fieldErrors.currentPassword}
            disabled={isSubmitting}
          />

          <PasswordField
            id="new-password"
            label="Mật khẩu mới"
            value={form.newPassword}
            onChange={(event) => setField('newPassword', event.target.value)}
            autoComplete="new-password"
            error={fieldErrors.newPassword}
            disabled={isSubmitting}
          />

          <PasswordRequirements password={form.newPassword.trim()} />

          <PasswordField
            id="confirm-new-password"
            label="Xác nhận mật khẩu mới"
            value={form.confirmNewPassword}
            onChange={(event) => setField('confirmNewPassword', event.target.value)}
            autoComplete="new-password"
            error={fieldErrors.confirmNewPassword}
            disabled={isSubmitting}
          />

          {apiError ? (
            <p
              className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm font-medium text-[var(--color-danger)]"
              role="alert"
            >
              {apiError}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            {!mustChangePassword ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(getUserHomePath(user))}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  )
}
