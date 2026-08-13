import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Mail, MessageSquare, Megaphone, Plus, Send, Users, X } from 'lucide-react'
import api from '../../api/client'

// ── Plantilla de carga externa ────────────────────────────────────────────
// Para clientes que aún no están registrados en el sistema (ej: base de
// vencimientos de RTM que ya maneja el CDA por fuera). Columnas mínimas
// para poder contactarlos e invitarlos a acercarse a pagar.
const TEMPLATE_HEADERS = ['nombre', 'email', 'telefono', 'placa', 'concepto', 'valor', 'fecha_vencimiento']
const TEMPLATE_EXAMPLE = [
  'Juan Pérez', 'juan.perez@correo.com', '3001234567', 'ABC123',
  'Revisión Técnico Mecánica', '180000', '2026-09-15',
]

function downloadCampaignTemplate() {
  const csvEscape = (v) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
  const rows = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE].map(r => r.map(csvEscape).join(','))
  const csv = '﻿' + rows.join('\r\n') // BOM para que Excel reconozca tildes/ñ
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'plantilla_campana_checkar.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const inp = "w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition placeholder:text-muted text-ink"
const sel = `${inp} cursor-pointer`

const STATUS_STYLE = {
  draft:   { label: 'Borrador', badge: 'bg-canvas text-muted border-border' },
  sending: { label: 'Enviando', badge: 'bg-info-soft text-info border-info/30' },
  sent:    { label: 'Enviada',  badge: 'bg-success-soft text-success border-success/30' },
  failed:  { label: 'Fallida',  badge: 'bg-danger-soft text-danger border-danger/30' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.draft
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${s.badge}`}>
      {s.label}
    </span>
  )
}

function ChannelBadge({ channel }) {
  const Icon = channel === 'sms' ? MessageSquare : Mail
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-2">
      <Icon className="w-3.5 h-3.5" />
      {channel === 'sms' ? 'SMS' : 'Email'}
    </span>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-2 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

function NewCampaignModal({ onClose, onCreated }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: '', channel: 'email', subject: '', message: '', city: '' },
  })
  const [preview, setPreview] = useState(null)
  const channel = watch('channel')
  const city = watch('city')

  const previewMut = useMutation({
    mutationFn: () => api.post('notifications/campaigns/preview_recipients/', {
      channel,
      filters: city ? { city } : {},
    }).then(r => r.data),
    onSuccess: (data) => setPreview(data.count),
  })

  const createMut = useMutation({
    mutationFn: (data) => api.post('notifications/campaigns/', {
      name: data.name,
      channel: data.channel,
      subject: data.channel === 'email' ? data.subject : '',
      message: data.message,
      filters: data.city ? { city: data.city } : {},
    }).then(r => r.data),
    onSuccess: onCreated,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-surface rounded-t-2xl sm:rounded-xl shadow-xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-bold text-ink">Nueva campaña</h2>
          <button onClick={onClose} className="text-muted hover:text-ink transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(data => createMut.mutate(data))} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <Field label="Nombre de la campaña" error={errors.name?.message}>
              <input
                {...register('name', { required: 'Requerido' })}
                placeholder="Ej: Recordatorio RTM Agosto"
                className={inp}
              />
            </Field>

            <Field label="Canal">
              <select {...register('channel')} className={sel}>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </Field>

            {channel === 'email' && (
              <Field label="Asunto" error={errors.subject?.message}>
                <input
                  {...register('subject', { required: channel === 'email' ? 'Requerido para email' : false })}
                  placeholder="Ej: Tu revisión técnico-mecánica está por vencer"
                  className={inp}
                />
              </Field>
            )}

            <Field label="Mensaje" error={errors.message?.message}>
              <textarea
                {...register('message', { required: 'Requerido' })}
                rows={5}
                placeholder={channel === 'email'
                  ? 'Puedes usar {{nombre}} para saludar al cliente por su nombre.'
                  : 'Mensaje corto — recuerda que los SMS cobran por longitud.'}
                className={inp}
              />
            </Field>

            <Field label="Filtrar por ciudad (opcional)">
              <input
                {...register('city')}
                placeholder="Ej: Riohacha — vacío envía a todos los clientes"
                className={inp}
                onBlur={() => setPreview(null)}
              />
            </Field>

            <div className="flex items-center justify-between bg-canvas rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-ink-2">
                <Users className="w-4 h-4" />
                {preview === null ? 'Destinatarios sin calcular' : `${preview} destinatario${preview !== 1 ? 's' : ''}`}
              </div>
              <button
                type="button"
                onClick={() => previewMut.mutate()}
                disabled={previewMut.isPending}
                className="text-xs font-semibold text-accent hover:underline disabled:opacity-50"
              >
                {previewMut.isPending ? 'Calculando...' : 'Calcular'}
              </button>
            </div>

            {createMut.isError && (
              <p className="text-xs text-danger">
                {createMut.error?.response?.data?.subject?.[0]
                  ?? createMut.error?.response?.data?.detail
                  ?? 'No se pudo crear la campaña.'}
              </p>
            )}
          </div>

          <div className="flex gap-3 px-5 py-4 border-t border-border flex-shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-border text-ink text-sm font-semibold hover:bg-canvas transition">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || createMut.isPending}
              className="flex-1 py-3 rounded-lg bg-brand text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
              {createMut.isPending ? 'Creando...' : 'Crear campaña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Campaigns() {
  const [showNew, setShowNew] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get('notifications/campaigns/').then(r => r.data),
    staleTime: 15 * 1000,
  })

  const sendMut = useMutation({
    mutationFn: (id) => api.post(`notifications/campaigns/${id}/send/`).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  })

  const campaigns = data?.results ?? data ?? []

  return (
    <div className="p-4 md:p-7 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-brand flex-shrink-0" />
            Campañas
          </h1>
          <p className="text-ink-2 text-sm">Envíos masivos de email y SMS a clientes</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadCampaignTemplate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-ink-2 text-sm font-semibold hover:bg-canvas hover:text-ink transition"
            title="Plantilla para cargar contactos que aún no están registrados en el sistema (ej: base de vencimientos)"
          >
            <Download className="w-4 h-4" />
            Descargar plantilla
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Nueva campaña
          </button>
        </div>
      </div>

      <p className="text-xs text-muted mb-5">
        La carga de esta plantilla para enviar campañas a contactos externos (no registrados) todavía no está disponible — por ahora la plantilla sirve para preparar la base. Avisame cuando quieras que agregue la carga.
      </p>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Megaphone className="w-10 h-10 text-muted mb-3" />
            <p className="text-ink font-semibold mb-1">Sin campañas todavía</p>
            <p className="text-ink-2 text-sm">Crea tu primera campaña de email o SMS.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Nombre</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Canal</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Destinatarios</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Enviados / Fallidos</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} className="border-t border-border hover:bg-card/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-ink">{c.name}</p>
                      {c.channel === 'email' && <p className="text-xs text-muted truncate max-w-xs">{c.subject}</p>}
                    </td>
                    <td className="px-4 py-3"><ChannelBadge channel={c.channel} /></td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-sm text-ink-2">{c.recipients_count}</td>
                    <td className="px-4 py-3 text-sm text-ink-2">{c.sent_count} / {c.failed_count}</td>
                    <td className="px-4 py-3 text-right">
                      {(c.status === 'draft' || c.status === 'failed') && (
                        <button
                          onClick={() => sendMut.mutate(c.id)}
                          disabled={sendMut.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {sendMut.isPending ? 'Enviando...' : 'Enviar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNew && (
        <NewCampaignModal
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false)
            queryClient.invalidateQueries({ queryKey: ['campaigns'] })
          }}
        />
      )}
    </div>
  )
}
