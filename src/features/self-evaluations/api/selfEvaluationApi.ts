import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse } from '@/types/api'

import type {
  SelfEvaluation,
  UpdateSelfEvaluationRequest,
} from '../types/selfEvaluation.types'

export const selfEvaluationApiLinks = {
  detail: (periodId: string) => `/api/SelfEvaluation/${periodId}`,
  update: (periodId: string) => `/api/SelfEvaluation/${periodId}`,
}

export type GetSelfEvaluationResponse = ApiResponse<SelfEvaluation>
export type UpdateSelfEvaluationResponse = ApiResponse<SelfEvaluation>

export async function getSelfEvaluation(
  periodId: string,
  signal?: AbortSignal,
): Promise<SelfEvaluation> {
  const response = await httpClient.get<GetSelfEvaluationResponse>(
    selfEvaluationApiLinks.detail(periodId),
    { signal },
  )

  return unwrapApiResponse(response.data)
}

export async function updateSelfEvaluation(
  periodId: string,
  payload: UpdateSelfEvaluationRequest,
): Promise<SelfEvaluation> {
  const response = await httpClient.put<UpdateSelfEvaluationResponse>(
    selfEvaluationApiLinks.update(periodId),
    payload,
  )

  return unwrapApiResponse(response.data)
}
