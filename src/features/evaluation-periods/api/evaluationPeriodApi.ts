import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse, PagedResult, PaginationQuery } from '@/types/api'
import { buildQueryParams } from '@/utils/queryString'

import type {
  CreateEvaluationPeriodRequest,
  EvaluationPeriod,
  UpdateEvaluationPeriodRequest,
} from '../types/evaluationPeriod.types'

export const evaluationPeriodApiLinks = {
  list: '/api/EvaluationPeriod',
  create: '/api/EvaluationPeriod',
  detail: (periodId: string) => `/api/EvaluationPeriod/${periodId}`,
  update: (periodId: string) => `/api/EvaluationPeriod/${periodId}`,
  delete: (periodId: string) => `/api/EvaluationPeriod/${periodId}`,
  lock: (periodId: string) => `/api/EvaluationPeriod/${periodId}/lock`,
}

export type EvaluationPeriodQuery = PaginationQuery & {
  organizationId?: string
  periodType?: string
  status?: string
  fromDate?: string
  toDate?: string
}

export type GetEvaluationPeriodsResponse = ApiResponse<PagedResult<EvaluationPeriod>>
export type GetEvaluationPeriodByIdResponse = ApiResponse<EvaluationPeriod>
export type CreateEvaluationPeriodResponse = ApiResponse<EvaluationPeriod>
export type UpdateEvaluationPeriodResponse = ApiResponse<EvaluationPeriod>
export type DeleteEvaluationPeriodResponse = ApiResponse<null>
export type LockEvaluationPeriodResponse = ApiResponse<EvaluationPeriod>

export async function getEvaluationPeriods(query: EvaluationPeriodQuery, signal?: AbortSignal) {
  const response = await httpClient.get<GetEvaluationPeriodsResponse>(
    evaluationPeriodApiLinks.list,
    { params: buildQueryParams(query), signal },
  )
  return unwrapApiResponse(response.data)
}

export async function getEvaluationPeriodById(periodId: string): Promise<EvaluationPeriod> {
  const response = await httpClient.get<GetEvaluationPeriodByIdResponse>(
    evaluationPeriodApiLinks.detail(periodId),
  )
  return unwrapApiResponse(response.data)
}

export async function createEvaluationPeriod(
  payload: CreateEvaluationPeriodRequest,
): Promise<EvaluationPeriod> {
  const response = await httpClient.post<CreateEvaluationPeriodResponse>(
    evaluationPeriodApiLinks.create,
    payload,
  )
  return unwrapApiResponse(response.data)
}

export async function updateEvaluationPeriod(
  periodId: string,
  payload: UpdateEvaluationPeriodRequest,
): Promise<EvaluationPeriod> {
  const response = await httpClient.put<UpdateEvaluationPeriodResponse>(
    evaluationPeriodApiLinks.update(periodId),
    payload,
  )
  return unwrapApiResponse(response.data)
}

export async function deleteEvaluationPeriod(periodId: string): Promise<null> {
  const response = await httpClient.delete<DeleteEvaluationPeriodResponse>(
    evaluationPeriodApiLinks.delete(periodId),
  )
  return unwrapApiResponse(response.data)
}

export async function lockEvaluationPeriod(periodId: string): Promise<EvaluationPeriod> {
  const response = await httpClient.post<LockEvaluationPeriodResponse>(
    evaluationPeriodApiLinks.lock(periodId),
  )
  return unwrapApiResponse(response.data)
}
