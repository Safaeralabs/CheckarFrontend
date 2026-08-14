import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import api from '../../api/client'
import { STATUS_MAP, VEHICLE_TYPE_LABELS, FUEL_LABELS, formatDate, formatDateTime } from '../../lib/utils'
import { PRE_EVAL_ITEMS, VISUAL_ITEMS, MECH_ITEMS } from '../../lib/inspectionItems'

const CLOSED_STATUSES = ['approved', 'rejected', 'certified']

const YESNO_LABELS = { yes: 'Sí', no: 'No', na: 'N/A' }
const PASSFAIL_LABELS = { pass: 'Cumple', fail: 'No cumple', na: 'N/A' }

const RESULT_COLORS = {
  yes: '#16a34a', pass: '#16a34a',
  no: '#dc2626', fail: '#dc2626',
  na: '#94a3b8',
}

function ResultPill({ value, labels }) {
  const color = RESULT_COLORS[value] ?? '#94a3b8'
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 999,
      fontSize: 9.5, fontWeight: 700, color: '#fff', background: color,
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
    }}>
      {labels[value] ?? '—'}
    </span>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <div style={{ border: '1px solid #94a3b8', borderTop: 'none' }}>
      <div style={{ padding: '6px 12px', background: '#f1f5f9', borderBottom: '1px solid #94a3b8' }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 8.5, color: '#64748b' }}>{subtitle}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function ItemRow({ label, value, labels }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      padding: '5px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 9.5,
    }}>
      <span>{label}</span>
      <ResultPill value={value} labels={labels} />
    </div>
  )
}

