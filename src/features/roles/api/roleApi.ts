import { httpClient } from '@/services/httpClient'
import { unwrapApiResponse } from '@/services/apiResponse'
import type { ApiResponse } from '@/types/api'

import type { CreateRoleRequest, Role, UpdateRoleRequest } from '../types/role.types'

export const roleApiLinks = {
  list: '/api/Role',
  create: '/api/Role',
  detail: (roleId: string) => `/api/Role/${roleId}`,
  update: (roleId: string) => `/api/Role/${roleId}`,
  delete: (roleId: string) => `/api/Role/${roleId}`,
}

export type GetRolesResponse = ApiResponse<Role[]>
export type GetRoleByIdResponse = ApiResponse<Role>
export type CreateRoleResponse = ApiResponse<Role>
export type UpdateRoleResponse = ApiResponse<Role>
export type DeleteRoleResponse = ApiResponse<null>

export async function getRoles(): Promise<Role[]> {
  const response = await httpClient.get<GetRolesResponse>(roleApiLinks.list)
  return unwrapApiResponse(response.data)
}

export async function getRoleById(roleId: string): Promise<Role> {
  const response = await httpClient.get<GetRoleByIdResponse>(roleApiLinks.detail(roleId))
  return unwrapApiResponse(response.data)
}

export async function createRole(payload: CreateRoleRequest): Promise<Role> {
  const response = await httpClient.post<CreateRoleResponse>(roleApiLinks.create, payload)
  return unwrapApiResponse(response.data)
}

export async function updateRole(roleId: string, payload: UpdateRoleRequest): Promise<Role> {
  const response = await httpClient.put<UpdateRoleResponse>(roleApiLinks.update(roleId), payload)
  return unwrapApiResponse(response.data)
}

export async function deleteRole(roleId: string): Promise<null> {
  const response = await httpClient.delete<DeleteRoleResponse>(roleApiLinks.delete(roleId))
  return unwrapApiResponse(response.data)
}
