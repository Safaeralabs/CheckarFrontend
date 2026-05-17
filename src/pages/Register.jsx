import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useState } from 'react'

const schema = z.object({
  first_name:      z.string().min(1, 'Requerido'),
  last_name:       z.string().min(1, 'Requerido'),
  username:        z.string().min(3, 'Mínimo 3 caracteres'),
  email:           z.string().email('Email inválido'),
  phone:           z.string().regex(/^\d{7,}$/, 'Solo dígitos, mín. 7'),
  document_number: z.string().regex(/^\d{5,}$/, 'Solo dígitos, mín. 5'),
  password:        z.string().min(8, 'Mínimo 8 caracteres'),
  confirm:         z.string(),
}).refine(d => d.password === d.confirm, { message: 'Las contraseñas no coinciden', path: ['confirm'] })

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

const inp = "w-full px-4 py-3 rounded-lg border border-border bg-surface text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition placeholder:text-muted text-ink"

export default function Register() {
  const navigate = useNavigate()
  const { register: authRegister } = useAuth()
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ confirm, ...data }) => {
    setApiError('')
    try {
      await authRegister(data)
      navigate('/cliente')
    } catch (err) {
      const d = err.response?.data
      setApiError(d?.detail ?? d?.username?.[0] ?? 'Error al registrar. Intenta de nuevo.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-md bg-surface rounded-xl border border-border shadow-sm p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-brand text-lg tracking-tight">CHECKAR</span>
        </div>

        <h2 className="text-2xl font-bold text-ink mb-1">Crear cuenta</h2>
        <p className="text-ink-2 text-sm mb-6">Acceso al portal de clientes</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre" error={errors.first_name?.message}>
              <input {...register('first_name')} placeholder="Juan" className={inp} />
            </Field>
            <Field label="Apellido" error={errors.last_name?.message}>
              <input {...register('last_name')} placeholder="Pérez" className={inp} />
            </Field>
          </div>

          <Field label="Usuario" error={errors.username?.message}>
            <input {...register('username')} placeholder="juan.perez" className={inp} />
          </Field>

          <Field label="Correo electrónico" error={errors.email?.message}>
            <input {...register('email')} type="email" placeholder="juan@correo.com" className={inp} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Celular" error={errors.phone?.message}>
              <input {...register('phone')} placeholder="3001234567" className={inp} />
            </Field>
            <Field label="Cédula / ID" error={errors.document_number?.message}>
              <input {...register('document_number')} placeholder="12345678" className={inp} />
            </Field>
          </div>

          <Field label="Contraseña" error={errors.password?.message}>
            <input {...register('password')} type="password" placeholder="Mín. 8 caracteres" className={inp} />
          </Field>

          <Field label="Confirmar contraseña" error={errors.confirm?.message}>
            <input {...register('confirm')} type="password" placeholder="Repite tu contraseña" className={inp} />
          </Field>

          {apiError && (
            <div className="px-4 py-3 rounded-lg bg-danger-soft border border-red-200 text-danger text-sm">
              {apiError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition disabled:opacity-60"
          >
            {isSubmitting ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-2">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-accent font-semibold hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
