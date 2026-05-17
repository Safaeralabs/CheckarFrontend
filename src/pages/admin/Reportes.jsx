import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Legend,
} from 'recharts'
import {
  ArrowDown, ArrowUp, CheckCircle, Clock, DollarSign,
  RefreshCw, TrendingUp, Users, XCircle,
} from 'lucide-react'
import { getReports } from '../../api/administration'

const PERIODOS = [
  { label: '7 días',  dias: 7  },
  { label: '30 días', dias: 30 },
  { label: '90 días', dias: 90 },
]

// ── Formato de moneda COP ─────────────────────────────────────────────────────
function cop(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)    return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function pct(n) { return n == null ? '—' : `${n}%` }

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPI({ icon: Icon, label, value, sub, color = 'brand', delta }) {
  const colors = {
    brand:   'text-brand   bg-brand/10',
    success: 'text-success bg-success/10',
    danger:  'text-danger  bg-danger/10',
    warning: 'text-warning bg-warning/10',
    purple:  'text-purple-600 bg-purple-50',
  }
  return (
    <div className="bg-surface rounded-xl border border-border p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-end justify-between gap-2">
          <p className="text-2xl font-bold text-ink leading-none">
            {value ?? <span className="w-16 h-6 bg-border rounded animate-pulse inline-block" />}
          </p>
          {delta != null && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold mb-0.5 ${delta >= 0 ? 'text-success' : 'text-danger'}`}>
              {delta >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-ink-2 mt-1">{label}</p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Tooltip personalizado ─────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-xl shadow-lg px-3 py-2.5 text-xs min-w-[130px]">
      <p className="font-bold text-ink mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-semibold text-ink">
            {currency ? cop(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Inspector performance row ─────────────────────────────────────────────────
function InspectorRow({ row, max }) {
  const pctBar = max > 0 ? (row.total / max) * 100 : 0
  return (
    <tr className="border-t border-border hover:bg-canvas transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-ink">{row.nombre}</p>
        <div className="h-1.5 bg-border rounded-full mt-1.5 w-28 overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: `${pctBar}%` }} />
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-ink text-center font-bold">{row.total}</td>
      <td className="px-4 py-3 text-sm text-success text-center font-semibold">{row.aprobadas}</td>
      <td className="px-4 py-3 text-sm text-danger text-center font-semibold">{row.rechazadas}</td>
      <td className="px-4 py-3 text-center">
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
          row.tasa_aprobacion >= 80 ? 'bg-success/10 text-success border-success/30'
          : row.tasa_aprobacion >= 60 ? 'bg-warning/10 text-warning border-warning/30'
          : 'bg-danger/10 text-danger border-danger/30'
        }`}>
          {row.tasa_aprobacion}%
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-muted text-center">
        {row.tiempo_promedio_minutos ? `${row.tiempo_promedio_minutos} min` : '—'}
      </td>
    </tr>
  )
}

