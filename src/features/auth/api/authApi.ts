import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse } from '@/types/api'

import type {
  ChangePasswordRequest,
  LoginCredentials,
  LoginRequest,
  LoginResult,
} from '../types/auth.types'

export const authApiLinks = {
  login: '/api/Auth/login',
  changePassword: '/api/Auth/change-password',
}

export type LoginApiResponse = ApiResponse<LoginResult>
export type ChangePasswordApiResponse = ApiResponse<unknown>

export async function loginApi(credentials: LoginCredentials): Promise<LoginResult> {
  const payload: LoginRequest = {
    userEmail: credentials.email,
    password: credentials.password,
  }

  const response = await httpClient.post<LoginApiResponse>(authApiLinks.login, payload)
  return unwrapApiResponse(response.data)
}

export async function changePasswordApi(payload: ChangePasswordRequest): Promise<unknown> {
  const response = await httpClient.post<ChangePasswordApiResponse>(
    authApiLinks.changePassword,
    payload,
  )
  return unwrapApiResponse(response.data)
}
