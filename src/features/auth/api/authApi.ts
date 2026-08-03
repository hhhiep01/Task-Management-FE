import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse } from '@/types/api'

import type { LoginCredentials, LoginRequest, LoginResponse } from '../types/auth.types'

export const authApiLinks = {
  login: '/api/Auth/login',
}

export type LoginApiResponse = ApiResponse<LoginResponse>

export async function loginApi(credentials: LoginCredentials): Promise<LoginResponse> {
  const payload: LoginRequest = {
    userEmail: credentials.email,
    password: credentials.password,
  }

  const response = await httpClient.post<LoginApiResponse>(authApiLinks.login, payload)
  return unwrapApiResponse(response.data)
}
