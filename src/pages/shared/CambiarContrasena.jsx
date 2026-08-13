import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getRoleHome } from '../../auth/roleHome'
import * as authApi from '../../api/auth'

const inp = "w-full px-4 py-3 rounded-lg border border-border bg-canvas text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-ink"

export default function CambiarContrasena() {
  const navigate = useNavigate()
  const { user, rotateToken, updateUser } = useAuth()
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }
    if (form.new_password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      })
      rotateToken(data.token)
      updateUser({ ...user, must_change_password: false })

      navigate(getRoleHome(user.role), { replace: true })
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Error al cambiar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-brand-soft flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-brand" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-ink text-center mb-1">Cambia tu contraseña</h1>
        <p className="text-sm text-muted text-center mb-8">
          Por seguridad, debes establecer una nueva contraseña antes de continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Contraseña temporal</label>
            <input
              type="password"
              value={form.current_password}
              onChange={e => setForm(p => ({ ...p, current_password: e.target.value }))}
              placeholder="La que recibiste por correo"
              className={inp}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Nueva contraseña</label>
            <input
              type="password"
              value={form.new_password}
              onChange={e => setForm(p => ({ ...p, new_password: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
              className={inp}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Repite la nueva contraseña"
              className={inp}
              required
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-danger-soft border border-red-200 text-danger text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition disabled:opacity-60"
          >
            {loading ? 'Cambiando…' : 'Establecer nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
