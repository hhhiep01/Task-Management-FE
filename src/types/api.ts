export type ApiResponse<TData> = {
  statusCode: number | string
  isSuccess: boolean
  errorMessage?: string | null
  result: TData
}

export type PaginatedResponse<TItem> = {
  items: TItem[]
  page: number
  pageSize: number
  total: number
}
