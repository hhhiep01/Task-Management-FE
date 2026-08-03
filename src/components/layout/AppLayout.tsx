import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import type { UserRole } from '@/features/auth/types/auth.types'

type NavigationItem = {
  label: string
  href: string
  roles: UserRole[]
}

const navigation: NavigationItem[] = [
  { label: 'Employee', href: '/employee', roles: ['employee'] },
  { label: 'Manager', href: '/manager', roles: ['manager'] },
  { label: 'Admin', href: '/admin', roles: ['admin'] },
]

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center">
          <nav className="flex gap-2">
            {navigation
              .filter((item) => item.roles.includes(user?.role ?? 'guest'))
              .map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    [
                      'rounded-md px-3 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-cyan-50 text-cyan-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">
              {user?.name} - {user?.role}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </header>

        <Outlet />
      </div>
    </main>
  )
}
