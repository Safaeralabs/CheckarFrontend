import { useDeferredValue, useState, startTransition } from 'react'
import {
  AlertTriangle,
  Camera,
  CarFront,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  Search,
  ShieldAlert,
  Waves,
} from 'lucide-react'
import { mockPortalData } from '../data/mockData'
import { PortalFrame } from '../components/PortalFrame'
import { MetricGrid } from '../components/MetricGrid'
import { SurfaceCard } from '../components/SurfaceCard'
import { DataTable } from '../components/DataTable'

function StatusPill({ tone = 'neutral', children }) {
  return <span className={`status-pill status-pill--${tone}`}>{children}</span>
}

const stepIcons = {
  reception: CarFront,
  precheck: FileCheck2,
  internal: ClipboardCheck,
  pressure: Gauge,
  visual: CheckCircle2,
  photo: Camera,
  tracking: Search,
  closure: ShieldAlert,
}

function StepRail({ steps, currentStep, onStepChange }) {
  const activeIndex = steps.findIndex((step) => step.key === currentStep)

  return (
    <div className="ops-stepper" role="tablist" aria-label="Wizard operativo">
      {steps.map((step, index) => {
        const Icon = stepIcons[step.key] ?? CheckCircle2
        const state = index < activeIndex ? 'complete' : index === activeIndex ? 'active' : 'pending'

        return (
          <button
            key={step.key}
            type="button"
            className={`ops-stepper__item is-${state}`}
            onClick={() => onStepChange(step.key)}
            role="tab"
            aria-selected={state === 'active'}
          >
            <span className="ops-stepper__index">{String(index + 1).padStart(2, '0')}</span>
            <span className="ops-stepper__icon">
              <Icon size={16} />
            </span>
            <span className="ops-stepper__copy">
              <strong>{step.label}</strong>
              <small>{state === 'complete' ? 'Completado' : state === 'active' ? 'En curso' : 'Pendiente'}</small>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function receptionRecordToForm(record) {
  return {
    inspectionType: record.inspectionType,
    serviceType: record.serviceType,
    plate: record.plate,
    inspectionOrigin: record.inspectionOrigin,
    mileage: record.mileage,
    isDriverOwner: record.isDriverOwner,
    foreignVehicle: record.foreignVehicle,
    vehicleFunctional: record.vehicleFunctional,
    driverName: record.driver.name,
    driverLastNameOne: record.driver.lastNameOne,
    driverLastNameTwo: record.driver.lastNameTwo,
    driverIdType: record.driver.idType,
    driverIdNumber: record.driver.idNumber,
    driverPhone: record.driver.phone,
    driverEmail: record.driver.email,
    driverAddress: record.driver.address,
    driverCity: record.driver.city,
    driverLicense: record.driver.license,
    driverHearing: record.driver.hearing,
    vehicleBrand: record.vehicle.brand,
    vehicleLine: record.vehicle.line,
    vehicleModel: record.vehicle.model,
    vehicleColor: record.vehicle.color,
    vehicleType: record.vehicle.type,
    vehicleClass: record.vehicle.class,
    vehicleService: record.vehicle.service,
    vehicleFuel: record.vehicle.fuel,
    vehicleDisplacement: record.vehicle.displacement,
    vehiclePassengers: record.vehicle.passengers,
    vehicleAxles: record.vehicle.axles,
    vehicleWindows: record.vehicle.windows,
    vehicleArmored: record.vehicle.armored,
  }
}

function ReceptionStage({ form, onChange }) {
  const setValue = (field) => (event) => onChange(field, event.target.value)

  return (
    <form className="ops-stage-stack" onSubmit={(event) => event.preventDefault()}>
      <div className="ops-stage-grid ops-stage-grid--duo">
        <article className="ops-stage-card ops-stage-card--accent">
          <p className="kicker">Paso 1 de 8</p>
          <h4>Tipo de inspeccion y placa</h4>
          <div className="ops-form-grid">
            <label className="ops-input">
              <span>Tipo de inspeccion</span>
              <select value={form.inspectionType} onChange={setValue('inspectionType')}>
                <option>Tecnico-mecanica</option>
                <option>Emisiones contaminantes</option>
                <option>Inspeccion visual</option>
                <option>Inspeccion fotografica</option>
              </select>
            </label>
            <label className="ops-input">
              <span>Servicio</span>
              <select value={form.serviceType} onChange={setValue('serviceType')}>
                <option>Revision tecnico-mecanica</option>
                <option>Control de emisiones</option>
                <option>Inspeccion visual</option>
                <option>Inspeccion fotografica</option>
              </select>
            </label>
            <label className="ops-input">
              <span>Placa</span>
              <input value={form.plate} onChange={setValue('plate')} />
            </label>
            <label className="ops-input">
              <span>Origen</span>
              <select value={form.inspectionOrigin} onChange={setValue('inspectionOrigin')}>
                <option>Cita programada</option>
                <option>Sin cita</option>
                <option>Reingreso</option>
              </select>
            </label>
          </div>
        </article>

        <article className="ops-stage-card">
          <p className="kicker">Control de ingreso</p>
          <h4>Estado inicial del expediente</h4>
          <div className="ops-form-grid">
            <label className="ops-input">
              <span>Kilometraje</span>
              <input value={form.mileage} onChange={setValue('mileage')} />
            </label>
            <label className="ops-input">
              <span>Conductor propietario</span>
              <select value={form.isDriverOwner} onChange={setValue('isDriverOwner')}>
                <option>Si</option>
                <option>No</option>
              </select>
            </label>
            <label className="ops-input">
              <span>Vehiculo extranjero</span>
              <select value={form.foreignVehicle} onChange={setValue('foreignVehicle')}>
                <option>No</option>
                <option>Si</option>
              </select>
            </label>
            <label className="ops-input">
              <span>Vehiculo funcional</span>
              <select value={form.vehicleFunctional} onChange={setValue('vehicleFunctional')}>
                <option>Si</option>
                <option>No</option>
              </select>
            </label>
          </div>
        </article>
      </div>

      <div className="ops-stage-grid ops-stage-grid--duo">
        <article className="ops-stage-card">
          <p className="kicker">Datos del conductor</p>
          <h4>{form.driverName} {form.driverLastNameOne} {form.driverLastNameTwo}</h4>
          <div className="ops-form-grid">
            <label className="ops-input">
              <span>Nombre</span>
              <input value={form.driverName} onChange={setValue('driverName')} />
            </label>
            <label className="ops-input">
              <span>Primer apellido</span>
              <input value={form.driverLastNameOne} onChange={setValue('driverLastNameOne')} />
            </label>
            <label className="ops-input">
              <span>Segundo apellido</span>
              <input value={form.driverLastNameTwo} onChange={setValue('driverLastNameTwo')} />
            </label>
            <label className="ops-input">
              <span>Tipo de identificacion</span>
              <select value={form.driverIdType} onChange={setValue('driverIdType')}>
                <option>CC</option>
                <option>CE</option>
                <option>NIT</option>
                <option>Pasaporte</option>
              </select>
            </label>
            <label className="ops-input">
              <span>Identificacion</span>
              <input value={form.driverIdNumber} onChange={setValue('driverIdNumber')} />
            </label>
            <label className="ops-input">
              <span>Celular</span>
              <input value={form.driverPhone} onChange={setValue('driverPhone')} />
            </label>
            <label className="ops-input">
              <span>Email</span>
              <input value={form.driverEmail} onChange={setValue('driverEmail')} />
            </label>
            <label className="ops-input">
              <span>Ciudad</span>
              <input value={form.driverCity} onChange={setValue('driverCity')} />
            </label>
            <label className="ops-input ops-input--wide">
              <span>Direccion</span>
              <input value={form.driverAddress} onChange={setValue('driverAddress')} />
            </label>
            <label className="ops-input">
              <span>Categoria de licencia</span>
              <input value={form.driverLicense} onChange={setValue('driverLicense')} />
            </label>
            <label className="ops-input">
              <span>Discapacidad auditiva</span>
              <select value={form.driverHearing} onChange={setValue('driverHearing')}>
                <option>No</option>
                <option>Si</option>
              </select>
            </label>
          </div>
        </article>

        <article className="ops-stage-card">
          <p className="kicker">Datos del vehiculo</p>
          <h4>{form.vehicleBrand} {form.vehicleLine}</h4>
          <div className="ops-form-grid">
            <label className="ops-input">
              <span>Marca</span>
              <input value={form.vehicleBrand} onChange={setValue('vehicleBrand')} />
            </label>
            <label className="ops-input">
              <span>Linea</span>
              <input value={form.vehicleLine} onChange={setValue('vehicleLine')} />
            </label>
            <label className="ops-input">
              <span>Modelo</span>
              <input value={form.vehicleModel} onChange={setValue('vehicleModel')} />
            </label>
            <label className="ops-input">
              <span>Color</span>
              <input value={form.vehicleColor} onChange={setValue('vehicleColor')} />
            </label>
            <label className="ops-input">
              <span>Tipo de vehiculo</span>
              <input value={form.vehicleType} onChange={setValue('vehicleType')} />
            </label>
            <label className="ops-input">
              <span>Clase de vehiculo</span>
              <input value={form.vehicleClass} onChange={setValue('vehicleClass')} />
            </label>
            <label className="ops-input">
              <span>Servicio</span>
              <input value={form.vehicleService} onChange={setValue('vehicleService')} />
            </label>
            <label className="ops-input">
              <span>Combustible</span>
              <input value={form.vehicleFuel} onChange={setValue('vehicleFuel')} />
            </label>
            <label className="ops-input">
              <span>Cilindraje</span>
              <input value={form.vehicleDisplacement} onChange={setValue('vehicleDisplacement')} />
            </label>
            <label className="ops-input">
              <span>Pasajeros</span>
              <input value={form.vehiclePassengers} onChange={setValue('vehiclePassengers')} />
            </label>
            <label className="ops-input">
              <span>Ejes</span>
              <input value={form.vehicleAxles} onChange={setValue('vehicleAxles')} />
            </label>
            <label className="ops-input">
              <span>Vidrios polarizados</span>
              <select value={form.vehicleWindows} onChange={setValue('vehicleWindows')}>
                <option>No</option>
                <option>Si</option>
              </select>
            </label>
            <label className="ops-input">
              <span>Blindado</span>
              <select value={form.vehicleArmored} onChange={setValue('vehicleArmored')}>
                <option>No</option>
                <option>Si</option>
              </select>
            </label>
          </div>
        </article>
      </div>
    </form>
  )
}

function PrecheckStage({ items }) {
  return (
    <div className="ops-stage-stack">
      <article className="ops-stage-card ops-stage-card--accent">
        <p className="kicker">Paso 2 de 8</p>
        <h4>Checklist documental y operativo</h4>
        <p className="ops-stage-note">
          Antes de entrar a linea, el operador debe cerrar cada punto como Si, No o No aplica.
        </p>
      </article>

      <div className="ops-check-grid">
        {items.map((item) => (
          <article className={`ops-check-item ${item.critical ? 'is-critical' : ''}`} key={item.item}>
            <div className="ops-check-item__head">
              <strong>{item.item}</strong>
              <StatusPill tone={item.answer === 'Si' ? 'success' : item.answer === 'No' ? 'danger' : 'neutral'}>
                {item.answer}
              </StatusPill>
            </div>
            <p>{item.observation}</p>
            {item.critical ? (
              <small>
                <AlertTriangle size={14} />
                Impide avanzar sin correccion
              </small>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}

function InternalItemsStage({ items }) {
  return (
    <div className="ops-stage-stack">
      <article className="ops-stage-card ops-stage-card--accent">
        <p className="kicker">Paso 3 de 8</p>
        <h4>Objetos dentro del vehiculo</h4>
        <p className="ops-stage-note">
          Relaciona objetos relevantes, evidencia opcional y observaciones previas a la inspeccion.
        </p>
      </article>

      <div className="ops-stage-grid ops-stage-grid--duo">
        <article className="ops-stage-card">
          <p className="kicker">Registro</p>
          {items.map((item) => (
            <article className="ops-inline-row" key={item.name}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.location} - {item.note}</p>
              </div>
              <span>{item.photo}</span>
            </article>
          ))}
        </article>

        <article className="ops-stage-card">
          <p className="kicker">Observacion operativa</p>
          <h4>Relacion de elementos internos</h4>
          <p className="ops-stage-note">
            Si no existen objetos, el expediente debe quedar marcado explicitamente como "sin elementos". Si hay
            objetos, deben quedar descritos antes de entregar el vehiculo a linea.
          </p>
        </article>
      </div>
    </div>
  )
}

function TirePressureStage({ summary, layout }) {
  return (
    <div className="ops-stage-stack">
      <article className="ops-stage-card ops-stage-card--accent">
        <p className="kicker">Paso 4 de 8</p>
        <h4>Presion de neumaticos por eje</h4>
        <p className="ops-stage-note">
          Registro tecnico por posicion, con alertas y capacidad de intercambio izquierda / derecha.
        </p>
      </article>

      <div className="ops-stage-grid ops-stage-grid--duo">
        <article className="ops-stage-card">
          <p className="kicker">Vista por eje</p>
          <div className="ops-pressure-grid">
            {layout.map((item) => (
              <article className="ops-pressure-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.state}</small>
              </article>
            ))}
          </div>
        </article>

        <article className="ops-stage-card">
          <p className="kicker">Resumen tecnico</p>
          {summary.map((item) => (
            <article className="ops-inline-row" key={item.axle}>
              <div>
                <strong>{item.axle}</strong>
                <p>{item.side} - {item.psi}</p>
              </div>
              <span>{item.state}</span>
            </article>
          ))}
        </article>
      </div>
    </div>
  )
}

function VisualStage({ items }) {
  return (
    <div className="ops-stage-stack">
      <article className="ops-stage-card ops-stage-card--accent">
        <p className="kicker">Paso 5 de 8</p>
        <h4>Checklist tecnico visual</h4>
        <p className="ops-stage-note">
          Cada categoria debe quedar aprobada, observada o no aplica, con observaciones cuando corresponda.
        </p>
      </article>

      <div className="ops-visual-grid">
        {items.map((item) => (
          <article className="ops-visual-card" key={item.category}>
            <div className="ops-visual-card__head">
              <strong>{item.category}</strong>
              <StatusPill tone={item.status === 'Aprobado' ? 'success' : 'warning'}>{item.status}</StatusPill>
            </div>
            <p>{item.note}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

function PhotoStage({ items }) {
  return (
    <div className="ops-stage-stack">
      <article className="ops-stage-card ops-stage-card--accent">
        <p className="kicker">Paso 6 de 8</p>
        <h4>Inspeccion fotografica obligatoria</h4>
        <p className="ops-stage-note">
          El sistema no debe permitir cierre sin evidencia de placa, VIN y vistas minimas del vehiculo.
        </p>
      </article>

      <div className="ops-photo-grid">
        {items.map((item) => (
          <article className={`ops-photo-card ${item.status === 'Pendiente' ? 'is-pending' : ''}`} key={item.shot}>
            <Camera size={18} />
            <strong>{item.shot}</strong>
            <p>{item.meta}</p>
            <StatusPill tone={item.status === 'Completa' ? 'success' : 'danger'}>{item.status}</StatusPill>
          </article>
        ))}
      </div>
    </div>
  )
}

function TrackingStage({ rows }) {
  return (
    <div className="ops-stage-stack">
      <article className="ops-stage-card ops-stage-card--accent">
        <p className="kicker">Paso 7 de 8</p>
        <h4>Seguimiento y control del flujo</h4>
        <p className="ops-stage-note">
          Estado, responsable, ultima actualizacion e incidencias del expediente en tiempo real.
        </p>
      </article>

      <article className="ops-stage-card">
        <DataTable
          columns={[
            { key: 'caseId', label: 'Caso' },
            { key: 'plate', label: 'Placa' },
            { key: 'current', label: 'Paso actual' },
            { key: 'time', label: 'Tiempo' },
            { key: 'incident', label: 'Incidencia' },
            { key: 'owner', label: 'Operador' },
          ]}
          rows={rows}
        />
      </article>
    </div>
  )
}

function ClosureStage({ actions, summary }) {
  return (
    <div className="ops-stage-stack">
      <article className="ops-stage-card ops-stage-card--accent">
        <p className="kicker">Paso 8 de 8</p>
        <h4>Resultados, certificacion y cierre</h4>
        <p className="ops-stage-note">
          El supervisor consolida el resultado final y decide si libera certificado, rechaza o devuelve a correccion.
        </p>
      </article>

      <div className="ops-stage-grid ops-stage-grid--duo">
        <article className="ops-stage-card">
          <p className="kicker">Decisiones</p>
          <div className="ops-result-grid">
            {actions.map((item) => (
              <article className="ops-result-card" key={item.title}>
                <CheckCircle2 size={18} />
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="ops-stage-card">
          <p className="kicker">Resumen de cierre</p>
          <div className="ops-field-grid">
            {summary.map((item) => (
              <div className="ops-field" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  )
}

function renderStepStage(stepKey, data, form, onReceptionChange) {
  switch (stepKey) {
    case 'reception':
      return <ReceptionStage form={form} onChange={onReceptionChange} />
    case 'precheck':
      return <PrecheckStage items={data.documentChecklist} />
    case 'internal':
      return <InternalItemsStage items={data.internalItems} />
    case 'pressure':
      return <TirePressureStage summary={data.tirePressure} layout={data.tireLayout} />
    case 'visual':
      return <VisualStage items={data.visualChecklist} />
    case 'photo':
      return <PhotoStage items={data.photoChecklist} />
    case 'tracking':
      return <TrackingStage rows={data.tracking} />
    case 'closure':
      return <ClosureStage actions={data.resultActions} summary={data.closureSummary} />
    default:
      return null
  }
}

export function OperationsPortalPage() {
  const data = mockPortalData.operations
  const [query, setQuery] = useState('')
  const [currentStep, setCurrentStep] = useState(data.activeRecord.currentStep)
  const [receptionForm, setReceptionForm] = useState(() => receptionRecordToForm(data.activeRecord))
  const deferredQuery = useDeferredValue(query)

  const filteredTracking = data.tracking.filter((item) => {
    const target = `${item.caseId} ${item.plate} ${item.current} ${item.owner}`.toLowerCase()
    return target.includes(deferredQuery.toLowerCase())
  })

  const activeStepIndex = data.workflowSteps.findIndex((step) => step.key === currentStep)
  const activeStep = data.workflowSteps[activeStepIndex] ?? data.workflowSteps[0]
  const handleReceptionChange = (field, value) => {
    setReceptionForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <PortalFrame
      accent="operations"
      badge="Centro operativo"
      title="Operacion e inspeccion del CDA"
      description="El portal operador se organiza por etapas reales del proceso Checkar. No reinventa el flujo: lo vuelve mas claro, trazable y escalable."
      nav={[
        { label: 'Dashboard', href: '#dashboard' },
        { label: 'Wizard', href: '#wizard' },
        { label: 'Seguimiento', href: '#seguimiento' },
        { label: 'Reportes', href: '#reportes' },
        { label: 'Bitacora', href: '#bitacora' },
      ]}
    >
      <section id="dashboard" className="portal-stack">
        <MetricGrid items={data.summary} />

        <div className="operations-topbar">
          {data.dayStatus.map((item) => (
            <article className="ops-signal-card" key={item.label}>
              <span className={`ops-signal-card__dot ops-signal-card__dot--${item.tone}`} />
              <div>
                <strong>{item.label}</strong>
                <p>{item.value}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <SurfaceCard
        title="Wizard operativo de inspeccion"
        eyebrow="Proceso real Checkar - 8 pasos"
        actions={<StatusPill tone="primary">{`Paso ${activeStepIndex + 1} de ${data.workflowSteps.length}`}</StatusPill>}
        id="wizard"
      >
        <div className="ops-wizard-shell">
          <div className="ops-wizard-head">
            <div className="ops-record-summary">
              <div className="ops-record-chipset">
                <StatusPill tone="primary">{data.activeRecord.code}</StatusPill>
                <StatusPill tone="warning">{data.activeRecord.status}</StatusPill>
                <StatusPill tone="neutral">{data.activeRecord.branch}</StatusPill>
              </div>
              <h3 className="ops-record-title">{receptionForm.plate} - {receptionForm.inspectionType}</h3>
              <p className="ops-record-note">
                Cita {data.activeRecord.appointment} - {data.activeRecord.lane} - {activeStep.summary}
              </p>
            </div>

            <div className="ops-wizard-progress">
              <span>{data.activeRecord.completion}</span>
              <strong>{activeStep.owner}</strong>
            </div>
          </div>

          <StepRail steps={data.workflowSteps} currentStep={currentStep} onStepChange={setCurrentStep} />

          <div className="ops-wizard-layout">
            <div className="ops-wizard-stage">
              {renderStepStage(currentStep, data, receptionForm, handleReceptionChange)}

              <div className="ops-action-bar ops-action-bar--wizard">
                <button
                  className="soft-button soft-button--light"
                  type="button"
                  disabled={activeStepIndex === 0}
                  onClick={() => setCurrentStep(data.workflowSteps[Math.max(activeStepIndex - 1, 0)].key)}
                >
                  <ChevronLeft size={16} />
                  Atras
                </button>
                <button className="soft-button soft-button--light" type="button">Guardar borrador</button>
                <button className="soft-button soft-button--light" type="button">Cancelar</button>
                <button
                  className="primary-action"
                  type="button"
                  disabled={activeStepIndex === data.workflowSteps.length - 1}
                  onClick={() =>
                    setCurrentStep(data.workflowSteps[Math.min(activeStepIndex + 1, data.workflowSteps.length - 1)].key)
                  }
                >
                  Continuar
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <aside className="ops-wizard-sidebar">
              <article className="ops-stage-card">
                <p className="kicker">Estado del paso</p>
                <h4>{activeStep.label}</h4>
                <p className="ops-stage-note">{activeStep.summary}</p>
                <div className="ops-field-grid">
                  <div className="ops-field">
                    <span>Responsable</span>
                    <strong>{activeStep.owner}</strong>
                  </div>
                  <div className="ops-field">
                    <span>Ultima actualizacion</span>
                    <strong>{activeStep.updatedAt}</strong>
                  </div>
                  <div className="ops-field ops-field--wide">
                    <span>Validacion</span>
                    <strong>{activeStep.validation}</strong>
                  </div>
                </div>
              </article>

              <article className="ops-stage-card">
                <p className="kicker">Control del expediente</p>
                <div className="ops-summary-list">
                  <div className="ops-summary-list__row">
                    <span>Autoguardado</span>
                    <strong>{data.activeRecord.autoSave}</strong>
                  </div>
                  <div className="ops-summary-list__row">
                    <span>Bloqueo</span>
                    <strong>{data.activeRecord.blocker}</strong>
                  </div>
                  <div className="ops-summary-list__row">
                    <span>Servicio</span>
                    <strong>{receptionForm.serviceType}</strong>
                  </div>
                  <div className="ops-summary-list__row">
                    <span>Kilometraje</span>
                    <strong>{receptionForm.mileage}</strong>
                  </div>
                </div>
              </article>
            </aside>
          </div>
        </div>
      </SurfaceCard>

      <div className="content-grid" id="recepcion">
        <SurfaceCard
          title="Cola de recepcion"
          eyebrow="Ingreso y apertura de expediente"
          actions={
            <button className="soft-button" type="button">
              <CarFront size={16} />
              Generar ingreso
            </button>
          }
        >
          <DataTable
            columns={[
              { key: 'plate', label: 'Placa' },
              { key: 'owner', label: 'Cliente' },
              { key: 'slot', label: 'Cita' },
              { key: 'status', label: 'Estado' },
              { key: 'lane', label: 'Punto' },
            ]}
            rows={data.receptionQueue}
          />
        </SurfaceCard>

        <SurfaceCard
          title="Cola de inspeccion"
          eyebrow="Linea y prioridad"
          actions={
            <button className="soft-button" type="button">
              <Gauge size={16} />
              Rebalancear linea
            </button>
          }
        >
          <div className="ops-queue-grid">
            {data.inspectionQueue.map((item) => (
              <article className="ops-queue-card" key={`${item.plate}-${item.stage}`}>
                <div className="ops-queue-card__head">
                  <strong>{item.plate}</strong>
                  <StatusPill tone={item.priority === 'Alta' ? 'danger' : 'warning'}>{item.priority}</StatusPill>
                </div>
                <p>{item.stage}</p>
                <span>{item.operator}</span>
                <small>ETA {item.eta}</small>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="content-grid content-grid--wide" id="seguimiento">
        <SurfaceCard
          title="Seguimiento de inspecciones"
          eyebrow="Estado en tiempo real"
          actions={
            <label className="search-box">
              <Search size={16} />
              <input
                placeholder="Buscar por caso, placa, etapa u operador"
                value={query}
                onChange={(event) => {
                  const nextValue = event.target.value
                  startTransition(() => setQuery(nextValue))
                }}
              />
            </label>
          }
        >
          <DataTable
            columns={[
              { key: 'caseId', label: 'Caso' },
              { key: 'plate', label: 'Placa' },
              { key: 'current', label: 'Paso actual' },
              { key: 'time', label: 'Tiempo' },
              { key: 'incident', label: 'Incidencia' },
              { key: 'owner', label: 'Operador' },
            ]}
            rows={filteredTracking}
          />
        </SurfaceCard>

        <SurfaceCard title="Alertas y fallas frecuentes" eyebrow="Bloqueos del dia">
          <div className="ops-alert-list">
            {data.criticalInspections.map((item) => (
              <article key={item.id} className="ops-alert-list__item">
                <ShieldAlert size={18} />
                <div>
                  <strong>{item.plate}</strong>
                  <p>{item.reason}</p>
                </div>
                <StatusPill tone="danger">{item.level}</StatusPill>
              </article>
            ))}
          </div>
          <div className="ops-failure-grid">
            {data.frequentFailures.map((item) => (
              <article key={item.item} className="ops-failure-card">
                <strong>{item.item}</strong>
                <p>{item.count}</p>
                <span>{item.impact}</span>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="content-grid content-grid--wide" id="reportes">
        <SurfaceCard title="Reportes operativos" eyebrow="Productividad y cuellos de botella">
          <div className="ops-report-grid">
            {data.reports.map((item) => (
              <article className="ops-report-card" key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Configuracion operativa" eyebrow="Supervisor y administrador">
          <div className="ops-settings-list">
            {data.settings.map((item) => (
              <article className="ops-setting-row" key={item}>
                <FileCheck2 size={16} />
                <span>{item}</span>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard title="Bitacora del sistema" eyebrow="Trazabilidad obligatoria" id="bitacora">
        <div className="stack-list">
          {data.logs.map((item) => (
            <article className="list-row" key={`${item.time}-${item.message}`}>
              <div className="list-row__lead">
                <Waves size={18} />
                <div>
                  <strong>{item.time} - {item.source}</strong>
                  <p>{item.message}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </PortalFrame>
  )
}
