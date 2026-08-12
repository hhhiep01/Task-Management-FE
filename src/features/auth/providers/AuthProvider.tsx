import { useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

import { loginApi } from '../api/authApi'
import {
  ACCESS_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  clearAuthStorage,
  getStoredMustChangePassword,
  setStoredMustChangePassword,
} from '../utils/authStorage'
import { getUserFromToken } from '../utils/jwt'
import { AuthContext } from './AuthContext'
import type { AuthContextValue, AuthUser } from '../types/auth.types'

type AuthState = {
  user: AuthUser | null
  mustChangePassword: boolean
}

function getStoredAuthState(): AuthState {
  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)

  if (!token) {
    clearAuthStorage()
    return { user: null, mustChangePassword: false }
  }

  try {
    const user = getUserFromToken(token)
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user))
    return { user, mustChangePassword: getStoredMustChangePassword() }
  } catch {
    clearAuthStorage()
    return { user: null, mustChangePassword: false }
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [authState, setAuthState] = useState<AuthState>(() => getStoredAuthState())

  const value = useMemo<AuthContextValue>(
    () => ({
      user: authState.user,
      isAuthenticated: Boolean(authState.user),
      mustChangePassword: authState.mustChangePassword,
      login: async (credentials) => {
        const result = await loginApi(credentials)
        const loggedInUser = getUserFromToken(result.token)

        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, result.token)
        localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(loggedInUser))
        setStoredMustChangePassword(result.mustChangePassword)
        setAuthState({
          user: loggedInUser,
          mustChangePassword: result.mustChangePassword,
        })

        return {
          user: loggedInUser,
          mustChangePassword: result.mustChangePassword,
        }
      },
      logout: () => {
        clearAuthStorage()
        setAuthState({ user: null, mustChangePassword: false })
      },
    }),
    [authState],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
