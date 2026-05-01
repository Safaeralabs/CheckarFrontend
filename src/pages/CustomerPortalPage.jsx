import {
  ArrowUpRight,
  BellRing,
  CalendarClock,
  CarFront,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Gauge,
  MapPin,
  Receipt,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { mockPortalData } from '../data/mockData'
import { PortalFrame } from '../components/PortalFrame'
import { MetricGrid } from '../components/MetricGrid'
import { SurfaceCard } from '../components/SurfaceCard'
import { DataTable } from '../components/DataTable'
import { TimelineProgress } from '../components/TimelineProgress'

function ringStyle(value) {
  return {
    background: `conic-gradient(#1187e6 0 ${value}%, rgba(17, 135, 230, 0.14) ${value}% 100%)`,
  }
}

export function CustomerPortalPage() {
  const data = mockPortalData.customer
  const currentInspection = data.inspections[0]

  return (
    <PortalFrame
      accent="customer"
      badge="Portal cliente"
      title="Centro del conductor"
      description="Agenda, seguimiento y documentos en una sola experiencia, pensada para clientes de revision tecnico-mecanica y emisiones."
      nav={[
        { label: 'Inicio', href: '#inicio' },
        { label: 'Vehiculos', href: '#vehiculos' },
        { label: 'Citas', href: '#citas' },
        { label: 'Documentos', href: '#documentos' },
      ]}
    >
      <section className="customer-spotlight" id="inicio">
        <div className="customer-spotlight__copy">
          <span className="customer-pill customer-pill--dark">
            <Sparkles size={15} />
            Dashboard cliente
          </span>
          <h3>{data.spotlight.greeting}</h3>
          <p>{data.spotlight.message}</p>

          <div className="customer-mini-stats">
            {data.spotlight.stats.map((item) => (
              <article className="customer-mini-stat" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="customer-spotlight__actions">
          <button className="primary-action" type="button">
            <CalendarClock size={16} />
            Agendar cita
          </button>
          <button className="soft-button soft-button--light" type="button">
            <FileText size={16} />
            Ver certificados
          </button>
        </div>
      </section>

      <MetricGrid items={data.summary} />

      <section className="customer-dashboard-grid">
        <article className="customer-profile-card">
          <div className="customer-profile-card__media">
            <div className="customer-avatar">
              <UserRound size={52} />
            </div>
            <span className="customer-pill customer-pill--ghost">{data.customerCard.membership}</span>
          </div>

          <div className="customer-profile-card__body">
            <div>
              <h3>{data.customerCard.name}</h3>
              <p>{data.customerCard.role}</p>
            </div>

            <div className="customer-profile-card__meta">
              <span>
                <MapPin size={15} />
                {data.customerCard.city}
              </span>
              <span>
                <CarFront size={15} />
                {data.customerCard.plate}
              </span>
              <span>
                <ShieldCheck size={15} />
                {data.customerCard.plan}
              </span>
            </div>
          </div>
        </article>

        <article className="customer-appointment-card">
          <div className="customer-card-head">
            <div>
              <p className="kicker">Proxima cita</p>
              <h3>{data.appointmentFocus.title}</h3>
            </div>
            <span className="customer-pill customer-pill--soft">{data.appointmentFocus.checklistReady}% listo</span>
          </div>

          <div className="customer-appointment-card__hero">
            <strong>{data.appointmentFocus.vehicle}</strong>
            <p>{data.appointmentFocus.service}</p>
          </div>

          <div className="customer-appointment-card__meta">
            <div>
              <span>Fecha</span>
              <strong>{data.appointmentFocus.date}</strong>
            </div>
            <div>
              <span>Hora</span>
              <strong>{data.appointmentFocus.time}</strong>
            </div>
            <div>
              <span>Sede</span>
              <strong>{data.appointmentFocus.branch}</strong>
            </div>
          </div>

          <div className="customer-progress-bar">
            <span style={{ width: `${data.appointmentFocus.checklistReady}%` }} />
          </div>

          <p className="customer-appointment-card__note">{data.appointmentFocus.note}</p>
        </article>

        <div className="customer-side-column">
          <article className="customer-gauge-card">
            <div className="customer-card-head">
              <div>
                <p className="kicker">Seguimiento en vivo</p>
                <h3>{data.inspectionGauge.label}</h3>
              </div>
              <Gauge size={18} />
            </div>

            <div className="customer-gauge-card__dial" style={ringStyle(data.inspectionGauge.value)}>
              <div>
                <strong>{data.inspectionGauge.value}%</strong>
                <span>{currentInspection.result}</span>
              </div>
            </div>

            <p>{data.inspectionGauge.detail}</p>
            <strong className="customer-inline-note">{data.inspectionGauge.eta}</strong>
          </article>

          <article className="customer-actions-card">
            <div className="customer-card-head">
              <div>
                <p className="kicker">Acciones rapidas</p>
                <h3>Lo que mas necesitas</h3>
              </div>
              <ArrowUpRight size={18} />
            </div>

            <div className="customer-actions-list">
              {data.quickActions.map((item) => (
                <button className="customer-action-item" type="button" key={item.title}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="customer-detail-grid">
        <SurfaceCard
          title="Estado de la inspeccion"
          eyebrow="Flujo del vehiculo"
          actions={
            <button className="soft-button soft-button--light" type="button">
              <Sparkles size={16} />
              Ver detalle
            </button>
          }
        >
          <div className="customer-state-card">
            <div className="customer-state-card__lead">
              <strong>{currentInspection.plate}</strong>
              <span className="status-badge">{currentInspection.updatedAt}</span>
            </div>
            <TimelineProgress currentStep={currentInspection.currentStep} />
          </div>
        </SurfaceCard>

        <SurfaceCard title="Agenda del servicio" eyebrow="Ruta de la cita" id="citas">
          <div className="customer-schedule">
            {data.schedule.map((item) => (
              <article className={`customer-schedule__item customer-schedule__item--${item.tone}`} key={`${item.time}-${item.title}`}>
                <div className="customer-schedule__time">{item.time}</div>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </section>

      <section className="customer-detail-grid customer-detail-grid--bottom">
        <SurfaceCard title="Vehiculos registrados" eyebrow="Perfil vehicular" id="vehiculos">
          <DataTable
            columns={[
              { key: 'plate', label: 'Placa' },
              { key: 'type', label: 'Tipo' },
              { key: 'brand', label: 'Marca / linea' },
              { key: 'year', label: 'Modelo' },
              { key: 'fuel', label: 'Combustible' },
              { key: 'status', label: 'Estado' },
            ]}
            rows={data.vehicles}
          />
        </SurfaceCard>

        <SurfaceCard title="Notificaciones activas" eyebrow="Recordatorios y alertas">
          <div className="customer-feed">
            {data.notifications.map((item) => (
              <article className="customer-feed__item" key={`${item.title}-${item.time}`}>
                <div className="customer-feed__icon">
                  <BellRing size={18} />
                </div>
                <div className="customer-feed__body">
                  <div className="customer-feed__head">
                    <strong>{item.title}</strong>
                    <span>{item.time}</span>
                  </div>
                  <p>{item.description}</p>
                </div>
                <span className="status-badge">{item.status}</span>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </section>

      <section className="customer-doc-grid" id="documentos">
        <SurfaceCard
          title="Documentos y resultados"
          eyebrow="Certificados, reportes y pagos"
          actions={
            <button className="soft-button soft-button--light" type="button">
              <Receipt size={16} />
              Ver pagos
            </button>
          }
        >
          <div className="customer-documents">
            {data.documents.map((item) => (
              <article className="customer-document-card" key={item.name}>
                <div className="customer-document-card__icon">
                  {item.name.includes('Factura') ? <Receipt size={18} /> : <FileText size={18} />}
                </div>
                <div className="customer-document-card__body">
                  <strong>{item.name}</strong>
                  <p>{item.vehicle}</p>
                  <span className="status-badge">{item.status}</span>
                </div>
                <button className="soft-button soft-button--light" type="button">
                  {item.action.includes('Descargar') ? <Download size={15} /> : <CheckCircle2 size={15} />}
                  {item.action}
                </button>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Historial de citas" eyebrow="Reservas y trazabilidad">
          <DataTable
            columns={[
              { key: 'code', label: 'Codigo' },
              { key: 'date', label: 'Fecha' },
              { key: 'branch', label: 'Sede' },
              { key: 'service', label: 'Servicio' },
              { key: 'status', label: 'Estado' },
            ]}
            rows={data.appointments}
          />
          <div className="customer-history-note">
            <Clock3 size={16} />
            Conserva tus citas, resultados y certificados en un solo historial digital.
          </div>
        </SurfaceCard>
      </section>
    </PortalFrame>
  )
}
