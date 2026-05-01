import { inspectionSteps } from '../data/mockData'

export function TimelineProgress({ currentStep }) {
  const currentIndex = inspectionSteps.findIndex((step) => step.key === currentStep)

  return (
    <div className="timeline-progress">
      {inspectionSteps.map((step, index) => (
        <div
          key={step.key}
          className={`timeline-progress__item ${index <= currentIndex ? 'is-active' : ''}`}
        >
          <div className="timeline-progress__dot">{index + 1}</div>
          <div>
            <strong>{step.label}</strong>
            <p>{index === currentIndex ? 'Estado actual' : 'Control del flujo tecnico'}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
