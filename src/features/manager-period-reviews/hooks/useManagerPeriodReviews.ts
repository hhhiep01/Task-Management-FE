import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getManagerPeriodReview,
  getPeriodReviewEmployees,
  updateManagerPeriodReview,
} from '../api/managerPeriodReviewApi'
import type { UpdateManagerPeriodReviewRequest } from '../types/managerPeriodReview.types'

export const managerPeriodReviewQueryKeys = {
  all: ['manager-period-reviews'] as const,
  employees: (periodId: string) =>
    [...managerPeriodReviewQueryKeys.all, 'employees', periodId] as const,
  detail: (periodId: string, userId: string) =>
    [...managerPeriodReviewQueryKeys.all, 'detail', periodId, userId] as const,
}

export function usePeriodReviewEmployees(periodId: string) {
  return useQuery({
    queryKey: managerPeriodReviewQueryKeys.employees(periodId),
    queryFn: ({ signal }) => getPeriodReviewEmployees(periodId, signal),
    enabled: Boolean(periodId),
  })
}

export function useManagerPeriodReview(periodId: string, userId: string) {
  return useQuery({
    queryKey: managerPeriodReviewQueryKeys.detail(periodId, userId),
    queryFn: ({ signal }) => getManagerPeriodReview(periodId, userId, signal),
    enabled: Boolean(periodId && userId),
  })
}

export function useUpdateManagerPeriodReview(periodId: string, userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateManagerPeriodReviewRequest) =>
      updateManagerPeriodReview(periodId, userId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: managerPeriodReviewQueryKeys.detail(periodId, userId),
      })
      void queryClient.refetchQueries({
        queryKey: managerPeriodReviewQueryKeys.employees(periodId),
        type: 'all',
      })
    },
  })
}
