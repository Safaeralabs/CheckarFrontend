import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import api from '../../api/client'

const schema = z.object({
  plate:            z.string().regex(/^[A-Za-z]{3}\d{3}$/, 'Formato inválido. Debe ser 3 letras y 3 dígitos (ej: ABC123)'),
  vehicle_type:     z.enum(['light', 'heavy', 'motorcycle']),
  vehicle_class:    z.string().optional().default(''),
  service_category: z.enum(['particular', 'commercial', 'public', 'official', 'teaching']),
  brand:            z.string().min(1, 'Requerido'),
  model_line:       z.string().min(1, 'Requerido'),
  model_year:       z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  color:            z.string().optional().default(''),
  fuel_type:        z.enum(['gasoline', 'diesel', 'hybrid', 'electric', 'gas']),
  vin:              z.string().optional().default(''),
  engine_number:    z.string().optional().default(''),
  mileage:          z.coerce.number().min(0).default(0),
  num_axes:         z.coerce.number().min(1).max(10).default(2),
  tinted_windows:   z.boolean().default(false),
  armored:          z.boolean().default(false),
  non_functional:   z.boolean().default(false),
})

const inp = "w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition placeholder:text-muted text-ink"
const sel = `${inp} cursor-pointer`

function Field({ label, error, children, half }) {
  return (
    <div className={half ? 'col-span-1' : 'col-span-2'}>
      <label className="block text-xs font-semibold text-ink-2 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

function Check({ label, ...props }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <input type="checkbox" className="w-4 h-4 rounded border-border accent-accent" {...props} />
      <span className="text-sm text-ink">{label}</span>
    </label>
  )
}

export default function VehicleForm({ vehicle, onSuccess, onCancel }) {
  const isEdit = !!vehicle

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: vehicle ?? {
      vehicle_type: 'light', service_category: 'particular',
      fuel_type: 'gasoline', num_axes: 2, mileage: 0,
      model_year: new Date().getFullYear(),
    },
  })

  useEffect(() => {
    if (vehicle) reset(vehicle)
  }, [vehicle, reset])

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? api.patch(`vehicles/${vehicle.id}/`, data)
      : api.post('vehicles/', data),
    onSuccess,
  })

  const onSubmit = (data) => {
    data.plate = data.plate.toUpperCase()
    mutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-xl bg-surface rounded-t-2xl sm:rounded-xl shadow-xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-bold text-ink">{isEdit ? 'Editar vehículo' : 'Nuevo vehículo'}</h2>
          <button onClick={onCancel} className="text-muted hover:text-ink transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto">
          <div className="p-5 space-y-6">
            {/* Identificación */}
            <section>
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Identificación</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Placa" error={errors.plate?.message} half>
                  <input {...register('plate')} placeholder="ABC123" className={inp}
                    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', textTransform: 'uppercase' }} />
                </Field>
                <Field label="Tipo" error={errors.vehicle_type?.message} half>
                  <select {...register('vehicle_type')} className={sel}>
                    <option value="light">Liviano</option>
                    <option value="heavy">Pesado</option>
                    <option value="motorcycle">Motocicleta</option>
                  </select>
                </Field>
                <Field label="Clase" error={errors.vehicle_class?.message} half>
                  <select {...register('vehicle_class')} className={sel}>
                    <option value="">— Sin especificar —</option>
                    <option value="auto">Automóvil</option>
                    <option value="pickup">Camioneta</option>
                    <option value="suv">Campero</option>
                    <option value="van">Microbús / Van</option>
                    <option value="truck">Camión</option>
                    <option value="bus">Bus</option>
                    <option value="motorcycle">Motocicleta</option>
                    <option value="other">Otro</option>
                  </select>
                </Field>
                <Field label="Servicio" error={errors.service_category?.message} half>
                  <select {...register('service_category')} className={sel}>
                    <option value="particular">Particular</option>
                    <option value="public">Público</option>
                    <option value="official">Oficial</option>
                    <option value="teaching">Enseñanza</option>
                    <option value="commercial">Comercial</option>
                  </select>
                </Field>
              </div>
            </section>

            {/* Datos generales */}
            <section>
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Datos generales</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Marca" error={errors.brand?.message} half>
                  <input {...register('brand')} placeholder="Toyota" className={inp} />
                </Field>
                <Field label="Línea / Modelo" error={errors.model_line?.message} half>
                  <input {...register('model_line')} placeholder="Camry" className={inp} />
                </Field>
                <Field label="Año" error={errors.model_year?.message} half>
                  <input {...register('model_year')} type="number" placeholder="2022" className={inp} />
                </Field>
                <Field label="Color" half>
                  <input {...register('color')} placeholder="Blanco" className={inp} />
                </Field>
                <Field label="Combustible" error={errors.fuel_type?.message}>
                  <select {...register('fuel_type')} className={sel}>
                    <option value="gasoline">Gasolina</option>
                    <option value="diesel">Diésel</option>
                    <option value="hybrid">Híbrido</option>
                    <option value="electric">Eléctrico</option>
                    <option value="gas">Gas</option>
                  </select>
                </Field>
              </div>
            </section>

            {/* Técnico */}
            <section>
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Técnico</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="VIN" half>
                  <input {...register('vin')} placeholder="Opcional" className={inp} />
                </Field>
                <Field label="Nro. motor" half>
                  <input {...register('engine_number')} placeholder="Opcional" className={inp} />
                </Field>
                <Field label="Kilometraje" error={errors.mileage?.message} half>
                  <input {...register('mileage')} type="number" placeholder="0" className={inp} />
                  <label className="mt-1.5 flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-border accent-accent" {...register('non_functional')} />
                    <span className="text-xs text-ink-2">Kilometraje no funcional</span>
                  </label>
                </Field>
                <Field label="Ejes" error={errors.num_axes?.message} half>
                  <input {...register('num_axes')} type="number" min={1} max={10} className={inp} />
                </Field>
              </div>
            </section>

            {/* Características */}
            <section>
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Características</h3>
              <div className="space-y-3">
                <Check label="Vidrios polarizados" {...register('tinted_windows')} />
                <Check label="Vehículo blindado" {...register('armored')} />
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 py-4 border-t border-border flex-shrink-0">
            <button type="button" onClick={onCancel}
              className="flex-1 py-3 rounded-lg border border-border text-ink text-sm font-semibold hover:bg-canvas transition">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || mutation.isPending}
              className="flex-1 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition disabled:opacity-60">
              {isSubmitting || mutation.isPending
                ? 'Guardando...'
                : isEdit ? 'Guardar cambios' : 'Agregar vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
