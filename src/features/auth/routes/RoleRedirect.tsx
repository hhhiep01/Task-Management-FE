import { Navigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'

const roleHomePaths = {
  admin: '/admin',
  employee: '/employee',
  manager: '/manager',
  guest: '/login',
}

export function RoleRedirect() {
  const { user } = useAuth()

  return <Navigate to={roleHomePaths[user?.role ?? 'guest']} replace />
}
