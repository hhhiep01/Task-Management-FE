import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createRole, deleteRole, getRoles, updateRole } from '../api/roleApi'
import type { RolePayload } from '../types/role.types'

export const roleQueryKeys = {
  all: ['roles'] as const,
}

export function useRoles() {
  return useQuery({
    queryKey: roleQueryKeys.all,
    queryFn: getRoles,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: string; payload: RolePayload }) =>
      updateRole(roleId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
    },
  })
}
