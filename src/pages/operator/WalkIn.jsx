import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, ArrowRight, Car, CheckCircle, Mail, Search, UserPlus } from 'lucide-react'
import api from '../../api/client'
import { STATUS_MAP, formatDateTime } from '../../lib/utils'

// ── Helpers de estilo ─────────────────────────────────────────────────────────
const inp  = "w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition placeholder:text-muted text-ink"
const sel  = `${inp} cursor-pointer`
const inpSm = "w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition placeholder:text-muted text-ink"

function Field({ label, children, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-2 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200' }
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>{s.label}</span>
}

const VEHICLE_TYPE_LABELS = { light: 'Liviano', heavy: 'Pesado', motorcycle: 'Motocicleta' }
const FUEL_LABELS = { gasoline: 'Gasolina', diesel: 'Diésel', hybrid: 'Híbrido', electric: 'Eléctrico', gas: 'Gas' }

// ── Fases del flujo ───────────────────────────────────────────────────────────
// 'search'    → input de placa
// 'found'     → vehículo encontrado, confirmar
// 'not_found' → placa no existe, opción de registrar
// 'new_form'  → formulario cliente+vehículo nuevo

export default function WalkIn() {
  const navigate = useNavigate()

  const [phase,          setPhase]          = useState('search')
  const [plate,          setPlate]          = useState('')
  const [searching,      setSearching]      = useState(false)
  const [searchError,    setSearchError]    = useState('')
  const [foundVehicle,   setFoundVehicle]   = useState(null)
  const [inspectionType, setInspectionType] = useState('official')
  const [submitError,    setSubmitError]    = useState('')

  // Formulario para cliente nuevo
  const [form, setForm] = useState({
    first_name: '', last_name: '', document_number: '', phone: '', email: '',
    brand: '', model_line: '', model_year: new Date().getFullYear(),
    vehicle_type: 'light', fuel_type: 'gasoline', color: '', registration_city: '',
  })
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Búsqueda por placa ────────────────────────────────────────────────────
  const PLATE_RE = /^[A-Z]{3}\d{3}$/

  const handleSearch = async () => {
    const p = plate.trim().toUpperCase()
    if (!p) { setSearchError('Ingresa una placa.'); return }
    if (!PLATE_RE.test(p)) {
      setSearchError('Formato inválido. Debe ser 3 letras seguidas de 3 dígitos (ej: ABC123).')
      return
    }
    setSearchError('')
    setSearching(true)
    try {
      const res = await api.get('vehicles/', { params: { plate: p } })
      const list = res.data?.results ?? res.data ?? []
      const exact = list.find(v => v.plate === p)
      if (exact) {
        setFoundVehicle(exact)
        setPhase('found')
      } else {
        setFoundVehicle(null)
        setPlate(p)
        setPhase('not_found')
      }
    } catch (err) {
      const d = err.response?.data
      setSearchError(
        typeof d === 'string' ? d
        : d?.detail ?? d?.plate?.[0] ?? 'Error al consultar. Intenta de nuevo.'
      )
    } finally {
      setSearching(false)
    }
  }

  const [createdResult, setCreatedResult] = useState(null)

  // ── Mutación walk-in ──────────────────────────────────────────────────────
  const walkInMut = useMutation({
    mutationFn: (payload) => api.post('operations/walk-in/', payload),
    onSuccess: (res) => {
      // Mostrar pantalla de confirmación con el número de turno antes de navegar
      setCreatedResult(res.data)
    },
    onError: (err) => {
      setSubmitError(err.response?.data?.detail ?? 'Error al crear la inspección.')
    },
  })

  const handleConfirmExisting = () => {
    setSubmitError('')
    walkInMut.mutate({ plate: foundVehicle.plate, inspection_type: inspectionType })
  }

  const handleSubmitNew = (e) => {
    e.preventDefault()
    setSubmitError('')
    walkInMut.mutate({ plate: plate.trim().toUpperCase(), inspection_type: inspectionType, ...form })
  }

  const reset = () => {
    setPhase('search'); setPlate(''); setFoundVehicle(null)
    setSearchError(''); setSubmitError(''); setInspectionType('official')
  }

  // ── Historial de inspecciones de la placa encontrada ─────────────────────
  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ['inspection-history', foundVehicle?.plate],
    queryFn: () => api.get('inspections/records/', {
      params: { search: foundVehicle.plate, ordering: '-started_at' },
    }).then(r => r.data),
    enabled: phase === 'found' && !!foundVehicle?.plate,
  })
  const historyItems = historyData?.results ?? historyData ?? []

  // ── Render ────────────────────────────────────────────────────────────────

  // Pantalla de éxito para cliente nuevo (muestra info del email antes de ir a recepción)
  if (createdResult) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="rounded-2xl border-2 border-success bg-success-soft p-8 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-success mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-success">
              {createdResult.is_new_client ? 'Cliente registrado' : 'Inspección iniciada'}
            </h2>
            <p className="text-sm text-green-700 mt-1">{createdResult.owner_name}</p>
          </div>
          {createdResult.turn_number && (
            <div className="inline-block bg-white border-2 border-success rounded-2xl px-8 py-4">
              <p className="text-xs text-muted font-semibold uppercase tracking-wide">Turno</p>
              <p className="text-4xl font-black text-success tracking-widest font-mono">{createdResult.turn_number}</p>
            </div>
          )}
          {createdResult.owner_email && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white border border-green-200">
              <Mail className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">
                Correo de contacto registrado: <strong>{createdResult.owner_email}</strong>
              </p>
            </div>
          )}
          <button
            onClick={() => navigate(`/operacion/recepcion/${createdResult.appointment_id}`)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm transition"
          >
            Ir a la recepción <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <button onClick={() => navigate('/operacion')} className="flex items-center gap-2 text-sm text-muted hover:text-ink transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Cola del día
      </button>

      <div className="flex items-start gap-4 mb-7">
        <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center flex-shrink-0">
          <Car className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">Ingreso rápido</h1>
          <p className="text-sm text-muted">Registra un vehículo que llega sin cita previa</p>
        </div>
      </div>

      {/* ── FASE: BÚSQUEDA ── */}
      {(phase === 'search' || phase === 'not_found') && (
        <div className="space-y-5">
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Placa del vehículo</h2>
            <div className="flex gap-2">
              <input
                value={plate}
                onChange={e => setPlate(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="ABC123"
                maxLength={10}
                className={`flex-1 px-3 py-2.5 rounded-lg border border-border bg-surface text-sm font-mono font-bold tracking-widest uppercase outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition placeholder:text-muted text-ink`}
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:bg-accent-hover transition disabled:opacity-60"
              >
                <Search className="w-4 h-4" />
                {searching ? 'Buscando...' : 'Consultar'}
              </button>
            </div>
            {searchError && (
              <p className="mt-2 text-xs text-danger flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {searchError}
              </p>
            )}
          </div>

          {/* Placa no encontrada */}
          {phase === 'not_found' && (
            <div className="bg-surface rounded-xl border border-border p-5 text-center space-y-4">
              <div className="w-12 h-12 bg-warning-soft rounded-full flex items-center justify-center mx-auto">
                <Car className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="font-semibold text-ink">Placa <span className="font-mono text-brand">{plate}</span> no está registrada</p>
                <p className="text-sm text-muted mt-1">Registra al cliente y su vehículo para continuar</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setPhase('new_form')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:bg-accent-hover transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Registrar nuevo cliente
                </button>
                <button onClick={reset} className="px-4 py-2.5 rounded-lg border border-border text-sm text-muted hover:text-ink hover:bg-canvas transition">
                  Buscar otra placa
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FASE: VEHÍCULO ENCONTRADO ── */}
      {phase === 'found' && foundVehicle && (
        <div className="space-y-4">
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 bg-success-soft rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Vehículo encontrado</p>
                <p className="text-xs text-muted">Confirma los datos antes de iniciar la inspección</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                ['Placa',    <span className="font-mono font-bold text-brand tracking-widest">{foundVehicle.plate}</span>],
                ['Tipo',     VEHICLE_TYPE_LABELS[foundVehicle.vehicle_type] ?? foundVehicle.vehicle_type],
                ['Marca',    foundVehicle.brand],
                ['Línea',    foundVehicle.model_line],
                ['Año',      foundVehicle.model_year],
                ['Combustible', FUEL_LABELS[foundVehicle.fuel_type] ?? foundVehicle.fuel_type],
              ].map(([label, value]) => (
                <div key={label} className="bg-canvas rounded-lg px-3 py-2 border border-border">
                  <p className="text-xs text-muted uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-ink">{value || '—'}</p>
                </div>
              ))}
            </div>

            {foundVehicle.owner_detail && (
              <div className="bg-canvas rounded-lg px-3 py-2.5 border border-border mb-4 space-y-1">
                <p className="text-xs text-muted uppercase tracking-wide font-semibold mb-1">Cliente asociado</p>
                <p className="text-sm font-bold text-ink">
                  {foundVehicle.owner_detail.first_name} {foundVehicle.owner_detail.last_name}
                </p>
                {foundVehicle.owner_detail.email && (
                  <p className="text-xs text-muted flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    {foundVehicle.owner_detail.email}
                  </p>
                )}
                {foundVehicle.owner_detail.phone && (
                  <p className="text-xs text-muted">📞 {foundVehicle.owner_detail.phone}</p>
                )}
                {foundVehicle.owner_detail.document_number && (
                  <p className="text-xs text-muted">CC {foundVehicle.owner_detail.document_number}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink-2 mb-1.5 uppercase tracking-wide">Tipo de inspección</label>
              <select value={inspectionType} onChange={e => setInspectionType(e.target.value)} className={sel}>
                <option value="official">Oficial</option>
                <option value="pre_technical">Pre-técnica</option>
              </select>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Historial de inspecciones</h2>
            {loadingHistory ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : historyItems.length === 0 ? (
              <p className="text-sm text-muted">Sin inspecciones previas registradas para esta placa.</p>
            ) : (
              <div className="divide-y divide-border -mx-5 -mb-1">
                {historyItems.map(ins => (
                  <div key={ins.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={ins.status} />
                        <span className="text-xs text-ink-2">
                          {ins.inspection_type === 'official' ? 'Oficial' : 'Pre-técnica'}
                        </span>
                      </div>
                      <p className="text-xs text-muted">{formatDateTime(ins.started_at)}</p>
                    </div>
                    <a
                      href={`/operacion/inspecciones/${ins.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-accent hover:underline flex-shrink-0"
                    >
                      reporte
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {submitError && (
            <div className="px-4 py-3 rounded-lg bg-danger-soft border border-red-200 text-danger text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {submitError}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={reset} className="px-4 py-3 rounded-xl border border-border text-sm text-muted hover:text-ink hover:bg-canvas transition">
              Buscar otra placa
            </button>
            <button
              onClick={handleConfirmExisting}
              disabled={walkInMut.isPending}
              className="flex-1 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm transition disabled:opacity-60"
            >
              {walkInMut.isPending ? 'Iniciando...' : 'Iniciar inspección →'}
            </button>
          </div>
        </div>
      )}

      {/* ── FASE: FORMULARIO NUEVO CLIENTE ── */}
      {phase === 'new_form' && (
        <form onSubmit={handleSubmitNew} className="space-y-6">
          {/* Propietario */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Datos del propietario</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre">
                <input value={form.first_name} onChange={e => setField('first_name', e.target.value)}
                  required placeholder="Juan" className={inp} />
              </Field>
              <Field label="Apellido">
                <input value={form.last_name} onChange={e => setField('last_name', e.target.value)}
                  required placeholder="García" className={inp} />
              </Field>
              <Field label="Número de documento">
                <input value={form.document_number} onChange={e => setField('document_number', e.target.value)}
                  required placeholder="1234567890" className={inp} />
              </Field>
              <Field label="Teléfono / Celular">
                <input value={form.phone} onChange={e => setField('phone', e.target.value)}
                  required placeholder="3001234567" className={inp} />
              </Field>
              <div className="col-span-2">
                <Field label="Email *" error={!form.email && submitError ? '' : undefined}>
                  <input value={form.email} onChange={e => setField('email', e.target.value)}
                    type="email" required placeholder="juan@correo.com" className={inp} />
                  <p className="mt-1 text-xs text-muted">Se usará para enviarle recordatorios y comunicaciones del CDA</p>
                </Field>
              </div>
            </div>
          </div>

          {/* Vehículo */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Datos del vehículo</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Placa">
                <input value={plate} readOnly
                  className={`${inpSm} font-mono font-bold tracking-widest bg-canvas cursor-not-allowed`} />
              </Field>
              <Field label="Tipo de vehículo">
                <select value={form.vehicle_type} onChange={e => setField('vehicle_type', e.target.value)} className={sel}>
                  <option value="light">Liviano</option>
                  <option value="heavy">Pesado</option>
                  <option value="motorcycle">Motocicleta</option>
                </select>
              </Field>
              <Field label="Marca">
                <input value={form.brand} onChange={e => setField('brand', e.target.value)}
                  required placeholder="Toyota" className={inp} />
              </Field>
              <Field label="Línea / Modelo">
                <input value={form.model_line} onChange={e => setField('model_line', e.target.value)}
                  required placeholder="Corolla" className={inp} />
              </Field>
              <Field label="Año">
                <input value={form.model_year} onChange={e => setField('model_year', parseInt(e.target.value) || 2020)}
                  type="number" min="1900" max="2030" required className={inpSm} />
              </Field>
              <Field label="Combustible">
                <select value={form.fuel_type} onChange={e => setField('fuel_type', e.target.value)} className={sel}>
                  <option value="gasoline">Gasolina</option>
                  <option value="diesel">Diésel</option>
                  <option value="hybrid">Híbrido</option>
                  <option value="electric">Eléctrico</option>
                  <option value="gas">Gas</option>
                </select>
              </Field>
              <div className="col-span-2">
                <Field label="Color (opcional)">
                  <input value={form.color} onChange={e => setField('color', e.target.value)}
                    placeholder="Rojo" className={inp} />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Ciudad de matrícula (opcional)">
                  <input value={form.registration_city} onChange={e => setField('registration_city', e.target.value)}
                    placeholder="Ej: Riohacha" className={inp} />
                </Field>
              </div>
            </div>
          </div>

          {/* Tipo de inspección */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Tipo de inspección</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { v: 'official',     label: 'Oficial',      desc: 'Inspección RTM oficial' },
                { v: 'pre_technical', label: 'Pre-técnica', desc: 'Revisión previa informal' },
              ].map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setInspectionType(opt.v)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    inspectionType === opt.v
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/40'
                  }`}
                >
                  <p className={`font-bold text-sm ${inspectionType === opt.v ? 'text-accent' : 'text-ink'}`}>{opt.label}</p>
                  <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {submitError && (
            <div className="px-4 py-3 rounded-lg bg-danger-soft border border-red-200 text-danger text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {submitError}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setPhase('not_found')}
              className="px-4 py-3 rounded-xl border border-border text-sm text-muted hover:text-ink hover:bg-canvas transition">
              Atrás
            </button>
            <button
              type="submit"
              disabled={walkInMut.isPending}
              className="flex-1 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm transition disabled:opacity-60"
            >
              {walkInMut.isPending ? 'Registrando...' : 'Registrar e iniciar inspección →'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
