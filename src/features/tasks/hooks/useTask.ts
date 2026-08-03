import { useQuery } from '@tanstack/react-query'

import { getTaskById } from '../api/taskApi'

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => getTaskById(taskId),
    enabled: Boolean(taskId),
  })
}
