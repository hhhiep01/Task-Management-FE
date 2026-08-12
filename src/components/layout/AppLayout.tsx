import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { AuthUser, UserRole } from '@/features/auth/types/auth.types'

type IconName =
  | 'home'
  | 'tasks'
  | 'clipboard'
  | 'review'
  | 'calendar'
  | 'folder'
  | 'list'
  | 'settings'
  | 'users'
  | 'building'
  | 'shield'

type SidebarItem = {
  label: string
  href?: string
  icon: IconName
  roles: UserRole[]
  roleCodes?: string[]
  disabled?: boolean
  title?: string
  end?: boolean
}

type SidebarSection = {
  label?: string
  items: SidebarItem[]
}

const employeeSections: SidebarSection[] = [
  {
    items: [{ label: 'Tổng quan', href: '/employee', icon: 'home', roles: ['employee'], end: true }],
  },
  {
    label: 'CÔNG VIỆC',
    items: [
      {
        label: 'Công việc của tôi',
        href: '/employee#my-tasks',
        icon: 'tasks',
        roles: ['employee'],
        end: true,
      },
    ],
  },
  {
    label: 'ĐÁNH GIÁ',
    items: [
      { label: 'Tự đánh giá', href: '/employee/self-evaluation', icon: 'clipboard', roles: ['employee'] },
    ],
  },
]

const managerSections: SidebarSection[] = [
  {
    items: [{ label: 'Tổng quan', href: '/manager', icon: 'home', roles: ['manager'], end: true }],
  },
  {
    label: 'CÔNG VIỆC',
    items: [
      { label: 'Tất cả công việc', href: '/manager/tasks', icon: 'tasks', roles: ['manager'] },
      { label: 'Chờ đánh giá', href: '/manager/waiting-evaluation', icon: 'review', roles: ['manager'] },
    ],
  },
  {
    label: 'ĐÁNH GIÁ',
    items: [
      {
        label: 'Tự đánh giá',
        icon: 'clipboard',
        roles: ['manager'],
        disabled: true,
        title: 'Tự đánh giá chưa có trang dành cho vai trò quản lý',
      },
      {
        label: 'Đánh giá nhân viên',
        href: '/manager/period-reviews',
        icon: 'review',
        roles: ['manager'],
        roleCodes: ['TP', 'PP'],
      },
      {
        label: 'Kết quả đánh giá',
        href: '/period-evaluation-summary',
        icon: 'review',
        roles: ['manager'],
        roleCodes: ['TP', 'PP'],
      },
    ],
  },
  {
    label: 'THIẾT LẬP',
    items: [
      { label: 'Kỳ đánh giá', href: '/manager/evaluation-periods', icon: 'calendar', roles: ['manager'] },
      { label: 'Nhóm công việc', href: '/manager/work-categories', icon: 'folder', roles: ['manager'] },
      { label: 'Danh mục công việc', href: '/manager/work-templates', icon: 'list', roles: ['manager'] },
      {
        label: 'Tiêu chí chung',
        href: '/common-criteria',
        icon: 'settings',
        roles: ['manager'],
        roleCodes: ['TP', 'PP'],
      },
    ],
  },
]

