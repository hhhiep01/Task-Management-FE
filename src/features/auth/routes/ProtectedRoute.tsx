import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types/auth.types'

type ProtectedRouteProps = {
  allowedRoles?: UserRole[]
  allowedRoleCodes?: string[]
}

export function ProtectedRoute({ allowedRoles, allowedRoleCodes }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role ?? 'guest')) {
    return <Navigate to="/unauthorized" replace />
  }

  if (
    allowedRoleCodes &&
    !allowedRoleCodes.includes(user?.roleCode?.toUpperCase() ?? '')
  ) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
