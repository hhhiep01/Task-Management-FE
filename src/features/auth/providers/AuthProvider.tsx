import { useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

import { loginApi } from '../api/authApi'
import { getUserFromToken } from '../utils/jwt'
import { AuthContext } from './AuthContext'
import type { AuthContextValue, AuthUser } from '../types/auth.types'

const AUTH_STORAGE_KEY = 'authUser'
const ACCESS_TOKEN_KEY = 'accessToken'

function getStoredUser() {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)

  if (!token) {
    return null
  }

  try {
    const user = getUserFromToken(token)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    return user
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    return null
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: async (credentials) => {
        const token = await loginApi(credentials)
        const loggedInUser = getUserFromToken(token)

        localStorage.setItem(ACCESS_TOKEN_KEY, token)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser))
        setUser(loggedInUser)

        return loggedInUser
      },
      logout: () => {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
