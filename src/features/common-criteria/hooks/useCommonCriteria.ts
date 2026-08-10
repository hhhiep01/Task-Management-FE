import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createCommonCriterion,
  deleteCommonCriterion,
  getCommonCriteria,
  updateCommonCriterion,
} from '../api/commonCriterionApi'
import type { CommonCriterionQuery } from '../api/commonCriterionApi'
import type { CommonCriterionPayload } from '../types/commonCriterion.types'

export const commonCriterionQueryKeys = {
  all: ['common-criteria'] as const,
}

export function useCommonCriteria(
  query: CommonCriterionQuery = { pageNumber: 1, pageSize: 100 },
  enabled = true,
) {
  return useQuery({
    queryKey: [...commonCriterionQueryKeys.all, query],
    queryFn: ({ signal }) => getCommonCriteria(query, signal),
    placeholderData: (previousData) => previousData,
    enabled,
  })
}

export function useCreateCommonCriterion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCommonCriterion,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commonCriterionQueryKeys.all })
    },
  })
}

export function useUpdateCommonCriterion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      criterionId,
      payload,
    }: {
      criterionId: string
      payload: CommonCriterionPayload
    }) => updateCommonCriterion(criterionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commonCriterionQueryKeys.all })
    },
  })
}

export function useDeleteCommonCriterion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCommonCriterion,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commonCriterionQueryKeys.all })
    },
  })
}
