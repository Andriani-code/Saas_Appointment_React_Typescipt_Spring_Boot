import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { MainLayout } from '@/layouts/MainLayout'

import { LoginPage }        from '@/pages/LoginPage'
import { RegisterPage }     from '@/pages/RegisterPage'
import { DashboardPage }    from '@/pages/DashboardPage'
import { SpecialistsPage }  from '@/pages/SpecialistsPage'
import { SpecialistDetail } from '@/pages/SpecialistDetail'
import { AppointmentsPage } from '@/pages/AppointmentsPage'
import { MessagesPage }     from '@/pages/MessagesPage'
import { SettingsPage }     from '@/pages/SettingsPage'
import { ProfilePage }      from '@/pages/ProfilePage'
import { NotFoundPage }     from '@/pages/NotFoundPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected */}
      <Route path="/" element={
        <PrivateRoute>
          <MainLayout>
            <Routes>
              <Route index element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </MainLayout>
        </PrivateRoute>
      } />

      <Route path="/dashboard" element={
        <PrivateRoute>
          <MainLayout><DashboardPage /></MainLayout>
        </PrivateRoute>
      } />
      <Route path="/specialists" element={
        <PrivateRoute>
          <MainLayout><SpecialistsPage /></MainLayout>
        </PrivateRoute>
      } />
      <Route path="/specialists/:id" element={
        <PrivateRoute>
          <MainLayout><SpecialistDetail /></MainLayout>
        </PrivateRoute>
      } />
      <Route path="/appointments" element={
        <PrivateRoute>
          <MainLayout><AppointmentsPage /></MainLayout>
        </PrivateRoute>
      } />
      <Route path="/messages" element={
        <PrivateRoute>
          <MainLayout><MessagesPage /></MainLayout>
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <MainLayout><ProfilePage /></MainLayout>
        </PrivateRoute>
      } />
      <Route path="/settings" element={
        <PrivateRoute>
          <MainLayout><SettingsPage /></MainLayout>
        </PrivateRoute>
      } />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
