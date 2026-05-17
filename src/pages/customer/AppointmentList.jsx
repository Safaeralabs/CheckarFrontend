import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Calendar, Plus, X } from 'lucide-react'
import api from '../../api/client'
import { STATUS_MAP, formatDateTime } from '../../lib/utils'

const TABS = [
  { key: 'all',       label: 'Todas' },
  { key: 'active',    label: 'Activas' },
  { key: 'completed', label: 'Completadas' },
]

const ACTIVE_STATUSES  = ['created', 'confirmed', 'checked_in', 'in_progress']
const DONE_STATUSES    = ['completed', 'certified']

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>{s.label}</span>
}

export default function AppointmentList() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.get('scheduling/appointments/').then(r => r.data),
  })

  const cancelMut = useMutation({
    mutationFn: (id) => api.post(`scheduling/appointments/${id}/cancel/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })

  const all = data?.results ?? data ?? []

  const items = all.filter(a => {
    if (tab === 'active')    return ACTIVE_STATUSES.includes(a.status)
    if (tab === 'completed') return DONE_STATUSES.includes(a.status)
    return true
  })

  const handleCancel = (a) => {
    if (confirm(`¿Cancelar la cita del ${formatDateTime(a.scheduled_for)}?`))
      cancelMut.mutate(a.id)
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">Mis citas</h1>
          <p className="text-sm text-muted mt-0.5">{all.length} en total</p>
        </div>
        <Link
          to="/cliente/citas/nueva"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" /> Nueva
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-canvas rounded-lg p-1 mb-5 border border-border">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-surface shadow-sm text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-surface rounded-xl border border-dashed border-border p-12 text-center">
          <Calendar className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-ink mb-1">Sin citas en esta categoría</p>
          <Link to="/cliente/citas/nueva" className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent font-medium hover:underline">
            <Plus className="w-3.5 h-3.5" /> Agendar cita
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(a => {
            const canCancel = ACTIVE_STATUSES.slice(0, 2).includes(a.status)
            const plate = a.vehicle_detail?.plate ?? '—'
            return (
              <div key={a.id} className="bg-surface rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <span className="font-mono font-bold text-brand tracking-widest text-sm">{plate.toUpperCase()}</span>
                    <p className="text-sm font-medium text-ink">
                      {a.service_detail?.name ?? 'Servicio'} · {a.branch_detail?.name ?? 'Sede'}
                    </p>
                    <p className="text-xs text-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateTime(a.scheduled_for)}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-4 flex items-center gap-3">
                  {a.inspection_record && (
                    <Link
                      to={`/cliente/inspecciones/${a.inspection_record}`}
                      className="text-xs text-accent font-medium hover:underline"
                    >
                      Ver inspección →
                    </Link>
                  )}
                  {canCancel && (
                    <button
                      onClick={() => handleCancel(a)}
                      disabled={cancelMut.isPending}
                      className="flex items-center gap-1 text-xs text-danger hover:underline disabled:opacity-50"
                    >
                      <X className="w-3 h-3" /> Cancelar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
