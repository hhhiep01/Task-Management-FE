import { Navigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { getUserHomePath } from '../utils/redirects'

export function RoleRedirect() {
  const { user } = useAuth()

  return <Navigate to={getUserHomePath(user)} replace />
}
