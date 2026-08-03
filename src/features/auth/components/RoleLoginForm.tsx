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
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const redirectTo = state?.from?.pathname ?? `/${role}`

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    login(role, { email, password })
    navigate(redirectTo, { replace: true })
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
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              name="password"
              type="password"
              required
              placeholder="Enter password"
              className="rounded-md border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          <Button type="submit" className={submitClassName}>
            {submitLabel}
          </Button>

          {showCreateAccount && (
            <button
              type="button"
              className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Create account
            </button>
          )}
        </form>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link to="/login/employee" className="font-medium text-cyan-700 hover:text-cyan-800">
            Employee
          </Link>
          <Link to="/login/manager" className="font-medium text-cyan-700 hover:text-cyan-800">
            Manager
          </Link>
          <Link to="/login/admin" className="font-medium text-cyan-700 hover:text-cyan-800">
            Admin
          </Link>
        </div>
      </section>
    </main>
  )
}
