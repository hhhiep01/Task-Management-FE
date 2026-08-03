import { NavLink } from 'react-router-dom'

import { cn } from '@/utils/cn'

const adminTabs = [
  { label: 'Tổng quan', href: '/admin' },
  { label: 'Quản lý role', href: '/admin/roles' },
]

export function AdminTabs() {
  return (
    <nav className="mb-6 flex gap-2 border-b border-slate-200" aria-label="Admin tabs">
      {adminTabs.map((tab) => (
        <NavLink
          key={tab.href}
          to={tab.href}
          end={tab.href === '/admin'}
          className={({ isActive }) =>
            cn(
              'border-b-2 px-4 py-3 text-sm font-semibold transition',
              isActive
                ? 'border-cyan-700 text-cyan-800'
                : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
