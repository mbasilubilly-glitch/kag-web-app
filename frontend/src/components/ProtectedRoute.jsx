import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

// Frontend mirrors backend admin checks; backend must still enforce.
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}


