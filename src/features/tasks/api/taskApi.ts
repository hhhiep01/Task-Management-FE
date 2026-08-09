import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse, PagedResult, PaginationQuery } from '@/types/api'
import { buildQueryParams } from '@/utils/queryString'

import type {
  CreateTaskRequest,
  Task,
  UpdateTaskRequest,
  UpdateTaskResultRequest,
} from '../types/task.types'

export const taskApiLinks = {
  list: '/api/Task',
  myTasks: '/api/Task/my-tasks',
  create: '/api/Task',
  detail: (taskId: string) => `/api/Task/${taskId}`,
  update: (taskId: string) => `/api/Task/${taskId}`,
  updateResult: (taskId: string) => `/api/Task/${taskId}/result`,
  delete: (taskId: string) => `/api/Task/${taskId}`,
  start: (taskId: string) => `/api/Task/${taskId}/start`,
  submit: (taskId: string) => `/api/Task/${taskId}/submit`,
  cancel: (taskId: string) => `/api/Task/${taskId}/cancel`,
}

export type TaskQuery = PaginationQuery & {
  periodId?: string
  workTemplateId?: string
  organizationId?: string
  assignedBy?: string
  assigneeId?: string
  workType?: string
  status?: string
  dueDateFrom?: string
  dueDateTo?: string
}

export type MyTasksQuery = Omit<TaskQuery, 'assigneeId'>

export type GetTasksResponse = ApiResponse<PagedResult<Task>>
export type GetTaskByIdResponse = ApiResponse<Task>
export type CreateTaskResponse = ApiResponse<Task>
export type UpdateTaskResponse = ApiResponse<Task>
export type UpdateTaskResultResponse = ApiResponse<Task>
export type DeleteTaskResponse = ApiResponse<null>
export type TaskWorkflowResponse = ApiResponse<Task>

export type TaskWorkflowAction =
  | 'start'
  | 'submit'
  | 'cancel'

export async function getTasks(query: TaskQuery, signal?: AbortSignal) {
  const response = await httpClient.get<GetTasksResponse>(taskApiLinks.list, {
    params: buildQueryParams(query),
    signal,
  })
  return unwrapApiResponse(response.data)
}

export async function getMyTasks(query: MyTasksQuery, signal?: AbortSignal) {
  const response = await httpClient.get<GetTasksResponse>(taskApiLinks.myTasks, {
    params: buildQueryParams(query),
    signal,
  })
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

export async function updateTaskResult(
  taskId: string,
  payload: UpdateTaskResultRequest,
): Promise<Task> {
  const response = await httpClient.put<UpdateTaskResultResponse>(
    taskApiLinks.updateResult(taskId),
    payload,
  )
  return unwrapApiResponse(response.data)
}

export async function runTaskWorkflowAction(
  taskId: string,
  action: TaskWorkflowAction,
): Promise<Task> {
  const response = await httpClient.patch<TaskWorkflowResponse>(taskApiLinks[action](taskId))
  return unwrapApiResponse(response.data)
}
