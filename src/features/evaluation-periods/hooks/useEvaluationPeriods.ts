import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createEvaluationPeriod,
  deleteEvaluationPeriod,
  getEvaluationPeriods,
  updateEvaluationPeriod,
} from '../api/evaluationPeriodApi'
import type { EvaluationPeriodQuery } from '../api/evaluationPeriodApi'
import type { EvaluationPeriodPayload } from '../types/evaluationPeriod.types'

export const evaluationPeriodQueryKeys = {
  all: ['evaluation-periods'] as const,
}

export function useEvaluationPeriods(query: EvaluationPeriodQuery = { pageNumber: 1, pageSize: 100 }) {
  return useQuery({
    queryKey: [...evaluationPeriodQueryKeys.all, query],
    queryFn: ({ signal }) => getEvaluationPeriods(query, signal),
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateEvaluationPeriod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEvaluationPeriod,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: evaluationPeriodQueryKeys.all })
    },
  })
}

export function useUpdateEvaluationPeriod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      periodId,
      payload,
    }: {
      periodId: string
      payload: EvaluationPeriodPayload
    }) => updateEvaluationPeriod(periodId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: evaluationPeriodQueryKeys.all })
    },
  })
}

export function useDeleteEvaluationPeriod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteEvaluationPeriod,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: evaluationPeriodQueryKeys.all })
    },
  })
}
