import type { Role } from '@/types'

const EMAIL_KEY = 'userEmail'
const ROLE_KEY = 'userRole'
const PROFILE_COMPLETED_KEY = 'profileCompleted'
const USER_ID_KEY = 'userId'
const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

export interface StoredAuthSession {
  email: string
  role: Role
  profileCompleted?: boolean
  userId?: string
  accessToken?: string
  refreshToken?: string
}

export function getStoredAuthSession(): StoredAuthSession | null {
  const email = localStorage.getItem(EMAIL_KEY)
  const role = localStorage.getItem(ROLE_KEY) as Role | null
  const profileCompletedStr = localStorage.getItem(PROFILE_COMPLETED_KEY)

  if (!email || !role) {
    return null
  }

  return {
    email,
    role,
    profileCompleted: profileCompletedStr ? profileCompletedStr === 'true' : undefined,
    userId: localStorage.getItem(USER_ID_KEY) ?? undefined,
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined,
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined,
  }
}

export function storeAuthSession(session: StoredAuthSession) {
  localStorage.setItem(EMAIL_KEY, session.email)
  localStorage.setItem(ROLE_KEY, session.role)

  if (session.profileCompleted !== undefined) {
    localStorage.setItem(PROFILE_COMPLETED_KEY, String(session.profileCompleted))
  } else {
    localStorage.removeItem(PROFILE_COMPLETED_KEY)
  }

  if (session.userId) {
    localStorage.setItem(USER_ID_KEY, session.userId)
  } else {
    localStorage.removeItem(USER_ID_KEY)
  }

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
  localStorage.removeItem(PROFILE_COMPLETED_KEY)
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}
