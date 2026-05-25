import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

const schema = z.object({
  username: z.string().min(1, 'Ingresa tu usuario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPwd, setShowPwd] = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    setApiError('')
    try {
      const user = await login(data)
      if (user.must_change_password) { navigate('/cambiar-contrasena'); return }
      if (user.role === 'customer') navigate('/cliente')
      else if (['supervisor', 'admin'].includes(user.role)) navigate('/admin-panel')
      else navigate('/operacion')
    } catch (err) {
      setApiError(err.response?.data?.detail ?? 'Credenciales incorrectas')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — brand */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] p-12 relative overflow-hidden" style={{background:'linear-gradient(145deg,#060d1f 0%,#081428 60%,#0c1b34 100%)'}}>
        {/* Patrón de puntos */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        {/* Línea azul superior */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-brand" />

        <div className="relative">
          <div className="mb-12">
            <img src="/logo_blanco.png" alt="Checkar" className="h-14 w-auto" />
          </div>
          <h1 className="text-white text-3xl font-bold leading-tight mb-4">
            Tu inspección<br />técnico-mecánica<br />en línea.
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            Agenda, rastrea y descarga tus certificados de revisión
            sin hacer filas. Todo desde tu teléfono.
          </p>

          <div className="mt-10 space-y-4">
            {['Agenda citas desde cualquier lugar', 'Seguimiento en tiempo real', 'Certificados digitales'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/30 text-xs">
          Riohacha, La Guajira, Colombia<br />
          Calle 15 No. 12B-44
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-6 bg-canvas">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="lg:hidden mb-8">
            <img src="/logo_blanco.png" alt="Checkar" className="h-12 w-auto" />
          </div>

          <h2 className="text-2xl font-bold text-ink mb-1">Bienvenido</h2>
          <p className="text-ink-2 text-sm mb-8">Ingresa a tu portal de revisiones</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Usuario</label>
              <input
                {...register('username')}
                autoComplete="username"
                placeholder="tu.usuario"
                className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition placeholder:text-muted text-ink"
              />
              {errors.username && <p className="mt-1 text-xs text-danger">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-lg border border-border bg-canvas text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
            </div>

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
              {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-2">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-accent font-semibold hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
