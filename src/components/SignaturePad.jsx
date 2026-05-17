import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'

const SignaturePad = forwardRef(function SignaturePad({ label, disabled = false }, ref) {
  const canvasRef = useRef(null)
  const [empty, setEmpty] = useState(true)
  const drawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  useImperativeHandle(ref, () => ({
    toDataURL: () => {
      if (empty) return ''
      return canvasRef.current?.toDataURL('image/png') ?? ''
    },
    isEmpty: () => empty,
    clear: () => clearCanvas(),
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    }
  }

  const startDraw = (e) => {
    if (disabled) return
    e.preventDefault()
    drawing.current = true
    lastPos.current = getPos(e)
  }

  const draw = (e) => {
    if (!drawing.current || disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
    setEmpty(false)
  }

  const stopDraw = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    drawing.current = false
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setEmpty(true)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-ink-2 uppercase tracking-wide">{label}</label>
        {!empty && !disabled && (
          <button type="button" onClick={clearCanvas}
            className="flex items-center gap-1 text-xs text-muted hover:text-danger transition">
            <Trash2 className="w-3 h-3" /> Borrar
          </button>
        )}
      </div>
      <div className={`relative rounded-xl border-2 transition ${
        empty ? 'border-dashed border-border' : 'border-border'
      } ${disabled ? 'opacity-50' : 'cursor-crosshair'} bg-white`}>
        <canvas
          ref={canvasRef}
          width={500}
          height={160}
          className="w-full h-32 rounded-xl touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {empty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-muted">Firme aquí</p>
          </div>
        )}
      </div>
    </div>
  )
})

export default SignaturePad
