import { useQuery } from '@tanstack/react-query'

import { getTaskById } from '../api/taskApi'
import { taskQueryKeys } from './useTasks'

export function useTask(taskId: string) {
  return useQuery({
    queryKey: [...taskQueryKeys.all, taskId],
    queryFn: () => getTaskById(taskId),
    enabled: Boolean(taskId),
  })
}
