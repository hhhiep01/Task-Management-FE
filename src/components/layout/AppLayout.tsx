import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import type { UserRole } from '@/features/auth/types/auth.types'

type NavigationItem = {
  label: string
  href: string
  roles: UserRole[]
}

const navigation: NavigationItem[] = [
  { label: 'Nhân viên', href: '/employee', roles: ['employee'] },
  { label: 'Trưởng phòng', href: '/manager', roles: ['manager'] },
  { label: 'Tài khoản', href: '/manager/accounts', roles: ['manager'] },
  { label: 'Phòng ban', href: '/manager/organizations', roles: ['manager'] },
  { label: 'Kỳ đánh giá', href: '/manager/evaluation-periods', roles: ['manager'] },
  { label: 'Nhóm công việc', href: '/manager/work-categories', roles: ['manager'] },
  { label: 'Danh mục công việc', href: '/manager/work-templates', roles: ['manager'] },
  { label: 'Giao việc', href: '/manager/tasks', roles: ['manager'] },
  { label: 'Quản trị', href: '/admin', roles: ['admin'] },
  { label: 'Tài khoản', href: '/admin/accounts', roles: ['admin'] },
  { label: 'Vai trò', href: '/admin/roles', roles: ['admin'] },
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
              Đăng xuất
            </button>
          </div>
        </header>

        <Outlet />
      </div>
    </main>
  )
}
