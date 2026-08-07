import { NavLink, Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
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
    <main className="min-h-screen bg-[var(--color-app-bg)] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
          <nav className="flex flex-wrap gap-2">
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
                        ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-strong)]',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-text-muted)]">
              {user?.name} - {user?.role}
            </span>
            <Button type="button" variant="secondary" size="sm" onClick={logout}>
              Đăng xuất
            </Button>
          </div>
        </header>

        <Outlet />
      </div>
    </main>
  )
}
