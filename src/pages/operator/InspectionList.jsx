import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ClipboardList } from 'lucide-react'
import api from '../../api/client'
import { STATUS_MAP, formatDateTime } from '../../lib/utils'

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200' }
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>{s.label}</span>
}

export default function InspectionList() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => api.get('inspections/records/').then(r => r.data),
    refetchInterval: 30_000,
  })

  const items = data?.results ?? data ?? []

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Inspecciones</h1>
        <p className="text-sm text-muted mt-0.5">{items.length} registros</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-surface rounded-xl border border-dashed border-border p-12 text-center">
          <ClipboardList className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-ink">Sin inspecciones registradas</p>
          <p className="text-xs text-muted mt-1">Las inspecciones aparecerán al recepcionar vehículos</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-canvas text-xs text-muted font-semibold uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Placa</th>
                  <th className="text-left px-4 py-3">Inspector</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Inicio</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map(ins => (
                  <tr
                    key={ins.id}
                    onClick={() => navigate(`/operacion/inspecciones/${ins.id}`)}
                    className="hover:bg-canvas cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-brand tracking-widest">
                        {ins.vehicle_plate?.toUpperCase() ?? '—'}
                      </span>
                      <p className="text-xs text-muted mt-0.5">{ins.vehicle_brand} {ins.vehicle_model}</p>
                    </td>
                    <td className="px-4 py-4 text-ink-2">{ins.customer_name ?? '—'}</td>
                    <td className="px-4 py-4 text-ink-2">
                      {ins.inspection_type === 'official' ? 'Oficial' : 'Pre-técnica'}
                    </td>
                    <td className="px-4 py-4 text-muted text-xs">{formatDateTime(ins.started_at)}</td>
                    <td className="px-4 py-4"><StatusBadge status={ins.status} /></td>
                    <td className="px-4 py-4 text-muted">
                      <ChevronRight className="w-4 h-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-border">
            {items.map(ins => (
              <button
                key={ins.id}
                onClick={() => navigate(`/operacion/inspecciones/${ins.id}`)}
                className="w-full text-left px-4 py-4 flex items-center justify-between gap-3 hover:bg-canvas transition"
              >
                <div className="space-y-1">
                  <span className="font-mono font-bold text-brand tracking-widest text-sm block">
                    {ins.vehicle_plate?.toUpperCase() ?? '—'}
                  </span>
                  <StatusBadge status={ins.status} />
                  <p className="text-xs text-muted">{formatDateTime(ins.started_at)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
