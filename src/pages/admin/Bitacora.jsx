import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, BookOpen, Info, RefreshCw, XCircle } from 'lucide-react'
import api from '../../api/client'

const PERIODOS = [
  { label: '24 h',  dias: 1  },
  { label: '7 días', dias: 7  },
  { label: '30 días', dias: 30 },
]

const NIVELES = [
  { value: '',        label: 'Todos' },
  { value: 'info',    label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'error',   label: 'Error' },
]

function levelStyle(level) {
  if (level === 'error')   return { badge: 'bg-danger-soft text-danger border-danger/30',   icon: XCircle,      dot: 'bg-danger' }
  if (level === 'warning') return { badge: 'bg-warning-soft text-warning border-warning/30', icon: AlertTriangle, dot: 'bg-warning' }
  return                          { badge: 'bg-info-soft text-info border-info/30',           icon: Info,          dot: 'bg-info' }
}

function desde(dias) {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  return d.toISOString().slice(0, 10)
}

export default function Bitacora() {
  const [periodo, setPeriodo] = useState(7)
  const [nivel,   setNivel]   = useState('')

  const params = { desde: desde(periodo), page_size: 200 }
  if (nivel) params.level = nivel

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['bitacora', periodo, nivel],
    queryFn: () => api.get('operations/logs/', { params }).then(r => r.data),
    staleTime: 60 * 1000,
  })

  const entradas = data?.results ?? data ?? []

  return (
    <div className="p-4 md:p-7 max-w-6xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-ink mb-1 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-brand" />
          Bitácora del sistema
        </h1>
        <p className="text-ink-2 text-sm">Registro de actividades y eventos del sistema</p>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {/* Header con filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <p className="text-xs text-muted">
            {isFetching ? 'Actualizando...' : `${entradas.length} registro${entradas.length !== 1 ? 's' : ''}`}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro nivel */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              {NIVELES.map(n => (
                <button
                  key={n.value}
                  onClick={() => setNivel(n.value)}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${
                    nivel === n.value ? 'bg-accent text-white' : 'text-ink-2 hover:bg-canvas hover:text-ink'
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>

            {/* Filtro período */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              {PERIODOS.map(p => (
                <button
                  key={p.dias}
                  onClick={() => setPeriodo(p.dias)}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${
                    periodo === p.dias ? 'bg-accent text-white' : 'text-ink-2 hover:bg-canvas hover:text-ink'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-lg border border-border text-muted hover:text-ink hover:bg-canvas transition disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabla */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <BookOpen className="w-10 h-10 text-muted mb-3" />
            <p className="text-ink font-semibold mb-1">Sin registros en este período</p>
            <p className="text-ink-2 text-sm">No hay entradas en la bitácora para los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Fecha</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Nivel</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Fuente</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map(e => {
                  const { badge, dot } = levelStyle(e.level)
                  return (
                    <tr key={e.id} className="border-t border-border hover:bg-card/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                        {new Date(e.created_at).toLocaleString('es-CO', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                          {e.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted">{e.source || '—'}</td>
                      <td className="px-4 py-3 text-sm text-ink max-w-md truncate">{e.message}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
