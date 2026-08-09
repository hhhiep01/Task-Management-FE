export type ApiResponse<TData> = {
  statusCode: number | string
  isSuccess: boolean
  errorMessage?: string | null
  result: TData
}

export type PagedResult<TItem> = {
  items: TItem[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export type PaginationQuery = {
  pageNumber: number
  pageSize: number
  search?: string
}
