import { useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, FileText, PenLine, X } from 'lucide-react'
import api from '../../api/client'
import SignaturePad from '../../components/SignaturePad'
import { formatDate, formatDateTime } from '../../lib/utils'

const DAMAGE_SYMBOLS = { rayado: '—', golpe: 'X', mancha: 'O', partido: '?' }
const DAMAGE_COLORS  = { rayado: '#f59e0b', golpe: '#ef4444', mancha: '#f97316', partido: '#8b5cf6' }

function CarSVGReadonly({ annotations = [] }) {
  return (
    <svg viewBox="0 0 200 380" className="w-32" style={{ height: 'auto' }}>
      <rect x="30" y="50"  width="140" height="280" rx="22" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
      <rect x="40" y="50"  width="120" height="65"  rx="14" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1"/>
      <rect x="55" y="108" width="90"  height="42"  rx="6"  fill="#bae6fd" opacity="0.8"/>
      <rect x="35" y="145" width="130" height="90"  rx="4"  fill="#dde3ec" stroke="#94a3b8" strokeWidth="0.5"/>
      <line x1="100" y1="148" x2="100" y2="232" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4 3"/>
      <rect x="55" y="232" width="90"  height="42"  rx="6"  fill="#bae6fd" opacity="0.8"/>
      <rect x="40" y="268" width="120" height="62"  rx="14" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1"/>
      <rect x="8"   y="62"  width="26" height="48" rx="8" fill="#475569"/>
      <rect x="166" y="62"  width="26" height="48" rx="8" fill="#475569"/>
      <rect x="8"   y="258" width="26" height="48" rx="8" fill="#475569"/>
      <rect x="166" y="258" width="26" height="48" rx="8" fill="#475569"/>
      <text x="100" y="24"  textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600">FRENTE</text>
      <text x="100" y="372" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600">TRASERO</text>
      {annotations.map((m, i) => (
        <g key={i}>
          <circle cx={m.x} cy={m.y} r="10" fill="white" stroke={DAMAGE_COLORS[m.type] ?? '#666'} strokeWidth="1.5" opacity="0.9"/>
          <text x={m.x} y={m.y + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill={DAMAGE_COLORS[m.type] ?? '#666'}>
            {DAMAGE_SYMBOLS[m.type] ?? '?'}
          </text>
        </g>
      ))}
    </svg>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm text-ink font-semibold ml-4 text-right">{value || '—'}</span>
    </div>
  )
}

export default function ClientSignature() {
  const { receptionId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const sigRef = useRef(null)
  const [sigOpen, setSigOpen] = useState(false)
  const [sigError, setSigError] = useState('')
  const [done, setDone] = useState(false)

  const { data: rec, isLoading } = useQuery({
    queryKey: ['client-reception', receptionId],
    queryFn: () => api.get(`operations/receptions/${receptionId}/`).then(r => r.data),
    enabled: !!receptionId,
  })

  const { data: apt } = useQuery({
    queryKey: ['apt-for-sig', rec?.appointment],
    queryFn: () => api.get(`scheduling/appointments/${rec.appointment}/`).then(r => r.data),
    enabled: !!rec?.appointment,
  })

  const { data: vehicle } = useQuery({
    queryKey: ['veh-for-sig', apt?.vehicle],
    queryFn: () => api.get(`vehicles/${apt.vehicle}/`).then(r => r.data),
    enabled: !!apt?.vehicle,
  })

  const signMut = useMutation({
    mutationFn: (sig) => api.post(`operations/receptions/${receptionId}/client_sign/`, { signature_client: sig }),
    onSuccess: () => {
      setSigOpen(false)
      setDone(true)
      qc.invalidateQueries({ queryKey: ['client-reception', receptionId] })
      qc.invalidateQueries({ queryKey: ['pending-signatures'] })
    },
    onError: (err) => {
      setSigError(err.response?.data?.detail ?? 'Error al guardar la firma.')
    },
  })

  const handleConfirmSign = () => {
    setSigError('')
    if (sigRef.current?.isEmpty()) {
      setSigError('Por favor dibuja tu firma antes de confirmar.')
      return
    }
    signMut.mutate(sigRef.current.toDataURL())
  }

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!rec) return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <p className="text-muted text-sm">Recepción no encontrada.</p>
    </div>
  )

  if (done || rec.signature_status === 'fully_signed') {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="rounded-2xl border-2 border-success bg-success-soft p-8 text-center">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
          <h2 className="text-xl font-bold text-success mb-2">Recepción firmada</h2>
          <p className="text-sm text-green-700">
            Tu firma ha sido registrada. La inspección de tu vehículo puede comenzar.
          </p>
          <Link
            to="/cliente"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    )
  }

  const inv = rec.inventory ?? {}
  const annotations = rec.damage_annotations ?? []

  return (
    <>
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-5">
        <Link to="/cliente" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition">
          <ArrowLeft className="w-4 h-4" /> Inicio
        </Link>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Firma de recepción</h1>
            <p className="text-sm text-muted mt-0.5">Revisa los datos y firma para autorizar la inspección</p>
          </div>
        </div>

        {/* Datos del vehículo */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Vehículo</h2>
          <Row label="Placa" value={vehicle?.plate?.toUpperCase()} />
          <Row label="Marca / Línea" value={`${vehicle?.brand ?? ''} ${vehicle?.model_line ?? ''}`.trim()} />
          <Row label="Año" value={vehicle?.model_year} />
          <Row label="Kilometraje" value={vehicle?.mileage?.toLocaleString('es-CO')} />
          <Row label="Fecha de recepción" value={formatDateTime(rec.arrival_time ?? rec.created_at)} />
        </div>

        {/* Tipo de inspección */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Inspección</h2>
          <Row label="Tipo" value={rec.inspection_type === 'official' ? 'RTMyEC Oficial' : rec.inspection_type === 'preventiva' ? 'Preventiva' : 'Pre-técnica'} />
          <Row label="Subtipo" value={rec.inspection_subtype === 'reinspeccion' ? 'Re-inspección' : 'Primera inspección'} />
          <Row label="Costo" value={rec.inspection_cost ? `$ ${Number(rec.inspection_cost).toLocaleString('es-CO')}` : ''} />
        </div>

        {/* Inventario */}
        {Object.values(inv).some(Boolean) && (
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Inventario declarado</h2>
            {[
              ['Llavero', inv.llavero], ['Equipo de carretera', inv.equipo_carretera],
              ['Encendedor', inv.encendedor], ['Radio', inv.radio],
              ['Extintor', inv.extintor], ['Tapete', inv.tapete],
              ['Herramientas', inv.herramientas], ['Parlantes', inv.parlantes],
              ['N° sillas', inv.num_sillas], ['Otros', inv.otros],
            ].filter(([, v]) => v).map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
          </div>
        )}

        {/* Esquema de daños */}
        {annotations.length > 0 && (
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Daños registrados</h2>
            <div className="flex items-center gap-6">
              <CarSVGReadonly annotations={annotations} />
              <div className="flex flex-wrap gap-2">
                {['rayado', 'golpe', 'mancha', 'partido'].map(t => {
                  const n = annotations.filter(a => a.type === t).length
                  if (!n) return null
                  return (
                    <span key={t} className="px-2 py-1 rounded-lg text-xs font-medium bg-canvas border border-border text-ink">
                      {DAMAGE_SYMBOLS[t]} {t}: {n}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Notas */}
        {rec.notes && (
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Notas del operador</h2>
            <p className="text-sm text-ink-2 leading-relaxed">{rec.notes}</p>
          </div>
        )}

        {/* Cláusula */}
        <div className="bg-canvas rounded-xl border border-border p-4 text-xs text-muted leading-relaxed">
          Con mi firma en este documento entrego el vehículo para iniciar el proceso de inspección técnico mecánica
          y de emisiones contaminantes realizadas en el CDA. Reconozco que el costo de la inspección es de{' '}
          <strong className="text-ink">$ {rec.inspection_cost ? Number(rec.inspection_cost).toLocaleString('es-CO') : '—'}</strong>.
        </div>

        {/* Botón de firma */}
        <button
          onClick={() => setSigOpen(true)}
          className="w-full py-4 rounded-xl bg-brand hover:bg-brand-light text-white font-bold text-sm transition flex items-center justify-center gap-2"
        >
          <PenLine className="w-5 h-5" /> Firmar recepción
        </button>
      </div>

      {/* Modal de firma */}
      {sigOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-base font-bold text-ink">Tu firma</h2>
            <button onClick={() => setSigOpen(false)} className="p-1 rounded-lg hover:bg-surface transition">
              <X className="w-5 h-5 text-muted" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
            <p className="text-sm text-muted text-center max-w-xs">
              Dibuja tu firma en el recuadro de abajo para confirmar la recepción del vehículo.
            </p>
            <div className="w-full max-w-md">
              <SignaturePad ref={sigRef} label="Firma del cliente" />
            </div>
            {sigError && (
              <p className="text-sm text-danger">{sigError}</p>
            )}
          </div>

          <div className="p-4 border-t border-border flex gap-3">
            <button
              onClick={() => setSigOpen(false)}
              className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-ink hover:bg-surface transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmSign}
              disabled={signMut.isPending}
              className="flex-2 flex-1 py-3 rounded-xl bg-brand hover:bg-brand-light text-white font-bold text-sm transition disabled:opacity-60"
            >
              {signMut.isPending ? 'Guardando...' : 'Confirmar firma'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
