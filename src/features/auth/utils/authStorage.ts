export const AUTH_USER_STORAGE_KEY = 'authUser'
export const ACCESS_TOKEN_STORAGE_KEY = 'accessToken'
export const MUST_CHANGE_PASSWORD_STORAGE_KEY = 'mustChangePassword'

export function clearAuthStorage() {
  localStorage.removeItem(AUTH_USER_STORAGE_KEY)
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  localStorage.removeItem(MUST_CHANGE_PASSWORD_STORAGE_KEY)
}

export function setStoredMustChangePassword(value: boolean) {
  localStorage.setItem(MUST_CHANGE_PASSWORD_STORAGE_KEY, String(value))
}

export function getStoredMustChangePassword() {
  return localStorage.getItem(MUST_CHANGE_PASSWORD_STORAGE_KEY) === 'true'
}
