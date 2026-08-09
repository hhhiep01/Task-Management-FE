import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse, PagedResult, PaginationQuery } from '@/types/api'
import { buildQueryParams } from '@/utils/queryString'

import type { Task } from '../types/task.types'
import type { EvaluateTaskRequest, TaskEvaluation } from '../types/taskEvaluation.types'

export const taskEvaluationApiLinks = {
  waiting: '/api/Task/waiting-evaluation',
  evaluate: (taskId: string) => `/api/Task/${taskId}/evaluate`,
  history: (taskId: string) => `/api/Task/${taskId}/evaluations`,
}

export type WaitingEvaluationQuery = PaginationQuery & {
  periodId?: string
  assigneeId?: string
  dueDateFrom?: string
  dueDateTo?: string
}

export async function getWaitingEvaluationTasks(query: WaitingEvaluationQuery, signal?: AbortSignal) {
  const response = await httpClient.get<ApiResponse<PagedResult<Task>>>(taskEvaluationApiLinks.waiting, {
    params: buildQueryParams(query),
    signal,
  })
  return unwrapApiResponse(response.data)
}

export async function evaluateTask(taskId: string, payload: EvaluateTaskRequest) {
  const response = await httpClient.post<ApiResponse<string>>(taskEvaluationApiLinks.evaluate(taskId), payload)
  return unwrapApiResponse(response.data)
}

export async function getTaskEvaluationHistory(taskId: string, signal?: AbortSignal) {
  const response = await httpClient.get<ApiResponse<TaskEvaluation[]>>(taskEvaluationApiLinks.history(taskId), { signal })
  return unwrapApiResponse(response.data)
}
