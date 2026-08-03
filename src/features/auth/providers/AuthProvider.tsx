import { useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

import { AuthContext } from './AuthContext'
import type { AuthContextValue, AuthUser, LoginCredentials, LoginRole } from '../types/auth.types'

const AUTH_STORAGE_KEY = 'authUser'
const validRoles = ['employee', 'manager', 'admin']

function getStoredUser() {
  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!storedUser) {
    return null
  }

  try {
    const user = JSON.parse(storedUser) as AuthUser

    if (!validRoles.includes(user.role)) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem('accessToken')
      return null
    }

    return user
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem('accessToken')
    return null
  }
}

function createDemoUser(role: LoginRole, credentials?: LoginCredentials): AuthUser {
  return {
    id: `demo-${role}`,
    name: `${role[0].toUpperCase()}${role.slice(1)} Demo`,
    email: credentials?.email || `${role}@taskmanagement.local`,
    role,
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: (role, credentials) => {
        const demoUser = createDemoUser(role, credentials)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser))
        setUser(demoUser)
      },
      logout: () => {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        localStorage.removeItem('accessToken')
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
