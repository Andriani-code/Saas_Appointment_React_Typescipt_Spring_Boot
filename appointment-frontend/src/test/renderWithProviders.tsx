import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types'

interface RenderOptions {
  role?: Role
  email?: string
  route?: string
}

export function renderWithProviders(
  ui: ReactElement,
  { role = 'CLIENT', email = 'user@example.com', route = '/' }: RenderOptions = {},
) {
  window.localStorage.clear()
  window.localStorage.setItem('userEmail', email)
  window.localStorage.setItem('userRole', role)

  // Directly set the auth store state for tests
  useAuthStore.setState({
    user: { email, role, profileCompleted: true },
    isAuthenticated: true,
  })

  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>,
  )
}
