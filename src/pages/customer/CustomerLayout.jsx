import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Calendar, Car, FileText, Home, LogOut, Search } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'

const navItems = [
  { to: '/cliente',                icon: Home,     label: 'Inicio',     end: true },
  { to: '/cliente/vehiculos',      icon: Car,      label: 'Vehículos' },
  { to: '/cliente/citas',          icon: Calendar, label: 'Citas' },
  { to: '/cliente/inspecciones/0', icon: Search,   label: 'Inspección', hide: true },
  { to: '/cliente/documentos',     icon: FileText, label: 'Documentos' },
]

const bottomNav = navItems.filter(n => !n.hide)

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-accent-soft text-accent'
      : 'text-ink-2 hover:bg-canvas hover:text-ink'
  }`

const mobileClass = ({ isActive }) =>
  `flex flex-col items-center gap-1 pt-2 pb-1 px-3 text-xs font-medium transition-colors ${
    isActive ? 'text-accent' : 'text-muted'
  }`

export default function CustomerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => { await logout(); navigate('/login') }
  const initials = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  return (
    <div className="min-h-screen bg-canvas">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-60 bg-surface border-r border-border flex-col z-30">
        <div className="flex items-center px-5 py-4 border-b border-border">
          <img src="/logo_blanco.png" alt="Checkar" className="h-8 w-auto" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.filter(n => !n.hide).map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Avatar → perfil | logout */}
        <div className="border-t border-border px-3 py-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <NavLink to="/cliente/perfil" className="w-8 h-8 rounded-full bg-brand-soft border border-brand-soft flex items-center justify-center text-xs font-bold text-brand flex-shrink-0 hover:ring-2 hover:ring-brand/40 transition">
              {initials}
            </NavLink>
            <NavLink to="/cliente/perfil" className="flex-1 min-w-0 hover:opacity-80 transition">
              <p className="text-sm font-semibold text-ink truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-muted truncate">Cliente</p>
            </NavLink>
            <button onClick={handleLogout} className="text-muted hover:text-danger transition" title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Header — mobile */}
      <header className="md:hidden sticky top-0 z-30 bg-surface border-b border-border flex items-center justify-between px-4 h-14">
        <img src="/logo_blanco.png" alt="Checkar" className="h-7 w-auto" />
        <div className="flex items-center gap-2">
          <NavLink to="/cliente/perfil" className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center text-xs font-bold text-brand">
            {initials}
          </NavLink>
          <button onClick={handleLogout} className="text-muted hover:text-danger transition p-1" title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-30 flex justify-around">
        {bottomNav.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={mobileClass}>
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
