import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, MapPin } from 'lucide-react'
import api from '../../api/client'
import { formatCurrency } from '../../lib/utils'

const STEPS = ['Sede y servicio', 'Fecha y hora', 'Confirmar']

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <div key={label} className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
              done ? 'bg-success text-white' : active ? 'bg-accent text-white' : 'bg-border text-muted'
            }`}>
              {done ? <CheckCircle className="w-4 h-4" /> : n}
            </div>
            <span className={`text-xs font-medium hidden sm:block truncate ${active ? 'text-ink' : 'text-muted'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1 ${done ? 'bg-success' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function SelectCard({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? 'border-accent bg-accent-soft ring-1 ring-accent'
          : 'border-border bg-surface hover:border-brand/40'
      }`}
    >
      {children}
    </button>
  )
}

export default function AppointmentNew() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [sel, setSel] = useState({
    branch: null, service: null, vehicle: null, slot: null, notes: '',
  })

  const { data: branchesRaw } = useQuery({ queryKey: ['branches'], queryFn: () => api.get('scheduling/branches/').then(r => r.data) })
  const { data: servicesRaw } = useQuery({ queryKey: ['services'], queryFn: () => api.get('scheduling/services/').then(r => r.data) })
  const { data: vehiclesRaw } = useQuery({ queryKey: ['vehicles'], queryFn: () => api.get('vehicles/').then(r => r.data) })
  const { data: slotsRaw } = useQuery({
    queryKey: ['slots', sel.branch?.id, sel.service?.id],
    queryFn: () => api.get('scheduling/slots/', { params: { branch: sel.branch?.id, service: sel.service?.id, is_available: true } }).then(r => r.data),
    enabled: !!sel.branch && !!sel.service && step === 2,
  })

  const branches = branchesRaw?.results ?? branchesRaw ?? []
  const services = servicesRaw?.results ?? servicesRaw ?? []
  const vehicles = vehiclesRaw?.results ?? vehiclesRaw ?? []
  const slots = slotsRaw?.results ?? slotsRaw ?? []

  const mutation = useMutation({
    mutationFn: (data) => api.post('scheduling/appointments/', data),
    onSuccess: () => navigate('/cliente/citas'),
  })

  const canNext = () => {
    if (step === 1) return sel.branch && sel.service && sel.vehicle
    if (step === 2) return !!sel.slot
    return true
  }

  const submit = () => {
    mutation.mutate({
      vehicle: sel.vehicle.id,
      branch: sel.branch.id,
      service: sel.service.id,
      slot: sel.slot?.id ?? null,
      scheduled_for: sel.slot?.start_time,
      notes: sel.notes,
      source_channel: 'portal_cliente',
    })
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/cliente/citas')}
        className="flex items-center gap-2 text-sm text-muted hover:text-ink transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <h1 className="text-2xl font-bold text-ink mb-2">Nueva cita</h1>
      <p className="text-sm text-muted mb-6">Revisión técnico-mecánica</p>

      <StepBar current={step} />

      {/* PASO 1 — Sede, servicio y vehículo */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-ink mb-3">Selecciona una sede</h2>
            <div className="space-y-2">
              {branches.map(b => (
                <SelectCard key={b.id} selected={sel.branch?.id === b.id} onClick={() => setSel(s => ({ ...s, branch: b }))}>
                  <p className="font-semibold text-sm text-ink">{b.name}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted">
                    <MapPin className="w-3 h-3" /> {b.address}, {b.city}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-muted">
                    <Clock className="w-3 h-3" /> {b.opens_at?.slice(0,5)} – {b.closes_at?.slice(0,5)}
                  </div>
                </SelectCard>
              ))}
              {branches.length === 0 && <p className="text-sm text-muted">Cargando sedes…</p>}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink mb-3">Selecciona un servicio</h2>
            <div className="space-y-2">
              {services.map(s => (
                <SelectCard key={s.id} selected={sel.service?.id === s.id} onClick={() => setSel(st => ({ ...st, service: s }))}>
                  <p className="font-semibold text-sm text-ink">{s.name}</p>
                  <p className="text-xs text-muted mt-0.5">{s.duration_minutes} min · {s.description}</p>
                </SelectCard>
              ))}
              {services.length === 0 && <p className="text-sm text-muted">Cargando servicios…</p>}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink mb-3">¿Con cuál vehículo?</h2>
            <div className="space-y-2">
              {vehicles.map(v => (
                <SelectCard key={v.id} selected={sel.vehicle?.id === v.id} onClick={() => setSel(s => ({ ...s, vehicle: v }))}>
                  <p className="font-mono font-bold text-brand tracking-widest text-sm">{v.plate.toUpperCase()}</p>
                  <p className="text-xs text-muted mt-0.5">{v.brand} {v.model_line} {v.model_year}</p>
                </SelectCard>
              ))}
              {vehicles.length === 0 && (
                <p className="text-sm text-muted">
                  No tienes vehículos registrados.{' '}
                  <a href="/cliente/vehiculos" className="text-accent hover:underline">Agregar uno →</a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PASO 2 — Slots */}
      {step === 2 && (
        <div>
          <h2 className="text-sm font-semibold text-ink mb-3">Selecciona fecha y hora</h2>
          {slots.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay franjas disponibles para la selección actual</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {slots.map(slot => {
                const dt = new Date(slot.start_time)
                return (
                  <SelectCard key={slot.id} selected={sel.slot?.id === slot.id} onClick={() => setSel(s => ({ ...s, slot }))}>
                    <p className="text-xs font-semibold text-muted uppercase">
                      {dt.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-base font-bold text-ink mt-0.5">
                      {dt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {slot.capacity - slot.reserved_count} cupo{slot.capacity - slot.reserved_count !== 1 ? 's' : ''}
                    </p>
                  </SelectCard>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* PASO 3 — Confirmar */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-ink mb-3">Revisa y confirma</h2>
          <div className="bg-surface rounded-xl border border-border divide-y divide-border">
            {[
              ['Vehículo', `${sel.vehicle?.plate?.toUpperCase()} · ${sel.vehicle?.brand} ${sel.vehicle?.model_line}`],
              ['Sede', sel.branch?.name],
              ['Servicio', sel.service?.name],
              ['Fecha y hora', sel.slot ? new Date(sel.slot.start_time).toLocaleString('es-CO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Sin franja'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-start px-5 py-3.5 text-sm">
                <span className="text-muted">{label}</span>
                <span className="font-medium text-ink text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Notas adicionales (opcional)</label>
            <textarea
              value={sel.notes}
              onChange={e => setSel(s => ({ ...s, notes: e.target.value }))}
              rows={3}
              placeholder="Ej: El vehículo tiene un ruido en el motor..."
              className="w-full px-4 py-3 rounded-lg border border-border bg-canvas text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition resize-none placeholder:text-muted"
            />
          </div>

          {mutation.isError && (
            <div className="px-4 py-3 rounded-lg bg-danger-soft border border-red-200 text-danger text-sm">
              {mutation.error?.response?.data?.detail ?? 'Error al agendar la cita. Intenta de nuevo.'}
            </div>
          )}
        </div>
      )}

      {/* Footer de navegación */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3 rounded-lg border border-border text-ink text-sm font-semibold hover:bg-canvas transition flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Atrás
          </button>
        )}
        {step < 3 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="flex-1 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            Continuar <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={mutation.isPending}
            className="flex-1 py-3 rounded-lg bg-brand hover:bg-brand-light text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {mutation.isPending ? 'Agendando...' : 'Confirmar cita'}
          </button>
        )}
      </div>
    </div>
  )
}
