import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ArrowRight, Bell, Car, CheckCircle, Clock, Printer } from 'lucide-react'
import api from '../../api/client'
import { addDamagePhoto, removeDamagePhoto } from '../../api/operations'
import SignaturePad from '../../components/SignaturePad'
import DamageDiagram from '../../components/DamageDiagram'

const schema = z.object({
  // Inspección
  inspection_type:          z.enum(['official', 'pre_technical']),
  foreign_vehicle:          z.boolean().default(false),
  // Conductor
  driver_is_owner:          z.boolean().default(true),
  driver_name:              z.string().optional().default(''),
  driver_first_surname:     z.string().optional().default(''),
  driver_second_surname:    z.string().optional().default(''),
  driver_id_type:           z.enum(['cc', 'ce', 'passport', 'nit', 'ti']),
  driver_id_number:         z.string().optional().default(''),
  driver_phone:             z.string().optional().default(''),
  driver_email:             z.string().email().optional().or(z.literal('')).default(''),
  driver_address:           z.string().optional().default(''),
  driver_city:              z.string().optional().default(''),
  driver_license_category:  z.enum(['A1','A2','B1','B2','B3','C1','C2','C3']).optional().or(z.literal('')),
  driver_hearing_impaired:  z.boolean().default(false),
  // Verificaciones
  plate_confirmed:          z.boolean().default(false),
  customer_confirmed:       z.boolean().default(false),
  documents_complete:       z.boolean().default(false),
  objects_in_vehicle:       z.boolean().default(false),
  notes:                    z.string().optional().default(''),
  // Datos del vehículo (se envían por separado a PATCH vehicles/{id}/)
  veh_service_category:     z.enum(['particular', 'commercial', 'public', 'official', 'teaching']).default('particular'),
  veh_vehicle_class:        z.string().optional().default(''),
  veh_num_axes:             z.coerce.number().int().min(1).max(10).default(2),
  veh_mileage:              z.coerce.number().int().min(0).default(0),
  veh_num_passengers:       z.coerce.number().int().min(1).optional().or(z.literal('')),
  veh_non_functional:       z.boolean().default(false),
  veh_tinted_windows:       z.boolean().default(false),
  veh_armored:              z.boolean().default(false),
  veh_registration_city:    z.string().optional().default(''),
  // FR-25 extras
  inspection_subtype:       z.enum(['primera', 'reinspeccion']).default('primera'),
  inspection_cost:          z.coerce.number().min(0).optional().or(z.literal('')),
  // Inventario: campos de texto libre por ítem
  inv_llavero:              z.string().optional().default(''),
  inv_equipo_carretera:     z.string().optional().default(''),
  inv_encendedor:           z.string().optional().default(''),
  inv_radio:                z.string().optional().default(''),
  inv_extintor:             z.string().optional().default(''),
  inv_tapete:               z.string().optional().default(''),
  inv_herramientas:         z.string().optional().default(''),
  inv_parlantes:            z.string().optional().default(''),
  inv_num_sillas:           z.string().optional().default(''),
  inv_otros:                z.string().optional().default(''),
})

const inp = "w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition placeholder:text-muted text-ink"
const sel = `${inp} cursor-pointer`
const inpSm = "w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition placeholder:text-muted text-ink"

