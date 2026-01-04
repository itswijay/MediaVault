import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export const ProtectedRoute = ({
  children,
  adminOnly = false,
}: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth()

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if admin access is required
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
