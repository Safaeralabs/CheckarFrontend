import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './state/useAuth'
import { AccessPage } from './pages/AccessPage'
import { CustomerPortalPage } from './pages/CustomerPortalPage'
import { OperationsPortalPage } from './pages/OperationsPortalPage'
import { AdminPortalPage } from './pages/AdminPortalPage'

function ProtectedRoute({ children, allow }) {
  const { user, ready } = useAuth()

  if (!ready) {
    return <div className="screen-loader">Cargando experiencia Checkar...</div>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to={defaultRouteByRole(user.role)} replace />
  }

  return children
}

function defaultRouteByRole(role) {
  if (role === 'customer') return '/cliente'
  if (role === 'admin') return '/admin'
  return '/operacion'
}

export default function App() {
  const { user, ready } = useAuth()

  if (!ready) {
    return <div className="screen-loader">Sincronizando acceso...</div>
  }

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to={defaultRouteByRole(user.role)} replace /> : <AccessPage />}
      />
      <Route
        path="/cliente"
        element={
          <ProtectedRoute allow={['customer']}>
            <CustomerPortalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operacion"
        element={
          <ProtectedRoute allow={['operator', 'inspector', 'supervisor']}>
            <OperationsPortalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allow={['admin', 'supervisor']}>
            <AdminPortalPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
