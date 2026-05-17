import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import api from '../../api/client'
import { formatDate } from '../../lib/utils'

const DAMAGE_SYMBOLS = { rayado: '—', golpe: 'X', mancha: 'O', partido: '?' }
const DAMAGE_COLORS  = { rayado: '#f59e0b', golpe: '#ef4444', mancha: '#f97316', partido: '#8b5cf6' }

const VEHICLE_TYPE_LABELS  = { light: 'Liviano', heavy: 'Pesado', motorcycle: 'Motocicleta' }
const FUEL_LABELS          = { gasoline: 'Gasolina', diesel: 'Diésel', hybrid: 'Híbrido', electric: 'Eléctrico', gas: 'Gas' }
const SERVICE_LABELS       = { particular: 'Particular', commercial: 'Comercial', public: 'Público' }
const VEHICLE_CLASS_LABELS = { auto: 'Automóvil', pickup: 'Camioneta', suv: 'Campero', van: 'Microbús/Van', truck: 'Camión', bus: 'Bus', motorcycle: 'Motocicleta', other: 'Otro' }

function CarSVGReadonly({ annotations = [] }) {
  return (
    <svg viewBox="0 0 200 380" style={{ width: 140, height: 'auto' }}>
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

function Row({ label, value, cols = 1 }) {
  return (
    <div style={{ gridColumn: `span ${cols}`, borderBottom: '1px solid #e2e8f0', padding: '4px 0' }}>
      <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}:{' '}
      </span>
      <span style={{ fontSize: 10, color: '#1e293b' }}>{value || '—'}</span>
    </div>
  )
}

function SigBox({ label, dataUrl }) {
  return (
    <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 8px', minHeight: 80, flex: 1 }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 4 }}>
        {label}
      </div>
      {dataUrl
        ? <img src={dataUrl} alt="firma" style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }} />
        : <div style={{ height: 50 }} />
      }
    </div>
  )
}

