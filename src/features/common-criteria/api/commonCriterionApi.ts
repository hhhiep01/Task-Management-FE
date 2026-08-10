import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse, PagedResult, PaginationQuery } from '@/types/api'
import { buildQueryParams } from '@/utils/queryString'

import type {
  CommonCriterion,
  CreateCommonCriterionRequest,
  UpdateCommonCriterionRequest,
} from '../types/commonCriterion.types'

export const commonCriterionApiLinks = {
  list: '/api/CommonCriterion',
  create: '/api/CommonCriterion',
  detail: (criterionId: string) => `/api/CommonCriterion/${criterionId}`,
  update: (criterionId: string) => `/api/CommonCriterion/${criterionId}`,
  delete: (criterionId: string) => `/api/CommonCriterion/${criterionId}`,
}

export type CommonCriterionQuery = PaginationQuery & {
  organizationId?: string
  parentId?: string
  criterionType?: string
  isActive?: boolean
}

export type GetCommonCriteriaResponse = ApiResponse<PagedResult<CommonCriterion>>
export type GetCommonCriterionByIdResponse = ApiResponse<CommonCriterion>
export type CreateCommonCriterionResponse = ApiResponse<CommonCriterion>
export type UpdateCommonCriterionResponse = ApiResponse<CommonCriterion>
export type DeleteCommonCriterionResponse = ApiResponse<null>

export async function getCommonCriteria(query: CommonCriterionQuery, signal?: AbortSignal) {
  const response = await httpClient.get<GetCommonCriteriaResponse>(commonCriterionApiLinks.list, {
    params: buildQueryParams(query),
    signal,
  })

  return unwrapApiResponse(response.data)
}

export async function getCommonCriterionById(criterionId: string): Promise<CommonCriterion> {
  const response = await httpClient.get<GetCommonCriterionByIdResponse>(
    commonCriterionApiLinks.detail(criterionId),
  )

  return unwrapApiResponse(response.data)
}

export async function createCommonCriterion(
  payload: CreateCommonCriterionRequest,
): Promise<CommonCriterion> {
  const response = await httpClient.post<CreateCommonCriterionResponse>(
    commonCriterionApiLinks.create,
    payload,
  )

  return unwrapApiResponse(response.data)
}

export async function updateCommonCriterion(
  criterionId: string,
  payload: UpdateCommonCriterionRequest,
): Promise<CommonCriterion> {
  const response = await httpClient.put<UpdateCommonCriterionResponse>(
    commonCriterionApiLinks.update(criterionId),
    payload,
  )

  return unwrapApiResponse(response.data)
}

export async function deleteCommonCriterion(criterionId: string): Promise<null> {
  const response = await httpClient.delete<DeleteCommonCriterionResponse>(
    commonCriterionApiLinks.delete(criterionId),
  )

  return unwrapApiResponse(response.data)
}
