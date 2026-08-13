import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { getRoleHome } from './roleHome'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, ready, isAuthenticated } = useAuth()

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (user?.must_change_password) return <Navigate to="/cambiar-contrasena" replace />

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getRoleHome(user?.role)} replace />
  }

  return children
}
