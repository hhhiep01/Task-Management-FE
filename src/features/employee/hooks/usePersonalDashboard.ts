import { useQuery } from '@tanstack/react-query'

import { getPersonalAttentionTasks, getPersonalDashboardOverview } from '../api/personalDashboardApi'
import type { PersonalDashboardQuery } from '../api/personalDashboardApi'

export const personalDashboardQueryKeys = {
  all: ['personal-dashboard'] as const,
  overview: (periodId: string) => [...personalDashboardQueryKeys.all, 'overview', periodId] as const,
  attentionTasks: (periodId: string) => [...personalDashboardQueryKeys.all, 'attention-tasks', periodId] as const,
}

export function usePersonalDashboardOverview(query: PersonalDashboardQuery) {
  const periodId = query.periodId ?? ''

  return useQuery({
    queryKey: personalDashboardQueryKeys.overview(periodId),
    queryFn: ({ signal }) => getPersonalDashboardOverview(query, signal),
  })
}

export function usePersonalAttentionTasks(query: PersonalDashboardQuery & { limit?: number } = {}) {
  const periodId = query.periodId ?? ''

  return useQuery({
    queryKey: personalDashboardQueryKeys.attentionTasks(periodId),
    queryFn: ({ signal }) => getPersonalAttentionTasks(query, signal),
  })
}
