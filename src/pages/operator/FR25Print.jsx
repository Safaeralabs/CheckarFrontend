import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import api from '../../api/client'
import { formatDate } from '../../lib/utils'

// FR-25 v11 — control del formato oficial (fecha de edición de la plantilla, no de la transacción)
const FR25_TEMPLATE_DATE = '2025-02-08'

const DAMAGE_SYMBOLS = { rayado: '—', golpe: 'X', mancha: 'O', partido: '?', presion: 'psi' }
const DAMAGE_COLORS  = { rayado: '#f59e0b', golpe: '#ef4444', mancha: '#f97316', partido: '#8b5cf6', presion: '#0ea5e9' }
const DAMAGE_LABELS  = { rayado: 'Rayado', golpe: 'Golpe', mancha: 'Mancha', partido: 'Partido', presion: 'Presión' }

// Mapea la clase interna del vehículo a las 5 casillas del formato oficial
function officialClass(vehicleClass) {
  if (vehicleClass === 'auto') return 'automovil'
  if (vehicleClass === 'pickup') return 'camioneta'
  if (vehicleClass === 'suv') return 'campero'
  if (vehicleClass === 'motorcycle') return 'motocicleta'
  return 'otros' // van, truck, bus, other
}

function CarSVGReadonly({ annotations = [] }) {
  return (
    <svg viewBox="0 0 200 380" style={{ width: 130, height: 'auto' }}>
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
          <text x={m.x} y={m.y + 3} textAnchor="middle" fontSize={DAMAGE_SYMBOLS[m.type]?.length > 1 ? 6 : 9} fontWeight="700" fill={DAMAGE_COLORS[m.type] ?? '#666'}>
            {DAMAGE_SYMBOLS[m.type] ?? '?'}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ── Casilla de verificación estilo formato impreso ──────────────────────────
function CheckSq({ checked }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 10, height: 10, border: '1.2px solid #1e293b', marginRight: 3,
      flexShrink: 0, fontSize: 8, fontWeight: 900, lineHeight: 1,
    }}>
      {checked ? '✕' : ''}
    </span>
  )
}

function CheckOpt({ label, checked }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 10, fontSize: 9.5, color: '#1e293b' }}>
      <CheckSq checked={checked} /> {label}
    </span>
  )
}

function Cell({ label, children, style }) {
  return (
    <div style={{ border: '1px solid #94a3b8', padding: '4px 8px', ...style }}>
      <div style={{ fontSize: 8, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 10.5, color: '#1e293b', minHeight: 14 }}>
        {children}
      </div>
    </div>
  )
}

