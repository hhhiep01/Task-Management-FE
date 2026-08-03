import { httpClient } from '@/services/httpClient'

import type { Task } from '../types/task.types'

export async function getTasks() {
  const response = await httpClient.get<Task[]>('/tasks')
  return response.data
}

export async function getTaskById(taskId: string) {
  const response = await httpClient.get<Task>(`/tasks/${taskId}`)
  return response.data
}
