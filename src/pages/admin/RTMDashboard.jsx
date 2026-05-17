import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle, CheckCircle, Download, Phone, RefreshCw,
  Users, ClipboardList, Car, Clock
} from 'lucide-react'
import { getDashboardSummary, getRTMVencimiento } from '../../api/administration'

// ── Helpers ───────────────────────────────────────────────────────────────────

function diasColor(dias) {
  if (dias <= 15) return { badge: 'bg-danger-soft text-danger border-danger/30',    dot: 'bg-danger' }
  if (dias <= 30) return { badge: 'bg-warning-soft text-warning border-warning/30', dot: 'bg-warning' }
  if (dias <= 60) return { badge: 'bg-info-soft text-info border-info/30',          dot: 'bg-info' }
  return           { badge: 'bg-success-soft text-success border-success/30',       dot: 'bg-success' }
}

function exportarCSV(filas, diasUmbral) {
  const headers = ['Placa', 'Marca', 'Modelo', 'Año', 'Tipo', 'Propietario', 'Teléfono', 'Email', 'Documento', 'Fecha vencimiento', 'Días restantes']
  const rows = filas.map(r => [
    r.vehiculo.placa,
    r.vehiculo.marca,
    r.vehiculo.modelo,
    r.vehiculo.anio,
    r.vehiculo.tipo === 'light' ? 'Liviano' : r.vehiculo.tipo === 'heavy' ? 'Pesado' : 'Motocicleta',
    r.propietario.nombre,
    r.propietario.telefono,
    r.propietario.email,
    r.propietario.documento,
    r.fecha_vencimiento,
    r.vence_en_dias,
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rtm-vencimiento-${diasUmbral}dias-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Tarjeta de métrica ────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand:   'text-brand bg-brand-soft',
    danger:  'text-danger bg-danger-soft',
    warning: 'text-warning bg-warning-soft',
    success: 'text-success bg-success-soft',
  }
  return (
    <div className="bg-surface rounded-xl border border-border p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-ink leading-none mb-1">
          {value ?? <span className="w-12 h-6 bg-border rounded animate-pulse inline-block" />}
        </p>
        <p className="text-sm font-medium text-ink-2">{label}</p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Fila de la tabla ──────────────────────────────────────────────────────────

function FilaRTM({ r }) {
  const { badge, dot } = diasColor(r.vence_en_dias)
  const tipoLabel = { light: 'Liviano', heavy: 'Pesado', motorcycle: 'Moto' }[r.vehiculo.tipo] ?? r.vehiculo.tipo

  return (
    <tr className="border-t border-border hover:bg-card/40 transition-colors">
      <td className="px-4 py-3">
        <span className="font-mono font-bold text-ink text-sm tracking-widest">{r.vehiculo.placa}</span>
        <p className="text-xs text-muted mt-0.5">{tipoLabel}</p>
      </td>
      <td className="px-4 py-3 text-sm text-ink">
        {r.vehiculo.marca}
        <p className="text-xs text-muted">{r.vehiculo.modelo} · {r.vehiculo.anio}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-ink">{r.propietario.nombre || '—'}</p>
        <p className="text-xs text-muted font-mono">{r.propietario.documento}</p>
      </td>
      <td className="px-4 py-3">
        {r.propietario.telefono ? (
          <a
            href={`https://wa.me/57${r.propietario.telefono}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-success hover:text-success/80 text-sm font-medium transition"
          >
            <Phone className="w-3.5 h-3.5" />
            {r.propietario.telefono}
          </a>
        ) : (
          <span className="text-muted text-sm">—</span>
        )}
        {r.propietario.email && (
          <p className="text-xs text-muted mt-0.5 truncate max-w-[160px]">{r.propietario.email}</p>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-ink-2">
        {new Date(r.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-CO', {
          day: '2-digit', month: 'short', year: 'numeric'
        })}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          {r.vence_en_dias === 0 ? 'Hoy' : `${r.vence_en_dias} días`}
        </span>
      </td>
    </tr>
  )
}

// ── Vista móvil de una tarjeta RTM ────────────────────────────────────────────

function CardRTM({ r }) {
  const { badge, dot } = diasColor(r.vence_en_dias)
  const tipoLabel = { light: 'Liviano', heavy: 'Pesado', motorcycle: 'Moto' }[r.vehiculo.tipo] ?? r.vehiculo.tipo

  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono font-bold text-ink tracking-widest">{r.vehiculo.placa}</span>
          <p className="text-xs text-muted">{r.vehiculo.marca} {r.vehiculo.modelo} · {r.vehiculo.anio} · {tipoLabel}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          {r.vence_en_dias === 0 ? 'Hoy' : `${r.vence_en_dias}d`}
        </span>
      </div>
      <div className="border-t border-border pt-3 space-y-1">
        <p className="text-sm font-medium text-ink">{r.propietario.nombre || '—'}</p>
        <p className="text-xs text-muted font-mono">{r.propietario.documento}</p>
        {r.propietario.telefono && (
          <a
            href={`https://wa.me/57${r.propietario.telefono}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-success text-sm font-medium"
          >
            <Phone className="w-3.5 h-3.5" /> {r.propietario.telefono}
          </a>
        )}
      </div>
      <div className="text-xs text-muted">
        Vence: {new Date(r.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

const FILTROS = [
  { label: '30 días', dias: 30 },
  { label: '60 días', dias: 60 },
  { label: '90 días', dias: 90 },
]

export default function RTMDashboard() {
  const [diasFiltro, setDiasFiltro] = useState(60)

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => getDashboardSummary().then(r => r.data),
    staleTime: 2 * 60 * 1000,
  })

  const { data: rtmData, isLoading: loadingRTM, refetch, isFetching } = useQuery({
    queryKey: ['rtm-vencimiento', diasFiltro],
    queryFn: () => getRTMVencimiento(diasFiltro).then(r => r.data),
    staleTime: 60 * 1000,
  })

  const resultados = rtmData?.resultados ?? []

  return (
    <div className="p-4 md:p-7 max-w-6xl">
      {/* Encabezado */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-ink mb-1">Panel de inteligencia</h1>
        <p className="text-ink-2 text-sm">Seguimiento de RTM y métricas operativas del CDA</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={ClipboardList}
          label="Inspecciones totales"
          value={loadingSummary ? null : summary?.total_inspecciones ?? 0}
          sub={`${summary?.inspecciones_este_mes ?? 0} este mes`}
          color="brand"
        />
        <MetricCard
          icon={CheckCircle}
          label="Aprobadas"
          value={loadingSummary ? null : summary?.aprobadas ?? 0}
          color="success"
        />
        <MetricCard
          icon={Users}
          label="Clientes nuevos"
          value={loadingSummary ? null : summary?.clientes_nuevos_este_mes ?? 0}
          sub="Este mes"
          color="brand"
        />
        <MetricCard
          icon={AlertTriangle}
          label="RTM vencen pronto"
          value={loadingSummary ? null : summary?.rtm_vencen_30_dias ?? 0}
          sub="Próximos 30 días"
          color="danger"
        />
      </div>

      {/* Tabla RTM */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {/* Header tabla */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              RTM próximas a vencer
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isFetching ? 'Actualizando...' : `${rtmData?.total ?? 0} vehículo${rtmData?.total !== 1 ? 's' : ''} encontrado${rtmData?.total !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro de días */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              {FILTROS.map(f => (
                <button
                  key={f.dias}
                  onClick={() => setDiasFiltro(f.dias)}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${
                    diasFiltro === f.dias
                      ? 'bg-accent text-white'
                      : 'text-ink-2 hover:bg-canvas hover:text-ink'
                  }`}
                >
                  {f.label}
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

            {resultados.length > 0 && (
              <button
                onClick={() => exportarCSV(resultados, diasFiltro)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-ink-2 hover:text-ink hover:bg-canvas transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabla desktop */}
        {loadingRTM ? (
          <div className="hidden md:flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : resultados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Car className="w-10 h-10 text-muted mb-3" />
            <p className="text-ink font-semibold mb-1">Sin vencimientos en {diasFiltro} días</p>
            <p className="text-ink-2 text-sm">No hay RTM próximas a vencer en este período.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Placa</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Vehículo</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Propietario</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Contacto</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Vencimiento</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Tiempo restante</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map(r => <FilaRTM key={r.certificado_id} r={r} />)}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden p-4 space-y-3">
              {resultados.map(r => <CardRTM key={r.certificado_id} r={r} />)}
            </div>
          </>
        )}

        {/* Leyenda de colores */}
        {resultados.length > 0 && (
          <div className="flex flex-wrap gap-4 px-5 py-3 border-t border-border">
            {[
              { label: 'Crítico (≤ 15 días)',  dot: 'bg-danger' },
              { label: 'Urgente (≤ 30 días)',  dot: 'bg-warning' },
              { label: 'Próximo (≤ 60 días)',  dot: 'bg-info' },
              { label: 'Normal (> 60 días)',   dot: 'bg-success' },
            ].map(({ label, dot }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-muted">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                {label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
