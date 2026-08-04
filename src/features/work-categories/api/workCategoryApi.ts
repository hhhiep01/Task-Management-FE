import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse } from '@/types/api'

import type {
  CreateWorkCategoryRequest,
  UpdateWorkCategoryRequest,
  WorkCategory,
} from '../types/workCategory.types'

export const workCategoryApiLinks = {
  list: '/api/WorkCategory',
  create: '/api/WorkCategory',
  detail: (categoryId: string) => `/api/WorkCategory/${categoryId}`,
  update: (categoryId: string) => `/api/WorkCategory/${categoryId}`,
  delete: (categoryId: string) => `/api/WorkCategory/${categoryId}`,
}

export type GetWorkCategoriesResponse = ApiResponse<WorkCategory[]>
export type GetWorkCategoryByIdResponse = ApiResponse<WorkCategory>
export type CreateWorkCategoryResponse = ApiResponse<WorkCategory>
export type UpdateWorkCategoryResponse = ApiResponse<WorkCategory>
export type DeleteWorkCategoryResponse = ApiResponse<null>

export async function getWorkCategories(): Promise<WorkCategory[]> {
  const response = await httpClient.get<GetWorkCategoriesResponse>(workCategoryApiLinks.list)
  return unwrapApiResponse(response.data)
}

export async function getWorkCategoryById(categoryId: string): Promise<WorkCategory> {
  const response = await httpClient.get<GetWorkCategoryByIdResponse>(
    workCategoryApiLinks.detail(categoryId),
  )
  return unwrapApiResponse(response.data)
}

export async function createWorkCategory(
  payload: CreateWorkCategoryRequest,
): Promise<WorkCategory> {
  const response = await httpClient.post<CreateWorkCategoryResponse>(
    workCategoryApiLinks.create,
    payload,
  )
  return unwrapApiResponse(response.data)
}

export async function updateWorkCategory(
  categoryId: string,
  payload: UpdateWorkCategoryRequest,
): Promise<WorkCategory> {
  const response = await httpClient.put<UpdateWorkCategoryResponse>(
    workCategoryApiLinks.update(categoryId),
    payload,
  )
  return unwrapApiResponse(response.data)
}

export async function deleteWorkCategory(categoryId: string): Promise<null> {
  const response = await httpClient.delete<DeleteWorkCategoryResponse>(
    workCategoryApiLinks.delete(categoryId),
  )
  return unwrapApiResponse(response.data)
}
