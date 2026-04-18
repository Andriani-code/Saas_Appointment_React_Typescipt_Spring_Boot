import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { AuthUser, Role } from '@/types'

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (user: AuthUser) => void
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const accessToken  = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    const email        = localStorage.getItem('userEmail')
    const role         = localStorage.getItem('userRole') as Role | null

    if (accessToken && refreshToken && email && role) {
      setUser({ accessToken, refreshToken, email, role })
    }
  }, [])

  const login = (authUser: AuthUser) => {
    localStorage.setItem('accessToken',  authUser.accessToken)
    localStorage.setItem('refreshToken', authUser.refreshToken)
    localStorage.setItem('userEmail',    authUser.email)
    localStorage.setItem('userRole',     authUser.role)
    setUser(authUser)
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  const hasRole = (...roles: Role[]) => {
    return user ? roles.includes(user.role) : false
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
