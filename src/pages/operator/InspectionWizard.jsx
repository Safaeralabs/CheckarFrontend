import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, ArrowRight, Camera, CheckCircle, Circle,
  ClipboardCheck, Gauge, ShieldCheck, ThumbsDown, ThumbsUp, Truck, Wind, XCircle,
} from 'lucide-react'
import api from '../../api/client'
import { STATUS_MAP, formatDateTime } from '../../lib/utils'

/* ─── Constantes del proceso ─────────────────────────────────────── */

const STEPS = [
  { n: 1, label: 'Pre-evaluación',      icon: ClipboardCheck },
  { n: 2, label: 'Presión neumáticos',  icon: Gauge },
  { n: 3, label: 'Inspección visual',   icon: ShieldCheck },
  { n: 4, label: 'Pruebas mecánicas',   icon: Wind },
  { n: 5, label: 'Fotografías',         icon: Camera },
  { n: 6, label: 'Resultado',           icon: CheckCircle },
]

const PRE_EVAL_ITEMS = [
  { key: 'soat_vigente',          label: 'SOAT vigente',                              critical: true,  hasNA: false },
  { key: 'licencia_transito',     label: 'Presentó licencia de tránsito',              critical: true,  hasNA: false },
  { key: 'identificacion',        label: 'Presentó identificación',                   critical: false, hasNA: false },
  { key: 'vehiculo_limpio',       label: 'Vehículo limpio',                           critical: false, hasNA: false },
  { key: 'vehiculo_vacio',        label: 'Vehículo vacío',                            critical: false, hasNA: false },
  { key: 'dispositivos_seguridad',label: 'Dispositivos de seguridad deshabilitados',  critical: false, hasNA: false },
  { key: 'sin_tapacubos',         label: 'Inexistencia de tapacubos',                 critical: false, hasNA: true  },
  { key: 'preparado_inspeccion',  label: 'Vehículo preparado para la inspección',     critical: false, hasNA: false },
]

const VISUAL_ITEMS = [
  { key: 'carroceria_danos',       category: 'carroceria',   label: 'Sin daños visibles en carrocería' },
  { key: 'carroceria_oxidacion',   category: 'carroceria',   label: 'Sin oxidación severa' },
  { key: 'luces_frontales',        category: 'luces',        label: 'Luces frontales funcionando' },
  { key: 'luces_traseras',         category: 'luces',        label: 'Luces traseras y stop funcionando' },
  { key: 'luces_direccionales',    category: 'luces',        label: 'Direccionales (4 vías) funcionando' },
  { key: 'llantas_desgaste',       category: 'llantas',      label: 'Desgaste uniforme y dentro del límite' },
  { key: 'vidrios_parabrisas',     category: 'vidrios',      label: 'Parabrisas sin fisuras ni daños críticos' },
  { key: 'vidrios_laterales',      category: 'vidrios',      label: 'Vidrios laterales en buen estado' },
  { key: 'cinturones',             category: 'seguridad',    label: 'Cinturones de seguridad funcionando' },
  { key: 'espejos_retrovisores',   category: 'seguridad',    label: 'Espejos retrovisores completos y ajustados' },
]

const MECH_ITEMS = [
  { key: 'motor_ruidos',           category: 'motor',        label: 'Sin ruidos anormales en motor' },
  { key: 'motor_humo',             category: 'motor',        label: 'Sin emisión de humo visible anormal' },
  { key: 'motor_fugas',            category: 'motor',        label: 'Sin fugas de aceite o refrigerante' },
  { key: 'frenos_pedal',           category: 'frenos',       label: 'Pedal de freno firme y sin juego excesivo' },
  { key: 'frenos_eficiencia',      category: 'frenos',       label: 'Frenado eficiente en línea recta' },
  { key: 'frenos_mano',            category: 'frenos',       label: 'Freno de mano / estacionamiento funcional' },
  { key: 'direccion_juego',        category: 'dirección',    label: 'Sin juego excesivo en volante' },
  { key: 'suspension_estado',      category: 'suspensión',   label: 'Suspensión sin holguras anormales' },
  { key: 'transmision_cambios',    category: 'transmisión',  label: 'Cambios de marcha sin anomalías' },
  { key: 'escape_emisiones',       category: 'escape',       label: 'Sistema de escape sin fugas' },
]

