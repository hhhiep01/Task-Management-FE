import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { env } from '@/config/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

import { useAuth } from '../hooks/useAuth'
import type { LoginRole } from '../types/auth.types'

type RoleLoginFormProps = {
  role: LoginRole
  title: string
  description: string
  submitLabel: string
  submitClassName?: string
  showCreateAccount?: boolean
}

type LocationState = {
  from?: {
    pathname?: string
  }
}

function getLoginErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : ''

  if (message === 'Email or password is wrong') {
    return 'Email hoặc mật khẩu không đúng'
  }

  return message || 'Đăng nhập thất bại'
}

export function RoleLoginForm({
  role,
  title,
  description,
  submitLabel,
  submitClassName,
  showCreateAccount = false,
}: RoleLoginFormProps) {
  useDocumentTitle(`${title} | ${env.appName}`)

  const { isAuthenticated, login } = useAuth()
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const redirectTo = state?.from?.pathname ?? `/${role}`

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    try {
      setErrorMessage('')
      setIsSubmitting(true)
      const loggedInUser = await login({ email, password })

      navigate(redirectTo === `/${role}` ? `/${loggedInUser.role}` : redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-6">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
          {env.appName}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1>
        <p className="mt-3 text-slate-600">{description}</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              name="email"
              type="email"
              required
              placeholder={`${role}@taskmanagement.local`}
              className="rounded-md border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Mật khẩu</span>
            <input
              name="password"
              type="password"
              required
              placeholder="Nhập mật khẩu"
              className="rounded-md border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          {errorMessage && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className={submitClassName}>
            {isSubmitting ? 'Đang đăng nhập...' : submitLabel}
          </Button>

          {showCreateAccount && (
            <button
              type="button"
              className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Tạo tài khoản
            </button>
          )}
        </form>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link to="/login/employee" className="font-medium text-cyan-700 hover:text-cyan-800">
            Nhân viên
          </Link>
          <Link to="/login/manager" className="font-medium text-cyan-700 hover:text-cyan-800">
            Trưởng phòng
          </Link>
          <Link to="/login/admin" className="font-medium text-cyan-700 hover:text-cyan-800">
            Quản trị
          </Link>
        </div>
      </section>
    </main>
  )
}
