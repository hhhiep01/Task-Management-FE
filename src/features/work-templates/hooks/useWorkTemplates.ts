import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createWorkTemplate,
  deleteWorkTemplate,
  getWorkTemplates,
  updateWorkTemplate,
} from '../api/workTemplateApi'
import type { WorkTemplateQuery } from '../api/workTemplateApi'
import type { WorkTemplatePayload } from '../types/workTemplate.types'

export const workTemplateQueryKeys = {
  all: ['work-templates'] as const,
}

export function useWorkTemplates(query: WorkTemplateQuery = { pageNumber: 1, pageSize: 100 }) {
  return useQuery({
    queryKey: [...workTemplateQueryKeys.all, query],
    queryFn: ({ signal }) => getWorkTemplates(query, signal),
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateWorkTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workTemplateQueryKeys.all })
    },
  })
}

export function useUpdateWorkTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      templateId,
      payload,
    }: {
      templateId: string
      payload: WorkTemplatePayload
    }) => updateWorkTemplate(templateId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workTemplateQueryKeys.all })
    },
  })
}

export function useDeleteWorkTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWorkTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workTemplateQueryKeys.all })
    },
  })
}
