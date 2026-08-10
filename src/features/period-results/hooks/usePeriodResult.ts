import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getMyPeriodResult,
  submitPeriodResult,
  updateSelfProposal,
} from '../api/periodResultApi'
import type { SelfProposalRequest } from '../types/periodResult.types'

export const periodResultQueryKeys = {
  all: ['period-results'] as const,
  myResult: (periodId: string) => [...periodResultQueryKeys.all, 'my-result', periodId] as const,
}

export function useMyPeriodResult(periodId: string) {
  return useQuery({
    queryKey: periodResultQueryKeys.myResult(periodId),
    queryFn: ({ signal }) => getMyPeriodResult(periodId, signal),
    enabled: Boolean(periodId),
  })
}

export function useUpdateSelfProposal(periodId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SelfProposalRequest) => updateSelfProposal(periodId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: periodResultQueryKeys.myResult(periodId),
      })
    },
  })
}

export function useSubmitPeriodResult(periodId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => submitPeriodResult(periodId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: periodResultQueryKeys.myResult(periodId),
      })
    },
  })
}
