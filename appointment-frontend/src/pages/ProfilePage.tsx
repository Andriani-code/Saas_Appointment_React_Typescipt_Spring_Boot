import { Navigate } from 'react-router-dom'

// Profile is managed via Settings page
export function ProfilePage() {
  return <Navigate to="/settings" replace />
}
