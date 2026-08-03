import type { AuthUser, UserRole } from '../types/auth.types'

const nameIdentifierClaim =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
const roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
const nameClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'

type JwtPayload = {
  [nameIdentifierClaim]?: string
  [roleClaim]?: string
  [nameClaim]?: string
  Role?: string
  Email?: string
  UserId?: string
  FullName?: string
  exp?: number
}

const roleMap: Record<string, UserRole> = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(paddedBase64)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}

export function decodeJwtPayload(token: string): JwtPayload {
  const [, payload] = token.split('.')

  if (!payload) {
    throw new Error('Invalid login token')
  }

  return JSON.parse(decodeBase64Url(payload)) as JwtPayload
}

export function isJwtExpired(payload: JwtPayload) {
  if (!payload.exp) {
    return false
  }

  return payload.exp * 1000 <= Date.now()
}

export function getUserFromToken(token: string): AuthUser {
  const payload = decodeJwtPayload(token)

  if (isJwtExpired(payload)) {
    throw new Error('Login token expired')
  }

  const role = roleMap[(payload[roleClaim] || payload.Role || '').toUpperCase()]

  if (!role || role === 'guest') {
    throw new Error('Invalid user role')
  }

  const id = payload.UserId || payload[nameIdentifierClaim] || ''
  const name = payload.FullName || payload[nameClaim] || payload.Email || 'User'

  return {
    id,
    name,
    email: payload.Email || '',
    role,
  }
}
