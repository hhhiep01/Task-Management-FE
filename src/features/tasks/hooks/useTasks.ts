import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createTask,
  deleteTask,
  getMyTasks,
  getTasks,
  runTaskWorkflowAction,
  updateTask,
  updateTaskResult,
} from '../api/taskApi'
import type { MyTasksQuery, TaskQuery, TaskWorkflowAction } from '../api/taskApi'
import type { UpdateTaskRequest, UpdateTaskResultRequest } from '../types/task.types'

export const taskQueryKeys = {
  all: ['tasks'] as const,
  myTasks: ['tasks', 'my-tasks'] as const,
}

export function useTasks(query: TaskQuery = { pageNumber: 1, pageSize: 10 }) {
  return useQuery({
    queryKey: [...taskQueryKeys.all, query],
    queryFn: ({ signal }) => getTasks(query, signal),
    placeholderData: (previousData) => previousData,
  })
}

export function useMyTasks(query: MyTasksQuery = { pageNumber: 1, pageSize: 10 }) {
  return useQuery({
    queryKey: [...taskQueryKeys.myTasks, query],
    queryFn: ({ signal }) => getMyTasks(query, signal),
    placeholderData: (previousData) => previousData,
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

export function useTaskWorkflowAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, action }: { taskId: string; action: TaskWorkflowAction }) =>
      runTaskWorkflowAction(taskId, action),
    onSuccess: (task) => {
      queryClient.setQueryData([...taskQueryKeys.all, task.id], task)
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.myTasks })
    },
  })
}

export function useUpdateTaskResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateTaskResultRequest }) =>
      updateTaskResult(taskId, payload),
    onSuccess: (task) => {
      queryClient.setQueryData([...taskQueryKeys.all, task.id], task)
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.myTasks })
    },
  })
}
