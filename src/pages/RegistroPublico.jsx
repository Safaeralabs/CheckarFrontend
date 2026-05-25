import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck, User, Car, CheckCircle, ChevronRight, ChevronLeft, Eye, EyeOff } from 'lucide-react'
import { registroPublico } from '../api/auth'

// ── Schemas por paso ─────────────────────────────────────────────────────────

const step1Fields = ['first_name', 'last_name', 'document_number', 'phone', 'email', 'password', 'confirm']
const step2Fields = ['plate', 'brand', 'model_line', 'model_year', 'vehicle_type', 'fuel_type']

const schema = z.object({
  // Paso 1 — propietario
  first_name:      z.string().min(1, 'Requerido'),
  last_name:       z.string().min(1, 'Requerido'),
  document_number: z.string().regex(/^\d{5,12}$/, 'Solo dígitos, entre 5 y 12'),
  phone:           z.string().regex(/^\d{7,10}$/, 'Solo dígitos, entre 7 y 10'),
  email:           z.string().email('Correo inválido'),
  password:        z.string().min(8, 'Mínimo 8 caracteres'),
  confirm:         z.string(),
  // Paso 2 — vehículo
  plate:        z.string().regex(/^[A-Za-z]{3}\d{3}$/, 'Formato inválido. Debe ser 3 letras y 3 dígitos (ej: ABC123)'),
  brand:        z.string().min(1, 'Requerido'),
  model_line:   z.string().min(1, 'Requerido'),
  model_year:   z.coerce.number().min(1990, 'Año mínimo 1990').max(new Date().getFullYear() + 1, 'Año inválido'),
  vehicle_type: z.enum(['light', 'heavy', 'motorcycle'], { message: 'Selecciona un tipo' }),
  fuel_type:    z.enum(['gasoline', 'diesel', 'hybrid', 'electric', 'gas'], { message: 'Selecciona el combustible' }),
  color:             z.string().optional().default(''),
  registration_city: z.string().optional().default(''),
}).refine(d => d.password === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
})

// ── Estilos compartidos ───────────────────────────────────────────────────────

const inp = "w-full px-4 py-3 rounded-lg border border-border bg-card text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition placeholder:text-muted text-ink"
const sel = `${inp} cursor-pointer`

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-2 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

