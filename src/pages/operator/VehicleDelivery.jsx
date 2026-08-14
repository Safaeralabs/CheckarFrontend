import { useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, Circle, Truck } from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import SignaturePad from '../../components/SignaturePad'
import { formatDateTime } from '../../lib/utils'

const CLOSED_STATUSES = ['approved', 'rejected', 'certified']

const WARNING_TEXT = 'SEÑOR USUARIO: C.D.A. CHECKAR S.A.S. LE SOLICITA VERIFIQUE EL ESTADO ACTUAL DE SU VEHÍCULO, ' +
  'PARA QUE ASÍ IDENTIFIQUE CUALQUIER DETERIORO GENERADO DURANTE EL PASO DEL VEHÍCULO POR LA LÍNEA DE INSPECCIÓN ' +
  'PARA SU INMEDIATA VERIFICACIÓN POR PARTE DEL CENTRO DE DIAGNÓSTICO'

export default function VehicleDelivery() {
  const { appointmentId } = useParams()
  const qc = useQueryClient()
  const { user } = useAuth()

  const sigRef = useRef(null)
  const [sigError, setSigError] = useState('')

  const { data: apt, isLoading: loadApt } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => api.get(`scheduling/appointments/${appointmentId}/`).then(r => r.data),
    enabled: !!appointmentId,
  })

  const vehicleId = apt?.vehicle
  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => api.get(`vehicles/${vehicleId}/`).then(r => r.data),
    enabled: !!vehicleId,
  })

  const { data: reception, isLoading: loadReception } = useQuery({
    queryKey: ['reception', appointmentId],
    queryFn: () => api.get('operations/receptions/', { params: { appointment: appointmentId } }).then(r => {
      const list = r.data?.results ?? r.data ?? []
      return list[0] ?? null
    }),
    enabled: !!appointmentId,
  })

  const inspectionId = apt?.inspection_record
  const { data: inspection } = useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: () => api.get(`inspections/records/${inspectionId}/`).then(r => r.data),
    enabled: !!inspectionId,
  })

  const deliverMut = useMutation({
    mutationFn: () => api.patch(`operations/receptions/${reception.id}/`, {
      signature_delivery: sigRef.current?.toDataURL() ?? '',
      delivered_at: new Date().toISOString(),
      delivered_by: user?.id,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reception', appointmentId] }),
  })

  if (loadApt || loadReception) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const plate = vehicle?.plate ?? apt?.vehicle_detail?.plate ?? '—'
  const inspectionClosed = CLOSED_STATUSES.includes(inspection?.status)

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <Link to="/operacion" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Cola del día
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center flex-shrink-0">
          <Truck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">Entrega de vehículo</h1>
          <p className="text-sm text-muted">
            <span className="font-mono font-bold text-brand">{plate.toUpperCase()}</span>
          </p>
        </div>
      </div>

      {reception?.delivered_at ? (
        <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Vehículo entregado</p>
              <p className="text-xs text-green-700 mt-0.5">Entregado el {formatDateTime(reception.delivered_at)}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-2 mb-1.5 uppercase tracking-wide">Firma de recibido</p>
            <div className="rounded-xl border-2 border-border bg-white p-2">
              {reception.signature_delivery
                ? <img src={reception.signature_delivery} alt="firma de entrega" className="w-full h-32 object-contain" />
                : <div className="h-32" />
              }
            </div>
          </div>
        </div>
      ) : !inspectionClosed ? (
        <div className="rounded-2xl border-2 border-border bg-surface p-8 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-canvas">
            <Circle className="w-7 h-7 text-muted" />
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">La inspección no ha finalizado</h2>
          <p className="text-sm text-muted mt-2 max-w-sm mx-auto">
            El vehículo solo puede entregarse una vez la inspección tenga un resultado final.
          </p>
          {inspection?.id && (
            <Link
              to={`/operacion/inspecciones/${inspection.id}`}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition"
            >
              Ir a la inspección
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border p-5 space-y-5">
          <div className="p-4 rounded-lg border border-border bg-canvas">
            <p className="text-xs font-semibold text-ink-2 uppercase tracking-wide leading-relaxed">
              {WARNING_TEXT}
            </p>
          </div>

          <SignaturePad ref={sigRef} label="Firma de recibido conforme" />

          {sigError && (
            <div className="px-4 py-3 rounded-lg bg-danger-soft border border-red-200 text-danger text-sm">
              {sigError}
            </div>
          )}

          {deliverMut.isError && (
            <div className="px-4 py-3 rounded-lg bg-danger-soft border border-red-200 text-danger text-sm">
              {deliverMut.error?.response?.data?.detail ?? 'Error al confirmar la entrega.'}
            </div>
          )}

          <button
            type="button"
            disabled={deliverMut.isPending || !reception?.id}
            onClick={() => {
              if (sigRef.current?.isEmpty()) {
                setSigError('Se requiere la firma de recibido conforme para confirmar la entrega.')
                return
              }
              setSigError('')
              deliverMut.mutate()
            }}
            className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm transition disabled:opacity-60"
          >
            {deliverMut.isPending ? 'Confirmando...' : 'Confirmar entrega'}
          </button>
        </div>
      )}
    </div>
  )
}
