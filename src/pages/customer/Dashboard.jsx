import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, Car, ChevronRight, FileText, PenLine, Plus } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import api from '../../api/client'
import { STATUS_MAP, formatDateTime, VEHICLE_TYPE_LABELS, FUEL_LABELS } from '../../lib/utils'

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>
      {s.label}
    </span>
  )
}

function Plate({ value }) {
  return (
    <span className="font-mono font-semibold text-brand tracking-widest text-sm">
      {value?.toUpperCase()}
    </span>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('vehicles/').then(r => r.data),
  })
  const { data: appointmentsData } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.get('scheduling/appointments/').then(r => r.data),
  })
  const { data: pendingSigsData } = useQuery({
    queryKey: ['pending-signatures'],
    queryFn: () => api.get('operations/receptions/', { params: { signature_status: 'operator_signed' } })
      .then(r => r.data?.results ?? r.data ?? []),
    refetchInterval: 30_000,
  })

  const vehicles = vehiclesData?.results ?? vehiclesData ?? []
  const appointments = appointmentsData?.results ?? appointmentsData ?? []
  const upcoming = appointments.filter(a => ['created', 'confirmed'].includes(a.status))
  const nextAppt = upcoming[0]
  const pendingSigs = pendingSigsData ?? []

  const name = user?.first_name || user?.username || 'Cliente'

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold text-ink">Hola, {name} 👋</h1>
        <p className="text-ink-2 text-sm mt-0.5">Tu inspección siempre al día</p>
      </div>

      {/* Banner de firmas pendientes */}
      {pendingSigs.length > 0 && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <PenLine className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800">
                {pendingSigs.length === 1
                  ? 'Tienes una recepción pendiente de firma'
                  : `Tienes ${pendingSigs.length} recepciones pendientes de firma`}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                La inspección de tu vehículo no puede iniciar hasta que firmes.
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {pendingSigs.map(rec => (
              <Link
                key={rec.id}
                to={`/cliente/firmar/${rec.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-white border border-amber-200 hover:border-amber-400 transition"
              >
                <span className="text-sm font-semibold text-amber-900">
                  Recepción #{rec.id}
                </span>
                <span className="text-xs text-amber-700 flex items-center gap-1">
                  Firmar <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Vehículos', value: vehicles.length, icon: Car, href: '/cliente/vehiculos' },
          { label: 'Citas activas', value: upcoming.length, icon: Calendar, href: '/cliente/citas' },
          { label: 'Documentos', value: '—', icon: FileText, href: '/cliente/documentos' },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link key={label} to={href} className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-1 hover:border-brand/30 transition">
            <Icon className="w-4 h-4 text-muted" />
            <span className="text-xl font-bold text-ink">{value}</span>
            <span className="text-xs text-muted">{label}</span>
          </Link>
        ))}
      </div>

      {/* Próxima cita */}
      {nextAppt ? (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-ink">Próxima cita</h2>
            <Link to="/cliente/citas" className="text-xs text-accent hover:underline flex items-center gap-0.5">
              Ver todas <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Plate value={nextAppt.vehicle_detail?.plate ?? nextAppt.vehicle} />
                <p className="text-sm text-ink font-medium">
                  {nextAppt.service_detail?.name ?? 'Servicio'} · {nextAppt.branch_detail?.name ?? 'Sede'}
                </p>
                <p className="text-xs text-muted">{formatDateTime(nextAppt.scheduled_for)}</p>
              </div>
              <StatusBadge status={nextAppt.status} />
            </div>
            <Link
              to="/cliente/citas"
              className="mt-4 flex items-center gap-2 text-sm text-accent font-medium hover:underline"
            >
              Ver detalle <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-dashed border-border p-8 text-center">
          <Calendar className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-ink mb-1">Sin citas agendadas</p>
          <p className="text-xs text-muted mb-4">Agenda tu próxima revisión técnico-mecánica</p>
          <Link
            to="/cliente/citas/nueva"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" /> Agendar cita
          </Link>
        </div>
      )}

      {/* Mis vehículos */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-ink">Mis vehículos</h2>
          <Link to="/cliente/vehiculos" className="text-xs text-accent hover:underline flex items-center gap-0.5">
            Gestionar <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {vehicles.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <Car className="w-7 h-7 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted">Aún no has registrado vehículos</p>
            <Link to="/cliente/vehiculos" className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent font-medium hover:underline">
              <Plus className="w-3.5 h-3.5" /> Agregar
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {vehicles.slice(0, 3).map(v => (
              <li key={v.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <Plate value={v.plate} />
                  <p className="text-xs text-muted mt-0.5">{v.brand} {v.model_line} · {VEHICLE_TYPE_LABELS[v.vehicle_type]} · {FUEL_LABELS[v.fuel_type]}</p>
                </div>
              </li>
            ))}
            {vehicles.length > 3 && (
              <li className="px-5 py-3">
                <Link to="/cliente/vehiculos" className="text-xs text-accent hover:underline">
                  +{vehicles.length - 3} más →
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/cliente/citas/nueva"
          className="flex items-center gap-3 p-4 bg-brand rounded-xl text-white hover:bg-brand-light transition"
        >
          <Calendar className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">Nueva cita</span>
        </Link>
        <Link
          to="/cliente/documentos"
          className="flex items-center gap-3 p-4 bg-surface border border-border rounded-xl text-ink hover:border-brand/30 transition"
        >
          <FileText className="w-5 h-5 text-muted flex-shrink-0" />
          <span className="text-sm font-semibold">Mis documentos</span>
        </Link>
      </div>
    </div>
  )
}