const adminSections: SidebarSection[] = [
  {
    items: [{ label: 'Tổng quan', href: '/admin', icon: 'home', roles: ['admin'], end: true }],
  },
  {
    label: 'QUẢN TRỊ',
    items: [
      { label: 'Tài khoản', href: '/admin/accounts', icon: 'users', roles: ['admin'] },
      { label: 'Phòng ban', href: '/admin/organizations', icon: 'building', roles: ['admin'] },
      { label: 'Vai trò', href: '/admin/roles', icon: 'shield', roles: ['admin'] },
    ],
  },
  {
    label: 'THIẾT LẬP',
    items: [
      { label: 'Kỳ đánh giá', href: '/admin/evaluation-periods', icon: 'calendar', roles: ['admin'] },
      { label: 'Tiêu chí chung', href: '/common-criteria', icon: 'settings', roles: ['admin'] },
    ],
  },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    if (!isMobileOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isMobileOpen])

  const sections = getSidebarSections(user)
  const breadcrumb = getPageContext(location.pathname)

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--color-app-bg)]">
      <Sidebar
        user={user}
        sections={sections}
        collapsed={isCollapsed}
        mobile={false}
        onToggle={() => setIsCollapsed((current) => !current)}
      />

      {isMobileOpen ? (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      ) : null}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 motion-reduce:transition-none lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          user={user}
          sections={sections}
          collapsed={false}
          mobile
          onToggle={() => setIsMobileOpen(false)}
        />
      </div>

      <div className={`min-h-screen min-w-0 transition-[padding] duration-200 motion-reduce:transition-none ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-30 flex min-h-16 min-w-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] lg:hidden"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Mở menu điều hướng"
              aria-expanded={isMobileOpen}
            >
              <MenuIcon />
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[var(--color-text-muted)]">{breadcrumb.parent}</p>
              <h1 className="truncate text-sm font-semibold text-[var(--color-text-strong)] sm:text-base">
                {breadcrumb.current}
              </h1>
            </div>
          </div>

          <details className="group relative shrink-0">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 transition-colors hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-primary-subtle)] text-xs font-bold text-[var(--color-primary)]">
                {getInitials(user?.name)}
              </span>
              <span className="hidden min-w-0 text-left sm:block">
                <span className="block max-w-40 truncate text-sm font-semibold text-[var(--color-text-strong)]">{user?.name}</span>
                <span className="block text-xs text-[var(--color-text-muted)]">{getRoleLabel(user?.role)}</span>
              </span>
              <ChevronDownIcon />
            </summary>
            <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-2 shadow-[var(--shadow-card)]">
              <div className="border-b border-[var(--color-border)] px-3 py-2">
                <p className="truncate text-sm font-semibold text-[var(--color-text-strong)]">{user?.name}</p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">{user?.email}</p>
              </div>
              <NavLink
                to="/change-password"
                className="mt-1 flex h-9 w-full items-center rounded-[var(--radius-md)] px-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                Đổi mật khẩu
              </NavLink>
              <Button type="button" variant="ghost" size="sm" className="mt-1 w-full justify-start" onClick={logout}>
                Đăng xuất
              </Button>
            </div>
          </details>
        </header>

        <div className="w-full min-w-0 px-4 py-5 sm:px-6 sm:py-6">
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  )
}

function Sidebar({
  user,
  sections,
  collapsed,
  mobile,
  onToggle,
}: {
  user: AuthUser | null
  sections: SidebarSection[]
  collapsed: boolean
  mobile: boolean
  onToggle: () => void
}) {
  return (
    <aside
      className={`flex h-full min-h-screen flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] ${
        mobile ? 'w-64' : `fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 motion-reduce:transition-none lg:flex ${collapsed ? 'w-20' : 'w-64'}`
      }`}
      aria-label="Menu điều hướng"
    >
      <div className={`flex h-16 shrink-0 items-center border-b border-[var(--color-border)] ${collapsed && !mobile ? 'justify-center px-2' : 'justify-between px-4'}`}>
        <div className={`flex min-w-0 items-center gap-2.5 ${collapsed && !mobile ? 'justify-center' : ''}`}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-sm font-bold text-white">TM</span>
          {collapsed && !mobile ? null : (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--color-text-strong)]">Task Management</p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Workspace</p>
            </div>
          )}
        </div>
        {mobile ? (
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            onClick={onToggle}
            aria-label="Đóng menu"
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4" aria-label="Menu chức năng">
        <div className="grid gap-5">
          {sections.map((section, index) => (
            <SidebarSectionView key={section.label ?? `section-${index}`} section={section} user={user} collapsed={collapsed && !mobile} />
          ))}
        </div>
      </nav>

      <div className={`shrink-0 border-t border-[var(--color-border)] p-3 ${collapsed && !mobile ? 'flex justify-center' : ''}`}>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          aria-label={collapsed && !mobile ? 'Mở rộng menu' : 'Thu gọn menu'}
          title={collapsed && !mobile ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {collapsed && !mobile ? <ChevronRightIcon /> : <><ChevronLeftIcon /><span>Thu gọn menu</span></>}
        </button>
      </div>
    </aside>
  )
}

function SidebarSectionView({
  section,
  user,
  collapsed,
}: {
  section: SidebarSection
  user: AuthUser | null
  collapsed: boolean
}) {
  const visibleItems = section.items.filter((item) => isSidebarItemVisible(item, user))
  if (!visibleItems.length) return null

  return (
    <section>
      {section.label && !collapsed ? (
        <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.12em] text-[var(--color-text-muted)]">{section.label}</p>
      ) : null}
      <div className="grid gap-1">
        {visibleItems.map((item) => <SidebarItemView key={`${item.label}-${item.href ?? 'disabled'}`} item={item} collapsed={collapsed} />)}
      </div>
    </section>
  )
}

function SidebarItemView({ item, collapsed }: { item: SidebarItem; collapsed: boolean }) {
  const icon = <SidebarIcon name={item.icon} />
  const baseClassName = `group relative flex min-h-10 min-w-0 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors ${
    collapsed ? 'justify-center' : ''
  }`

  if (item.disabled || !item.href) {
    return (
      <span className={`${baseClassName} cursor-not-allowed text-[var(--color-text-muted)] opacity-60`} title={collapsed ? item.title ?? item.label : item.title} aria-disabled="true">
        {icon}
        {collapsed ? null : <span className="min-w-0 truncate">{item.label}</span>}
        {collapsed ? <Tooltip label={item.title ?? item.label} /> : null}
      </span>
    )
  }

  return (
    <NavLink
      to={item.href}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) => `${baseClassName} ${
        isActive
          ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
          : 'text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-strong)]'
      }`}
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-[var(--color-primary)]' : ''}>{icon}</span>
          {collapsed ? null : <span className="min-w-0 truncate">{item.label}</span>}
          {collapsed ? <Tooltip label={item.label} /> : null}
        </>
      )}
    </NavLink>
  )
}

function Tooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-sm)] bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm group-hover:block group-focus-visible:block">
      {label}
    </span>
  )
}

function isSidebarItemVisible(item: SidebarItem, user: AuthUser | null) {
  return Boolean(
    user &&
      item.roles.includes(user.role) &&
      (!item.roleCodes || item.roleCodes.includes(user.roleCode.toUpperCase())),
  )
}

function getSidebarSections(user: AuthUser | null) {
  if (user?.role === 'employee') return employeeSections
  if (user?.role === 'manager') return managerSections
  if (user?.role === 'admin') return adminSections
  return []
}

function getPageContext(pathname: string) {
  if (pathname === '/employee') return { parent: 'Không gian làm việc', current: 'Tổng quan' }
  if (pathname.startsWith('/employee/self-evaluation')) return { parent: 'Đánh giá', current: 'Tự đánh giá' }
  if (pathname.startsWith('/employee/tasks')) return { parent: 'Công việc của tôi', current: 'Chi tiết công việc' }
  if (pathname === '/manager') return { parent: 'Không gian làm việc', current: 'Tổng quan' }
  if (pathname.startsWith('/manager/tasks/')) return { parent: 'Công việc', current: 'Chi tiết công việc' }
  if (pathname.startsWith('/manager/tasks')) return { parent: 'Công việc', current: 'Tất cả công việc' }
  if (pathname.startsWith('/manager/waiting-evaluation')) return { parent: 'Công việc', current: 'Chờ đánh giá' }
  if (pathname.startsWith('/manager/period-reviews')) return { parent: 'Đánh giá', current: 'Đánh giá nhân viên' }
  if (pathname.startsWith('/manager/evaluation-periods')) return { parent: 'Thiết lập', current: 'Kỳ đánh giá' }
  if (pathname.startsWith('/admin/evaluation-periods')) return { parent: 'Thiết lập', current: 'Kỳ đánh giá' }
  if (pathname.startsWith('/manager/work-categories')) return { parent: 'Thiết lập', current: 'Nhóm công việc' }
  if (pathname.startsWith('/manager/work-templates')) return { parent: 'Thiết lập', current: 'Danh mục công việc' }
  if (pathname === '/common-criteria') return { parent: 'Thiết lập', current: 'Tiêu chí chung' }
  if (pathname === '/admin') return { parent: 'Quản trị', current: 'Tổng quan' }
  if (pathname.startsWith('/admin/accounts')) return { parent: 'Quản trị', current: 'Tài khoản' }
  if (pathname.startsWith('/admin/organizations')) return { parent: 'Quản trị', current: 'Phòng ban' }
  if (pathname.startsWith('/admin/roles')) return { parent: 'Quản trị', current: 'Vai trò' }
  return { parent: 'Task Management', current: 'Không gian làm việc' }
}

function getRoleLabel(role?: UserRole) {
  if (role === 'admin') return 'Quản trị viên'
  if (role === 'manager') return 'Quản lý'
  if (role === 'employee') return 'Nhân viên'
  return ''
}

function getInitials(name?: string) {
  if (!name) return 'U'
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function SidebarIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 9 7-6 7 6" /><path d="M5 8.5V17h10V8.5" /><path d="M8 17v-5h4v5" /></>,
    tasks: <><rect x="4" y="3" width="12" height="14" rx="1.5" /><path d="M7 7h6M7 10h6M7 13h4" /></>,
    clipboard: <><rect x="5" y="4" width="10" height="13" rx="1.5" /><path d="M8 4.5V3h4v1.5M8 9h4M8 12h3" /></>,
    review: <><path d="M4 4.5h12v9H8l-4 3v-12Z" /><path d="m7 9 2 2 4-4" /></>,
    calendar: <><rect x="3" y="4.5" width="14" height="12" rx="1.5" /><path d="M6 3v3M14 3v3M3 8h14" /></>,
    folder: <><path d="M3 5.5h5l1.5 2H17v7.5H3z" /><path d="M3 7.5h14" /></>,
    list: <><path d="M8 5h8M8 10h8M8 15h8" /><path d="M4 5h.01M4 10h.01M4 15h.01" /></>,
    settings: <><path d="M10 3v2M10 15v2M3 10h2M15 10h2M5 5l1.5 1.5M13.5 13.5 15 15M15 5l-1.5 1.5M6.5 13.5 5 15" /><circle cx="10" cy="10" r="3" /></>,
    users: <><circle cx="8" cy="8" r="2.5" /><path d="M3.5 16a4.5 4.5 0 0 1 9 0M14 6.5a2 2 0 0 1 0 4M14 12.5a3.5 3.5 0 0 1 2.5 3.5" /></>,
    building: <><path d="M4 17V4h8v13M12 8h4v9M2 17h14M7 7h2M7 10h2M7 13h2" /></>,
    shield: <><path d="m10 3 6 2v4c0 4-2.5 6.5-6 8-3.5-1.5-6-4-6-8V5z" /><path d="m7.5 10 1.7 1.7 3.5-3.5" /></>,
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

function MenuIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
}

function CloseIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
}

function ChevronDownIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0"><path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ChevronLeftIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="m12 5-5 5 5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ChevronRightIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="m8 5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
