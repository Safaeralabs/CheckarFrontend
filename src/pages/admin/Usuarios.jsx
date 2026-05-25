import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, KeyRound, Users, X } from 'lucide-react'
import * as usersApi from '../../api/users'

const ROLES = [
  { value: 'operator',   label: 'Operador' },
  { value: 'inspector',  label: 'Inspector' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'admin',      label: 'Administrador' },
]

const ROLE_FILTER = [{ value: '', label: 'Todos los roles' }, ...ROLES]

const roleBadge = {
  operator:   'bg-info-soft text-info',
  inspector:  'bg-warning-soft text-warning',
  supervisor: 'bg-accent-soft text-accent',
  admin:      'bg-danger-soft text-danger',
}

const inp = "w-full px-3 py-2.5 rounded-lg border border-border bg-canvas text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-ink"
const btn = "px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition disabled:opacity-60"
const btnGhost = "px-4 py-2 rounded-lg border border-border text-ink-2 hover:bg-canvas text-sm transition"

const EMPTY_FORM = { username: '', password: '', first_name: '', last_name: '', email: '', phone: '', document_number: '', role: 'operator' }

export default function Usuarios() {
  const qc = useQueryClient()
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | { mode: 'create' } | { mode: 'edit', user } | { mode: 'password', user }
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [newPass, setNewPass] = useState('')
  const [passError, setPassError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['internal-users'],
    queryFn: () => usersApi.listInternal().then(r => r.data?.results ?? r.data ?? []),
  })

  const users = (data ?? []).filter(u => {
    const matchRole = !roleFilter || u.role === roleFilter
    const q = search.toLowerCase()
    const matchSearch = !q || [u.first_name, u.last_name, u.username, u.email].join(' ').toLowerCase().includes(q)
    return matchRole && matchSearch
  })

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      modal?.mode === 'create'
        ? usersApi.createUser(payload)
        : usersApi.updateUser(modal.user.id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['internal-users'] }); closeModal() },
    onError: (err) => {
      const d = err.response?.data
      setFormError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Error al guardar.')
    },
  })

  const passMutation = useMutation({
    mutationFn: () => usersApi.resetPassword(modal.user.id, newPass),
    onSuccess: () => closeModal(),
    onError: (err) => {
      const d = err.response?.data
      setPassError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Error al cambiar contraseña.')
    },
  })

  const toggleActive = useMutation({
    mutationFn: (u) => usersApi.updateUser(u.id, { is_active: !u.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['internal-users'] }),
  })

  function openCreate() {
    setForm(EMPTY_FORM); setFormError(''); setModal({ mode: 'create' })
  }

  function openEdit(u) {
    setForm({ username: u.username, password: '', first_name: u.first_name, last_name: u.last_name, email: u.email ?? '', phone: u.phone ?? '', document_number: u.document_number ?? '', role: u.role })
    setFormError('')
    setModal({ mode: 'edit', user: u })
  }

  function openPassword(u) {
    setNewPass(''); setPassError(''); setModal({ mode: 'password', user: u })
  }

  function closeModal() { setModal(null) }

  function handleSave(e) {
    e.preventDefault()
    setFormError('')
    const payload = { ...form }
    if (modal.mode === 'edit') delete payload.username
    if (!payload.password) delete payload.password
    saveMutation.mutate(payload)
  }

  const initials = (u) => [u.first_name?.[0], u.last_name?.[0]].filter(Boolean).join('').toUpperCase() || u.username[0].toUpperCase()

  return (
    <div className="p-4 md:p-7 max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand" />
            Usuarios internos
          </h1>
          <p className="text-ink-2 text-sm">Operadores, inspectores, supervisores y administradores</p>
        </div>
        <button onClick={openCreate} className={btn + ' flex items-center gap-2'}>
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, usuario o correo…"
          className={inp + ' sm:max-w-xs'}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={inp + ' sm:w-48'}>
          {ROLE_FILTER.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted text-sm">Cargando…</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-muted text-sm">Sin resultados</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Usuario</th>
                <th className="px-5 py-3 text-left font-medium hidden sm:table-cell">Username</th>
                <th className="px-5 py-3 text-left font-medium">Rol</th>
                <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Estado</th>
                <th className="px-5 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-canvas/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center text-xs font-bold text-brand flex-shrink-0">
                        {initials(u)}
                      </div>
                      <div>
                        <p className="font-medium text-ink">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-ink-2 hidden sm:table-cell">@{u.username}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[u.role] ?? 'bg-canvas text-muted'}`}>
                      {ROLES.find(r => r.value === u.role)?.label ?? u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <button
                      onClick={() => toggleActive.mutate(u)}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition ${u.is_active ? 'bg-success-soft text-success hover:opacity-70' : 'bg-danger-soft text-danger hover:opacity-70'}`}
                    >
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-canvas transition" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => openPassword(u)} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-canvas transition" title="Resetear contraseña">
                        <KeyRound className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear/editar */}
      {(modal?.mode === 'create' || modal?.mode === 'edit') && (
        <Modal title={modal.mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'} onClose={closeModal}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <F label="Nombre" value={form.first_name} onChange={v => setForm(p => ({ ...p, first_name: v }))} required />
              <F label="Apellido" value={form.last_name} onChange={v => setForm(p => ({ ...p, last_name: v }))} required />
            </div>
            {modal.mode === 'create' && (
              <F label="Nombre de usuario" value={form.username} onChange={v => setForm(p => ({ ...p, username: v }))} required />
            )}
            <F label="Correo" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
            <div className="grid grid-cols-2 gap-4">
              <F label="Teléfono" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
              <F label="Documento" value={form.document_number} onChange={v => setForm(p => ({ ...p, document_number: v }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">Rol</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className={inp}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <F
              label={modal.mode === 'create' ? 'Contraseña' : 'Nueva contraseña (opcional)'}
              type="password"
              value={form.password}
              onChange={v => setForm(p => ({ ...p, password: v }))}
              required={modal.mode === 'create'}
            />
            {formError && <p className="text-sm text-danger">{formError}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={closeModal} className={btnGhost}>Cancelar</button>
              <button type="submit" disabled={saveMutation.isPending} className={btn}>
                {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal resetear contraseña */}
      {modal?.mode === 'password' && (
        <Modal title={`Resetear contraseña — ${modal.user.first_name}`} onClose={closeModal}>
          <div className="space-y-4">
            <F label="Nueva contraseña" type="password" value={newPass} onChange={setNewPass} />
            {passError && <p className="text-sm text-danger">{passError}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={closeModal} className={btnGhost}>Cancelar</button>
              <button onClick={() => passMutation.mutate()} disabled={passMutation.isPending || newPass.length < 8} className={btn}>
                {passMutation.isPending ? 'Guardando…' : 'Cambiar contraseña'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-surface border border-border rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function F({ label, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-2 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} className={inp} />
    </div>
  )
}
