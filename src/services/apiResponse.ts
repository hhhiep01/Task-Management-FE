import type { ApiResponse } from '@/types/api'

function getApiErrorMessage<TData>(response: ApiResponse<TData>) {
  if (response.errorMessage) {
    return response.errorMessage
  }

  if (typeof response.result === 'string') {
    return response.result
  }

  return 'Request failed'
}

export function unwrapApiResponse<TData>(response: ApiResponse<TData>) {
  if (!response.isSuccess || response.statusCode !== 200) {
    throw new Error(getApiErrorMessage(response))
  }

  return response.result
}