export default function FR25Print() {
  const { receptionId } = useParams()

  const { data: rec, isLoading } = useQuery({
    queryKey: ['reception-print', receptionId],
    queryFn: () => api.get(`operations/receptions/${receptionId}/`).then(r => r.data),
  })

  const { data: apt } = useQuery({
    queryKey: ['appointment-for-print', rec?.appointment],
    queryFn: () => api.get(`scheduling/appointments/${rec.appointment}/`).then(r => r.data),
    enabled: !!rec?.appointment,
  })

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle-for-print', apt?.vehicle],
    queryFn: () => api.get(`vehicles/${apt.vehicle}/`).then(r => r.data),
    enabled: !!apt?.vehicle,
  })

  const { data: owner } = useQuery({
    queryKey: ['owner-for-print', vehicle?.owner],
    queryFn: () => api.get(`auth/users/${vehicle.owner}/`).then(r => r.data),
    enabled: !!vehicle?.owner,
  })

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const inv = rec?.inventory ?? {}
  const annotations = rec?.damage_annotations ?? []

  const infoRows = [
    ['Nombre', apt?.customer_detail ? `${apt.customer_detail.first_name} ${apt.customer_detail.last_name}` : ''],
    ['Cédula / Documento', apt?.customer_detail?.document_number],
    ['Teléfono', apt?.customer_detail?.phone],
    ['Fecha', formatDate(rec?.arrival_time ?? rec?.created_at)],
    ['Placa', vehicle?.plate],
    ['Nacionalidad', rec?.foreign_vehicle ? 'Extranjero' : 'Colombiano'],
    ['Clase', VEHICLE_CLASS_LABELS[vehicle?.vehicle_class] ?? vehicle?.vehicle_class],
    ['Combustible', FUEL_LABELS[vehicle?.fuel_type]],
    ['Servicio', SERVICE_LABELS[vehicle?.service_category]],
    ['Vidrios polarizados', vehicle?.tinted_windows ? 'Sí' : 'No'],
    ['Blindaje', vehicle?.armored ? 'Sí' : 'No'],
    ['Kilometraje', vehicle?.mileage?.toLocaleString('es-CO')],
    ['Ciudad de matrícula', vehicle?.registration_city],
  ]

  const invItems = [
    ['Llavero', inv.llavero], ['Equipo de Carretera', inv.equipo_carretera],
    ['Encendedor', inv.encendedor], ['Radio', inv.radio],
    ['Extintor', inv.extintor], ['Tapete', inv.tapete],
    ['Herramientas', inv.herramientas], ['Parlantes', inv.parlantes],
    ['N° de Sillas', inv.num_sillas], ['Otros', inv.otros],
  ]

  const st = {
    page: { background: '#fff', color: '#1e293b', fontFamily: 'Arial, sans-serif', fontSize: 11,
            maxWidth: 780, margin: '0 auto', padding: '24px 32px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              borderBottom: '2px solid #1e293b', paddingBottom: 10, marginBottom: 14 },
    h1: { fontSize: 18, fontWeight: 700, margin: 0 },
    sub: { fontSize: 11, color: '#64748b', margin: '2px 0 0' },
    badge: { border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 10px', fontSize: 10,
             textAlign: 'right', lineHeight: 1.6 },
    section: { marginBottom: 14 },
    sectionTitle: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
                    color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: 3, marginBottom: 6 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px' },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px 12px' },
    printBtn: { position: 'fixed', bottom: 24, right: 24, display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, background: '#0ea5e9', color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, zIndex: 999 },
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}</style>

      <button className="no-print" style={st.printBtn} onClick={() => window.print()}>
        <Printer size={16} /> Imprimir / Guardar PDF
      </button>

      <div style={st.page}>
        {/* Encabezado */}
        <div style={st.header}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0ea5e9', letterSpacing: -1 }}>checkar</div>
            <div style={st.sub}>CDA CHECKAR S.A.S · Calle 15 No. 12B–44 · Riohacha, La Guajira</div>
            <div style={{ ...st.sub, marginTop: 2 }}>
              <strong style={{ fontSize: 13 }}>RECEPCIÓN DE VEHÍCULOS</strong>
              {' · '}Revisión Técnico Mecánica y Emisiones Contaminantes
            </div>
          </div>
          <div style={st.badge}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>FR-25</div>
            <div>Versión: 11</div>
            <div>{formatDate(rec?.arrival_time ?? rec?.created_at)}</div>
          </div>
        </div>

        {/* Datos generales */}
        <div style={st.section}>
          <div style={st.sectionTitle}>Datos del cliente y vehículo</div>
          <div style={st.grid2}>
            {infoRows.map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
          </div>
        </div>

        {/* Tipo de inspección */}
        <div style={st.section}>
          <div style={st.sectionTitle}>Tipo de inspección</div>
          <div style={st.grid3}>
            <Row label="Tipo" value={rec?.inspection_type === 'official' ? 'RTMyEC' : rec?.inspection_type === 'preventiva' ? 'Preventiva' : 'Pre-técnica'} />
            <Row label="Subtipo" value={rec?.inspection_subtype === 'reinspeccion' ? 'Re-inspección' : 'Primera inspección'} />
            <Row label="Costo" value={rec?.inspection_cost ? `$ ${Number(rec.inspection_cost).toLocaleString('es-CO')}` : ''} />
          </div>
        </div>

        {/* Inventario + Esquema */}
        <div style={{ ...st.section, display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={st.sectionTitle}>Inventario del vehículo</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
              {invItems.map(([label, value]) => (
                <Row key={label} label={label} value={value} />
              ))}
            </div>
          </div>
          <div style={{ width: 160 }}>
            <div style={st.sectionTitle}>Esquema de daños</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <CarSVGReadonly annotations={annotations} />
              {annotations.length > 0 && (
                <div style={{ fontSize: 9, color: '#64748b', textAlign: 'center' }}>
                  {['rayado', 'golpe', 'mancha', 'partido'].map(t => {
                    const n = annotations.filter(a => a.type === t).length
                    if (!n) return null
                    return <span key={t} style={{ marginRight: 6 }}>{DAMAGE_SYMBOLS[t]} {t}:{n}</span>
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verificaciones */}
        <div style={st.section}>
          <div style={st.sectionTitle}>Verificaciones de recepción</div>
          <div style={st.grid2}>
            {[
              ['Placa confirmada',                 rec?.plate_confirmed],
              ['Cliente / propietario confirmado',  rec?.customer_confirmed],
              ['Documentos completos',              rec?.documents_complete],
              ['Objetos dentro del vehículo',       rec?.objects_in_vehicle],
            ].map(([label, val]) => (
              <Row key={label} label={label} value={val ? 'Sí' : 'No'} />
            ))}
          </div>
        </div>

        {/* Notas */}
        {rec?.notes && (
          <div style={st.section}>
            <div style={st.sectionTitle}>Notas</div>
            <div style={{ fontSize: 10, color: '#334155', lineHeight: 1.5 }}>{rec.notes}</div>
          </div>
        )}

        {/* Cláusulas */}
        <div style={{ ...st.section, fontSize: 8.5, color: '#64748b', lineHeight: 1.5,
                      background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
          <strong>Con mi firma en este documento entrego el vehículo</strong> para iniciar el proceso de inspección técnico mecánica
          y de emisiones contaminantes realizadas en el CDA.
          {' '}Me comprometo a leer las instrucciones detalladas en el respaldo del documento.
          {' '}Reconozco que la inspección de este vehículo tiene un costo de{' '}
          <strong>$ {rec?.inspection_cost ? Number(rec.inspection_cost).toLocaleString('es-CO') : '___________'}</strong>.
        </div>

        {/* Firmas */}
        <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
          <SigBox label="Funcionario del CDA" dataUrl={rec?.signature_officer} />
          <SigBox label="Cliente (Firma Autorizada)" dataUrl={rec?.signature_client} />
        </div>

        <div style={{ textAlign: 'center', fontSize: 8, color: '#94a3b8', marginTop: 10 }}>
          NOTA: UNA VEZ CANCELADA LA INSPECCIÓN NO SE DEVUELVE EL DINERO
        </div>
      </div>
    </>
  )
}
