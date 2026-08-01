import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PageResponse } from '@/types'

interface UsePaginatedFetchOptions<T> {
  enabled?: boolean
  pageSize?: number
  deps?: readonly unknown[]
  getItemKey?: (item: T) => string
}

interface UsePaginatedFetchResult<T> {
  items: T[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  page: number
  totalPages: number
  totalElements: number
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  reset: () => void
  setItems: Dispatch<SetStateAction<T[]>>
}

function mergePageItems<T>(current: T[], incoming: T[], getItemKey?: (item: T) => string) {
  if (!getItemKey) {
    return [...current, ...incoming]
  }

  const items = new Map<string, T>()
  current.forEach((item) => items.set(getItemKey(item), item))
  incoming.forEach((item) => items.set(getItemKey(item), item))
  return Array.from(items.values())
}

export function usePaginatedFetch<T>(
  fetchPage: (page: number, size: number) => Promise<PageResponse<T>>,
  {
    enabled = true,
    pageSize = 20,
    deps = [],
    getItemKey,
  }: UsePaginatedFetchOptions<T> = {},
): UsePaginatedFetchResult<T> {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(enabled)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // Guards against concurrent fetches so loading never gets stuck
  const fetchingRef = useRef(false)
  const pageRef = useRef(0)
  const hasMoreRef = useRef(false)

  // Keep the latest fetchPage in a ref so the effect below doesn't re-run
  // on every render (fetchPage is often defined inline by callers).
  const fetchPageRef = useRef(fetchPage)
  useEffect(() => {
    fetchPageRef.current = fetchPage
  }, [fetchPage])

  const loadPage = useCallback(async (targetPage: number, append: boolean) => {
    if (!enabled) {
      setItems([])
      setLoading(false)
      setLoadingMore(false)
      setError(null)
      setPage(0)
      setTotalPages(0)
      setTotalElements(0)
      setHasMore(false)
      return
    }

    // Prevent concurrent non-append (refresh) fetches
    if (!append && fetchingRef.current) {
      return
    }
    fetchingRef.current = true

    setError(null)
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const response = await fetchPageRef.current(targetPage, pageSize)
      setItems((current) =>
        append ? mergePageItems(current, response.content, getItemKey) : response.content,
      )
      setPage(response.page)
      pageRef.current = response.page
      setTotalPages(response.totalPages)
      setTotalElements(response.totalElements)
      setHasMore(!response.last)
      hasMoreRef.current = !response.last
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load data')
      if (!append) {
        setItems([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      fetchingRef.current = false
    }
  }, [enabled, pageSize])

  const refresh = useCallback(async () => {
    await loadPage(0, false)
  }, [loadPage])

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMoreRef.current) {
      return
    }

    await loadPage(pageRef.current + 1, true)
  }, [loadPage])

  const reset = useCallback(() => {
    setItems([])
    setLoading(enabled)
    setLoadingMore(false)
    setError(null)
    setPage(0)
    pageRef.current = 0
    setTotalPages(0)
    setTotalElements(0)
    setHasMore(false)
    hasMoreRef.current = false
    fetchingRef.current = false
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      setLoadingMore(false)
      return
    }
    void refresh().catch(() => undefined)
  }, [refresh, enabled, ...deps])

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    page,
    totalPages,
    totalElements,
    loadMore,
    refresh,
    reset,
    setItems,
  }
}
