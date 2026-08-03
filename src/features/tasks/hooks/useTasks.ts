import { useQuery } from '@tanstack/react-query'

import { getTasks } from '../api/taskApi'

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: getTasks,
  })
}
