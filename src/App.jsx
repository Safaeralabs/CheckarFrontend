import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import RegistroPublico from './pages/RegistroPublico'
import CustomerLayout from './pages/customer/CustomerLayout'
import Dashboard from './pages/customer/Dashboard'
import VehicleList from './pages/customer/VehicleList'
import AppointmentNew from './pages/customer/AppointmentNew'
import AppointmentList from './pages/customer/AppointmentList'
import InspectionDetail from './pages/customer/InspectionDetail'
import DocumentList from './pages/customer/DocumentList'
import ClientSignature from './pages/customer/ClientSignature'
import OperatorLayout from './pages/operator/OperatorLayout'
import OperatorDashboard from './pages/operator/OperatorDashboard'
import ReceptionForm from './pages/operator/ReceptionForm'
import InspectionList from './pages/operator/InspectionList'
import InspectionWizard from './pages/operator/InspectionWizard'
import WalkIn from './pages/operator/WalkIn'
import FR25Print from './pages/operator/FR25Print'
import AdminLayout from './pages/admin/AdminLayout'
import RTMDashboard from './pages/admin/RTMDashboard'
import Reportes from './pages/admin/Reportes'
import Bitacora from './pages/admin/Bitacora'
import Usuarios from './pages/admin/Usuarios'
import Perfil from './pages/shared/Perfil'

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
  if (user.role === 'customer') return <Navigate to="/cliente" replace />
  if (ADMIN_ROLES.includes(user.role)) return <Navigate to="/admin-panel" replace />
  if (OPERATOR_ROLES.includes(user.role)) return <Navigate to="/operacion" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"     element={<Login />} />
      <Route path="/registro"  element={<Register />} />
      <Route path="/registrar" element={<RegistroPublico />} />

      {/* Portal Cliente */}
      <Route
        path="/cliente"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index                  element={<Dashboard />} />
        <Route path="vehiculos"       element={<VehicleList />} />
        <Route path="citas"           element={<AppointmentList />} />
        <Route path="citas/nueva"     element={<AppointmentNew />} />
        <Route path="inspecciones/:id" element={<InspectionDetail />} />
        <Route path="documentos"      element={<DocumentList />} />
        <Route path="firmar/:receptionId" element={<ClientSignature />} />
        <Route path="perfil"              element={<Perfil />} />
      </Route>

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
        <Route path="bitacora"          element={<Bitacora />} />
        <Route path="usuarios"          element={<Usuarios />} />
        <Route path="perfil"            element={<Perfil />} />
      </Route>

      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
