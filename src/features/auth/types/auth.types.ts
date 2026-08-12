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
  mustChangePassword: boolean
  login: (credentials: LoginCredentials) => Promise<AuthenticatedLogin>
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

export type LoginResult = {
  token: string
  mustChangePassword: boolean
}

export type AuthenticatedLogin = {
  user: AuthUser
  mustChangePassword: boolean
}

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}
