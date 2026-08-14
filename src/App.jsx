import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import { getRoleHome } from './auth/roleHome'
import Login from './pages/Login'
import OperatorLayout from './pages/operator/OperatorLayout'
import OperatorDashboard from './pages/operator/OperatorDashboard'
import ReceptionForm from './pages/operator/ReceptionForm'
import InspectionList from './pages/operator/InspectionList'
import InspectionWizard from './pages/operator/InspectionWizard'
import VehicleDelivery from './pages/operator/VehicleDelivery'
import InspectionReport from './pages/operator/InspectionReport'
import WalkIn from './pages/operator/WalkIn'
import FR25Print from './pages/operator/FR25Print'
import AdminLayout from './pages/admin/AdminLayout'
import RTMDashboard from './pages/admin/RTMDashboard'
import Reportes from './pages/admin/Reportes'
import Bitacora from './pages/admin/Bitacora'
import Campaigns from './pages/admin/Campaigns'
import Usuarios from './pages/admin/Usuarios'
import Perfil from './pages/shared/Perfil'
import CambiarContrasena from './pages/shared/CambiarContrasena'

const OPERATOR_ROLES = ['operator', 'inspector', 'supervisor', 'admin']
const ADMIN_ROLES    = ['supervisor', 'admin']

function RoleRedirect() {
  const { user, ready } = useAuth()
  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={getRoleHome(user.role)} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"            element={<Login />} />
      <Route path="/cambiar-contrasena" element={<CambiarContrasena />} />

      {/* Portal Operador / Inspector */}
      <Route
        path="/operacion"
        element={
          <ProtectedRoute allowedRoles={OPERATOR_ROLES}>
            <OperatorLayout />
          </ProtectedRoute>
        }
      >
        <Route index                           element={<OperatorDashboard />} />
        <Route path="walk-in"                  element={<WalkIn />} />
        <Route path="recepcion/:appointmentId" element={<ReceptionForm />} />
        <Route path="inspecciones"             element={<InspectionList />} />
        <Route path="inspecciones/:id"         element={<InspectionWizard />} />
        <Route path="inspecciones/:id/reporte" element={<InspectionReport />} />
        <Route path="entrega/:appointmentId"   element={<VehicleDelivery />} />
        <Route path="fr25/:receptionId"        element={<FR25Print />} />
        <Route path="perfil"                   element={<Perfil />} />
      </Route>

      {/* Portal Admin / Supervisor */}
      <Route
        path="/admin-panel"
        element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index                    element={<RTMDashboard />} />
        <Route path="reportes"          element={<Reportes />} />
        <Route path="campanas"          element={<Campaigns />} />
        <Route path="bitacora"          element={<Bitacora />} />
        <Route path="usuarios"          element={<Usuarios />} />
        <Route path="perfil"            element={<Perfil />} />
      </Route>

      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
