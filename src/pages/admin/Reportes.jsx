import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Clock, RefreshCw, TrendingUp, XCircle } from 'lucide-react'
import { getReports } from '../../api/administration'

const PERIODOS = [
  { label: '7 días',  dias: 7  },
  { label: '30 días', dias: 30 },
  { label: '90 días', dias: 90 },
]

function MetricCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand:   'text-brand bg-brand-soft',
    success: 'text-success bg-success-soft',
    danger:  'text-danger bg-danger-soft',
    warning: 'text-warning bg-warning-soft',
  }
  return (
    <div className="bg-surface rounded-xl border border-border p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-ink leading-none mb-1">
          {value ?? <span className="w-16 h-6 bg-border rounded animate-pulse inline-block" />}
        </p>
        <p className="text-sm font-medium text-ink-2">{label}</p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function ApprovalBar({ aprobadas, rechazadas }) {
  const total = aprobadas + rechazadas
  if (total === 0) return <p className="text-sm text-muted">Sin datos de resultado aún</p>
  const pct = Math.round((aprobadas / total) * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted">
        <span>Aprobadas {aprobadas}</span>
        <span>Rechazadas {rechazadas}</span>
      </div>
      <div className="h-3 bg-danger-soft rounded-full overflow-hidden">
        <div className="h-full bg-success rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted text-right">{pct}% tasa de aprobación</p>
    </div>
  )
}

export default function Reportes() {
  const [dias, setDias] = useState(30)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['reports', dias],
    queryFn: () => getReports(dias).then(r => r.data),
    staleTime: 2 * 60 * 1000,
  })

  const porDia = data?.por_dia ?? []

  return (
    <div className="p-4 md:p-7 max-w-6xl">
      <div className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand" />
            Reportes de operación
          </h1>
          <p className="text-ink-2 text-sm">Tiempos y volúmenes de inspecciones del CDA</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {PERIODOS.map(p => (
              <button
                key={p.dias}
                onClick={() => setDias(p.dias)}
                className={`px-3 py-1.5 text-xs font-semibold transition ${
                  dias === p.dias ? 'bg-accent text-white' : 'text-ink-2 hover:bg-canvas hover:text-ink'
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

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={TrendingUp}
          label="Inspecciones"
          value={isLoading ? null : data?.total ?? 0}
          sub={`Últimos ${dias} días`}
          color="brand"
        />
        <MetricCard
          icon={CheckCircle}
          label="Aprobadas"
          value={isLoading ? null : data?.aprobadas ?? 0}
          color="success"
        />
        <MetricCard
          icon={XCircle}
          label="Rechazadas"
          value={isLoading ? null : data?.rechazadas ?? 0}
          color="danger"
        />
        <MetricCard
          icon={Clock}
          label="Tiempo promedio"
          value={isLoading ? null : data?.tiempo_promedio_minutos ? `${data.tiempo_promedio_minutos} min` : '—'}
          sub="Por inspección"
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasa de aprobación */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-bold text-ink mb-4">Tasa de aprobación</h2>
          {isLoading
            ? <div className="h-12 bg-border rounded animate-pulse" />
            : <ApprovalBar aprobadas={data?.aprobadas ?? 0} rechazadas={data?.rechazadas ?? 0} />
          }

          <div className="mt-5 pt-4 border-t border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Oficial</span>
              <span className="font-semibold text-ink">{isLoading ? '—' : data?.por_tipo?.oficial ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Pre-técnica</span>
              <span className="font-semibold text-ink">{isLoading ? '—' : data?.por_tipo?.pre_tecnica ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Volumen por día */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-ink">Volumen diario</h2>
            <p className="text-xs text-muted mt-0.5">Inspecciones por día en el período</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : porDia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="w-8 h-8 text-muted mb-2" />
              <p className="text-sm text-muted">Sin inspecciones en este período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Fecha</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide text-center">Total</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide text-center">Aprobadas</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide text-center">Rechazadas</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Distribución</th>
                  </tr>
                </thead>
                <tbody>
                  {[...porDia].reverse().map(d => {
                    const pct = d.total > 0 ? Math.round((d.aprobadas / d.total) * 100) : 0
                    return (
                      <tr key={d.dia} className="border-t border-border hover:bg-card/40 transition-colors">
                        <td className="px-4 py-3 text-sm text-ink font-medium">
                          {new Date(d.dia + 'T00:00:00').toLocaleDateString('es-CO', {
                            weekday: 'short', day: '2-digit', month: 'short'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-ink text-center">{d.total}</td>
                        <td className="px-4 py-3 text-sm text-success font-semibold text-center">{d.aprobadas}</td>
                        <td className="px-4 py-3 text-sm text-danger font-semibold text-center">{d.rechazadas}</td>
                        <td className="px-4 py-3 min-w-[100px]">
                          <div className="h-2 bg-danger-soft rounded-full overflow-hidden">
                            <div className="h-full bg-success rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