const STATUS_TRANSITIONS = {
  pending:             'documents_validated',
  documents_validated: 'pre_evaluated',
  pre_evaluated:       'visual_review',
  visual_review:       'mechanical_test',
  mechanical_test:     'results_recorded',
}

/* ─── Utilidades UI ──────────────────────────────────────────────── */

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200' }
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>{s.label}</span>
}

function StepBar({ current }) {
  return (
    <div className="flex gap-1 mb-6">
      {STEPS.map(({ n, label, icon: Icon }) => {
        const done   = n < current
        const active = n === current
        return (
          <div key={n} className="flex items-center gap-1 flex-1 min-w-0">
            <div
              title={label}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold flex-shrink-0 transition-colors ${
                done ? 'bg-success text-white' : active ? 'bg-accent text-white' : 'bg-border text-muted'
              }`}
            >
              {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </div>
            <span className={`text-xs font-medium hidden lg:block truncate ${active ? 'text-ink' : 'text-muted'}`}>
              {label}
            </span>
            {n < STEPS.length && <div className={`flex-1 h-px mx-1 ${done ? 'bg-success' : 'bg-border'}`} />}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Componente de ítem SI/NO/NA ────────────────────────────────── */
function YesNoNA({ value, onChange, hasNA, critical }) {
  const opts = [
    { v: 'yes', label: 'Sí',       cls: 'bg-success-soft text-success border-green-300',  sel: 'bg-success text-white border-success' },
    { v: 'no',  label: 'No',       cls: 'bg-danger-soft text-danger border-red-300',       sel: 'bg-danger text-white border-danger' },
    ...( hasNA ? [{ v: 'na', label: 'N/A', cls: 'bg-canvas text-muted border-border', sel: 'bg-slate-500 text-white border-slate-500' }] : [] ),
  ]
  return (
    <div className="flex gap-1.5">
      {opts.map(o => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
            value === o.v ? o.sel : o.cls + ' hover:opacity-80'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ─── Componente de ítem CUMPLE / NO CUMPLE / NA ─────────────────── */
function PassFail({ value, onChange }) {
  const opts = [
    { v: 'pass', label: 'Cumple',     cls: 'bg-success-soft text-success border-green-300', sel: 'bg-success text-white border-success' },
    { v: 'fail', label: 'No cumple',  cls: 'bg-danger-soft text-danger border-red-300',     sel: 'bg-danger text-white border-danger' },
    { v: 'na',   label: 'N/A',        cls: 'bg-canvas text-muted border-border',             sel: 'bg-slate-500 text-white border-slate-500' },
  ]
  return (
    <div className="flex gap-1.5">
      {opts.map(o => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
            value === o.v ? o.sel : o.cls + ' hover:opacity-80'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ─── WIZARD PRINCIPAL ───────────────────────────────────────────── */

export default function InspectionWizard() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [step, setStep] = useState(1)

  // Estado local de cada paso
  const [preEval,    setPreEval]    = useState({})     // { [key]: 'yes'|'no'|'na' }
  const [tire,       setTire]       = useState({ spare_tire_1: '', spare_tire_2: '', no_spare: false })
  const [axles,      setAxles]      = useState([])     // [{ axle_number, is_double, single_pressure, left_outer, left_inner, right_outer, right_inner }]
  const [visual,     setVisual]     = useState({})     // { [key]: 'pass'|'fail'|'na' }
  const [mech,       setMech]       = useState({})
  const [photos,     setPhotos]     = useState([])
  const [result,     setResult]     = useState({ overall_result: '', observations: '' })
  const [saving,     setSaving]     = useState(false)
  const [stepError,  setStepError]  = useState('')

  /* Carga de la inspección */
  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => api.get(`inspections/records/${id}/`).then(r => r.data),
  })

  const { data: vehicleData } = useQuery({
    queryKey: ['vehicle-for-inspection', inspection?.appointment],
    queryFn: async () => {
      const apt = await api.get(`scheduling/appointments/${inspection.appointment}/`)
      const veh = await api.get(`vehicles/${apt.data.vehicle}/`)
      return veh.data
    },
    enabled: !!inspection?.appointment,
  })

  const { data: reception } = useQuery({
    queryKey: ['reception-for-wizard', inspection?.appointment],
    queryFn: () => api.get('operations/receptions/', { params: { appointment: inspection.appointment } })
      .then(r => (r.data?.results ?? r.data ?? [])[0] ?? null),
    enabled: !!inspection?.appointment,
  })

  /* Avanzar estado en el backend */
  const advanceMut = useMutation({
    mutationFn: ({ next_status }) => api.post(`inspections/records/${id}/advance_status/`, { next_status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inspection', id] }),
  })

  /* ── Guardar cada paso ──────────────────────────────────────────── */

  const saveStep = async () => {
    setSaving(true)
    setStepError('')
    try {
      if (step === 1) {
        // Guardar 8 ítems de pre-evaluación
        const existingItems = await api.get('inspections/pre-evaluation/', { params: { inspection: id } })
        const existing = existingItems.data?.results ?? existingItems.data ?? []
        const existingMap = Object.fromEntries(existing.map(i => [i.item_key, i]))

        for (const [key, res] of Object.entries(preEval)) {
          if (!res) continue
          if (existingMap[key]) {
            await api.patch(`inspections/pre-evaluation/${existingMap[key].id}/`, { result: res })
          } else {
            await api.post('inspections/pre-evaluation/', { inspection: id, item_key: key, result: res })
          }
        }
        // Avanzar: pending → documents_validated → pre_evaluated
        // (solo si el estado actual todavía no llegó a pre_evaluated; si el
        // usuario vuelve a este paso después de haber avanzado, no se reintenta
        // la transición para no chocar con INSPECTION_TRANSITIONS del backend)
        if (inspection?.status === 'pending') {
          await api.post(`inspections/records/${id}/advance_status/`, { next_status: 'documents_validated' })
          await api.post(`inspections/records/${id}/advance_status/`, { next_status: 'pre_evaluated' })
          await qc.invalidateQueries({ queryKey: ['inspection', id] })
        } else if (inspection?.status === 'documents_validated') {
          await api.post(`inspections/records/${id}/advance_status/`, { next_status: 'pre_evaluated' })
          await qc.invalidateQueries({ queryKey: ['inspection', id] })
        }
      }

      if (step === 2) {
        // Guardar presión de neumáticos
        const existingTire = await api.get('inspections/tire-pressure/', { params: { inspection: id } })
        const tireList = existingTire.data?.results ?? existingTire.data ?? []
        let tireRecordId

        const tirePayload = {
          inspection: id,
          spare_tire_1: tire.spare_tire_1 ? parseFloat(tire.spare_tire_1) : null,
          spare_tire_2: tire.spare_tire_2 ? parseFloat(tire.spare_tire_2) : null,
          no_spare_tire: tire.no_spare,
        }

        if (tireList.length > 0) {
          await api.patch(`inspections/tire-pressure/${tireList[0].id}/`, tirePayload)
          tireRecordId = tireList[0].id
        } else {
          const created = await api.post('inspections/tire-pressure/', tirePayload)
          tireRecordId = created.data.id
        }

        // Guardar presiones por eje
        const existingAxles = await api.get('inspections/tire-pressure-axles/', { params: { record: tireRecordId } })
        const existingAxleList = existingAxles.data?.results ?? existingAxles.data ?? []
        const axleMap = Object.fromEntries(existingAxleList.map(a => [a.axle_number, a]))

        for (const axle of axles) {
          const payload = {
            record: tireRecordId,
            axle_number: axle.axle_number,
            is_double_tire: axle.is_double,
            single_pressure: axle.is_double ? null : (parseFloat(axle.single_pressure) || null),
            left_outer:  axle.is_double ? (parseFloat(axle.left_outer)  || null) : null,
            left_inner:  axle.is_double ? (parseFloat(axle.left_inner)  || null) : null,
            right_outer: axle.is_double ? (parseFloat(axle.right_outer) || null) : null,
            right_inner: axle.is_double ? (parseFloat(axle.right_inner) || null) : null,
          }
          if (axleMap[axle.axle_number]) {
            await api.patch(`inspections/tire-pressure-axles/${axleMap[axle.axle_number].id}/`, payload)
          } else {
            await api.post('inspections/tire-pressure-axles/', payload)
          }
        }
      }

      if (step === 3) {
        // Guardar checklist visual
        const existing = await api.get('inspections/checklist/', { params: { inspection: id, category: 'visual' } })
        const existingList = existing.data?.results ?? existing.data ?? []
        const existingMap = Object.fromEntries(existingList.map(i => [i.item_name, i]))

        for (const item of VISUAL_ITEMS) {
          const st = visual[item.key] ?? 'na'
          const payload = { inspection: id, category: item.category, item_name: item.key, status: st }
          if (existingMap[item.key]) {
            await api.patch(`inspections/checklist/${existingMap[item.key].id}/`, { status: st })
          } else {
            await api.post('inspections/checklist/', payload)
          }
        }
        if (inspection?.status === 'pre_evaluated') {
          await api.post(`inspections/records/${id}/advance_status/`, { next_status: 'visual_review' })
          await qc.invalidateQueries({ queryKey: ['inspection', id] })
        }
      }

      if (step === 4) {
        // Guardar checklist mecánico
        const existing = await api.get('inspections/checklist/', { params: { inspection: id, category__in: 'motor,frenos,dirección,suspensión,transmisión,escape' } })
        const existingList = existing.data?.results ?? existing.data ?? []
        const existingMap = Object.fromEntries(existingList.map(i => [i.item_name, i]))

        for (const item of MECH_ITEMS) {
          const st = mech[item.key] ?? 'na'
          const payload = { inspection: id, category: item.category, item_name: item.key, status: st }
          if (existingMap[item.key]) {
            await api.patch(`inspections/checklist/${existingMap[item.key].id}/`, { status: st })
          } else {
            await api.post('inspections/checklist/', payload)
          }
        }
        if (inspection?.status === 'visual_review') {
          await api.post(`inspections/records/${id}/advance_status/`, { next_status: 'mechanical_test' })
          await qc.invalidateQueries({ queryKey: ['inspection', id] })
        }
      }

      if (step === 5) {
        // Fotos: ya se guardaron durante la carga de cada archivo
        if (inspection?.status === 'mechanical_test') {
          await api.post(`inspections/records/${id}/advance_status/`, { next_status: 'results_recorded' })
          await qc.invalidateQueries({ queryKey: ['inspection', id] })
        }
      }

      if (step === 6) {
        // Resultado final
        if (!result.overall_result) { setStepError('Selecciona un resultado (Aprobar o Rechazar)'); setSaving(false); return }
        await api.patch(`inspections/records/${id}/`, { observations: result.observations })
        await api.post(`inspections/records/${id}/advance_status/`, { next_status: result.overall_result === 'approved' ? 'approved' : 'rejected' })
        await qc.invalidateQueries({ queryKey: ['inspection', id] })
        setSaving(false)
        return
      }

      setStep(s => s + 1)
    } catch (err) {
      setStepError(err.response?.data?.detail ?? 'Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  /* Inicializar ejes al cargar vehículo */
  const numAxes = vehicleData?.num_axes ?? 2
  const initAxles = () => {
    if (axles.length === 0 && numAxes > 0) {
      setAxles(Array.from({ length: numAxes }, (_, i) => ({
        axle_number: i + 1,
        is_double: i > 0,
        single_pressure: '',
        left_outer: '', left_inner: '', right_outer: '', right_inner: '',
      })))
    }
  }
  if (vehicleData && axles.length === 0) initAxles()

  /* ── Render principal ──────────────────────────────────────────── */

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const isClosed = ['approved', 'rejected', 'certified'].includes(inspection?.status)

  if (isClosed) return <ClosedView inspection={inspection} />

  if (reception && reception.signature_status !== 'fully_signed') {
    const isPending = reception.signature_status === 'operator_signed'
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <Link to="/operacion/inspecciones" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Inspecciones
        </Link>
        <div className={`rounded-2xl border-2 p-8 text-center ${isPending ? 'border-amber-300 bg-amber-50' : 'border-border bg-surface'}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isPending ? 'bg-amber-100' : 'bg-canvas'}`}>
            <Circle className={`w-7 h-7 ${isPending ? 'text-amber-500' : 'text-muted'}`} />
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isPending ? 'text-amber-800' : 'text-ink'}`}>
            {isPending ? 'Esperando firma del cliente' : 'Firma pendiente'}
          </h2>
          <p className={`text-sm mt-2 max-w-sm mx-auto ${isPending ? 'text-amber-700' : 'text-muted'}`}>
            {isPending
              ? 'La inspección no puede comenzar hasta que el cliente firme la recepción desde su portal.'
              : 'El operador debe completar y firmar la recepción antes de iniciar la inspección.'}
          </p>
          <Link
            to={`/operacion/recepcion/${inspection.appointment}`}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition"
          >
            Ir a la recepción
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <Link to="/operacion/inspecciones" className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Inspecciones
          </Link>
          <h1 className="text-xl font-bold text-ink">Inspección #{id}</h1>
          <p className="text-xs text-muted mt-0.5">{formatDateTime(inspection?.started_at)}</p>
        </div>
        <StatusBadge status={inspection?.status} />
      </div>

      <StepBar current={step} />

      {/* ── PASO 1: Pre-evaluación ── */}
      {step === 1 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 bg-canvas border-b border-border">
            <h2 className="text-sm font-bold text-ink">Pre-evaluación</h2>
            <p className="text-xs text-muted">Verifica los requisitos previos antes de iniciar la inspección</p>
          </div>
          <div className="divide-y divide-border">
            {PRE_EVAL_ITEMS.map(item => (
              <div key={item.key} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm text-ink">{item.label}</p>
                  {item.critical && <p className="text-xs text-danger font-medium">Crítico</p>}
                </div>
                <YesNoNA
                  value={preEval[item.key]}
                  onChange={v => setPreEval(p => ({ ...p, [item.key]: v }))}
                  hasNA={item.hasNA}
                  critical={item.critical}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PASO 2: Presión de neumáticos ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3 bg-canvas border-b border-border">
              <h2 className="text-sm font-bold text-ink">Presión de neumáticos</h2>
              <p className="text-xs text-muted">Vehículo con {numAxes} eje{numAxes !== 1 ? 's' : ''}</p>
            </div>
            <div className="p-5 space-y-5">
              {axles.map((axle, idx) => (
                <div key={axle.axle_number} className="p-4 rounded-lg bg-canvas border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-ink">Eje {axle.axle_number}</p>
                    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={axle.is_double}
                        onChange={e => setAxles(a => a.map((ax, i) => i === idx ? { ...ax, is_double: e.target.checked } : ax))}
                        className="w-3.5 h-3.5 accent-accent"
                      />
                      Llanta doble
                    </label>
                  </div>

                  {!axle.is_double ? (
                    <div>
                      <label className="block text-xs text-muted mb-1">Presión (PSI)</label>
                      <input
                        type="number"
                        value={axle.single_pressure}
                        onChange={e => setAxles(a => a.map((ax, i) => i === idx ? { ...ax, single_pressure: e.target.value } : ax))}
                        placeholder="30"
                        className="w-32 px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none focus:border-brand transition"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { side: 'Izquierda', fields: [['left_outer', 'Externa'], ['left_inner', 'Interna']] },
                        { side: 'Derecha',   fields: [['right_inner', 'Interna'], ['right_outer', 'Externa']] },
                      ].map(({ side, fields }) => (
                        <div key={side}>
                          <p className="text-xs font-semibold text-muted mb-2">{side}</p>
                          {fields.map(([field, fieldLabel]) => (
                            <div key={field} className="mb-2">
                              <label className="text-xs text-muted">{fieldLabel} (PSI)</label>
                              <input
                                type="number"
                                value={axle[field]}
                                onChange={e => setAxles(a => a.map((ax, i) => i === idx ? { ...ax, [field]: e.target.value } : ax))}
                                placeholder="30"
                                className="w-full mt-0.5 px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none focus:border-brand transition"
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Llanta de repuesto */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink">Llanta de repuesto</h3>
              <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={tire.no_spare}
                  onChange={e => setTire(t => ({ ...t, no_spare: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-accent"
                />
                No tiene
              </label>
            </div>
            {!tire.no_spare && (
              <div className="flex gap-3">
                {[['spare_tire_1', 'Repuesto 1 (PSI)'], ['spare_tire_2', 'Repuesto 2 (PSI)']].map(([field, lbl]) => (
                  <div key={field} className="flex-1">
                    <label className="block text-xs text-muted mb-1">{lbl}</label>
                    <input
                      type="number"
                      value={tire[field]}
                      onChange={e => setTire(t => ({ ...t, [field]: e.target.value }))}
                      placeholder="30"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-ink"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PASO 3: Visual ── */}
      {step === 3 && (
        <ChecklistSection
          title="Inspección visual"
          subtitle="Evalúa el estado visible del vehículo"
          items={VISUAL_ITEMS}
          values={visual}
          onChange={(key, val) => setVisual(v => ({ ...v, [key]: val }))}
        />
      )}

      {/* ── PASO 4: Mecánico ── */}
      {step === 4 && (
        <ChecklistSection
          title="Pruebas mecánicas"
          subtitle="Verifica los sistemas mecánicos del vehículo"
          items={MECH_ITEMS}
          values={mech}
          onChange={(key, val) => setMech(v => ({ ...v, [key]: val }))}
        />
      )}

      {/* ── PASO 5: Fotos ── */}
      {step === 5 && (
        <PhotoStep inspectionId={id} photos={photos} setPhotos={setPhotos} />
      )}

      {/* ── PASO 6: Resultado ── */}
      {step === 6 && (
        <div className="space-y-4">
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-sm font-bold text-ink mb-4">Resultado de inspección</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setResult(r => ({ ...r, overall_result: 'approved' }))}
                className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                  result.overall_result === 'approved'
                    ? 'border-success bg-success-soft'
                    : 'border-border hover:border-success/40'
                }`}
              >
                <ThumbsUp className={`w-8 h-8 ${result.overall_result === 'approved' ? 'text-success' : 'text-muted'}`} />
                <span className={`font-bold text-sm ${result.overall_result === 'approved' ? 'text-success' : 'text-muted'}`}>
                  Aprobar
                </span>
              </button>
              <button
                onClick={() => setResult(r => ({ ...r, overall_result: 'rejected' }))}
                className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                  result.overall_result === 'rejected'
                    ? 'border-danger bg-danger-soft'
                    : 'border-border hover:border-danger/40'
                }`}
              >
                <ThumbsDown className={`w-8 h-8 ${result.overall_result === 'rejected' ? 'text-danger' : 'text-muted'}`} />
                <span className={`font-bold text-sm ${result.overall_result === 'rejected' ? 'text-danger' : 'text-muted'}`}>
                  Rechazar
                </span>
              </button>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5">
            <label className="block text-sm font-semibold text-ink mb-2">Observaciones del inspector</label>
            <textarea
              value={result.observations}
              onChange={e => setResult(r => ({ ...r, observations: e.target.value }))}
              rows={4}
              placeholder="Describe los hallazgos relevantes de la inspección..."
              className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition resize-none placeholder:text-muted text-ink"
            />
          </div>
        </div>
      )}

      {/* Error */}
      {stepError && (
        <div className="mt-4 px-4 py-3 rounded-lg bg-danger-soft border border-red-200 text-danger text-sm">
          {stepError}
        </div>
      )}

      {/* Navegación */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-ink text-sm font-semibold hover:bg-canvas transition"
          >
            <ArrowLeft className="w-4 h-4" /> Atrás
          </button>
        )}
        <button
          onClick={saveStep}
          disabled={saving}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition disabled:opacity-60 ${
            step === 6 ? 'bg-brand hover:bg-brand-light' : 'bg-accent hover:bg-accent-hover'
          }`}
        >
          {saving
            ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</span>
            : step === 6
              ? <><CheckCircle className="w-4 h-4" /> Finalizar inspección</>
              : <><ArrowRight className="w-4 h-4" /> Guardar y continuar</>
          }
        </button>
      </div>
    </div>
  )
}

/* ─── Sub-componentes ─────────────────────────────────────────────── */

function ChecklistSection({ title, subtitle, items, values, onChange }) {
  const categories = [...new Set(items.map(i => i.category))]
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-3 bg-canvas border-b border-border">
        <h2 className="text-sm font-bold text-ink">{title}</h2>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
      {categories.map(cat => (
        <div key={cat}>
          <div className="px-5 py-2 bg-canvas border-y border-border">
            <p className="text-xs font-bold text-muted uppercase tracking-wider capitalize">{cat}</p>
          </div>
          <div className="divide-y divide-border">
            {items.filter(i => i.category === cat).map(item => (
              <div key={item.key} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <p className="text-sm text-ink">{item.label}</p>
                <PassFail value={values[item.key]} onChange={v => onChange(item.key, v)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const REQUIRED_PHOTOS = [
  { key: 'frente',    label: 'Frente del vehículo' },
  { key: 'posterior', label: 'Posterior del vehículo' },
  { key: 'lateral_izq', label: 'Lateral izquierdo' },
  { key: 'lateral_der', label: 'Lateral derecho' },
  { key: 'vin',       label: 'Placa VIN / número de chasis' },
  { key: 'tablero',   label: 'Tablero / instrumentos' },
]

function PhotoStep({ inspectionId, photos, setPhotos }) {
  const qc = useQueryClient()
  const { data: existingPhotos } = useQuery({
    queryKey: ['photos', inspectionId],
    queryFn: () => api.get('inspections/photos/', { params: { inspection: inspectionId } }).then(r => r.data),
  })
  const savedPhotos = existingPhotos?.results ?? existingPhotos ?? []

  const handleUpload = async (label, file) => {
    const fd = new FormData()
    fd.append('inspection', inspectionId)
    fd.append('label', label)
    fd.append('photo', file)
    await api.post('inspections/photos/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    qc.invalidateQueries({ queryKey: ['photos', inspectionId] })
  }

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-3 bg-canvas border-b border-border">
        <h2 className="text-sm font-bold text-ink">Fotografías</h2>
        <p className="text-xs text-muted">Tomas obligatorias del vehículo</p>
      </div>
      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {REQUIRED_PHOTOS.map(({ key, label }) => {
          const saved = savedPhotos.find(p => p.label === key)
          return (
            <label key={key} className="cursor-pointer">
              <div className={`aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                saved ? 'border-success bg-success-soft' : 'border-border hover:border-accent'
              }`}>
                {saved
                  ? <><CheckCircle className="w-5 h-5 text-success" /><span className="text-xs text-success font-medium text-center px-2">{label}</span></>
                  : <><Camera className="w-5 h-5 text-muted" /><span className="text-xs text-muted text-center px-2">{label}</span></>
                }
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => e.target.files[0] && handleUpload(key, e.target.files[0])}
              />
            </label>
          )
        })}
      </div>
    </div>
  )
}

function ClosedView({ inspection }) {
  const approved = inspection?.status === 'approved' || inspection?.status === 'certified'
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <Link to="/operacion/inspecciones" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Inspecciones
      </Link>
      <div className={`rounded-2xl border-2 p-8 text-center ${
        approved ? 'border-success bg-success-soft' : 'border-danger bg-danger-soft'
      }`}>
        {approved
          ? <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
          : <XCircle className="w-12 h-12 text-danger mx-auto mb-4" />
        }
        <h2 className={`text-xl font-bold mb-2 ${approved ? 'text-success' : 'text-danger'}`}>
          Inspección {approved ? 'aprobada' : 'rechazada'}
        </h2>
        {inspection?.observations && (
          <p className="text-sm text-ink-2 mt-3 leading-relaxed max-w-sm mx-auto">
            {inspection.observations}
          </p>
        )}
        <p className="text-xs text-muted mt-4">Finalizada: {formatDateTime(inspection?.completed_at)}</p>
        {inspection?.appointment && (
          <Link
            to={`/operacion/entrega/${inspection.appointment}`}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-light text-white text-sm font-semibold transition"
          >
            <Truck className="w-4 h-4" /> Entregar vehículo
          </Link>
        )}
      </div>
    </div>
  )
}
