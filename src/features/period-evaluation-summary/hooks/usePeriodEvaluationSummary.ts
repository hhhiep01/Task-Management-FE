import { useQuery } from '@tanstack/react-query'

import {
  getPeriodEvaluationSummary,
  type PeriodEvaluationSummaryQuery,
} from '../api/periodEvaluationSummaryApi'

export const periodEvaluationSummaryQueryKeys = {
  all: ['period-evaluation-summary'] as const,
  summary: (periodId: string, query: PeriodEvaluationSummaryQuery) =>
    [...periodEvaluationSummaryQueryKeys.all, periodId, query] as const,
}

export function usePeriodEvaluationSummary(
  periodId: string,
  query: PeriodEvaluationSummaryQuery,
) {
  return useQuery({
    queryKey: periodEvaluationSummaryQueryKeys.summary(periodId, query),
    queryFn: ({ signal }) => getPeriodEvaluationSummary(periodId, query, signal),
    enabled: Boolean(periodId),
    placeholderData: (previousData) => previousData,
  })
}
