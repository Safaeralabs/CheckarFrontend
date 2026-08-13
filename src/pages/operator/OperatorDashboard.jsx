import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Calendar, Car, CheckCircle, Clock, PlayCircle } from 'lucide-react'
import api from '../../api/client'
import { STATUS_MAP, formatDateTime } from '../../lib/utils'
import { useAuth } from '../../auth/AuthContext'

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200' }
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>{s.label}</span>
}

function Plate({ value }) {
  return <span className="font-mono font-bold text-brand tracking-widest">{value?.toUpperCase()}</span>
}

function TurnBadge({ value }) {
  if (!value) return <span className="text-xs text-muted">—</span>
  return (
    <span className="inline-flex px-2 py-0.5 rounded-md bg-accent-soft text-accent text-xs font-bold font-mono tracking-wide">
      {value}
    </span>
  )
}

const TODAY = new Date().toISOString().slice(0, 10)

export default function OperatorDashboard() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: () => api.get('scheduling/appointments/', {
      params: { scheduled_for__date: TODAY }
    }).then(r => r.data),
    refetchInterval: 60_000,
  })

  const checkinMut = useMutation({
    mutationFn: (id) => api.post(`scheduling/appointments/${id}/cancel/`), // placeholder — real endpoint sería check-in
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })

  const appointments = data?.results ?? data ?? []

  const stats = {
    total:      appointments.length,
    pending:    appointments.filter(a => ['created', 'confirmed'].includes(a.status)).length,
    inProgress: appointments.filter(a => ['checked_in', 'in_progress'].includes(a.status)).length,
    done:       appointments.filter(a => ['completed', 'certified'].includes(a.status)).length,
  }

  const handleRecepcionar = (apt) => navigate(`/operacion/recepcion/${apt.id}`)
  const handleInspeccionar = (apt) => {
    if (apt.inspection_record) navigate(`/operacion/inspecciones/${apt.inspection_record}`)
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Cola del día</h1>
        <p className="text-sm text-muted mt-0.5">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total agendados', value: stats.total,      icon: Calendar, color: 'text-brand' },
          { label: 'Pendientes',      value: stats.pending,    icon: Clock,    color: 'text-warning' },
          { label: 'En proceso',      value: stats.inProgress, icon: Car,      color: 'text-accent' },
          { label: 'Completados',     value: stats.done,       icon: CheckCircle, color: 'text-success' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className="text-2xl font-bold text-ink">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Queue */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-surface rounded-xl border border-dashed border-border p-12 text-center">
          <Calendar className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-ink">Sin citas agendadas para hoy</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-canvas">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Vehículos del día</p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted font-semibold uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Turno</th>
                  <th className="text-left px-4 py-3">Placa</th>
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3">Servicio</th>
                  <th className="text-left px-4 py-3">Hora</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-right px-5 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {appointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-canvas transition-colors">
                    <td className="px-5 py-4">
                      <TurnBadge value={apt.turn_number} />
                    </td>
                    <td className="px-4 py-4">
                      <Plate value={apt.vehicle_detail?.plate ?? '—'} />
                    </td>
                    <td className="px-4 py-4 text-ink">
                      {apt.customer_detail?.first_name} {apt.customer_detail?.last_name}
                    </td>
                    <td className="px-4 py-4 text-ink-2">{apt.service_detail?.name ?? '—'}</td>
                    <td className="px-4 py-4 text-muted">
                      {new Date(apt.scheduled_for).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={apt.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <QueueAction apt={apt} onRecepcionar={handleRecepcionar} onInspect={handleInspeccionar} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {appointments.map(apt => (
              <div key={apt.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TurnBadge value={apt.turn_number} />
                    <Plate value={apt.vehicle_detail?.plate ?? '—'} />
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
                <p className="text-sm text-ink">{apt.customer_detail?.first_name} {apt.customer_detail?.last_name}</p>
                <p className="text-xs text-muted">{apt.service_detail?.name} · {new Date(apt.scheduled_for).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
                <div className="pt-1">
                  <QueueAction apt={apt} onRecepcionar={handleRecepcionar} onInspect={handleInspeccionar} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function QueueAction({ apt, onRecepcionar, onInspect }) {
  if (['created', 'confirmed'].includes(apt.status)) {
    return (
      <button
        onClick={() => onRecepcionar(apt)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-light transition"
      >
        <Car className="w-3.5 h-3.5" /> Recepcionar
      </button>
    )
  }
  if (['checked_in'].includes(apt.status) && apt.inspection_record) {
    return (
      <button
        onClick={() => onInspect(apt)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition"
      >
        <PlayCircle className="w-3.5 h-3.5" /> Inspeccionar
      </button>
    )
  }
  if (['in_progress'].includes(apt.status) && apt.inspection_record) {
    return (
      <button
        onClick={() => onInspect(apt)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent text-accent text-xs font-semibold hover:bg-accent-soft transition"
      >
        <PlayCircle className="w-3.5 h-3.5" /> Continuar
      </button>
    )
  }
  return <span className="text-xs text-muted">—</span>
}
