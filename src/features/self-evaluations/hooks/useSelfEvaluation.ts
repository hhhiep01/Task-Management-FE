import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getSelfEvaluation,
  updateSelfEvaluation,
} from '../api/selfEvaluationApi'
import type { UpdateSelfEvaluationRequest } from '../types/selfEvaluation.types'

export const selfEvaluationQueryKeys = {
  all: ['self-evaluation'] as const,
  detail: (periodId: string) => [...selfEvaluationQueryKeys.all, periodId] as const,
}

export function useSelfEvaluation(periodId: string) {
  return useQuery({
    queryKey: selfEvaluationQueryKeys.detail(periodId),
    queryFn: ({ signal }) => getSelfEvaluation(periodId, signal),
    enabled: Boolean(periodId),
  })
}

export function useUpdateSelfEvaluation(periodId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateSelfEvaluationRequest) =>
      updateSelfEvaluation(periodId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: selfEvaluationQueryKeys.detail(periodId),
      })
    },
  })
}
