import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { PaginationQuery } from '@/types/api'

import { useDebouncedValue } from './useDebouncedValue'

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100

function parsePositiveInteger(value: string | null, fallback: number, maximum?: number) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || (maximum && parsed > maximum)) {
    return fallback
  }
  return parsed
}

export function usePagedListState<const TKey extends string>(filterKeys: readonly TKey[]) {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlSearch = searchParams.get('search') ?? ''
  const [searchInput, setSearchInput] = useState(urlSearch)
  const debouncedSearch = useDebouncedValue(searchInput.trim())
  const previousDebouncedSearch = useRef(debouncedSearch)
  const pageNumber = parsePositiveInteger(searchParams.get('pageNumber'), 1)
  const pageSize = parsePositiveInteger(
    searchParams.get('pageSize'),
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  )

  useEffect(() => {
    setSearchInput(urlSearch)
  }, [urlSearch])

  useEffect(() => {
    if (debouncedSearch === previousDebouncedSearch.current) return
    previousDebouncedSearch.current = debouncedSearch
    if (debouncedSearch === urlSearch) return

    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('pageNumber', '1')
      if (debouncedSearch) next.set('search', debouncedSearch)
      else next.delete('search')
      return next
    }, { replace: true })
  }, [debouncedSearch, setSearchParams, urlSearch])

  const filters = useMemo(
    () =>
      Object.fromEntries(filterKeys.map((key) => [key, searchParams.get(key) ?? ''])) as Record<
        TKey,
        string
      >,
    [filterKeys, searchParams],
  )

  const setFilter = useCallback(
    (key: TKey, value: string) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        next.set('pageNumber', '1')
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      })
    },
    [setSearchParams],
  )

  const setPageNumber = useCallback(
    (value: number) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        next.set('pageNumber', String(Math.max(1, value)))
        return next
      })
    },
    [setSearchParams],
  )

  const setPageSize = useCallback(
    (value: number) => {
      const safeValue = Math.min(MAX_PAGE_SIZE, Math.max(1, value))
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        next.set('pageNumber', '1')
        next.set('pageSize', String(safeValue))
        return next
      })
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchInput('')
    setSearchParams((current) => {
      const next = new URLSearchParams()
      next.set('pageNumber', '1')
      next.set('pageSize', current.get('pageSize') ?? String(DEFAULT_PAGE_SIZE))
      return next
    })
  }, [setSearchParams])

  const query: PaginationQuery & Record<TKey, string | undefined> = {
    pageNumber,
    pageSize,
    search: urlSearch || undefined,
    ...Object.fromEntries(
      filterKeys.map((key) => [key, filters[key] || undefined]),
    ) as Record<TKey, string | undefined>,
  }

  return {
    query,
    filters,
    searchInput,
    setSearchInput,
    setFilter,
    setPageNumber,
    setPageSize,
    clearFilters,
    hasActiveFilters: Boolean(urlSearch || filterKeys.some((key) => filters[key])),
  }
}
