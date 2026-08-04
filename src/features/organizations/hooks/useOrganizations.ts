import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createOrganization,
  deleteOrganization,
  getOrganizations,
  updateOrganization,
} from '../api/organizationApi'
import type { OrganizationPayload } from '../types/organization.types'

export const organizationQueryKeys = {
  all: ['organizations'] as const,
}

export function useOrganizations() {
  return useQuery({
    queryKey: organizationQueryKeys.all,
    queryFn: getOrganizations,
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all })
    },
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      organizationId,
      payload,
    }: {
      organizationId: string
      payload: OrganizationPayload
    }) => updateOrganization(organizationId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all })
    },
  })
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all })
    },
  })
}