function Field({ label, error, children, half }) {
  return (
    <div className={half ? '' : 'col-span-2'}>
      <label className="block text-xs font-semibold text-ink-2 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

function CheckRow({ label, ...props }) {
  return (
    <label className="flex items-center gap-3 py-3 cursor-pointer">
      <input type="checkbox" className="w-4 h-4 rounded border-border accent-accent" {...props} />
      <span className="text-sm text-ink">{label}</span>
    </label>
  )
}

function InfoPill({ label, value }) {
  return (
    <div className="bg-canvas rounded-lg px-3 py-2 border border-border">
      <p className="text-xs text-muted uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-ink">{value || '—'}</p>
    </div>
  )
}

const VEHICLE_CLASS_LABELS = {
  auto: 'Automóvil', pickup: 'Camioneta', suv: 'Campero',
  van: 'Microbús / Van', truck: 'Camión', bus: 'Bus',
  motorcycle: 'Motocicleta', other: 'Otro',
}

const VEHICLE_TYPE_LABELS = { light: 'Liviano', heavy: 'Pesado', motorcycle: 'Motocicleta' }
const FUEL_LABELS = { gasoline: 'Gasolina', diesel: 'Diésel', hybrid: 'Híbrido', electric: 'Eléctrico', gas: 'Gas' }

const SIG_STATUS = {
  unsigned:        { label: 'Sin firmas',               color: 'bg-gray-100 text-gray-600 border-gray-200' },
  operator_signed: { label: 'Firmado — esperando cliente', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  fully_signed:    { label: 'Firmado por ambos',         color: 'bg-green-50 text-green-700 border-green-200' },
}

export default function ReceptionForm() {
  const { appointmentId } = useParams()
  const qc = useQueryClient()

  const officerSigRef = useRef(null)
  const [damageAnnotations, setDamageAnnotations] = useState([])
  const [reqSigError, setReqSigError] = useState('')

  const { data: apt, isLoading: loadApt } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => api.get(`scheduling/appointments/${appointmentId}/`).then(r => r.data),
    enabled: !!appointmentId,
  })

  const vehicleId = apt?.vehicle
  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => api.get(`vehicles/${vehicleId}/`).then(r => r.data),
    enabled: !!vehicleId,
  })

  const { data: existingReception } = useQuery({
    queryKey: ['reception', appointmentId],
    queryFn: () => api.get('operations/receptions/', { params: { appointment: appointmentId } }).then(r => {
      const list = r.data?.results ?? r.data ?? []
      return list[0] ?? null
    }),
    enabled: !!appointmentId,
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      inspection_type: 'official',
      driver_id_type: 'cc',
      driver_is_owner: true,
      veh_num_axes: 2,
      veh_mileage: 0,
      veh_service_category: 'particular',
    },
  })

  useEffect(() => {
    if (!existingReception) return
    const inv = existingReception.inventory ?? {}
    reset({
      ...existingReception,
      inv_llavero:          inv.llavero          ?? '',
      inv_equipo_carretera: inv.equipo_carretera  ?? '',
      inv_encendedor:       inv.encendedor        ?? '',
      inv_radio:            inv.radio             ?? '',
      inv_extintor:         inv.extintor          ?? '',
      inv_tapete:           inv.tapete            ?? '',
      inv_herramientas:     inv.herramientas      ?? '',
      inv_parlantes:        inv.parlantes         ?? '',
      inv_num_sillas:       inv.num_sillas        ?? '',
      inv_otros:            inv.otros             ?? '',
    })
    if (existingReception.damage_annotations?.length) {
      setDamageAnnotations(existingReception.damage_annotations)
    }
  }, [existingReception, reset])

  // Pre-populate vehicle fields when vehicle data loads
  useEffect(() => {
    if (!vehicle) return
    setValue('veh_service_category', vehicle.service_category || 'particular')
    setValue('veh_vehicle_class', vehicle.vehicle_class || '')
    setValue('veh_num_axes', vehicle.num_axes ?? 2)
    setValue('veh_mileage', vehicle.mileage ?? 0)
    setValue('veh_num_passengers', vehicle.num_passengers ?? '')
    setValue('veh_non_functional', vehicle.non_functional ?? false)
    setValue('veh_tinted_windows', vehicle.tinted_windows ?? false)
    setValue('veh_armored', vehicle.armored ?? false)
    setValue('veh_registration_city', vehicle.registration_city || '')
  }, [vehicle, setValue])

  const saveMut = useMutation({
    mutationFn: async (data) => {
      // Separar campos del vehículo y del inventario
      const {
        veh_service_category, veh_vehicle_class, veh_num_axes, veh_mileage,
        veh_num_passengers, veh_non_functional, veh_tinted_windows, veh_armored,
        veh_registration_city,
        inv_llavero, inv_equipo_carretera, inv_encendedor, inv_radio, inv_extintor,
        inv_tapete, inv_herramientas, inv_parlantes, inv_num_sillas, inv_otros,
        inspection_cost,
        ...receptionData
      } = data

      // PATCH vehículo
      if (vehicleId) {
        await api.patch(`vehicles/${vehicleId}/`, {
          service_category:  veh_service_category,
          vehicle_class:     veh_vehicle_class || '',
          num_axes:          veh_num_axes,
          mileage:           veh_mileage,
          num_passengers:    veh_num_passengers || null,
          non_functional:    veh_non_functional,
          tinted_windows:    veh_tinted_windows,
          armored:           veh_armored,
          registration_city: veh_registration_city || '',
        })
      }

      // Construir payload de recepción con inventario, daños y firma del operador
      const inventory = {
        llavero: inv_llavero, equipo_carretera: inv_equipo_carretera,
        encendedor: inv_encendedor, radio: inv_radio, extintor: inv_extintor,
        tapete: inv_tapete, herramientas: inv_herramientas, parlantes: inv_parlantes,
        num_sillas: inv_num_sillas, otros: inv_otros,
      }
      const signature_officer = officerSigRef.current?.toDataURL() ?? ''
      const fullPayload = {
        ...receptionData,
        inspection_cost:    inspection_cost || null,
        inventory,
        damage_annotations: damageAnnotations,
        signature_officer,
      }

      // POST / PATCH recepción
      if (existingReception) {
        return api.patch(`operations/receptions/${existingReception.id}/`, fullPayload)
      }
      return api.post('operations/receptions/', {
        ...fullPayload,
        appointment:  appointmentId,
        arrival_time: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reception', appointmentId] })
    },
  })

  const requestSigMut = useMutation({
    mutationFn: () => api.post(`operations/receptions/${existingReception.id}/request_signature/`),
    onSuccess: () => {
      setReqSigError('')
      qc.invalidateQueries({ queryKey: ['reception', appointmentId] })
    },
    onError: (err) => {
      setReqSigError(err.response?.data?.detail ?? 'Error al solicitar firma.')
    },
  })

  const driverIsOwner = watch('driver_is_owner')

  if (loadApt) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const plate = vehicle?.plate ?? apt?.vehicle_detail?.plate ?? '—'
  const serviceName = apt?.service_detail?.name ?? 'Inspección'

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <Link to="/operacion" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Cola del día
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center flex-shrink-0">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Recepción de vehículo</h1>
            <p className="text-sm text-muted">
              <span className="font-mono font-bold text-brand">{plate.toUpperCase()}</span>
              {' · '}{serviceName}
            </p>
          </div>
        </div>
        {existingReception && (
          <div className="flex items-start gap-3">
            {existingReception.turn_number && (
              <div className="bg-accent-soft rounded-xl px-4 py-2 text-center">
                <p className="text-[10px] text-accent font-semibold uppercase tracking-wide">Turno</p>
                <p className="text-lg font-black text-accent font-mono tracking-widest">{existingReception.turn_number}</p>
              </div>
            )}
            <Link
              to={`/operacion/fr25/${existingReception.id}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted hover:text-ink hover:border-brand/40 transition"
            >
              <Printer className="w-4 h-4" /> FR-25
            </Link>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(d => saveMut.mutate(d))} className="space-y-8">

        {/* Tipo de inspección */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Inspección</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo" half error={errors.inspection_type?.message}>
              <select {...register('inspection_type')} className={sel}>
                <option value="official">RTMyEC (Oficial)</option>
                <option value="preventiva">Preventiva</option>
                <option value="pre_technical">Pre-técnica</option>
              </select>
            </Field>
            <Field label="Subtipo" half error={errors.inspection_subtype?.message}>
              <select {...register('inspection_subtype')} className={sel}>
                <option value="primera">Primera inspección</option>
                <option value="reinspeccion">Re-inspección</option>
              </select>
            </Field>
            <Field label="Costo ($)" half error={errors.inspection_cost?.message}>
              <input {...register('inspection_cost')} type="number" min="0" step="1000"
                placeholder="0" className={inpSm} />
            </Field>
          </div>
          <div className="mt-3 divide-y divide-border">
            <CheckRow label="Vehículo extranjero" {...register('foreign_vehicle')} />
          </div>
        </section>

        {/* Datos del vehículo */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Datos del vehículo</h2>

          {/* Info readonly */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5">
            <InfoPill label="Tipo"       value={VEHICLE_TYPE_LABELS[vehicle?.vehicle_type] ?? vehicle?.vehicle_type} />
            <InfoPill label="Marca"      value={vehicle?.brand} />
            <InfoPill label="Línea"      value={vehicle?.model_line} />
            <InfoPill label="Año"        value={vehicle?.model_year} />
            <InfoPill label="Combustible" value={FUEL_LABELS[vehicle?.fuel_type] ?? vehicle?.fuel_type} />
            <InfoPill label="Color"      value={vehicle?.color} />
            {vehicle?.registration_city && (
              <InfoPill label="Matrícula" value={vehicle.registration_city} />
            )}
          </div>

          {/* Campos editables */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Servicio" half>
              <select {...register('veh_service_category')} className={sel}>
                <option value="particular">Particular</option>
                <option value="public">Público</option>
                <option value="official">Oficial</option>
                <option value="teaching">Enseñanza</option>
                <option value="commercial">Comercial</option>
              </select>
            </Field>

            <Field label="Clase de vehículo" half>
              <select {...register('veh_vehicle_class')} className={sel}>
                <option value="">— Sin especificar —</option>
                <option value="auto">Automóvil</option>
                <option value="pickup">Camioneta</option>
                <option value="suv">Campero / SUV</option>
                <option value="van">Microbús / Van</option>
                <option value="truck">Camión</option>
                <option value="bus">Bus</option>
                <option value="motorcycle">Motocicleta</option>
                <option value="other">Otro</option>
              </select>
            </Field>

            <Field label="Número de ejes" half error={errors.veh_num_axes?.message}>
              <select {...register('veh_num_axes')} className={sel}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>

            <Field label="N° pasajeros" half>
              <input {...register('veh_num_passengers')} type="number" min="1" placeholder="5" className={inpSm} />
            </Field>

            <Field label="Kilometraje" half error={errors.veh_mileage?.message}>
              <input {...register('veh_mileage')} type="number" min="0" placeholder="88000" className={inpSm} />
              <label className="mt-1.5 flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-border accent-accent" {...register('veh_non_functional')} />
                <span className="text-xs text-ink-2">Kilometraje no funcional</span>
              </label>
            </Field>

            <Field label="Ciudad de matrícula">
              <input {...register('veh_registration_city')} placeholder="Ej: Riohacha" className={inp} />
            </Field>
          </div>

          <div className="mt-3 divide-y divide-border">
            <CheckRow label="Uso de vidrios polarizados" {...register('veh_tinted_windows')} />
            <CheckRow label="Vehículo blindado"          {...register('veh_armored')} />
          </div>
        </section>

        {/* Inventario de objetos */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Inventario del vehículo</h2>
          <p className="text-xs text-muted mb-3">Registra los objetos encontrados en el vehículo al momento de la recepción.</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              ['inv_llavero',          'Llavero'],
              ['inv_equipo_carretera', 'Equipo de Carretera'],
              ['inv_encendedor',       'Encendedor'],
              ['inv_radio',            'Radio'],
              ['inv_extintor',         'Extintor'],
              ['inv_tapete',           'Tapete'],
              ['inv_herramientas',     'Herramientas'],
              ['inv_parlantes',        'Parlantes'],
              ['inv_num_sillas',       'N° de Sillas'],
              ['inv_otros',            'Otros'],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="block text-xs text-muted mb-1">{label}</label>
                <input {...register(field)} placeholder="—" className={inpSm} />
              </div>
            ))}
          </div>
        </section>

        {/* Esquema de daños visuales */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Esquema de daños</h2>
          <DamageDiagram
            value={damageAnnotations}
            onChange={setDamageAnnotations}
            receptionId={existingReception?.id ?? null}
            photos={existingReception?.damage_photos ?? []}
            onAddPhoto={async (damageId, photoBase64) => {
              await addDamagePhoto(existingReception.id, { damage_id: damageId, photo_base64: photoBase64 })
              qc.invalidateQueries({ queryKey: ['reception', appointmentId] })
            }}
            onRemovePhoto={async (photoId) => {
              await removeDamagePhoto(existingReception.id, photoId)
              qc.invalidateQueries({ queryKey: ['reception', appointmentId] })
            }}
          />
        </section>

        {/* Datos del conductor */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Conductor</h2>
          <div className="divide-y divide-border mb-4">
            <CheckRow label="El conductor es el propietario del vehículo" {...register('driver_is_owner')} />
          </div>

          {!driverIsOwner && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre" half error={errors.driver_name?.message}>
                <input {...register('driver_name')} placeholder="Juan" className={inp} />
              </Field>
              <Field label="Primer apellido" half>
                <input {...register('driver_first_surname')} placeholder="Pérez" className={inp} />
              </Field>
              <Field label="Segundo apellido" half>
                <input {...register('driver_second_surname')} placeholder="García" className={inp} />
              </Field>
              <Field label="Tipo de identificación" half>
                <select {...register('driver_id_type')} className={sel}>
                  <option value="cc">Cédula de ciudadanía</option>
                  <option value="ce">Cédula de extranjería</option>
                  <option value="passport">Pasaporte</option>
                  <option value="nit">NIT</option>
                  <option value="ti">Tarjeta de identidad</option>
                </select>
              </Field>
              <Field label="Número de identificación" half>
                <input {...register('driver_id_number')} placeholder="12345678" className={inp} />
              </Field>
              <Field label="Celular" half>
                <input {...register('driver_phone')} placeholder="3001234567" className={inp} />
              </Field>
              <Field label="Email" half>
                <input {...register('driver_email')} type="email" placeholder="conductor@correo.com" className={inp} />
              </Field>
              <Field label="Dirección" half>
                <input {...register('driver_address')} placeholder="Calle 15 No. 12-44" className={inp} />
              </Field>
              <Field label="Ciudad" half>
                <input {...register('driver_city')} placeholder="Riohacha" className={inp} />
              </Field>
              <Field label="Categoría de licencia" half>
                <select {...register('driver_license_category')} className={sel}>
                  <option value="">— Sin especificar —</option>
                  {['A1','A2','B1','B2','B3','C1','C2','C3'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          )}
          {!driverIsOwner && (
            <div className="mt-3 divide-y divide-border">
              <CheckRow label="Conductor con discapacidad auditiva" {...register('driver_hearing_impaired')} />
            </div>
          )}
        </section>

        {/* Verificaciones */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Verificaciones de recepción</h2>
          <div className="divide-y divide-border">
            <CheckRow label="Placa confirmada"                  {...register('plate_confirmed')} />
            <CheckRow label="Cliente / propietario confirmado"  {...register('customer_confirmed')} />
            <CheckRow label="Documentos completos"              {...register('documents_complete')} />
            <CheckRow label="Hay objetos dentro del vehículo"   {...register('objects_in_vehicle')} />
          </div>
        </section>

        {/* Notas */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Notas</h2>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Observaciones adicionales al recepcionar el vehículo..."
            className={`${inp} resize-none`}
          />
        </section>

        {/* Firma del operador */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Firma del operador</h2>
          <p className="text-xs text-muted mb-5">
            El funcionario firma primero. Luego se solicita la firma del cliente desde su portal.
          </p>
          <SignaturePad ref={officerSigRef} label="Funcionario del CDA" />
        </section>

        {saveMut.isError && (
          <div className="px-4 py-3 rounded-lg bg-danger-soft border border-red-200 text-danger text-sm">
            {saveMut.error?.response?.data?.detail ?? 'Error al guardar la recepción.'}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || saveMut.isPending}
          className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm transition disabled:opacity-60"
        >
          {saveMut.isPending ? 'Guardando...' : existingReception ? 'Guardar cambios' : 'Guardar recepción'}
        </button>
      </form>

      {/* Flujo de firmas — solo visible cuando ya hay recepción guardada */}
      {existingReception && (
        <div className="mt-6 bg-surface rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-muted uppercase tracking-widest">Estado de firmas</h2>
            {(() => {
              const s = SIG_STATUS[existingReception.signature_status] ?? SIG_STATUS.unsigned
              return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>{s.label}</span>
            })()}
          </div>

          {existingReception.signature_status === 'unsigned' && (
            <div>
              <p className="text-xs text-muted mb-3">
                Una vez guardada la firma del operador, solicita la firma del cliente para habilitar la inspección.
              </p>
              <button
                onClick={() => { setReqSigError(''); requestSigMut.mutate() }}
                disabled={requestSigMut.isPending}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition disabled:opacity-60"
              >
                <Bell className="w-4 h-4" />
                {requestSigMut.isPending ? 'Enviando...' : 'Solicitar firma del cliente'}
              </button>
              {reqSigError && <p className="mt-2 text-xs text-danger">{reqSigError}</p>}
            </div>
          )}

          {existingReception.signature_status === 'operator_signed' && (
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-800">Esperando firma del cliente</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    La inspección iniciará una vez que el cliente firme desde su portal.
                  </p>
                </div>
              </div>
              {apt?.customer_detail && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-canvas border border-border">
                  <Bell className="w-4 h-4 text-muted flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-ink-2 space-y-0.5">
                    <p className="font-semibold text-ink">
                      Notificación enviada a: {apt.customer_detail.first_name} {apt.customer_detail.last_name}
                    </p>
                    {apt.customer_detail.email && <p className="text-muted">{apt.customer_detail.email}</p>}
                    {apt.customer_detail.phone && <p className="text-muted">{apt.customer_detail.phone}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {existingReception.signature_status === 'fully_signed' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Recepción firmada por ambas partes</p>
                  <p className="text-xs text-green-700 mt-0.5">La inspección ya puede comenzar.</p>
                </div>
              </div>
              <InspectionLink appointmentId={appointmentId} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InspectionLink({ appointmentId }) {
  const { data } = useQuery({
    queryKey: ['inspection-for-reception', appointmentId],
    queryFn: () => api.get('inspections/records/', { params: { appointment: appointmentId } })
      .then(r => (r.data?.results ?? r.data ?? [])[0] ?? null),
    enabled: !!appointmentId,
  })
  if (!data) return null
  return (
    <Link
      to={`/operacion/inspecciones/${data.id}`}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand hover:bg-brand-light text-white font-bold text-sm transition"
    >
      Ir a la inspección <ArrowRight className="w-4 h-4" />
    </Link>
  )
}
