import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import {
  clearAuthSession,
  getStoredAuthSession,
  storeAuthSession,
} from './authStorage'
import type { Role } from '@/types'

// Allow requests to opt out of the global error toast: apiClient.get(url, { silent: true })
declare module 'axios' {
  export interface AxiosRequestConfig {
    silent?: boolean
  }
}

const BASE_URL = '/api/v1'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  silent?: boolean
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const session = getStoredAuthSession()

  if (session?.accessToken) {
    config.headers.set('Authorization', `Bearer ${session.accessToken}`)
  }

  return config
})

// Single-flight token refresh: if several requests 401 at the same time,
// only one refresh call is sent and the others wait for it.
let refreshInFlight: Promise<boolean> | null = null
let lastNetworkToastAt = 0

function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight
  }

  const session = getStoredAuthSession()
  if (!session?.refreshToken) {
    return Promise.resolve(false)
  }

  refreshInFlight = axios
    .post<{
      email: string
      role: Role
      userId?: string
      accessToken: string
      refreshToken: string
    }>(`${BASE_URL}/auth/refresh`, {
      refreshToken: session.refreshToken,
    })
    .then((refreshResponse) => {
      storeAuthSession({
        email: refreshResponse.data.email,
        role: refreshResponse.data.role,
        userId: refreshResponse.data.userId,
        accessToken: refreshResponse.data.accessToken,
        refreshToken: refreshResponse.data.refreshToken,
      })
      return true
    })
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null
    })

  return refreshInFlight
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequestConfig | undefined
    const status = error.response?.status

    // Token expired → refresh once and retry the original request
    if (status === 401 && original && !original._retry) {
      original._retry = true
      const refreshed = await refreshAccessToken()

      if (refreshed) {
        return apiClient(original)
      }

      // Refresh failed → session is over. Avoid redirect loops when we are
      // already on the login page.
      clearAuthSession()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    // Only surface errors the UI cannot meaningfully handle:
    //  - no HTTP response (network failure / backend down)
    //  - server errors (5xx)
    // Expected client errors (4xx) are handled by the pages themselves
    // (they often silently catch 404s such as "profile not found").
    // Requests marked `silent` never toast.
    const showToast = !original?.silent && (status === undefined || status >= 500)

    if (showToast) {
      const message = (error.response?.data as { message?: string } | undefined)?.message
      if (message) {
        toast.error(message)
      } else if (status === undefined) {
        // Throttle: several parallel requests fail at once when the backend
        // is down — one toast is enough.
        const now = Date.now()
        if (now - lastNetworkToastAt > 5000) {
          lastNetworkToastAt = now
          toast.error('Le serveur est injoignable. Vérifiez votre connexion.')
        }
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
