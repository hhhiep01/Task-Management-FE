import { unwrapApiResponse } from '@/services/apiResponse'
import { httpClient } from '@/services/httpClient'
import type { ApiResponse, PagedResult, PaginationQuery } from '@/types/api'
import { buildQueryParams } from '@/utils/queryString'

import type {
  CreateUserAccountRequest,
  ResetPasswordRequest,
  UpdateUserAccountRequest,
  UserAccount,
} from '../types/account.types'

export const userAccountApiLinks = {
  list: '/api/UserAccount',
  create: '/api/UserAccount',
  detail: (accountId: string) => `/api/UserAccount/${accountId}`,
  update: (accountId: string) => `/api/UserAccount/${accountId}`,
  delete: (accountId: string) => `/api/UserAccount/${accountId}`,
  resetPassword: (accountId: string) => `/api/UserAccount/${accountId}/reset-password`,
}

export type UserAccountQuery = PaginationQuery & {
  roleId?: string
  organizationId?: string
}

export type GetUserAccountsResponse = ApiResponse<PagedResult<UserAccount>>
export type GetUserAccountByIdResponse = ApiResponse<UserAccount>
export type CreateUserAccountResponse = ApiResponse<UserAccount>
export type UpdateUserAccountResponse = ApiResponse<UserAccount>
export type DeleteUserAccountResponse = ApiResponse<null>
export type ResetUserPasswordResponse = ApiResponse<unknown>

export async function getUserAccounts(query: UserAccountQuery, signal?: AbortSignal) {
  const response = await httpClient.get<GetUserAccountsResponse>(userAccountApiLinks.list, {
    params: buildQueryParams(query),
    signal,
  })
  return unwrapApiResponse(response.data)
}

export async function getUserAccountById(accountId: string): Promise<UserAccount> {
  const response = await httpClient.get<GetUserAccountByIdResponse>(
    userAccountApiLinks.detail(accountId),
  )
  return unwrapApiResponse(response.data)
}

export async function createUserAccount(
  payload: CreateUserAccountRequest,
): Promise<UserAccount> {
  const response = await httpClient.post<CreateUserAccountResponse>(
    userAccountApiLinks.create,
    payload,
  )
  return unwrapApiResponse(response.data)
}

export async function updateUserAccount(
  accountId: string,
  payload: UpdateUserAccountRequest,
): Promise<UserAccount> {
  const response = await httpClient.put<UpdateUserAccountResponse>(
    userAccountApiLinks.update(accountId),
    payload,
  )
  return unwrapApiResponse(response.data)
}

export async function deleteUserAccount(accountId: string): Promise<null> {
  const response = await httpClient.delete<DeleteUserAccountResponse>(
    userAccountApiLinks.delete(accountId),
  )
  return unwrapApiResponse(response.data)
}

export async function resetUserPassword(
  accountId: string,
  payload: ResetPasswordRequest,
): Promise<unknown> {
  const response = await httpClient.post<ResetUserPasswordResponse>(
    userAccountApiLinks.resetPassword(accountId),
    payload,
  )
  return unwrapApiResponse(response.data)
}
