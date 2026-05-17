import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Car, Edit2, Plus, Trash2 } from 'lucide-react'
import api from '../../api/client'
import { VEHICLE_TYPE_LABELS, FUEL_LABELS, SERVICE_CATEGORY_LABELS } from '../../lib/utils'
import VehicleForm from './VehicleForm'

function Plate({ value }) {
  return (
    <span className="font-mono font-bold text-brand tracking-widest">
      {value?.toUpperCase()}
    </span>
  )
}

function TypeChip({ children, color = 'bg-brand-soft text-brand' }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{children}</span>
}

export default function VehicleList() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | 'new' | vehicle object

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('vehicles/').then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`vehicles/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })

  const vehicles = data?.results ?? data ?? []

  const handleDelete = (v) => {
    if (confirm(`¿Eliminar el vehículo ${v.plate}? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(v.id)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Mis vehículos</h1>
          <p className="text-sm text-muted mt-0.5">{vehicles.length} registrado{vehicles.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-surface rounded-xl border border-dashed border-border p-12 text-center">
          <Car className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-base font-semibold text-ink mb-1">Sin vehículos registrados</p>
          <p className="text-sm text-muted mb-5">Agrega tu primer vehículo para agendar citas</p>
          <button
            onClick={() => setModal('new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" /> Agregar vehículo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => (
            <div key={v.id} className="bg-surface rounded-xl border border-border p-5 flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Plate value={v.plate} />
                <p className="text-sm font-medium text-ink">{v.brand} {v.model_line} {v.model_year}</p>
                <div className="flex flex-wrap gap-1.5">
                  <TypeChip>{VEHICLE_TYPE_LABELS[v.vehicle_type]}</TypeChip>
                  <TypeChip color="bg-canvas text-ink-2">{FUEL_LABELS[v.fuel_type]}</TypeChip>
                  {v.service_category && (
                    <TypeChip color="bg-accent-soft text-accent">{SERVICE_CATEGORY_LABELS[v.service_category]}</TypeChip>
                  )}
                  {v.color && <TypeChip color="bg-canvas text-muted">{v.color}</TypeChip>}
                </div>
                {v.mileage > 0 && (
                  <p className="text-xs text-muted">{v.mileage.toLocaleString('es-CO')} km</p>
                )}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => setModal(v)}
                  className="p-2 rounded-lg border border-border text-ink-2 hover:border-brand hover:text-brand transition"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(v)}
                  disabled={deleteMutation.isPending}
                  className="p-2 rounded-lg border border-border text-ink-2 hover:border-danger hover:text-danger transition"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <VehicleForm
          vehicle={modal === 'new' ? null : modal}
          onSuccess={() => { setModal(null); qc.invalidateQueries({ queryKey: ['vehicles'] }) }}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}
