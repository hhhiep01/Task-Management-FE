import axios from 'axios'
import type { AxiosError } from 'axios'

import { env } from '@/config/env'
import {
  clearAuthStorage,
  setStoredMustChangePassword,
} from '@/features/auth/utils/authStorage'
import type { ApiResponse } from '@/types/api'

const PASSWORD_CHANGE_REQUIRED_MESSAGE =
  'Password change is required before continuing.'

export class ApiClientError extends Error {
  readonly status?: number
  readonly responseData?: unknown

  constructor(message: string, status?: number, responseData?: unknown) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.responseData = responseData
  }
}

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }

  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      clearAuthStorage()

      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }

    if (
      error.response?.status === 403 &&
      error.response.data?.errorMessage?.trim() === PASSWORD_CHANGE_REQUIRED_MESSAGE
    ) {
      setStoredMustChangePassword(true)

      if (window.location.pathname !== '/change-password') {
        window.location.assign('/change-password')
      }
    }

    const message = error.response?.data?.errorMessage || error.message
    return Promise.reject(new ApiClientError(message, error.response?.status, error.response?.data))
  },
)
