import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, Circle, Clock, Download,
  FileText, ShieldCheck, XCircle,
} from 'lucide-react'
import api from '../../api/client'
import { formatDate, formatDateTime } from '../../lib/utils'

const STEPS = [
  { key: 'pending',              label: 'Pendiente' },
  { key: 'documents_validated',  label: 'Documentos validados' },
  { key: 'pre_evaluated',        label: 'Pre-evaluación' },
  { key: 'visual_review',        label: 'Inspección visual' },
  { key: 'mechanical_test',      label: 'Pruebas técnicas' },
  { key: 'results_recorded',     label: 'Resultados registrados' },
  { key: 'approved',             label: 'Aprobada' },
  { key: 'certified',            label: 'Certificado emitido' },
]
const STEP_KEYS = STEPS.map(s => s.key)

const TYPE_LABELS = { official: 'RTMyEC Oficial', pre_technical: 'Pre-técnica', preventiva: 'Preventiva' }
const CATEGORY_LABELS = {
  carroceria: 'Carrocería', luces: 'Luces', llantas: 'Llantas', vidrios: 'Vidrios',
  seguridad: 'Seguridad', motor: 'Motor', frenos: 'Frenos', dirección: 'Dirección',
  suspensión: 'Suspensión', transmisión: 'Transmisión', escape: 'Escape',
}

export default function InspectionDetail() {
  const { id } = useParams()

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection-detail', id],
    queryFn: () => api.get(`inspections/records/${id}/full_detail/`).then(r => r.data),
    enabled: !!id && id !== '0',
  })

  if (id === '0') return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <Link to="/cliente/citas" className="flex items-center gap-2 text-sm text-muted hover:text-ink mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver a citas
      </Link>
      <p className="text-muted text-sm">Selecciona una inspección desde tus citas.</p>
    </div>
  )

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!inspection) return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <p className="text-muted text-sm">Inspección no encontrada.</p>
    </div>
  )

  const currentIdx  = STEP_KEYS.indexOf(inspection.status)
  const isApproved  = ['approved', 'certified'].includes(inspection.status)
  const isRejected  = inspection.status === 'rejected'
  const isCertified = inspection.status === 'certified'
  const cert        = inspection.certificate_data

  const failedItems = (inspection.checklist_items ?? []).filter(i => i.status === 'fail')
  const passedItems = (inspection.checklist_items ?? []).filter(i => i.status === 'pass')
  const failedDocs  = (inspection.document_checks ?? []).filter(i => i.result === 'invalid')

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-5">
      <Link to="/cliente/citas" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition">
        <ArrowLeft className="w-4 h-4" /> Volver a citas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            <span className="font-mono text-brand">{inspection.vehicle_plate?.toUpperCase()}</span>
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {inspection.vehicle_brand} {inspection.vehicle_model} {inspection.vehicle_year}
            {' · '}{TYPE_LABELS[inspection.inspection_type] ?? inspection.inspection_type}
          </p>
          <p className="text-xs text-muted flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            {formatDateTime(inspection.started_at ?? inspection.created_at)}
          </p>
        </div>
        {isCertified && cert && (
          <a
            href={cert.file}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition"
          >
            <Download className="w-4 h-4" /> Certificado
          </a>
        )}
      </div>

      {/* Resultado destacado */}
      {(isApproved || isRejected) && (
        <div className={`rounded-2xl border-2 p-6 flex items-center gap-4 ${
          isApproved ? 'border-success bg-success-soft' : 'border-danger bg-danger-soft'
        }`}>
          {isApproved
            ? <ShieldCheck className="w-10 h-10 text-success flex-shrink-0" />
            : <XCircle    className="w-10 h-10 text-danger flex-shrink-0" />
          }
          <div>
            <p className={`text-lg font-bold ${isApproved ? 'text-success' : 'text-danger'}`}>
              Inspección {isApproved ? 'aprobada' : 'rechazada'}
            </p>
            {isCertified && cert && (
              <p className="text-xs text-green-700 mt-0.5">
                Cert. N° {cert.certificate_number} · Válido hasta {formatDate(cert.expires_at)}
              </p>
            )}
            {isRejected && failedItems.length > 0 && (
              <p className="text-xs text-danger mt-0.5">
                {failedItems.length} ítem{failedItems.length > 1 ? 's' : ''} no cumple{failedItems.length > 1 ? 'n' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Ítems que no cumplen */}
      {failedItems.length > 0 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-canvas flex items-center gap-2">
            <XCircle className="w-4 h-4 text-danger" />
            <h2 className="text-sm font-semibold text-ink">No cumplen ({failedItems.length})</h2>
          </div>
          <ul className="divide-y divide-border">
            {failedItems.map(item => (
              <li key={item.id} className="px-5 py-3 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-danger flex-shrink-0" />
                <div>
                  <p className="text-sm text-ink">{item.item_name.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted capitalize">{CATEGORY_LABELS[item.category] ?? item.category}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Observaciones */}
      {inspection.observations && (
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-muted" />
            <h2 className="text-sm font-semibold text-ink">Observaciones del inspector</h2>
          </div>
          <p className="text-sm text-ink-2 leading-relaxed">{inspection.observations}</p>
        </div>
      )}

      {/* Resumen del checklist */}
      {passedItems.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">
            Ítems evaluados — {passedItems.length} cumplen · {failedItems.length} no cumplen
          </h2>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all"
              style={{ width: `${(passedItems.length / (passedItems.length + failedItems.length)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-ink mb-4">Progreso</h2>
        <ol className="space-y-0">
          {STEPS.map((step, i) => {
            const done   = i < currentIdx
            const active = i === currentIdx
            const last   = i === STEPS.length - 1
            return (
              <li key={step.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    done    ? 'bg-success text-white'
                    : active && isRejected ? 'bg-danger text-white'
                    : active ? 'bg-accent text-white'
                    : 'bg-border text-muted'
                  }`}>
                    {done ? <CheckCircle className="w-3 h-3" />
                      : active && isRejected ? <XCircle className="w-3 h-3" />
                      : <Circle className="w-3 h-3" />}
                  </div>
                  {!last && <div className={`w-px my-1 ${done ? 'bg-success' : 'bg-border'}`} style={{ minHeight: 16 }} />}
                </div>
                <div className="pb-3 min-w-0">
                  <p className={`text-xs font-medium ${done || active ? 'text-ink' : 'text-muted'}`}>{step.label}</p>
                  {active && isRejected && <p className="text-xs text-danger">Rechazada</p>}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
