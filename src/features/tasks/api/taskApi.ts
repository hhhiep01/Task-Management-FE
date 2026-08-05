import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse } from '@/types/api'

import type { CreateTaskRequest, Task, UpdateTaskRequest } from '../types/task.types'

export const taskApiLinks = {
  list: '/api/Task',
  create: '/api/Task',
  detail: (taskId: string) => `/api/Task/${taskId}`,
  update: (taskId: string) => `/api/Task/${taskId}`,
  delete: (taskId: string) => `/api/Task/${taskId}`,
}

export type GetTasksResponse = ApiResponse<Task[]>
export type GetTaskByIdResponse = ApiResponse<Task>
export type CreateTaskResponse = ApiResponse<Task>
export type UpdateTaskResponse = ApiResponse<Task>
export type DeleteTaskResponse = ApiResponse<null>

export async function getTasks(): Promise<Task[]> {
  const response = await httpClient.get<GetTasksResponse>(taskApiLinks.list)
  return unwrapApiResponse(response.data)
}

export async function getTaskById(taskId: string): Promise<Task> {
  const response = await httpClient.get<GetTaskByIdResponse>(taskApiLinks.detail(taskId))
  return unwrapApiResponse(response.data)
}

export async function createTask(payload: CreateTaskRequest): Promise<Task> {
  const response = await httpClient.post<CreateTaskResponse>(taskApiLinks.create, payload)
  return unwrapApiResponse(response.data)
}

export async function updateTask(taskId: string, payload: UpdateTaskRequest): Promise<Task> {
  const response = await httpClient.put<UpdateTaskResponse>(taskApiLinks.update(taskId), payload)
  return unwrapApiResponse(response.data)
}

export async function deleteTask(taskId: string): Promise<null> {
  const response = await httpClient.delete<DeleteTaskResponse>(taskApiLinks.delete(taskId))
  return unwrapApiResponse(response.data)
}
