import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types/auth.types'

type ProtectedRouteProps = {
  allowedRoles?: UserRole[]
}

const roleLoginPaths = {
  admin: '/login/admin',
  employee: '/login/employee',
  manager: '/login/manager',
  guest: '/login',
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    const loginPath = roleLoginPaths[allowedRoles?.[0] ?? 'guest']
    return <Navigate to={loginPath} replace state={{ from: location }} />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role ?? 'guest')) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
