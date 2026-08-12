import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

import { useAuth } from '../hooks/useAuth'
import { getUserHomePath } from '../utils/redirects'

type LocationState = {
  from?: {
    pathname?: string
  }
  successMessage?: string
}

function getLoginErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : ''

  if (message === 'Email or password is wrong') {
    return 'Email hoặc mật khẩu không đúng'
  }

  return message || 'Đăng nhập thất bại'
}

export function LoginPage() {
  useDocumentTitle(`Đăng nhập | ${env.appName}`)

  const { isAuthenticated, login, mustChangePassword, user } = useAuth()
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  if (isAuthenticated) {
    return (
      <Navigate
        to={mustChangePassword ? '/change-password' : getUserHomePath(user)}
        replace
      />
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '').trim()

    try {
      setErrorMessage('')
      setIsSubmitting(true)
      const loginResult = await login({ email, password })
      const homePath = getUserHomePath(loginResult.user)
      const requestedPath = state?.from?.pathname
      const redirectTo =
        loginResult.mustChangePassword
          ? '/change-password'
          : requestedPath && !['/login', '/change-password'].includes(requestedPath)
            ? requestedPath
            : homePath

      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-app-bg)] px-6 py-10">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-3xl font-bold text-[var(--color-text-strong)]">Đăng nhập</h1>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          {state?.successMessage ? (
            <p
              className="rounded-[var(--radius-md)] bg-[var(--color-success-soft)] px-3 py-2 text-sm font-medium text-[var(--color-success)]"
              role="status"
            >
              {state.successMessage}
            </p>
          ) : null}
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="name@example.com"
              className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 py-3 text-sm text-[var(--color-text-strong)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Mật khẩu</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 py-3 text-sm text-[var(--color-text-strong)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-teal-100"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm font-medium text-[var(--color-danger)]">
              {errorMessage}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting} className="mt-1 w-full">
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
