export type UserRole = 'guest' | 'employee' | 'manager' | 'admin'

export type LoginRole = Exclude<UserRole, 'guest'>

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

export type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (role: LoginRole, credentials?: LoginCredentials) => void
  logout: () => void
}

export type LoginCredentials = {
  email: string
  password: string
}
