import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const STATUS_MAP = {
  created:            { label: 'Creada',           color: 'bg-white/8 text-white/70 border-white/10' },
  confirmed:          { label: 'Confirmada',        color: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
  checked_in:         { label: 'Recepcionada',      color: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  in_progress:        { label: 'En inspección',     color: 'bg-orange-500/15 text-orange-300 border-orange-500/25' },
  completed:          { label: 'Completada',        color: 'bg-green-500/15 text-green-300 border-green-500/25' },
  rejected:           { label: 'Rechazada',         color: 'bg-red-500/15 text-red-300 border-red-500/25' },
  cancelled:          { label: 'Cancelada',         color: 'bg-white/5 text-white/40 border-white/8' },
  no_show:            { label: 'No asistió',        color: 'bg-white/5 text-white/35 border-white/8' },
  pending:            { label: 'Pendiente',         color: 'bg-white/8 text-white/60 border-white/10' },
  documents_validated:{ label: 'Docs. validados',  color: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
  pre_evaluated:      { label: 'Pre-evaluado',      color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25' },
  visual_review:      { label: 'Insp. visual',      color: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  mechanical_test:    { label: 'Pruebas mec.',      color: 'bg-orange-500/15 text-orange-300 border-orange-500/25' },
  results_recorded:   { label: 'Resultados',        color: 'bg-purple-500/15 text-purple-300 border-purple-500/25' },
  approved:           { label: 'Aprobada',          color: 'bg-green-500/15 text-green-300 border-green-500/25' },
  certified:          { label: 'Certificada',       color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
}

export const FUEL_LABELS = {
  gasoline: 'Gasolina', diesel: 'Diésel', hybrid: 'Híbrido',
  electric: 'Eléctrico', gas: 'Gas',
}

export const VEHICLE_TYPE_LABELS = {
  light: 'Liviano', heavy: 'Pesado', motorcycle: 'Motocicleta',
}

export const SERVICE_CATEGORY_LABELS = {
  particular: 'Particular', commercial: 'Comercial', public: 'Público',
}

export const VEHICLE_CLASS_LABELS = {
  auto: 'Automóvil', pickup: 'Camioneta', suv: 'Campero', van: 'Microbús / Van',
  truck: 'Camión', bus: 'Bus', motorcycle: 'Motocicleta', other: 'Otro',
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)
}
