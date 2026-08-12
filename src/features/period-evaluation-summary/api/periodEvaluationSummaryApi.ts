import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse } from '@/types/api'

import type { PeriodEvaluationSummary } from '../types/periodEvaluationSummary.types'

export type PeriodEvaluationSummaryQuery = {
  search?: string
  status?: string
  rating?: string
  pageNumber: number
  pageSize: number
}

export const periodEvaluationSummaryApiLinks = {
  summary: (periodId: string) => `/api/PeriodResult/${periodId}/summary`,
}

export async function getPeriodEvaluationSummary(
  periodId: string,
  query: PeriodEvaluationSummaryQuery,
  signal?: AbortSignal,
) {
  const response = await httpClient.get<ApiResponse<PeriodEvaluationSummary>>(
    periodEvaluationSummaryApiLinks.summary(periodId),
    { params: query, signal },
  )

  return unwrapApiResponse(response.data)
}
