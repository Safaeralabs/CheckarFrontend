import { useState } from 'react'

const DAMAGE_TYPES = [
  { id: 'rayado',   label: 'Rayado',  symbol: '—', color: '#f59e0b', bg: '#fef3c7' },
  { id: 'golpe',    label: 'Golpe',   symbol: 'X', color: '#ef4444', bg: '#fee2e2' },
  { id: 'mancha',   label: 'Mancha',  symbol: 'O', color: '#f97316', bg: '#ffedd5' },
  { id: 'partido',  label: 'Partido', symbol: '?', color: '#8b5cf6', bg: '#ede9fe' },
]

// SVG top-down car silhouette — viewBox 0 0 200 380
function CarSVG() {
  return (
    <>
      {/* Cuerpo principal */}
      <rect x="30" y="50"  width="140" height="280" rx="22" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>

      {/* Capó (frente) */}
      <rect x="40" y="50"  width="120" height="65"  rx="14" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1"/>
      {/* Parabrisas delantero */}
      <rect x="55" y="108" width="90"  height="42"  rx="6"  fill="#bae6fd" opacity="0.8"/>

      {/* Habitáculo (techo) */}
      <rect x="35" y="145" width="130" height="90"  rx="4"  fill="#dde3ec" stroke="#94a3b8" strokeWidth="0.5"/>
      {/* Línea central techo */}
      <line x1="100" y1="148" x2="100" y2="232" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4 3"/>

      {/* Parabrisas trasero */}
      <rect x="55" y="232" width="90"  height="42"  rx="6"  fill="#bae6fd" opacity="0.8"/>
      {/* Maletero (trasero) */}
      <rect x="40" y="268" width="120" height="62"  rx="14" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1"/>

      {/* Ruedas delanteras */}
      <rect x="8"  y="62"  width="26" height="48"  rx="8"  fill="#475569"/>
      <rect x="166" y="62" width="26" height="48"  rx="8"  fill="#475569"/>
      {/* Ruedas traseras */}
      <rect x="8"  y="258" width="26" height="48"  rx="8"  fill="#475569"/>
      <rect x="166" y="258" width="26" height="48" rx="8"  fill="#475569"/>

      {/* Aro ruedas */}
      <rect x="12"  y="67"  width="18" height="38" rx="5" fill="#94a3b8"/>
      <rect x="170" y="67"  width="18" height="38" rx="5" fill="#94a3b8"/>
      <rect x="12"  y="263" width="18" height="38" rx="5" fill="#94a3b8"/>
      <rect x="170" y="263" width="18" height="38" rx="5" fill="#94a3b8"/>

      {/* Puertas delanteras */}
      <rect x="33" y="150" width="6"  height="82" rx="2" fill="#b8c4d4" stroke="#94a3b8" strokeWidth="0.5"/>
      <rect x="161" y="150" width="6" height="82" rx="2" fill="#b8c4d4" stroke="#94a3b8" strokeWidth="0.5"/>
      {/* Línea de puerta delantera/trasera */}
      <line x1="35"  y1="196" x2="35"  y2="196" stroke="#94a3b8" strokeWidth="0.5"/>

      {/* Etiquetas */}
      <text x="100" y="24"  textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">FRENTE</text>
      <text x="100" y="372" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">TRASERO</text>
      <text x="8"   y="190" textAnchor="middle" fontSize="8"  fill="#64748b" transform="rotate(-90,8,190)">IZQ</text>
      <text x="192" y="190" textAnchor="middle" fontSize="8"  fill="#64748b" transform="rotate(90,192,190)">DER</text>
    </>
  )
}

function DamageMarker({ mark, onRemove }) {
  const dt = DAMAGE_TYPES.find(d => d.id === mark.type)
  if (!dt) return null
  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={(e) => { e.stopPropagation(); onRemove(mark.id) }}
    >
      <circle cx={mark.x} cy={mark.y} r="11" fill={dt.bg} stroke={dt.color} strokeWidth="1.5"/>
      <text
        x={mark.x} y={mark.y + 4}
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill={dt.color}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {dt.symbol}
      </text>
    </g>
  )
}

export default function DamageDiagram({ value = [], onChange }) {
  const [selectedType, setSelectedType] = useState('golpe')
  const svgRef = { current: null }

  const handleSvgClick = (e) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const vb = svg.viewBox.baseVal
    const x = ((e.clientX - rect.left) / rect.width)  * vb.width
    const y = ((e.clientY - rect.top)  / rect.height) * vb.height
    const newMark = { id: Date.now(), type: selectedType, x: Math.round(x), y: Math.round(y) }
    onChange([...value, newMark])
  }

  const removeMarker = (id) => {
    onChange(value.filter(m => m.id !== id))
  }

  return (
    <div className="space-y-3">
      {/* Selector de tipo de daño */}
      <div className="flex flex-wrap gap-2">
        {DAMAGE_TYPES.map(dt => (
          <button
            key={dt.id}
            type="button"
            onClick={() => setSelectedType(dt.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              selectedType === dt.id
                ? 'border-2'
                : 'border border-border text-muted hover:text-ink'
            }`}
            style={selectedType === dt.id ? {
              borderColor: dt.color,
              color: dt.color,
              background: dt.bg,
            } : {}}
          >
            <span className="font-mono font-bold text-sm" style={{ color: dt.color }}>{dt.symbol}</span>
            {dt.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted">
        Haz clic sobre el vehículo para marcar daños. Clic sobre un marcador para eliminarlo.
      </p>

      {/* Diagrama */}
      <div className="flex justify-center">
        <svg
          viewBox="0 0 200 380"
          className="w-full max-w-[220px] cursor-crosshair select-none"
          style={{ touchAction: 'none' }}
          onClick={handleSvgClick}
        >
          <CarSVG />
          {value.map(mark => (
            <DamageMarker key={mark.id} mark={mark} onRemove={removeMarker} />
          ))}
        </svg>
      </div>

      {/* Leyenda de marcadores activos */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {DAMAGE_TYPES.map(dt => {
            const count = value.filter(m => m.type === dt.id).length
            if (!count) return null
            return (
              <span key={dt.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: dt.bg, color: dt.color }}
              >
                <span className="font-mono">{dt.symbol}</span>
                {dt.label}: {count}
              </span>
            )
          })}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-muted hover:text-danger transition ml-1"
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  )
}