function SigBox({ label, dataUrl }) {
  return (
    <div style={{ border: '1px solid #94a3b8', padding: '6px 8px', minHeight: 80, flex: 1 }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 4, textAlign: 'center' }}>
        {label}
      </div>
      {dataUrl
        ? <img src={dataUrl} alt="firma" style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
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

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const inv = rec?.inventory ?? {}
  const annotations = rec?.damage_annotations ?? []
  const svc = vehicle?.service_category
  const cls = officialClass(vehicle?.vehicle_class)
  const fuel = vehicle?.fuel_type

  const invItemsRow1 = [
    ['Llavero', inv.llavero], ['Equipo de Carretera', inv.equipo_carretera],
    ['Encendedor', inv.encendedor], ['Radio', inv.radio], ['Extintor', inv.extintor],
  ]
  const invItemsRow2 = [
    ['Tapete', inv.tapete], ['Herramientas', inv.herramientas],
    ['Parlantes', inv.parlantes], ['No. de Sillas', inv.num_sillas], ['Otros', inv.otros],
  ]

  const st = {
    page: { background: '#fff', color: '#1e293b', fontFamily: 'Arial, sans-serif', fontSize: 11,
            maxWidth: 800, margin: '0 auto', padding: '20px 16px' },
    printBtn: { position: 'fixed', bottom: 24, right: 24, display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, background: '#0ea5e9', color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, zIndex: 999 },
    legalH: { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', textAlign: 'center', margin: '18px 0 6px' },
    legalP: { fontSize: 8.5, color: '#334155', lineHeight: 1.5, margin: '0 0 6px' },
  }

  return (
    <>
      <style>{`
        /* En pantalla (mobile/desktop) las grillas de 3-5 columnas pensadas
           para papel se apilan para que el texto no se aplaste. Al imprimir
           (o en pantallas anchas) vuelven al layout original del formato. */
        .fr25-g3, .fr25-g-clase, .fr25-g-esquema { display: grid; grid-template-columns: 1fr; }
        .fr25-g-inv { display: grid; grid-template-columns: repeat(2, 1fr); }
        @media screen and (min-width: 700px) {
          .fr25-g3        { grid-template-columns: 1.6fr 1.3fr 1fr; }
          .fr25-g-clase   { grid-template-columns: 2fr 1fr 1fr; }
          .fr25-g-inv     { grid-template-columns: repeat(5, 1fr); }
          .fr25-g-esquema { grid-template-columns: 1fr 1fr 1.3fr; }
        }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .fr25-page-break { page-break-before: always; }
          .fr25-g3        { grid-template-columns: 1.6fr 1.3fr 1fr !important; }
          .fr25-g-clase   { grid-template-columns: 2fr 1fr 1fr !important; }
          .fr25-g-inv     { grid-template-columns: repeat(5, 1fr) !important; }
          .fr25-g-esquema { grid-template-columns: 1fr 1fr 1.3fr !important; }
        }
      `}</style>

      <button className="no-print" style={st.printBtn} onClick={() => window.print()}>
        <Printer size={16} /> Imprimir / Guardar PDF
      </button>

      <div style={st.page}>
        {/* ── Encabezado ── */}
        <div className="fr25-g3" style={{ border: '1px solid #94a3b8', borderBottom: 'none' }}>
          <div style={{ padding: '8px 12px', borderRight: '1px solid #94a3b8' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0ea5e9', letterSpacing: -1 }}>checkar</div>
            <div style={{ fontSize: 8.5, color: '#64748b' }}>Centro de Diagnóstico Automotor</div>
            <div style={{ fontSize: 8.5, color: '#64748b', marginTop: 2 }}>
              Calle 15 No. 12B – 44 Riohacha – La Guajira · Cel: 318 3586103
            </div>
          </div>
          <div style={{ padding: '8px 12px', borderRight: '1px solid #94a3b8', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, textAlign: 'center' }}>RECEPCIÓN DE VEHÍCULOS</div>
            <div style={{ fontSize: 8.5, textAlign: 'center', marginTop: 3 }}>
              REVISIÓN TÉCNICO MECÁNICA Y EMISIONES CONTAMINANTES
            </div>
          </div>
          <div style={{ padding: '8px 12px', fontSize: 9.5, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>FR-25</div>
            <div>FECHA: {FR25_TEMPLATE_DATE}</div>
            <div>VERSIÓN: 11</div>
            {rec?.turn_number && (
              <div style={{ marginTop: 4, fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>
                TURNO: {rec.turn_number}
              </div>
            )}
          </div>
        </div>

        {/* ── Datos del cliente ── */}
        <div className="fr25-g3">
          <Cell label="Nombre Cliente">
            {apt?.customer_detail ? `${apt.customer_detail.first_name} ${apt.customer_detail.last_name}` : '—'}
          </Cell>
          <Cell label="Tipo de documento">
            <CheckOpt label="Cédula" checked={false} />
            <CheckOpt label="T.I." checked={false} />
            <CheckOpt label="Nit" checked={false} />
          </Cell>
          <Cell label="Fecha">{formatDate(rec?.arrival_time ?? rec?.created_at)}</Cell>
        </div>
        <div className="fr25-g3" style={{ borderTop: 'none' }}>
          <Cell label="Dirección" style={{ borderTop: 'none' }}>{apt?.customer_detail?.address || '—'}</Cell>
          <Cell label="Teléfono" style={{ borderTop: 'none' }}>{apt?.customer_detail?.phone || '—'}</Cell>
          <Cell label="Placa" style={{ borderTop: 'none' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: 1 }}>{vehicle?.plate}</span>
          </Cell>
        </div>
        <div className="fr25-g3" style={{ borderTop: 'none' }}>
          <Cell label="E-mail" style={{ borderTop: 'none' }}>{apt?.customer_detail?.email || '—'}</Cell>
          <Cell label="Tipo de servicio" style={{ borderTop: 'none' }}>
            <div><CheckOpt label="Enseñanza" checked={svc === 'teaching'} /><CheckOpt label="Público" checked={svc === 'public'} /></div>
            <div><CheckOpt label="Oficial" checked={svc === 'official'} /><CheckOpt label="Particular" checked={svc === 'particular'} /></div>
            {svc === 'commercial' && <div style={{ fontSize: 8.5, color: '#64748b', marginTop: 2 }}>Comercial (categoría interna)</div>}
          </Cell>
          <Cell label="Nacionalidad del Vehículo" style={{ borderTop: 'none' }}>
            <CheckOpt label="Colombiano" checked={!rec?.foreign_vehicle} />
            <CheckOpt label="Extranjero" checked={!!rec?.foreign_vehicle} />
          </Cell>
        </div>

        {/* ── Clase / Combustible / Vidrios / Blindaje ── */}
        <div className="fr25-g-clase" style={{ borderTop: 'none' }}>
          <Cell label="Clase / Combustible" style={{ borderTop: 'none' }}>
            <div>
              <CheckOpt label="Motocicleta" checked={cls === 'motocicleta'} />
              <CheckOpt label="Automóvil"   checked={cls === 'automovil'} />
              <CheckOpt label="Campero"     checked={cls === 'campero'} />
              <CheckOpt label="Camioneta"   checked={cls === 'camioneta'} />
              <CheckOpt label="Otros"       checked={cls === 'otros'} />
            </div>
            <div style={{ marginTop: 3 }}>
              <CheckOpt label="Gasolina" checked={fuel === 'gasoline'} />
              <CheckOpt label="Diésel"   checked={fuel === 'diesel'} />
              <CheckOpt label="Gas"      checked={fuel === 'gas'} />
              <CheckOpt label="Híbrido"  checked={fuel === 'hybrid'} />
              <CheckOpt label="Eléctrico" checked={fuel === 'electric'} />
            </div>
          </Cell>
          <Cell label="Vidrios Polarizados" style={{ borderTop: 'none' }}>
            <CheckOpt label="Sí" checked={!!vehicle?.tinted_windows} />
            <CheckOpt label="No" checked={!vehicle?.tinted_windows} />
          </Cell>
          <Cell label="Blindaje" style={{ borderTop: 'none' }}>
            <CheckOpt label="Sí" checked={!!vehicle?.armored} />
            <CheckOpt label="No" checked={!vehicle?.armored} />
          </Cell>
        </div>

        {/* ── Inventario ── */}
        <div className="fr25-g-inv" style={{ borderTop: 'none' }}>
          {invItemsRow1.map(([label, value]) => (
            <Cell key={label} label={label} style={{ borderTop: 'none' }}>{value || '—'}</Cell>
          ))}
        </div>
        <div className="fr25-g-inv" style={{ borderTop: 'none' }}>
          {invItemsRow2.map(([label, value]) => (
            <Cell key={label} label={label} style={{ borderTop: 'none' }}>{value || '—'}</Cell>
          ))}
        </div>

        {/* ── Esquema de daños + Kilometraje + Tipo de revisión ── */}
        <div className="fr25-g-esquema" style={{ borderTop: 'none' }}>
          <Cell label="Simbología de daños" style={{ borderTop: 'none' }}>
            {Object.keys(DAMAGE_LABELS).map(t => (
              <div key={t} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
                <span>{DAMAGE_LABELS[t]}</span>
                <span style={{ fontWeight: 700, color: DAMAGE_COLORS[t] }}>{DAMAGE_SYMBOLS[t]}</span>
              </div>
            ))}
          </Cell>
          <Cell label="Esquema" style={{ borderTop: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CarSVGReadonly annotations={annotations} />
          </Cell>
          <div style={{ border: '1px solid #94a3b8', borderTop: 'none', borderLeft: 'none', padding: '6px 10px' }}>
            <div style={{ fontSize: 8, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Kilometraje</div>
            <div style={{ fontSize: 10.5, marginBottom: 6 }}>
              {vehicle?.mileage?.toLocaleString('es-CO') ?? '—'}
              {vehicle?.non_functional && ' (no funcional)'}
            </div>
            <div style={{ fontSize: 8, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Tipo de revisión</div>
            <div><CheckOpt label="RTMYEC" checked={rec?.inspection_type === 'official'} /><CheckOpt label="Preventiva" checked={rec?.inspection_type === 'preventiva'} /></div>
            <div><CheckOpt label="Primera inspección" checked={rec?.inspection_subtype === 'primera'} /><CheckOpt label="Re-inspección" checked={rec?.inspection_subtype === 'reinspeccion'} /></div>
          </div>
        </div>

        {/* ── Declaraciones + costo ── */}
        <div style={{ border: '1px solid #94a3b8', borderTop: 'none', padding: '8px 12px', fontSize: 9 }}>
          <p style={{ margin: '2px 0' }}>✓ Con mi firma en este documento entrego el vehículo para iniciar el proceso de inspección técnico mecánica y de emisiones contaminantes realizadas en el CDA.</p>
          <p style={{ margin: '2px 0' }}>✓ Me comprometo a leer las instrucciones detalladas en el respaldo del documento.</p>
          <p style={{ margin: '2px 0' }}>
            ✓ Reconozco que la inspección de este vehículo tiene un costo de{' '}
            <strong>$ {rec?.inspection_cost ? Number(rec.inspection_cost).toLocaleString('es-CO') : '___________'}</strong>.
          </p>
        </div>

        {/* ── Firmas ── */}
        <div style={{ display: 'flex' }}>
          <SigBox label="Funcionario del CDA" dataUrl={rec?.signature_officer} />
          <SigBox label="Cliente (Firma Autorizada)" dataUrl={rec?.signature_client} />
        </div>

        <div style={{ textAlign: 'center', fontSize: 8, color: '#94a3b8', marginTop: 6, fontWeight: 700 }}>
          NOTA: UNA VEZ CANCELADA LA INSPECCIÓN NO SE DEVUELVE EL DINERO
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            RESPALDO — condiciones generales y contrato de servicio.
            Transcrito por OCR del PDF oficial provisto. Revisar contra el
            documento fuente antes de usar con clientes: el OCR de un
            documento escaneado puede introducir errores de transcripción
            en un texto contractual.
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="fr25-page-break">
          <div style={st.legalH}>Condiciones generales de inspección</div>

          <p style={st.legalP}><strong>Recepción de documentos:</strong> Con todos los documentos en regla y la ayuda del cliente se ingresan los datos requeridos por el software para que el vehículo pueda ser inspeccionado.</p>

          <p style={st.legalP}><strong>Inspección:</strong> El vehículo será sometido a las siguientes pruebas en la pista: prueba de ruidos, alineado de luces, inspección visual interna y externa, alineación, suspensión, frenos, emisiones contaminantes, de acuerdo a la Res. 3768 y NTC 5375, NTC 5385, NTC 4983, NTC 4231, NTC ISO IEC 17020. Para motocicletas las pruebas son inspección visual, luces, emisiones contaminantes y ruido, de acuerdo a la Res. 3768 y NTC 5365. El C.D.A. CHECKAR S.A.S. se encuentra habilitado por el Ministerio de Transporte con la Resolución No. 001133 del 27 de marzo de 2009 como Organismo de Inspección Tipo A, Clase B, para realizar la Revisión Técnico Mecánica y de Emisiones Contaminantes a vehículos livianos y motos, conforme a la Resolución 3768 de 2013. El CDA comunica a la Superintendencia de Puerto y Transporte, a la autoridad ambiental, al RUNT y a ONAC los resultados de la RTM y EC, así como el informe de motivo de rechazo, si lo hubiese.</p>

          <p style={{ ...st.legalP, fontWeight: 700, marginTop: 8 }}>Revisión técnico mecánica y de emisiones contaminantes para vehículos</p>

          <p style={st.legalP}><strong>Resultado de diagnóstico:</strong> Al momento de someter el vehículo a este diagnóstico se pueden obtener los resultados, según sea el caso, aprobado o rechazado. En caso de un diagnóstico rechazado, el cliente recibe un formato uniforme de resultado que indica las pruebas realizadas al vehículo, para que así pueda corregirlas. Deberá presentarse en el lugar donde se hizo la inspección con las correcciones respectivas de su vehículo; una vez vencidos los 15 días calendario, el vehículo será facturado nuevamente. Una vez efectuadas las reparaciones, el vehículo podrá volver por una sola vez sin costo a someter los aspectos reprobados en la visita inicial a la revisión sensorial. En la segunda visita al C.D.A., el vehículo en todos los casos será objeto de una inspección sensorial o revisión mecanizada según corresponda. Cuando en la revisión sensorial se compruebe que el vehículo pudo haber sufrido alguna alteración, este será sometido a una revisión total como si acudiera por primera vez y esta generará el respectivo cobro.</p>

          <p style={st.legalP}><strong>Peticiones, quejas y reclamos:</strong> Por disposición de la Superintendencia de Industria y Comercio, C.D.A. CHECKAR S.A.S. posee un mecanismo institucional de PQRS (peticiones, quejas, reclamos, sugerencias y felicitaciones), formato que puede ser diligenciado de manera personal, por e-mail o teléfono (el cliente está en libertad de dar su nombre o actuar de forma anónima). C.D.A. CHECKAR S.A.S. es responsable frente al cliente de todos los compromisos tomados, en las vías militar, civil y judicial (Ley 1581 de 2012).</p>

          <p style={st.legalP}>C.D.A. CHECKAR S.A.S. no responde por los elementos dejados en el vehículo que no sean requeridos por autoridades de policía.</p>

          <div style={st.legalH}>Contrato de prestación de servicios de inspección técnico mecánica y emisiones contaminantes</div>

          <p style={st.legalP}>Toda persona que utilice los servicios de C.D.A. CHECKAR S.A.S. tendrá derecho a lo estipulado en el presente contrato, que se resume en un vehículo adecuadamente inspeccionado y el certificado de inspección otorgado por C.D.A. CHECKAR S.A.S., bajo las siguientes condiciones:</p>

          <p style={st.legalP}><strong>Primero:</strong> El C.D.A. CHECKAR S.A.S. desarrolla sus servicios de acuerdo con lo descrito en la Resolución 3768 de septiembre de 2013, "por la cual se establecen las condiciones mínimas que deben cumplir los organismos de inspección que realizan la revisión técnico-mecánica y de emisiones contaminantes de los vehículos automotores que transitan por el territorio nacional", teniendo la previa habilitación y/o acreditación por parte de los organismos competentes, que exigen la revisión periódica de los procesos y procedimientos utilizados para el desarrollo de las actividades.</p>

          <p style={st.legalP}><strong>Segundo:</strong> El C.D.A. CHECKAR S.A.S. no se hace responsable de daños ocasionados al automotor durante la prueba si el mismo no cumple con los aspectos mínimos para realizar la revisión, previa solicitud e información al usuario sobre el servicio solicitado.</p>

          <p style={st.legalP}><strong>Tercero:</strong> El propietario del vehículo no podrá realizar reclamaciones sobre devoluciones e indemnizaciones de dinero luego de la realización de las pruebas, sea cual fuere el resultado de la evaluación de su vehículo.</p>

          <p style={st.legalP}><strong>Cuarto:</strong> El certificado de conformidad es válido solo en el momento, sitio y condiciones bajo las cuales se realizó la inspección, por lo cual se garantiza que la totalidad de los requisitos solicitados para la revisión del vehículo fueron evaluados, y se solicita que el cliente verifique esta condición.</p>

          <p style={st.legalP}><strong>Quinto:</strong> El usuario dará un uso adecuado al certificado y/o informe de resultados emitido por C.D.A. CHECKAR S.A.S., uso que se encuentra contemplado en el manual que C.D.A. CHECKAR S.A.S. dispone para su consulta.</p>

          <p style={st.legalP}><strong>Sexto:</strong> El usuario conoce los procedimientos de uso del certificado descritos en los procedimientos internos de C.D.A. CHECKAR S.A.S.</p>

          <p style={st.legalP}><strong>Séptimo:</strong> La encuesta de satisfacción aplicada al cliente equivale, para C.D.A. CHECKAR S.A.S., a la aceptación conforme del servicio realizado y al cumplimiento total de los requisitos solicitados al momento del uso de sus servicios.</p>

          <p style={st.legalP}><strong>Octavo:</strong> El usuario se compromete a proporcionar acceso a los equipos de evaluación de ONAC y a los auditores internos, para realizar la testificación de las actividades de evaluación de la conformidad realizadas por C.D.A. CHECKAR S.A.S., cuando se requiera, así como el acceso a la información pertinente.</p>

          <div style={{ marginTop: 14, padding: '10px 14px', border: '1px solid #94a3b8', textAlign: 'center' }}>
            <p style={{ fontSize: 9, fontWeight: 700, margin: '2px 0' }}>SEÑOR USUARIO:</p>
            <p style={{ fontSize: 8.5, margin: '2px 0', lineHeight: 1.5 }}>
              C.D.A. CHECKAR S.A.S. LE SOLICITA VERIFIQUE EL ESTADO ACTUAL DE SU VEHÍCULO, PARA QUE ASÍ IDENTIFIQUE
              CUALQUIER DETERIORO GENERADO DURANTE EL PASO DEL VEHÍCULO POR LA LÍNEA DE INSPECCIÓN, PARA SU
              INMEDIATA VERIFICACIÓN POR PARTE DEL CENTRO DE DIAGNÓSTICO.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 40, marginTop: 20 }}>
            <SigBox label="Acepto" dataUrl={rec?.signature_delivery} />
            <SigBox label="Recibí conforme" dataUrl={rec?.signature_delivery} />
          </div>
          {rec?.delivered_at && (
            <div style={{ textAlign: 'center', fontSize: 8.5, color: '#64748b', marginTop: 4 }}>
              Fecha de entrega: {formatDate(rec.delivered_at)}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
