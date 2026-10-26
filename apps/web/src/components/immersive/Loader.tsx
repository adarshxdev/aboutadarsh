'use client'

import { useEffect, useRef, useState } from 'react'
import { setState, useImmersive } from '@/lib/immersive/store'
import { startAudio } from '@/lib/immersive/audio'
import { useScrollLock } from '@/lib/hooks'
import { heading } from '@/lib/fonts'
import { introSession } from '@/lib/immersive/session'

/** After this, offer a retry or the light version instead of waiting forever. */
const TROUBLE_MS = 20_000
const PARTICLES = 2200

/** Rasterise the name and pick target points on its strokes. */
function sampleName(text: string, width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const fontSize = Math.min(height * 0.5, (width * 0.85) / (text.length * 0.62))
  ctx.font = `800 ${fontSize}px ${heading.style.fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText(text, width / 2, height / 2)

  const data = ctx.getImageData(0, 0, width, height).data
  const filled: number[] = []
  for (let y = 0; y < height; y += 2)
    for (let x = 0; x < width; x += 2) if (data[(y * width + x) * 4 + 3] > 140) filled.push(x, y)

  const targets = new Float32Array(PARTICLES * 2)
  for (let i = 0; i < PARTICLES; i++) {
    const k = filled.length ? Math.floor(Math.random() * (filled.length / 2)) * 2 : 0
    targets[i * 2] = filled[k] ?? width / 2
    targets[i * 2 + 1] = filled[k + 1] ?? height / 2
  }
  return targets
}

export function Loader({
  name,
  target,
  particles,
  onGone,
}: {
  name: string
  /** Real load progress, 0 → 1. */
  target: number
  /** Particle count of the chosen tier, for the stats readout. */
  particles: number
  /** Called once the exit animation has finished; the parent unmounts the loader. */
  onGone: () => void
}) {
  const motion = useImmersive((s) => s.motion)
  const [shown, setShown] = useState(0)
  const [trouble, setTrouble] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const workerRef = useRef<Worker | null>(null)

  useScrollLock(true)

  // Count up smoothly toward the real progress, then stop scheduling frames.
  const shownRef = useRef(0)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      let v = shownRef.current + (target - shownRef.current) * 0.12
      if (Math.abs(target - v) < 0.004) v = target
      shownRef.current = v
      setShown(v)
      if (v !== target) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])

  useEffect(() => {
    if (target >= 1) return
    const timer = window.setTimeout(() => setTrouble(true), TROUBLE_MS)
    return () => window.clearTimeout(timer)
  }, [target])

  // Particle name, drawn on a 2D canvas from worker-simulated positions.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof Worker === 'undefined') return
    let raf = 0
    let cancelled = false
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    void document.fonts.load(`800 1em ${heading.style.fontFamily}`, name).then(() => {
      if (cancelled) return
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)
      const targets = sampleName(name, width, height)

      const draw = (points: Float32Array) => {
        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = '#efeae4'
        for (let i = 0; i < points.length; i += 2) ctx.fillRect(points[i], points[i + 1], 1.4, 1.4)
      }

      if (!motion) {
        draw(targets)
        return
      }

      const worker = new Worker(new URL('./loader.worker.ts', import.meta.url))
      workerRef.current = worker
      // Nothing is sent until the worker says it's listening.
      let buffer: Float32Array | null = null
      let last = performance.now()

      worker.onmessage = (e: MessageEvent<{ type: 'ready' } | { type: 'frame'; buffer: Float32Array }>) => {
        if (e.data.type === 'ready') {
          worker.postMessage({ type: 'init', targets, width, height })
          buffer = new Float32Array(targets.length)
          return
        }
        draw(e.data.buffer)
        buffer = e.data.buffer
      }
      const loop = (now: number) => {
        if (buffer) {
          const b = buffer
          buffer = null
          worker.postMessage({ type: 'step', dt: (now - last) / 1000, buffer: b }, [b.buffer])
        }
        last = now
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [name, motion])

  const enter = (withSound: boolean) => {
    introSession.set(withSound ? 'sound' : 'silent')
    if (withSound) {
      // Must run inside the click for autoplay rules.
      void startAudio().then((ok) => setState({ sound: ok }))
    }
    workerRef.current?.postMessage({ type: 'scatter' })
    setLeaving(true)
    setState({ entered: true })
    window.setTimeout(onGone, motion ? 1100 : 0)
    document.getElementById('hero-title')?.focus({ preventScroll: true })
  }

  const percent = Math.round(shown * 100)
  const ready = target >= 1 && shown >= 0.995

  return (
    <div
      className="loader"
      data-leaving={leaving || undefined}
      role="progressbar"
      aria-label="Loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <canvas ref={canvasRef} className="loader__motif" aria-hidden="true" />
      <div className="loader__rule" aria-hidden="true">
        <i style={{ transform: `scaleX(${shown})` }} />
      </div>
      <dl className="loader__stats" aria-hidden="true">
        <div>
          <dt>Loaded</dt>
          <dd>{String(percent).padStart(3, '0')}%</dd>
        </div>
        <div>
          <dt>Particles</dt>
          <dd>{Math.round(shown * particles).toLocaleString('en-US')}</dd>
        </div>
      </dl>

      {trouble && !ready && (
        <div className="loader__choices" role="alert">
          <p>This is taking a while.</p>
          <button type="button" className="pill pill--solid" onClick={() => window.location.reload()}>
            Try again
          </button>
          <button type="button" className="pill" onClick={() => setState({ quality: 'off' })}>
            Light version
          </button>
        </div>
      )}

      {ready && !leaving && (
        <div className="loader__choices">
          <button type="button" className="pill pill--solid" onClick={() => enter(true)}>
            Enter with sound
          </button>
          <button type="button" className="pill" onClick={() => enter(false)}>
            Without sound
          </button>
        </div>
      )}
    </div>
  )
}
