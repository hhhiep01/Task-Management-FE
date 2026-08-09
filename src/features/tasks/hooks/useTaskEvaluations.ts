import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiClientError } from '@/services/httpClient'

import {
  evaluateTask,
  getTaskEvaluationHistory,
  getWaitingEvaluationTasks,
} from '../api/taskEvaluationApi'
import type { WaitingEvaluationQuery } from '../api/taskEvaluationApi'
import type { EvaluateTaskRequest } from '../types/taskEvaluation.types'
import { taskQueryKeys } from './useTasks'

export const taskEvaluationQueryKeys = {
  all: ['task-evaluations'] as const,
  waiting: ['task-evaluations', 'waiting'] as const,
  history: (taskId: string) => ['task-evaluations', 'history', taskId] as const,
}

export function useWaitingEvaluationTasks(query: WaitingEvaluationQuery) {
  return useQuery({
    queryKey: [...taskEvaluationQueryKeys.waiting, query],
    queryFn: ({ signal }) => getWaitingEvaluationTasks(query, signal),
    placeholderData: (previousData) => previousData,
  })
}

export function useTaskEvaluationHistory(taskId: string) {
  return useQuery({
    queryKey: taskEvaluationQueryKeys.history(taskId),
    queryFn: ({ signal }) => getTaskEvaluationHistory(taskId, signal),
    enabled: Boolean(taskId),
  })
}

export function useEvaluateTask(taskId: string) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: taskEvaluationQueryKeys.waiting })
    void queryClient.invalidateQueries({ queryKey: taskEvaluationQueryKeys.history(taskId) })
    void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    void queryClient.invalidateQueries({ queryKey: taskQueryKeys.myTasks })
  }

  return useMutation({
    mutationFn: (payload: EvaluateTaskRequest) => evaluateTask(taskId, payload),
    onSuccess: invalidate,
    onError: (error) => {
      if (error instanceof ApiClientError && error.status === 409) invalidate()
    },
  })
}
