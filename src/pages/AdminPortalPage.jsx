import { BarChart3, Building2, FileCog, ShieldEllipsis } from 'lucide-react'
import { mockPortalData } from '../data/mockData'
import { PortalFrame } from '../components/PortalFrame'
import { MetricGrid } from '../components/MetricGrid'
import { SurfaceCard } from '../components/SurfaceCard'
import { DataTable } from '../components/DataTable'

export function AdminPortalPage() {
  const data = mockPortalData.admin

  return (
    <PortalFrame
      accent="admin"
      badge="Panel administrativo"
      title="Gobierno operativo y comercial"
      description="Usuarios, catalogo, sedes, reportes y decisiones de capacidad con una lectura ejecutiva mas clara."
      nav={[
        { label: 'Indicadores', href: '#indicadores' },
        { label: 'Usuarios', href: '#usuarios' },
        { label: 'Servicios', href: '#servicios' },
        { label: 'Sedes', href: '#sedes' },
      ]}
    >
      <MetricGrid items={data.summary} />

      <div className="content-grid">
        <SurfaceCard
          title="Frentes prioritarios"
          eyebrow="Control ejecutivo"
          actions={<button className="soft-button" type="button"><BarChart3 size={16} /> Exportar corte</button>}
        >
          <div className="stack-list">
            <article className="list-row">
              <div className="list-row__lead">
                <ShieldEllipsis size={18} />
                <div>
                  <strong>Usuarios y roles</strong>
                  <p>Acceso controlado para clientes, operacion, inspeccion y administracion.</p>
                </div>
              </div>
              <span className="status-badge">Activo</span>
            </article>
            <article className="list-row">
              <div className="list-row__lead">
                <FileCog size={18} />
                <div>
                  <strong>Tarifas y servicios</strong>
                  <p>Configuracion por sede, vigencia y tipo de vehiculo.</p>
                </div>
              </div>
              <span className="status-badge">En control</span>
            </article>
            <article className="list-row">
              <div className="list-row__lead">
                <Building2 size={18} />
                <div>
                  <strong>Capacidad por sede</strong>
                  <p>Planeacion de horarios y disponibilidad con base en demanda.</p>
                </div>
              </div>
              <span className="status-badge">Monitoreado</span>
            </article>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Reportes globales" eyebrow="Analitica y trazabilidad">
          <div className="report-grid">
            {data.reports.map((item) => (
              <article className="report-card" key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <button className="soft-button" type="button">Generar reporte</button>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="content-grid content-grid--wide">
        <SurfaceCard title="Usuarios y roles" eyebrow="Control de acceso" id="usuarios">
          <DataTable
            columns={[
              { key: 'name', label: 'Nombre' },
              { key: 'role', label: 'Rol' },
              { key: 'location', label: 'Ubicacion' },
              { key: 'status', label: 'Estado' },
            ]}
            rows={data.users}
          />
        </SurfaceCard>

        <SurfaceCard title="Servicios configurados" eyebrow="Oferta y tarifa" id="servicios">
          <DataTable
            columns={[
              { key: 'code', label: 'Codigo' },
              { key: 'name', label: 'Servicio' },
              { key: 'price', label: 'Tarifa' },
              { key: 'branch', label: 'Sede' },
            ]}
            rows={data.services}
          />
        </SurfaceCard>
      </div>

      <SurfaceCard title="Sedes y capacidad" eyebrow="Cobertura" id="sedes">
        <div className="branch-grid">
          {data.branches.map((branch) => (
            <article className="branch-card" key={branch.name}>
              <strong>{branch.name}</strong>
              <p>{branch.city}</p>
              <span>{branch.hours}</span>
              <span>{branch.capacity}</span>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </PortalFrame>
  )
}
