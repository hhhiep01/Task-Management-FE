import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse, PagedResult, PaginationQuery } from '@/types/api'
import { buildQueryParams } from '@/utils/queryString'

import type {
  CreateOrganizationRequest,
  Organization,
  UpdateOrganizationRequest,
} from '../types/organization.types'

export const organizationApiLinks = {
  list: '/api/Organization',
  create: '/api/Organization',
  detail: (organizationId: string) => `/api/Organization/${organizationId}`,
  update: (organizationId: string) => `/api/Organization/${organizationId}`,
  delete: (organizationId: string) => `/api/Organization/${organizationId}`,
}

export type GetOrganizationsResponse = ApiResponse<PagedResult<Organization>>
export type GetOrganizationByIdResponse = ApiResponse<Organization>
export type CreateOrganizationResponse = ApiResponse<Organization>
export type UpdateOrganizationResponse = ApiResponse<Organization>
export type DeleteOrganizationResponse = ApiResponse<null>

export async function getOrganizations(query: PaginationQuery, signal?: AbortSignal) {
  const response = await httpClient.get<GetOrganizationsResponse>(organizationApiLinks.list, {
    params: buildQueryParams(query),
    signal,
  })
  return unwrapApiResponse(response.data)
}

export async function getOrganizationById(organizationId: string): Promise<Organization> {
  const response = await httpClient.get<GetOrganizationByIdResponse>(
    organizationApiLinks.detail(organizationId),
  )
  return unwrapApiResponse(response.data)
}

export async function createOrganization(
  payload: CreateOrganizationRequest,
): Promise<Organization> {
  const response = await httpClient.post<CreateOrganizationResponse>(
    organizationApiLinks.create,
    payload,
  )
  return unwrapApiResponse(response.data)
}

export async function updateOrganization(
  organizationId: string,
  payload: UpdateOrganizationRequest,
): Promise<Organization> {
  const response = await httpClient.put<UpdateOrganizationResponse>(
    organizationApiLinks.update(organizationId),
    payload,
  )
  return unwrapApiResponse(response.data)
}

export async function deleteOrganization(organizationId: string): Promise<null> {
  const response = await httpClient.delete<DeleteOrganizationResponse>(
    organizationApiLinks.delete(organizationId),
  )
  return unwrapApiResponse(response.data)
}
