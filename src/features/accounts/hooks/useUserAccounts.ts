import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createUserAccount,
  deleteUserAccount,
  getUserAccounts,
  updateUserAccount,
} from '../api/userAccountApi'
import type { CreateUserAccountRequest, UpdateUserAccountRequest } from '../types/account.types'

export const userAccountQueryKeys = {
  all: ['user-accounts'] as const,
}

export function useUserAccounts() {
  return useQuery({
    queryKey: userAccountQueryKeys.all,
    queryFn: getUserAccounts,
  })
}

export function useCreateUserAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUserAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userAccountQueryKeys.all })
    },
  })
}

export function useUpdateUserAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      accountId,
      payload,
    }: {
      accountId: string
      payload: UpdateUserAccountRequest
    }) => updateUserAccount(accountId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userAccountQueryKeys.all })
    },
  })
}

export function useDeleteUserAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteUserAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userAccountQueryKeys.all })
    },
  })
}

export type CreateAccountMutationPayload = CreateUserAccountRequest
