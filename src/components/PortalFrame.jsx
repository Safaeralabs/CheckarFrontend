import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CircleHelp, LogOut } from 'lucide-react'
import { useAuth } from '../state/useAuth'

const appear = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export function PortalFrame({ accent, badge, title, description, nav, children }) {
  const { logout } = useAuth()
  const [activeHref, setActiveHref] = useState(nav[0]?.href ?? '#')
  const portalLabels = {
    customer: 'Experiencia cliente',
    operations: 'Centro operativo',
    admin: 'Control administrativo',
  }

  useEffect(() => {
    const syncActive = () => {
      if (window.location.hash) {
        setActiveHref(window.location.hash)
        return
      }

      setActiveHref(nav[0]?.href ?? '#')
    }

    syncActive()
    window.addEventListener('hashchange', syncActive)
    return () => window.removeEventListener('hashchange', syncActive)
  }, [nav])

  return (
    <div className={`portal-shell portal-shell--${accent}`}>
      <aside className="portal-sidebar">
        <div className="brand-lockup">
          <div className="sidebar-logo-frame" aria-label="Checkar CDA">
            <img
              className="sidebar-logo"
              src="/checkar-logo-sidebar.png"
              alt="Checkar CDA"
            />
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section__label">Navegacion</p>
          <nav className="sidebar-nav">
            {nav.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                className={`sidebar-link ${activeHref === item.href ? 'is-active' : ''}`}
                onClick={() => setActiveHref(item.href)}
              >
                <span className="sidebar-link__index">{String(index + 1).padStart(2, '0')}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>

        <div className="sidebar-assist">
          <div className="sidebar-assist__icon">
            <CircleHelp size={18} />
          </div>
          <div>
            <strong>Centro de ayuda</strong>
            <p>Consulta requisitos, documentos previos y seguimiento del proceso.</p>
          </div>
        </div>

        <div className="sidebar-footer">
          <span className="status-badge">{portalLabels[accent] ?? 'Plataforma Checkar'}</span>
          <button className="logout-button" type="button" onClick={logout}>
            <LogOut size={16} />
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="portal-main">
        <motion.header className="portal-hero" variants={appear} initial="hidden" animate="show">
          <div>
            <div className="hero-topline">
              <span className="hero-badge">{badge}</span>
            </div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </motion.header>

        <motion.div
          className="portal-content"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          animate="show"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
