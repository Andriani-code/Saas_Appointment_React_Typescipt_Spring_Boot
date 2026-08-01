import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './apiClient'
import { clearAuthSession, getStoredAuthSession, storeAuthSession } from './authStorage'

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios')
  return {
    ...actual,
    default: {
      ...actual.default,
      post: vi.fn(),
    },
  }
})

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}))

vi.mock('./authStorage', () => ({
  clearAuthSession: vi.fn(),
  getStoredAuthSession: vi.fn(),
  storeAuthSession: vi.fn(),
}))

function getRejectedInterceptor() {
  const handlers = (apiClient.interceptors.response as typeof apiClient.interceptors.response & {
    handlers?: Array<{ rejected?: (error: AxiosError) => Promise<unknown> }>
  }).handlers
  const handler = handlers?.[0]
  if (!handler?.rejected) {
    throw new Error('Response interceptor not registered')
  }
  return handler.rejected
}

describe('apiClient interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a toast for server errors (5xx)', async () => {
    vi.mocked(getStoredAuthSession).mockReturnValue(null)
    const rejected = getRejectedInterceptor()
    const error = new AxiosError('Server error')
    error.config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
    error.response = {
      data: { message: 'Something went wrong' },
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: error.config,
    }

    await expect(rejected(error)).rejects.toBe(error)
    expect(toast.error).toHaveBeenCalledWith('Something went wrong')
  })

  it('does not toast for client errors (4xx) that pages handle themselves', async () => {
    vi.mocked(getStoredAuthSession).mockReturnValue(null)
    const rejected = getRejectedInterceptor()
    const error = new AxiosError('Not found')
    error.config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
    error.response = {
      data: { message: 'Client profile not found' },
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: error.config,
    }

    await expect(rejected(error)).rejects.toBe(error)
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows a generic toast when the backend is unreachable', async () => {
    vi.mocked(getStoredAuthSession).mockReturnValue(null)
    const rejected = getRejectedInterceptor()
    const error = new AxiosError('Network Error')
    error.config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
    // no error.response → network failure

    await expect(rejected(error)).rejects.toBe(error)
    expect(toast.error).toHaveBeenCalledWith(
      'Le serveur est injoignable. Vérifiez votre connexion.',
    )
  })

  it('refreshes and retries when a 401 response is received', async () => {
    vi.mocked(getStoredAuthSession).mockReturnValue({
      email: 'user@example.com',
      role: 'CLIENT',
      accessToken: 'old-access',
      refreshToken: 'refresh-token',
    })

    vi.mocked(axios.post).mockResolvedValue({
      data: {
        email: 'user@example.com',
        role: 'CLIENT',
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      },
    })

    const config = {
      url: '/secure',
      method: 'get',
      headers: new AxiosHeaders(),
    } as InternalAxiosRequestConfig & { _retry?: boolean }

    apiClient.defaults.adapter = vi.fn().mockResolvedValue({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    })

    const error = new AxiosError('Unauthorized')
    error.config = config
    error.response = {
      data: {},
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config,
    }

    await getRejectedInterceptor()(error)

    expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/refresh', {
      refreshToken: 'refresh-token',
    })
    expect(storeAuthSession).toHaveBeenCalled()
    expect(apiClient.defaults.adapter).toHaveBeenCalled()
    expect(clearAuthSession).not.toHaveBeenCalled()
  })
})
