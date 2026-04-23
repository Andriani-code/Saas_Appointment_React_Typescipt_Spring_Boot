import type { Role } from '@/types'

const EMAIL_KEY = 'userEmail'
const ROLE_KEY = 'userRole'
const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

export interface StoredAuthSession {
  email: string
  role: Role
  accessToken?: string
  refreshToken?: string
}

export function getStoredAuthSession(): StoredAuthSession | null {
  const email = localStorage.getItem(EMAIL_KEY)
  const role = localStorage.getItem(ROLE_KEY) as Role | null

  if (!email || !role) {
    return null
  }

  return {
    email,
    role,
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined,
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined,
  }
}

export function storeAuthSession(session: StoredAuthSession) {
  localStorage.setItem(EMAIL_KEY, session.email)
  localStorage.setItem(ROLE_KEY, session.role)

  if (session.accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken)
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }

  if (session.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export function clearAuthSession() {
  localStorage.removeItem(EMAIL_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}