// ── Sección con título ────────────────────────────────────────────────────────
function Section({ title, sub, children, action }) {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Comparación período anterior ──────────────────────────────────────────────
function DeltaCard({ label, actual, anterior, delta, format = v => v }) {
  const up = delta >= 0
  return (
    <div className="p-4 rounded-xl border border-border bg-canvas">
      <p className="text-xs text-muted font-medium uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xl font-bold text-ink">{format(actual)}</p>
          <p className="text-xs text-muted mt-0.5">vs {format(anterior)} período anterior</p>
        </div>
        {delta != null && (
          <span className={`flex items-center gap-0.5 text-sm font-bold ${up ? 'text-success' : 'text-danger'}`}>
            {up ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Reportes() {
  const [dias, setDias] = useState(30)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['reports', dias],
    queryFn: () => getReports(dias).then(r => r.data),
    staleTime: 2 * 60 * 1000,
  })

  const porDia        = data?.por_dia        ?? []
  const porHora       = data?.por_hora       ?? []
  const porInspector  = data?.por_inspector  ?? []
  const ant           = data?.periodo_anterior ?? {}
  const porTipo       = data?.por_tipo        ?? {}

  const maxInspector = Math.max(...porInspector.map(r => r.total), 1)

  // Formato de fecha corto para ejes
  const fmtDia = iso => {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
  }
  const fmtHora = h => `${String(h).padStart(2, '0')}:00`

  const loading = isLoading

  return (
    <div className="p-4 md:p-7 max-w-7xl space-y-7">

      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand" />
            Business Analytics
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Rendimiento operativo y financiero del CDA
          </p>
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
            className="p-2 rounded-lg border border-border text-muted hover:text-ink transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPI icon={TrendingUp}   label="Inspecciones"      color="brand"
          value={loading ? null : data?.total ?? 0}
          delta={ant.delta_total}
          sub={`Últimos ${dias} días`}
        />
        <KPI icon={CheckCircle}  label="Aprobadas"          color="success"
          value={loading ? null : data?.aprobadas ?? 0}
          delta={ant.delta_aprobadas}
        />
        <KPI icon={XCircle}      label="Rechazadas"         color="danger"
          value={loading ? null : data?.rechazadas ?? 0}
        />
        <KPI icon={DollarSign}   label="Ingresos"           color="purple"
          value={loading ? null : cop(data?.ingresos_total ?? 0)}
          delta={ant.delta_ingresos}
          sub="Del período"
        />
        <KPI icon={Clock}        label="Tiempo promedio"    color="warning"
          value={loading ? null : data?.tiempo_promedio_minutos ? `${data.tiempo_promedio_minutos} min` : '—'}
          sub="Por inspección"
        />
        <KPI icon={Users}        label="Tasa aprobación"    color="success"
          value={loading ? null : pct(data?.tasa_aprobacion)}
          sub={`${data?.total ?? 0} totales`}
        />
      </div>

      {/* ── Gráficos fila 1: Volumen + Ingresos diarios ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Section title="Volumen diario" sub="Inspecciones por día">
          <div className="p-4 h-60">
            {loading ? (
              <div className="h-full bg-canvas rounded-lg animate-pulse" />
            ) : porDia.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porDia.map(d => ({ ...d, dia: fmtDia(d.dia) }))} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="aprobadas" name="Aprobadas" fill="#22c55e" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="rechazadas" name="Rechazadas" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>

        <Section title="Ingresos diarios" sub="COP por día de recepción">
          <div className="p-4 h-60">
            {loading ? (
              <div className="h-full bg-canvas rounded-lg animate-pulse" />
            ) : porDia.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={porDia.map(d => ({ ...d, dia: fmtDia(d.dia) }))}>
                  <defs>
                    <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => cop(v)} />
                  <Tooltip content={<CustomTooltip currency />} />
                  <Area dataKey="ingresos" name="Ingresos" stroke="#8b5cf6" strokeWidth={2}
                    fill="url(#gradIngresos)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>
      </div>

      {/* ── Gráficos fila 2: Hora pico + Por tipo ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Section title="Hora pico" sub="Volumen de inspecciones por hora del día">
          <div className="p-4 h-52">
            {loading ? (
              <div className="h-full bg-canvas rounded-lg animate-pulse" />
            ) : porHora.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porHora.map(h => ({ ...h, hora: fmtHora(h.hora) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="hora" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Inspecciones" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Section>

        <Section title="Por tipo de inspección" sub="Distribución del período">
          <div className="p-5 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-canvas rounded-lg animate-pulse" />)}
              </div>
            ) : (
              [
                { key: 'oficial',     label: 'RTMyEC Oficial',  color: 'bg-brand' },
                { key: 'pre_tecnica', label: 'Pre-técnica',     color: 'bg-accent' },
                { key: 'preventiva',  label: 'Preventiva',      color: 'bg-purple-500' },
              ].map(({ key, label, color }) => {
                const val = porTipo[key] ?? 0
                const total = Object.values(porTipo).reduce((a, b) => a + b, 0)
                const p = total > 0 ? Math.round(val / total * 100) : 0
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ink-2 font-medium">{label}</span>
                      <span className="text-ink font-bold">{val} <span className="text-muted font-normal text-xs">({p}%)</span></span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${p}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Section>
      </div>

      {/* ── Rendimiento por inspector ── */}
      <Section title="Rendimiento por inspector" sub={`${porInspector.length} inspector${porInspector.length !== 1 ? 'es' : ''} activos en el período`}>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-canvas rounded-lg animate-pulse" />)}
          </div>
        ) : porInspector.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted">
            <Users className="w-8 h-8 mb-2" />
            <p className="text-sm">Sin datos de inspectores en este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-canvas">
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Inspector</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide text-center">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide text-center">Aprobadas</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide text-center">Rechazadas</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide text-center">Tasa</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide text-center">T. promedio</th>
                </tr>
              </thead>
              <tbody>
                {porInspector.map(row => (
                  <InspectorRow key={row.id} row={row} max={maxInspector} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Comparación período anterior ── */}
      <div>
        <h2 className="text-sm font-bold text-ink mb-3">
          Comparación vs período anterior ({dias} días)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DeltaCard
            label="Inspecciones"
            actual={data?.total ?? 0}
            anterior={ant.total ?? 0}
            delta={ant.delta_total}
            format={v => v}
          />
          <DeltaCard
            label="Aprobadas"
            actual={data?.aprobadas ?? 0}
            anterior={ant.aprobadas ?? 0}
            delta={ant.delta_aprobadas}
            format={v => v}
          />
          <DeltaCard
            label="Ingresos"
            actual={data?.ingresos_total ?? 0}
            anterior={ant.ingresos ?? 0}
            delta={ant.delta_ingresos}
            format={cop}
          />
        </div>
      </div>

    </div>
  )
}
