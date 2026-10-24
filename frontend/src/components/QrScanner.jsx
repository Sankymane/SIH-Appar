import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import Icon from './Icon.jsx'
import { Button } from './ui.jsx'

function decodeImageData(img) {
  const res = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })
  return res?.data ?? null
}

// Decode a QR code from an uploaded image file.
export async function decodeQrFile(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return decodeImageData(ctx.getImageData(0, 0, canvas.width, canvas.height))
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Live camera scanner. Calls onResult(text) once, then stops.
export function CameraScanner({ onResult }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [state, setState] = useState('idle') // idle | starting | scanning | denied | unavailable
  const streamRef = useRef(null)
  const rafRef = useRef(0)

  const stop = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  useEffect(() => stop, [])

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unavailable')
      return
    }
    setState('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream
      await video.play()
      setState('scanning')
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      const tick = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0)
          const text = decodeImageData(ctx.getImageData(0, 0, canvas.width, canvas.height))
          if (text) {
            stop()
            setState('idle')
            onResult(text)
            return
          }
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch (e) {
      setState(e?.name === 'NotAllowedError' ? 'denied' : 'unavailable')
    }
  }

  return (
    <div>
      <div className="relative mx-auto aspect-4/3 w-full max-w-115 overflow-hidden rounded-lg bg-primary">
        <video ref={videoRef} playsInline muted className={state === 'scanning' ? 'h-full w-full object-cover' : 'hidden'} />
        <canvas ref={canvasRef} className="hidden" />
        <div className="pointer-events-none absolute inset-[16%] rounded-md">
          {['top-0 left-0 border-t-3 border-l-3', 'top-0 right-0 border-t-3 border-r-3', 'bottom-0 left-0 border-b-3 border-l-3', 'bottom-0 right-0 border-b-3 border-r-3'].map((c) => (
            <span key={c} className={`absolute size-7 border-saffron-2 ${c}`} />
          ))}
          {state === 'scanning' && <span className="scanline absolute inset-x-2 top-0 h-0.5 bg-saffron-2/80" />}
        </div>
        {state !== 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
            <Icon name="qr" size={34} className="text-primary-soft" />
            <p className="text-[14px] text-primary-soft">
              {state === 'denied'
                ? 'Camera permission was blocked. Allow it in the browser’s address bar, or upload a QR image instead.'
                : state === 'unavailable'
                  ? 'No camera available here. Upload a QR image or paste the code instead.'
                  : 'Hold the student’s QR code inside the frame.'}
            </p>
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-center">
        {state === 'scanning' ? (
          <Button onClick={() => { stop(); setState('idle') }} icon="x">
            Stop camera
          </Button>
        ) : (
          <Button variant="primary" icon="camera" onClick={start} disabled={state === 'starting'}>
            {state === 'starting' ? 'Starting camera…' : 'Start camera'}
          </Button>
        )}
      </div>
    </div>
  )
}
