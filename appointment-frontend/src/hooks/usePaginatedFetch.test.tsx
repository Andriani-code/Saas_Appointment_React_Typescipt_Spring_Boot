import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePaginatedFetch } from './usePaginatedFetch'

describe('usePaginatedFetch', () => {
  it('loads the first page and tracks pagination metadata', async () => {
    const fetchPage = vi.fn().mockImplementation(async (page: number) => {
      if (page === 0) {
        return {
          content: [{ id: '1' }, { id: '2' }],
          page: 0,
          size: 2,
          totalElements: 3,
          totalPages: 2,
          last: false,
        }
      }

      return {
        content: [{ id: '2' }, { id: '3' }],
        page: 1,
        size: 2,
        totalElements: 3,
        totalPages: 2,
        last: true,
      }
    })

    const { result } = renderHook(() =>
      usePaginatedFetch(fetchPage, {
        pageSize: 2,
        getItemKey: (item: { id: string }) => item.id,
      }),
    )

    await waitFor(() => expect(result.current.items.length).toBe(2))
    expect(result.current.items).toEqual([{ id: '1' }, { id: '2' }])
    expect(result.current.hasMore).toBe(true)
    expect(result.current.totalElements).toBe(3)
  })

  it('stores the error message when fetching fails', async () => {
    const fetchPage = vi.fn().mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => usePaginatedFetch(fetchPage))

    await waitFor(() => {
      expect(result.current.error).toBe('boom')
      expect(result.current.loading).toBe(false)
    })
  })
})