// ── Indicador de pasos ────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Propietario', icon: User },
  { label: 'Vehículo',    icon: Car },
  { label: 'Listo',       icon: CheckCircle },
]

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done    = i < current
        const active  = i === current
        const Icon    = s.icon
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                ${done   ? 'bg-brand border-brand'         : ''}
                ${active ? 'bg-brand/20 border-brand'      : ''}
                ${!done && !active ? 'bg-surface border-border' : ''}
              `}>
                <Icon className={`w-4 h-4 ${done || active ? 'text-brand' : 'text-muted'} ${done ? 'text-white' : ''}`} />
              </div>
              <span className={`text-[10px] mt-1 font-medium ${active ? 'text-brand' : done ? 'text-ink-2' : 'text-muted'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-16 h-px mx-1 mb-4 transition-all ${i < current ? 'bg-brand' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Paso 1: Datos del propietario ─────────────────────────────────────────────

function PasoPropietario({ form, onNext, apiError }) {
  const { register, trigger, formState: { errors } } = form
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleNext = async () => {
    const ok = await trigger(step1Fields)
    if (ok) onNext()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombre" error={errors.first_name?.message}>
          <input {...register('first_name')} placeholder="Juan" className={inp} />
        </Field>
        <Field label="Apellido" error={errors.last_name?.message}>
          <input {...register('last_name')} placeholder="Pérez" className={inp} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cédula / Documento" error={errors.document_number?.message}>
          <input {...register('document_number')} placeholder="12345678" className={inp} inputMode="numeric" />
        </Field>
        <Field label="Celular" error={errors.phone?.message}>
          <input {...register('phone')} placeholder="3001234567" className={inp} inputMode="tel" />
        </Field>
      </div>

      <Field label="Correo electrónico" error={errors.email?.message}>
        <input {...register('email')} type="email" placeholder="juan@correo.com" className={inp} />
      </Field>

      <Field label="Contraseña" error={errors.password?.message}>
        <div className="relative">
          <input
            {...register('password')}
            type={showPwd ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            className={`${inp} pr-11`}
          />
          <button type="button" onClick={() => setShowPwd(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition">
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>

      <Field label="Confirmar contraseña" error={errors.confirm?.message}>
        <div className="relative">
          <input
            {...register('confirm')}
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repite tu contraseña"
            className={`${inp} pr-11`}
          />
          <button type="button" onClick={() => setShowConfirm(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition">
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>

      {apiError && (
        <div className="px-4 py-3 rounded-lg bg-danger-soft border border-danger/30 text-danger text-sm">
          {apiError}
        </div>
      )}

      <button
        type="button"
        onClick={handleNext}
        className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
      >
        Continuar <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Paso 2: Datos del vehículo ────────────────────────────────────────────────

function PasoVehiculo({ form, onNext, onBack, isSubmitting, apiError }) {
  const { register, trigger, formState: { errors } } = form

  const handleNext = async () => {
    const ok = await trigger(step2Fields)
    if (ok) onNext()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Placa" error={errors.plate?.message}>
          <input
            {...register('plate')}
            placeholder="ABC123"
            className={inp}
            style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-mono)' }}
          />
        </Field>
        <Field label="Tipo de vehículo" error={errors.vehicle_type?.message}>
          <select {...register('vehicle_type')} className={sel}>
            <option value="">— Seleccionar —</option>
            <option value="light">Liviano</option>
            <option value="heavy">Pesado</option>
            <option value="motorcycle">Motocicleta</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Marca" error={errors.brand?.message}>
          <input {...register('brand')} placeholder="Toyota" className={inp} />
        </Field>
        <Field label="Línea / Modelo" error={errors.model_line?.message}>
          <input {...register('model_line')} placeholder="Corolla" className={inp} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Año" error={errors.model_year?.message}>
          <input {...register('model_year')} type="number" placeholder="2022" className={inp} inputMode="numeric" />
        </Field>
        <Field label="Color" error={errors.color?.message}>
          <input {...register('color')} placeholder="Blanco (opcional)" className={inp} />
        </Field>
      </div>

      <Field label="Ciudad de matrícula" error={errors.registration_city?.message}>
        <input {...register('registration_city')} placeholder="Ej: Riohacha (opcional)" className={inp} />
      </Field>

      <Field label="Combustible" error={errors.fuel_type?.message}>
        <select {...register('fuel_type')} className={sel}>
          <option value="">— Seleccionar —</option>
          <option value="gasoline">Gasolina</option>
          <option value="diesel">Diésel</option>
          <option value="hybrid">Híbrido</option>
          <option value="electric">Eléctrico</option>
          <option value="gas">Gas</option>
        </select>
      </Field>

      {apiError && (
        <div className="px-4 py-3 rounded-lg bg-danger-soft border border-danger/30 text-danger text-sm">
          {apiError}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-lg border border-border text-ink font-semibold text-sm flex items-center justify-center gap-2 hover:bg-surface transition"
        >
          <ChevronLeft className="w-4 h-4" /> Atrás
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
        >
          {isSubmitting ? 'Registrando...' : <>Registrarme <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  )
}

// ── Paso 3: Éxito ─────────────────────────────────────────────────────────────

function PasoExito({ nombre, documento }) {
  const navigate = useNavigate()
  return (
    <div className="text-center py-4 space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-success-soft flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold text-ink mb-2">¡Registro exitoso!</h3>
        <p className="text-ink-2 text-sm leading-relaxed">
          Bienvenido, <span className="text-ink font-semibold">{nombre}</span>.<br />
          Tu vehículo ha sido registrado y tu información ya está en el sistema.
        </p>
      </div>

      <div className="bg-surface rounded-xl border border-border p-4 text-left space-y-2">
        <p className="text-xs text-muted uppercase tracking-wide font-semibold mb-3">Tus datos de acceso</p>
        <div className="flex justify-between text-sm">
          <span className="text-ink-2">Usuario</span>
          <span className="text-ink font-mono font-semibold">{documento}</span>
        </div>
        <p className="text-xs text-muted">Usa tu número de documento para iniciar sesión.</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate('/login')}
          className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition"
        >
          Iniciar sesión
        </button>
        <button
          onClick={() => navigate('/cliente')}
          className="w-full py-3 rounded-lg border border-border text-ink font-semibold text-sm hover:bg-surface transition"
        >
          Ir a mi portal
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function RegistroPublico() {
  const [step, setStep] = useState(0)
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userData, setUserData] = useState(null)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicle_type: '',
      fuel_type: '',
      color: '',
      model_year: new Date().getFullYear(),
    },
    mode: 'onTouched',
  })

  const onSubmit = async (data) => {
    setApiError('')
    setIsSubmitting(true)
    try {
      const { confirm, color, registration_city, ...rest } = data
      const payload = {
        first_name:      rest.first_name,
        last_name:       rest.last_name,
        email:           rest.email,
        phone:           rest.phone,
        document_number: rest.document_number,
        password:        rest.password,
        vehicle: {
          plate:             rest.plate.toUpperCase(),
          brand:             rest.brand,
          model_line:        rest.model_line,
          model_year:        rest.model_year,
          vehicle_type:      rest.vehicle_type,
          fuel_type:         rest.fuel_type,
          color:             color || '',
          registration_city: registration_city || '',
        },
      }
      await registroPublico(payload)
      setUserData({ nombre: `${rest.first_name} ${rest.last_name}`, documento: rest.document_number })
      setStep(2)
    } catch (err) {
      const d = err.response?.data
      if (d?.vehicle?.plate) {
        setApiError(`Placa: ${d.vehicle.plate[0]}`)
      } else if (d?.document_number) {
        setApiError(d.document_number[0])
        setStep(0)
      } else if (d?.email) {
        setApiError(d.email[0])
        setStep(0)
      } else {
        setApiError(d?.detail ?? 'Error al registrar. Intenta de nuevo.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 py-12">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 bg-brand rounded-lg flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-white text-xl tracking-tight">CHECKAR</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-xl p-7">
        {step < 2 && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-ink mb-1">Registro de cliente</h2>
              <p className="text-ink-2 text-sm">
                Centro de Diagnóstico Automotriz · Riohacha, La Guajira
              </p>
            </div>
            <StepIndicator current={step} />
          </>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {step === 0 && (
            <PasoPropietario
              form={form}
              onNext={() => { setApiError(''); setStep(1) }}
              apiError={apiError}
            />
          )}
          {step === 1 && (
            <PasoVehiculo
              form={form}
              onBack={() => { setApiError(''); setStep(0) }}
              onNext={form.handleSubmit(onSubmit)}
              isSubmitting={isSubmitting}
              apiError={apiError}
            />
          )}
        </form>

        {step === 2 && userData && (
          <PasoExito nombre={userData.nombre} documento={userData.documento} />
        )}

        {step < 2 && (
          <p className="mt-6 text-center text-xs text-muted">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-accent font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        )}
      </div>

      <p className="mt-6 text-xs text-muted text-center">
        Calle 15 No. 12B-44, Riohacha · checkar.com.co
      </p>
    </div>
  )
}