function GroupedChecklist({ items, values, labels }) {
  const categories = [...new Set(items.map(i => i.category))]
  return categories.map(cat => (
    <div key={cat}>
      <div style={{ padding: '4px 12px', background: '#f8fafc', fontSize: 8, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {cat}
      </div>
      {items.filter(i => i.category === cat).map(item => (
        <ItemRow key={item.key} label={item.label} value={values[item.key]?.status} labels={labels} />
      ))}
    </div>
  ))
}

export default function InspectionReport() {
  const { id } = useParams()

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection-report', id],
    queryFn: () => api.get(`inspections/records/${id}/`).then(r => r.data),
  })

  const { data: apt } = useQuery({
    queryKey: ['appointment-report', inspection?.appointment],
    queryFn: () => api.get(`scheduling/appointments/${inspection.appointment}/`).then(r => r.data),
    enabled: !!inspection?.appointment,
  })

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle-report', apt?.vehicle],
    queryFn: () => api.get(`vehicles/${apt.vehicle}/`).then(r => r.data),
    enabled: !!apt?.vehicle,
  })

  const { data: preEvalData } = useQuery({
    queryKey: ['pre-eval-report', id],
    queryFn: () => api.get('inspections/pre-evaluation/', { params: { inspection: id } }).then(r => r.data?.results ?? r.data ?? []),
    enabled: !!id,
  })

  const { data: checklistData } = useQuery({
    queryKey: ['checklist-report', id],
    queryFn: () => api.get('inspections/checklist/', { params: { inspection: id } }).then(r => r.data?.results ?? r.data ?? []),
    enabled: !!id,
  })

  const { data: tireData } = useQuery({
    queryKey: ['tire-report', id],
    queryFn: () => api.get('inspections/tire-pressure/', { params: { inspection: id } }).then(r => (r.data?.results ?? r.data ?? [])[0] ?? null),
    enabled: !!id,
  })

  const { data: axlesData } = useQuery({
    queryKey: ['axles-report', tireData?.id],
    queryFn: () => api.get('inspections/tire-pressure-axles/', { params: { record: tireData.id } }).then(r => r.data?.results ?? r.data ?? []),
    enabled: !!tireData?.id,
  })

  const { data: photosData } = useQuery({
    queryKey: ['photos-report', id],
    queryFn: () => api.get('inspections/photos/', { params: { inspection: id } }).then(r => r.data?.results ?? r.data ?? []),
    enabled: !!id,
  })

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const preEvalMap = Object.fromEntries((preEvalData ?? []).map(i => [i.item_key, i]))
  const checklistMap = Object.fromEntries((checklistData ?? []).map(i => [i.item_name, i]))
  const axles = axlesData ?? []
  const photos = photosData ?? []

  const plate = vehicle?.plate ?? inspection?.vehicle_plate ?? '—'
  const customerName = apt?.customer_detail
    ? `${apt.customer_detail.first_name} ${apt.customer_detail.last_name}`
    : inspection?.customer_name ?? '—'

  const isClosed = CLOSED_STATUSES.includes(inspection?.status)
  const approved = inspection?.status === 'approved' || inspection?.status === 'certified'
  const statusInfo = STATUS_MAP[inspection?.status] ?? { label: inspection?.status ?? '—' }

  const st = {
    page: { background: '#fff', color: '#1e293b', fontFamily: 'Arial, sans-serif', fontSize: 11,
            maxWidth: 800, margin: '0 auto', padding: '20px 16px' },
    printBtn: { position: 'fixed', bottom: 24, right: 24, display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, background: '#0ea5e9', color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, zIndex: 999 },
    metaCell: { border: '1px solid #94a3b8', padding: '5px 10px' },
    metaLabel: { fontSize: 7.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
    metaValue: { fontSize: 10, fontWeight: 600 },
  }

  return (
    <>
      <style>{`
        .rep-g2 { display: grid; grid-template-columns: 1fr; }
        .rep-g3 { display: grid; grid-template-columns: 1fr; }
        .rep-photos { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
        @media screen and (min-width: 700px) {
          .rep-g2 { grid-template-columns: repeat(2, 1fr); }
          .rep-g3 { grid-template-columns: repeat(3, 1fr); }
          .rep-photos { grid-template-columns: repeat(3, 1fr); }
        }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .rep-page-break { page-break-before: always; }
          .rep-g2 { grid-template-columns: repeat(2, 1fr) !important; }
          .rep-g3 { grid-template-columns: repeat(3, 1fr) !important; }
          .rep-photos { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>

      <button className="no-print" style={st.printBtn} onClick={() => window.print()}>
        <Printer size={16} /> Imprimir / Guardar PDF
      </button>

      <div style={st.page}>
        {/* ── Encabezado ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                       border: '1px solid #94a3b8', borderBottom: 'none', padding: '10px 14px' }}>
          <img src="/checkar-logo-sidebar.png" alt="Checkar" style={{ height: 34, width: 'auto' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>REPORTE DE INSPECCIÓN</div>
            <div style={{ fontSize: 8.5, color: '#64748b' }}>Técnico-mecánica y de emisiones contaminantes</div>
            <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 2 }}>
              Calle 15 No. 12B – 44 Riohacha – La Guajira · Cel: 318 3586103
            </div>
          </div>
        </div>

        {/* ── Datos generales ── */}
        <div className="rep-g3">
          <div style={st.metaCell}>
            <div style={st.metaLabel}>Placa</div>
            <div style={{ ...st.metaValue, fontFamily: 'monospace', letterSpacing: 1 }}>{plate?.toUpperCase()}</div>
          </div>
          <div style={st.metaCell}>
            <div style={st.metaLabel}>Vehículo</div>
            <div style={st.metaValue}>
              {[vehicle?.brand, vehicle?.model_line, vehicle?.model_year].filter(Boolean).join(' ') || '—'}
            </div>
          </div>
          <div style={st.metaCell}>
            <div style={st.metaLabel}>Inspección #</div>
            <div style={st.metaValue}>{inspection?.id}</div>
          </div>
        </div>
        <div className="rep-g3">
          <div style={st.metaCell}>
            <div style={st.metaLabel}>Cliente</div>
            <div style={st.metaValue}>{customerName}</div>
          </div>
          <div style={st.metaCell}>
            <div style={st.metaLabel}>Tipo</div>
            <div style={st.metaValue}>
              {inspection?.inspection_type === 'official' ? 'Oficial' : 'Pre-técnica'}
              {' · '}
              {VEHICLE_TYPE_LABELS[vehicle?.vehicle_type] ?? vehicle?.vehicle_type ?? '—'}
              {' · '}
              {FUEL_LABELS[vehicle?.fuel_type] ?? vehicle?.fuel_type ?? '—'}
            </div>
          </div>
          <div style={st.metaCell}>
            <div style={st.metaLabel}>Estado</div>
            <div style={st.metaValue}>{statusInfo.label}</div>
          </div>
        </div>
        <div className="rep-g2" style={{ marginBottom: 10 }}>
          <div style={st.metaCell}>
            <div style={st.metaLabel}>Inicio</div>
            <div style={st.metaValue}>{formatDateTime(inspection?.started_at)}</div>
          </div>
          <div style={st.metaCell}>
            <div style={st.metaLabel}>Finalización</div>
            <div style={st.metaValue}>{formatDateTime(inspection?.completed_at)}</div>
          </div>
        </div>

        {/* ── Resultado final ── */}
        {isClosed && (
          <div style={{
            padding: '12px 16px', marginBottom: 10, borderRadius: 6,
            border: `2px solid ${approved ? '#16a34a' : '#dc2626'}`,
            background: approved ? '#f0fdf4' : '#fef2f2',
            WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: approved ? '#166534' : '#991b1b', textTransform: 'uppercase' }}>
              Inspección {statusInfo.label}
            </div>
            {inspection?.observations && (
              <div style={{ fontSize: 9.5, color: '#334155', marginTop: 6, lineHeight: 1.5 }}>
                {inspection.observations}
              </div>
            )}
          </div>
        )}

        {/* ── Pre-evaluación ── */}
        <Section title="Pre-evaluación" subtitle="Requisitos previos verificados antes de iniciar la inspección">
          {PRE_EVAL_ITEMS.map(item => (
            <ItemRow key={item.key} label={item.label} value={preEvalMap[item.key]?.result} labels={YESNO_LABELS} />
          ))}
        </Section>

        {/* ── Presión de neumáticos ── */}
        <Section title="Presión de neumáticos">
          {axles.length === 0 && !tireData ? (
            <div style={{ padding: '8px 12px', fontSize: 9.5, color: '#94a3b8' }}>No registrado.</div>
          ) : (
            <>
              {axles.map(axle => (
                <div key={axle.axle_number} style={{ padding: '5px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 9.5, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700 }}>Eje {axle.axle_number}</span>
                  {axle.is_double_tire ? (
                    <span>
                      Izq. ext {axle.left_outer ?? '—'} psi · Izq. int {axle.left_inner ?? '—'} psi ·{' '}
                      Der. int {axle.right_inner ?? '—'} psi · Der. ext {axle.right_outer ?? '—'} psi
                    </span>
                  ) : (
                    <span>{axle.single_pressure ?? '—'} psi</span>
                  )}
                </div>
              ))}
              <div style={{ padding: '5px 12px', fontSize: 9.5, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Llanta(s) de repuesto</span>
                <span>
                  {tireData?.no_spare_tire
                    ? 'No tiene'
                    : [tireData?.spare_tire_1, tireData?.spare_tire_2].filter(v => v != null).map(v => `${v} psi`).join(' · ') || '—'}
                </span>
              </div>
            </>
          )}
        </Section>

        {/* ── Inspección visual ── */}
        <Section title="Inspección visual" subtitle="Estado visible del vehículo">
          <GroupedChecklist items={VISUAL_ITEMS} values={checklistMap} labels={PASSFAIL_LABELS} />
        </Section>

        {/* ── Pruebas mecánicas ── */}
        <Section title="Pruebas mecánicas" subtitle="Sistemas mecánicos del vehículo">
          <GroupedChecklist items={MECH_ITEMS} values={checklistMap} labels={PASSFAIL_LABELS} />
        </Section>

        {/* ── Fotografías ── */}
        <Section title="Fotografías">
          {photos.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: 9.5, color: '#94a3b8' }}>Sin fotografías registradas.</div>
          ) : (
            <div className="rep-photos" style={{ padding: 8 }}>
              {photos.map(p => (
                <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <img src={p.photo} alt={p.label} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                  <div style={{ fontSize: 8, padding: '3px 6px', color: '#64748b', textTransform: 'capitalize' }}>
                    {p.label?.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <div style={{ textAlign: 'center', fontSize: 8, color: '#94a3b8', marginTop: 10, fontWeight: 600 }}>
          Reporte generado el {formatDate(new Date().toISOString())} · C.D.A. CHECKAR S.A.S. — Resolución No. 001133 del 27 de marzo de 2009
        </div>
      </div>
    </>
  )
}
