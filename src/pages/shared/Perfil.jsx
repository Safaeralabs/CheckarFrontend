import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import * as authApi from '../../api/auth'

const inp = "w-full px-3 py-2.5 rounded-lg border border-border bg-canvas text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-ink"
const btn = "px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition disabled:opacity-60"

export default function Perfil() {
  const { user, updateUser, rotateToken } = useAuth()

  const [profile, setProfile] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    document_number: user?.document_number ?? '',
  })
  const [profileStatus, setProfileStatus] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' })
  const [passStatus, setPassStatus] = useState(null)
  const [passLoading, setPassLoading] = useState(false)

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileStatus(null)
    try {
      const { data } = await authApi.updateProfile(profile)
      updateUser(data)
      setProfileStatus({ ok: true, msg: 'Datos actualizados correctamente.' })
    } catch (err) {
      const detail = err.response?.data
      const msg = typeof detail === 'object'
        ? Object.values(detail).flat().join(' ')
        : 'Error al actualizar los datos.'
      setProfileStatus({ ok: false, msg })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwords.new_password !== passwords.confirm) {
      setPassStatus({ ok: false, msg: 'Las contraseñas nuevas no coinciden.' })
      return
    }
    setPassLoading(true)
    setPassStatus(null)
    try {
      const { data } = await authApi.changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      })
      rotateToken(data.token)
      setPasswords({ current_password: '', new_password: '', confirm: '' })
      setPassStatus({ ok: true, msg: 'Contraseña cambiada correctamente.' })
    } catch (err) {
      const detail = err.response?.data
      const msg = typeof detail === 'object'
        ? Object.values(detail).flat().join(' ')
        : 'Error al cambiar la contraseña.'
      setPassStatus({ ok: false, msg })
    } finally {
      setPassLoading(false)
    }
  }

  const initials = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-ink">Mi perfil</h1>
        <p className="text-sm text-muted mt-0.5">Actualiza tu información personal y contraseña</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand-soft border border-border flex items-center justify-center text-lg font-bold text-brand flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-ink">{user?.first_name} {user?.last_name}</p>
          <p className="text-sm text-muted">@{user?.username} · {user?.role}</p>
        </div>
      </div>

      <form onSubmit={handleProfileSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-ink">Datos personales</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre" value={profile.first_name}
            onChange={v => setProfile(p => ({ ...p, first_name: v }))} />
          <Field label="Apellido" value={profile.last_name}
            onChange={v => setProfile(p => ({ ...p, last_name: v }))} />
          <Field label="Correo electrónico" type="email" value={profile.email}
            onChange={v => setProfile(p => ({ ...p, email: v }))} />
          <Field label="Teléfono" value={profile.phone}
            onChange={v => setProfile(p => ({ ...p, phone: v }))} />
          <Field label="Número de documento" value={profile.document_number}
            onChange={v => setProfile(p => ({ ...p, document_number: v }))} className="sm:col-span-2" />
        </div>

        {profileStatus && (
          <p className={`text-sm font-medium ${profileStatus.ok ? 'text-success' : 'text-danger'}`}>
            {profileStatus.msg}
          </p>
        )}

        <button type="submit" disabled={profileLoading} className={btn}>
          {profileLoading ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-ink">Cambiar contraseña</h2>

        <div className="space-y-4">
          <Field label="Contraseña actual" type="password" value={passwords.current_password}
            onChange={v => setPasswords(p => ({ ...p, current_password: v }))} />
          <Field label="Nueva contraseña" type="password" value={passwords.new_password}
            onChange={v => setPasswords(p => ({ ...p, new_password: v }))} />
          <Field label="Confirmar nueva contraseña" type="password" value={passwords.confirm}
            onChange={v => setPasswords(p => ({ ...p, confirm: v }))} />
        </div>

        {passStatus && (
          <p className={`text-sm font-medium ${passStatus.ok ? 'text-success' : 'text-danger'}`}>
            {passStatus.msg}
          </p>
        )}

        <button type="submit" disabled={passLoading} className={btn}>
          {passLoading ? 'Cambiando…' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-ink-2 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className={inp} />
    </div>
  )
}
