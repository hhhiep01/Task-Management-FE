import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createTask, deleteTask, getMyTasks, getTasks, updateTask } from '../api/taskApi'
import type { UpdateTaskRequest } from '../types/task.types'

export const taskQueryKeys = {
  all: ['tasks'] as const,
  myTasks: ['tasks', 'my-tasks'] as const,
}

export function useTasks() {
  return useQuery({
    queryKey: taskQueryKeys.all,
    queryFn: getTasks,
  })
}

export function useMyTasks() {
  return useQuery({
    queryKey: taskQueryKeys.myTasks,
    queryFn: getMyTasks,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.myTasks })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateTaskRequest }) =>
      updateTask(taskId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.myTasks })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.myTasks })
    },
  })
}
