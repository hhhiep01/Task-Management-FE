import axios from 'axios'
import type { AxiosError } from 'axios'

import { env } from '@/config/env'
import type { ApiResponse } from '@/types/api'

export class ApiClientError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
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
      localStorage.removeItem('authUser')
      localStorage.removeItem('accessToken')

      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }

    const message = error.response?.data?.errorMessage || error.message
    return Promise.reject(new ApiClientError(message, error.response?.status))
  },
)
