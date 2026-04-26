import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import {
  clearAuthSession,
  getStoredAuthSession,
  storeAuthSession,
} from './authStorage'

const BASE_URL = '/api/v1'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const session = getStoredAuthSession()

  if (session?.accessToken) {
    config.headers.set('Authorization', `Bearer ${session.accessToken}`)
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const session = getStoredAuthSession()

    if (error.response?.status === 401 && !original?._retry && session?.refreshToken) {
      original._retry = true

      try {
        const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: session.refreshToken,
        })

        storeAuthSession({
          email: refreshResponse.data.email,
          role: refreshResponse.data.role,
          accessToken: refreshResponse.data.accessToken,
          refreshToken: refreshResponse.data.refreshToken,
        })

        return apiClient(original)
      } catch {
        clearAuthSession()
        window.location.href = '/login'
      }
    }

    const errorData = error.response?.data as { message?: string } | undefined
    const errMsg = errorData?.message || error.message
    toast.error(errMsg)
    return Promise.reject(error)
  }
)

export default apiClient
