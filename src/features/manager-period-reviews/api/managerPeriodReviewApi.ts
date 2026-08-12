import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse } from '@/types/api'

import type {
  ManagerPeriodReview,
  PeriodReviewEmployee,
  UpdateManagerPeriodReviewRequest,
} from '../types/managerPeriodReview.types'

export const managerPeriodReviewApiLinks = {
  employees: (periodId: string) => `/api/PeriodReview/${periodId}/employees`,
  detail: (periodId: string, userId: string) =>
    `/api/PeriodReview/${periodId}/employees/${userId}`,
}

export async function getPeriodReviewEmployees(
  periodId: string,
  signal?: AbortSignal,
): Promise<PeriodReviewEmployee[]> {
  const response = await httpClient.get<ApiResponse<PeriodReviewEmployee[]>>(
    managerPeriodReviewApiLinks.employees(periodId),
    { signal },
  )

  return unwrapApiResponse(response.data)
}

export async function getManagerPeriodReview(
  periodId: string,
  userId: string,
  signal?: AbortSignal,
): Promise<ManagerPeriodReview> {
  const response = await httpClient.get<ApiResponse<ManagerPeriodReview>>(
    managerPeriodReviewApiLinks.detail(periodId, userId),
    { signal },
  )

  return unwrapApiResponse(response.data)
}

export async function updateManagerPeriodReview(
  periodId: string,
  userId: string,
  payload: UpdateManagerPeriodReviewRequest,
): Promise<void> {
  const response = await httpClient.put<ApiResponse<unknown>>(
    managerPeriodReviewApiLinks.detail(periodId, userId),
    payload,
  )

  unwrapApiResponse(response.data)
}
