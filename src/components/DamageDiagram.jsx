import { useRef, useState } from 'react'
import { Camera, Trash2, X } from 'lucide-react'

const DAMAGE_TYPES = [
  { id: 'rayado',   label: 'Rayado',   symbol: '—',   color: '#f59e0b', bg: '#fef3c7' },
  { id: 'golpe',    label: 'Golpe',    symbol: 'X',   color: '#ef4444', bg: '#fee2e2' },
  { id: 'mancha',   label: 'Mancha',   symbol: 'O',   color: '#f97316', bg: '#ffedd5' },
  { id: 'partido',  label: 'Partido',  symbol: '?',   color: '#8b5cf6', bg: '#ede9fe' },
  { id: 'presion',  label: 'Presión',  symbol: 'psi', color: '#0ea5e9', bg: '#e0f2fe' },
]

// SVG top-down car silhouette — viewBox 0 0 200 380
function CarSVG() {
  return (
    <>
      <rect x="30" y="50"  width="140" height="280" rx="22" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
      <rect x="40" y="50"  width="120" height="65"  rx="14" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1"/>
      <rect x="55" y="108" width="90"  height="42"  rx="6"  fill="#bae6fd" opacity="0.8"/>
      <rect x="35" y="145" width="130" height="90"  rx="4"  fill="#dde3ec" stroke="#94a3b8" strokeWidth="0.5"/>
      <line x1="100" y1="148" x2="100" y2="232" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="4 3"/>
      <rect x="55" y="232" width="90"  height="42"  rx="6"  fill="#bae6fd" opacity="0.8"/>
      <rect x="40" y="268" width="120" height="62"  rx="14" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1"/>
      <rect x="8"  y="62"  width="26" height="48"  rx="8"  fill="#475569"/>
      <rect x="166" y="62" width="26" height="48"  rx="8"  fill="#475569"/>
      <rect x="8"  y="258" width="26" height="48"  rx="8"  fill="#475569"/>
      <rect x="166" y="258" width="26" height="48" rx="8"  fill="#475569"/>
      <rect x="12"  y="67"  width="18" height="38" rx="5" fill="#94a3b8"/>
      <rect x="170" y="67"  width="18" height="38" rx="5" fill="#94a3b8"/>
      <rect x="12"  y="263" width="18" height="38" rx="5" fill="#94a3b8"/>
      <rect x="170" y="263" width="18" height="38" rx="5" fill="#94a3b8"/>
      <rect x="33" y="150" width="6"  height="82" rx="2" fill="#b8c4d4" stroke="#94a3b8" strokeWidth="0.5"/>
      <rect x="161" y="150" width="6" height="82" rx="2" fill="#b8c4d4" stroke="#94a3b8" strokeWidth="0.5"/>
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
    <g style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onRemove(mark.id) }}>
      <circle cx={mark.x} cy={mark.y} r="11" fill={dt.bg} stroke={dt.color} strokeWidth="1.5"/>
      <text
        x={mark.x} y={mark.y + 3}
        textAnchor="middle" fontSize={dt.symbol.length > 1 ? 6.5 : 10} fontWeight="700" fill={dt.color}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {dt.symbol}
      </text>
    </g>
  )
}

// Comprime imagen a max 1000px, JPEG 0.75
function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1000
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.src = url
  })
}

export default function DamageDiagram({
  value = [],
  onChange,
  // Props opcionales para fotos (solo cuando la recepción ya existe)
  receptionId = null,
  photos = [],          // [{id, damage_id, photo_base64, label}]
  onAddPhoto = null,    // async (damage_id, photo_base64) => void
  onRemovePhoto = null, // async (photo_id) => void
}) {
  const [selectedType, setSelectedType] = useState('golpe')
  const [previewPhoto, setPreviewPhoto] = useState(null) // base64 para lightbox
  const [uploadingId, setUploadingId] = useState(null)
  const fileInputRef = useRef(null)
  const pendingDamageId = useRef(null)

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
    // También eliminar fotos asociadas a este marcador
    const linked = photos.filter(p => String(p.damage_id) === String(id))
    linked.forEach(p => onRemovePhoto?.(p.id))
  }

  const openPhotoPicker = (damageId) => {
    pendingDamageId.current = String(damageId)
    fileInputRef.current.value = ''
    fileInputRef.current.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !pendingDamageId.current || !onAddPhoto) return
    const damageId = pendingDamageId.current
    setUploadingId(damageId)
    try {
      const base64 = await compressImage(file)
      await onAddPhoto(damageId, base64)
    } finally {
      setUploadingId(null)
      pendingDamageId.current = null
    }
  }

  const photosFor = (damageId) => photos.filter(p => String(p.damage_id) === String(damageId))

  return (
    <div className="space-y-3">
      {/* Input oculto para fotos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Selector de tipo de daño */}
      <div className="flex flex-wrap gap-2">
        {DAMAGE_TYPES.map(dt => (
          <button
            key={dt.id}
            type="button"
            onClick={() => setSelectedType(dt.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              selectedType === dt.id ? 'border-2' : 'border border-border text-muted hover:text-ink'
            }`}
            style={selectedType === dt.id ? { borderColor: dt.color, color: dt.color, background: dt.bg } : {}}
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

      {/* Lista detallada de marcadores con fotos */}
      {value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Daños registrados</p>
            <button
              type="button"
              onClick={() => { onChange([]); photos.forEach(p => onRemovePhoto?.(p.id)) }}
              className="text-xs text-muted hover:text-danger transition"
            >
              Limpiar todo
            </button>
          </div>

          {value.map((mark, idx) => {
            const dt = DAMAGE_TYPES.find(d => d.id === mark.type)
            const markPhotos = photosFor(mark.id)
            const isUploading = uploadingId === String(mark.id)
            return (
              <div key={mark.id} className="border border-border rounded-lg p-3 bg-canvas">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: dt?.bg, color: dt?.color }}
                    >
                      {dt?.symbol}
                    </span>
                    <span className="text-sm font-medium text-ink">{dt?.label ?? mark.type}</span>
                    <span className="text-xs text-muted">#{idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {receptionId ? (
                      <button
                        type="button"
                        onClick={() => openPhotoPicker(mark.id)}
                        disabled={isUploading}
                        className="flex items-center gap-1 px-2 py-1 rounded-md border border-border text-xs text-muted hover:text-ink hover:border-brand/40 transition disabled:opacity-50"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {isUploading ? 'Subiendo…' : 'Foto'}
                      </button>
                    ) : (
                      <span className="text-xs text-muted italic">Guarda para añadir fotos</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMarker(mark.id)}
                      className="p-1 rounded-md text-muted hover:text-danger hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Miniaturas de fotos */}
                {markPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {markPhotos.map(p => (
                      <div key={p.id} className="relative group">
                        <img
                          src={p.photo_base64}
                          alt="Daño"
                          className="w-16 h-16 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition"
                          onClick={() => setPreviewPhoto(p.photo_base64)}
                        />
                        {onRemovePhoto && (
                          <button
                            type="button"
                            onClick={() => onRemovePhoto(p.id)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <img
            src={previewPhoto}
            alt="Foto daño"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            onClick={() => setPreviewPhoto(null)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
