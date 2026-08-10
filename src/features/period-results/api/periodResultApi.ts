import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse } from '@/types/api'

import type { PeriodResult, SelfProposalRequest } from '../types/periodResult.types'

export const periodResultApiLinks = {
  myResult: (periodId: string) => `/api/PeriodResult/${periodId}/my-result`,
  selfProposal: (periodId: string) => `/api/PeriodResult/${periodId}/self-proposal`,
  submit: (periodId: string) => `/api/PeriodResult/${periodId}/submit`,
}

export type GetMyPeriodResultResponse = ApiResponse<PeriodResult>
type PeriodResultMutationResponse = ApiResponse<unknown>

export async function getMyPeriodResult(periodId: string, signal?: AbortSignal): Promise<PeriodResult> {
  const response = await httpClient.get<GetMyPeriodResultResponse>(
    periodResultApiLinks.myResult(periodId),
    { signal },
  )

  return unwrapApiResponse(response.data)
}

export async function updateSelfProposal(
  periodId: string,
  payload: SelfProposalRequest,
): Promise<void> {
  const response = await httpClient.put<PeriodResultMutationResponse>(
    periodResultApiLinks.selfProposal(periodId),
    payload,
  )

  unwrapApiResponse(response.data)
}

export async function submitPeriodResult(periodId: string): Promise<void> {
  const response = await httpClient.post<PeriodResultMutationResponse>(
    periodResultApiLinks.submit(periodId),
  )

  unwrapApiResponse(response.data)
}
