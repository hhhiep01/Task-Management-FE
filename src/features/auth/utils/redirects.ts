import type { AuthUser, UserRole } from '../types/auth.types'

const roleHomePaths: Record<UserRole, string> = {
  admin: '/admin',
  employee: '/employee',
  manager: '/manager',
  guest: '/login',
}

const roleCodeHomePaths: Record<string, string> = {
  ADMIN: '/admin',
  TP: '/manager',
  PP: '/manager',
  MANAGER: '/manager',
  NV: '/employee',
  EMPLOYEE: '/employee',
}

export function getUserHomePath(user?: AuthUser | null) {
  if (!user) {
    return roleHomePaths.guest
  }

  return roleCodeHomePaths[user.roleCode] ?? roleHomePaths[user.role]
}
