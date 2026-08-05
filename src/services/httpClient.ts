import axios from 'axios'
import type { AxiosError } from 'axios'

import { env } from '@/config/env'
import type { ApiResponse } from '@/types/api'

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
    return Promise.reject(new Error(message))
  },
)
