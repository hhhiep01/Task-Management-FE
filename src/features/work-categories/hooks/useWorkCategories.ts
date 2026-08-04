import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createWorkCategory,
  deleteWorkCategory,
  getWorkCategories,
  updateWorkCategory,
} from '../api/workCategoryApi'
import type { WorkCategoryPayload } from '../types/workCategory.types'

export const workCategoryQueryKeys = {
  all: ['work-categories'] as const,
}

export function useWorkCategories() {
  return useQuery({
    queryKey: workCategoryQueryKeys.all,
    queryFn: getWorkCategories,
  })
}

export function useCreateWorkCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workCategoryQueryKeys.all })
    },
  })
}

export function useUpdateWorkCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      categoryId,
      payload,
    }: {
      categoryId: string
      payload: WorkCategoryPayload
    }) => updateWorkCategory(categoryId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workCategoryQueryKeys.all })
    },
  })
}

export function useDeleteWorkCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWorkCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workCategoryQueryKeys.all })
    },
  })
}
