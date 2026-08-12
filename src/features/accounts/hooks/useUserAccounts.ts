import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createUserAccount,
  deleteUserAccount,
  getUserAccounts,
  resetUserPassword,
  updateUserAccount,
} from '../api/userAccountApi'
import type { UserAccountQuery } from '../api/userAccountApi'
import type {
  CreateUserAccountRequest,
  ResetPasswordRequest,
  UpdateUserAccountRequest,
} from '../types/account.types'

export const userAccountQueryKeys = {
  all: ['user-accounts'] as const,
}

export function useUserAccounts(query: UserAccountQuery = { pageNumber: 1, pageSize: 100 }) {
  return useQuery({
    queryKey: [...userAccountQueryKeys.all, query],
    queryFn: ({ signal }) => getUserAccounts(query, signal),
    placeholderData: (previousData) => previousData,
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

export function useResetUserPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      accountId,
      payload,
    }: {
      accountId: string
      payload: ResetPasswordRequest
    }) => resetUserPassword(accountId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userAccountQueryKeys.all })
    },
  })
}

export type CreateAccountMutationPayload = CreateUserAccountRequest
