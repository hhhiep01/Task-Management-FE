import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createTask, deleteTask, getTasks, updateTask } from '../api/taskApi'
import type { TaskPayload } from '../types/task.types'

export const taskQueryKeys = {
  all: ['tasks'] as const,
}

export function useTasks() {
  return useQuery({
    queryKey: taskQueryKeys.all,
    queryFn: getTasks,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: TaskPayload }) =>
      updateTask(taskId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    },
  })
}
