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
  { label: 'Công việc của tôi', href: '/employee', roles: ['employee'] },
  { label: 'Tổng quan', href: '/manager', roles: ['manager'] },
  { label: 'Kỳ đánh giá', href: '/manager/evaluation-periods', roles: ['manager'] },
  { label: 'Nhóm công việc', href: '/manager/work-categories', roles: ['manager'] },
  { label: 'Danh mục công việc', href: '/manager/work-templates', roles: ['manager'] },
  { label: 'Công việc', href: '/manager/tasks', roles: ['manager'] },
  { label: 'Chờ đánh giá', href: '/manager/waiting-evaluation', roles: ['manager'] },
  { label: 'Tổng quan', href: '/admin', roles: ['admin'] },
  { label: 'Tài khoản', href: '/admin/accounts', roles: ['admin'] },
  { label: 'Phòng ban', href: '/admin/organizations', roles: ['admin'] },
  { label: 'Vai trò', href: '/admin/roles', roles: ['admin'] },
]

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <main className="min-h-screen bg-[var(--color-app-bg)] px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        <header className="mb-5 flex flex-col justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:flex-row sm:items-center">
          <nav className="flex flex-wrap gap-1">
            {navigation
              .filter((item) => item.roles.includes(user?.role ?? 'guest'))
              .map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/employee' || item.href === '/manager' || item.href === '/admin'}
                  className={({ isActive }) =>
                    [
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
              <span className="font-medium text-[var(--color-text)]">{user?.name}</span>
              {' · '}{getRoleLabel(user?.role)}
            </span>
            <Button type="button" variant="secondary" size="sm" onClick={logout}>
              Đăng xuất
            </Button>
          </div>
        </header>

        <div className="w-full min-w-0 max-w-full">
          <Outlet />
        </div>
      </div>
    </main>
  )
}

function getRoleLabel(role?: UserRole) {
  if (role === 'admin') return 'Quản trị viên'
  if (role === 'manager') return 'Quản lý'
  if (role === 'employee') return 'Nhân viên'
  return ''
}
