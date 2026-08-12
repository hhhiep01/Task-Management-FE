import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse } from '@/types/api'
import { buildQueryParams } from '@/utils/queryString'

import type { PersonalAttentionTask, PersonalDashboardOverview } from '../types/personalDashboard.types'

export const personalDashboardApiLinks = {
  overview: '/api/Dashboard/my-overview',
  attentionTasks: '/api/Dashboard/my-attention-tasks',
}

export type PersonalDashboardQuery = {
  periodId?: string
}

export async function getPersonalDashboardOverview(query: PersonalDashboardQuery, signal?: AbortSignal) {
  const response = await httpClient.get<ApiResponse<PersonalDashboardOverview>>(
    personalDashboardApiLinks.overview,
    { params: buildQueryParams(query), signal },
  )

  return unwrapApiResponse(response.data)
}

export async function getPersonalAttentionTasks(
  query: PersonalDashboardQuery & { limit?: number },
  signal?: AbortSignal,
) {
  const response = await httpClient.get<ApiResponse<PersonalAttentionTask[]>>(
    personalDashboardApiLinks.attentionTasks,
    { params: buildQueryParams({ ...query, limit: query.limit ?? 5 }), signal },
  )

  return unwrapApiResponse(response.data)
}
