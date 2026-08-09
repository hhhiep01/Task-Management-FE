export type UserRole = 'guest' | 'employee' | 'manager' | 'admin'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
  roleCode: string
}

export type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<AuthUser>
  logout: () => void
}

export type LoginCredentials = {
  email: string
  password: string
}

export type LoginRequest = {
  userEmail: string
  password: string
}

export type LoginResponse = string
