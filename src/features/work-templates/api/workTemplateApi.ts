import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse } from '@/types/api'

import type {
  CreateWorkTemplateRequest,
  UpdateWorkTemplateRequest,
  WorkTemplate,
} from '../types/workTemplate.types'

export const workTemplateApiLinks = {
  list: '/api/WorkTemplate',
  create: '/api/WorkTemplate',
  detail: (templateId: string) => `/api/WorkTemplate/${templateId}`,
  update: (templateId: string) => `/api/WorkTemplate/${templateId}`,
  delete: (templateId: string) => `/api/WorkTemplate/${templateId}`,
}

export type GetWorkTemplatesResponse = ApiResponse<WorkTemplate[]>
export type GetWorkTemplateByIdResponse = ApiResponse<WorkTemplate>
export type CreateWorkTemplateResponse = ApiResponse<WorkTemplate>
export type UpdateWorkTemplateResponse = ApiResponse<WorkTemplate>
export type DeleteWorkTemplateResponse = ApiResponse<null>

export async function getWorkTemplates(): Promise<WorkTemplate[]> {
  const response = await httpClient.get<GetWorkTemplatesResponse>(workTemplateApiLinks.list)
  return unwrapApiResponse(response.data)
}

export async function getWorkTemplateById(templateId: string): Promise<WorkTemplate> {
  const response = await httpClient.get<GetWorkTemplateByIdResponse>(
    workTemplateApiLinks.detail(templateId),
  )
  return unwrapApiResponse(response.data)
}

export async function createWorkTemplate(
  payload: CreateWorkTemplateRequest,
): Promise<WorkTemplate> {
  const response = await httpClient.post<CreateWorkTemplateResponse>(
    workTemplateApiLinks.create,
    payload,
  )
  return unwrapApiResponse(response.data)
}

export async function updateWorkTemplate(
  templateId: string,
  payload: UpdateWorkTemplateRequest,
): Promise<WorkTemplate> {
  const response = await httpClient.put<UpdateWorkTemplateResponse>(
    workTemplateApiLinks.update(templateId),
    payload,
  )
  return unwrapApiResponse(response.data)
}

export async function deleteWorkTemplate(templateId: string): Promise<null> {
  const response = await httpClient.delete<DeleteWorkTemplateResponse>(
    workTemplateApiLinks.delete(templateId),
  )
  return unwrapApiResponse(response.data)
}
