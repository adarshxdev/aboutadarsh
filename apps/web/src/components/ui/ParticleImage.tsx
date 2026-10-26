'use client'

import { useEffect, useRef, useState } from 'react'

type Status = 'loading' | 'ready' | 'missing'

/**
 * A picture rebuilt from coloured beads: one bead per grid cell, coloured
 * from the image, flying in from a scatter and settling into place. The
 * pointer pushes beads aside; they drift back. Dark pixels become faint beads,
 * so a dark background recedes and the subject stands out. The loop stops
 * once everything has settled.
 */
export function ParticleImage({
  src,
  alt,
  className,
  spacing = 4,
}: {
  src: string
  alt: string
  className?: string
  /** Pixels between beads on screen; smaller is denser (and heavier). */
  spacing?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let cancelled = false
    let sim: {
      w: number
      h: number
      dot: number
      tx: Float32Array
      ty: Float32Array
      x: Float32Array
      y: Float32Array
      vx: Float32Array
      vy: Float32Array
      color: string[]
    } | null = null
    const pointer = { x: -1e4, y: -1e4, active: false }
    const image = new Image()

    const draw = () => {
      if (!sim) return
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, sim.w, sim.h)
      const px = reduced ? sim.tx : sim.x
      const py = reduced ? sim.ty : sim.y
      for (let i = 0; i < sim.color.length; i++) {
        ctx.fillStyle = sim.color[i]
        ctx.beginPath()
        ctx.arc(px[i], py[i], sim.dot, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    let last = 0
    const step = (now: number) => {
      if (!sim) return
      const dt = Math.min((now - (last || now)) / 1000, 1 / 30) || 1 / 60
      last = now
      const damping = Math.pow(0.84, dt * 60)
      const radius = Math.min(sim.w, sim.h) * 0.12
      let moving = 0
      for (let i = 0; i < sim.color.length; i++) {
        let ax = (sim.tx[i] - sim.x[i]) * 40
        let ay = (sim.ty[i] - sim.y[i]) * 40
        if (pointer.active) {
          const dx = sim.x[i] - pointer.x
          const dy = sim.y[i] - pointer.y
          const d = Math.hypot(dx, dy)
          if (d < radius) {
            const f = (1 - d / radius) * 6000
            ax += (dx / (d || 1)) * f
            ay += (dy / (d || 1)) * f
          }
        }
        sim.vx[i] = (sim.vx[i] + ax * dt) * damping
        sim.vy[i] = (sim.vy[i] + ay * dt) * damping
        sim.x[i] += sim.vx[i] * dt
        sim.y[i] += sim.vy[i] * dt
        moving = Math.max(moving, Math.abs(sim.vx[i]) + Math.abs(sim.vy[i]))
      }
      draw()
      raf = moving > 0.5 || pointer.active ? requestAnimationFrame(step) : 0
    }
    const wake = () => {
      if (!raf && !reduced) {
        last = 0
        raf = requestAnimationFrame(step)
      }
    }

    const build = () => {
      if (cancelled || !image.naturalWidth) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Fit the image inside the canvas, then read one pixel per bead.
      const fit = Math.min(w / image.naturalWidth, h / image.naturalHeight)
      const iw = Math.round(image.naturalWidth * fit)
      const ih = Math.round(image.naturalHeight * fit)
      const ox = (w - iw) / 2
      const oy = (h - ih) / 2
      const cols = Math.floor(iw / spacing)
      const rows = Math.floor(ih / spacing)
      const sample = document.createElement('canvas')
      sample.width = cols
      sample.height = rows
      const sctx = sample.getContext('2d', { willReadFrequently: true })!
      sctx.drawImage(image, 0, 0, cols, rows)
      const data = sctx.getImageData(0, 0, cols, rows).data

      const tx: number[] = []
      const ty: number[] = []
      const color: string[] = []
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const k = (j * cols + i) * 4
          const [r, g, b, a] = [data[k], data[k + 1], data[k + 2], data[k + 3]]
          if (a < 40) continue
          const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
          // Dark pixels fade out, so the background recedes behind the subject.
          const alpha = Math.min(1, 0.12 + lum * 1.4)
          tx.push(ox + (i + 0.5) * spacing)
          ty.push(oy + (j + 0.5) * spacing)
          color.push(`rgba(${r},${g},${b},${alpha.toFixed(2)})`)
        }
      }
      const n = color.length
      const x = new Float32Array(n)
      const y = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        // Rise from below in a loose cloud.
        x[i] = tx[i] + (Math.random() - 0.5) * w * 0.6
        y[i] = h + Math.random() * h * 0.6
      }
      sim = {
        w,
        h,
        dot: spacing * 0.42,
        tx: Float32Array.from(tx),
        ty: Float32Array.from(ty),
        x,
        y,
        vx: new Float32Array(n),
        vy: new Float32Array(n),
        color,
      }
      setStatus('ready')
      draw()
      wake()
    }

    image.onload = build
    image.onerror = () => !cancelled && setStatus('missing')
    image.src = src
    const resize = new ResizeObserver(build)
    resize.observe(canvas)

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.active = true
      wake()
    }
    const onLeave = () => {
      pointer.active = false
      wake()
    }
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      resize.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [src, spacing])

  return (
    <div className={`particle-image ${className ?? ''}`} data-status={status}>
      <canvas ref={canvasRef} role="img" aria-label={alt} />
      {status === 'missing' && (
        <p className="particle-image__missing">
          Add the picture at <code>apps/web/public{src}</code> to see it here.
        </p>
      )}
    </div>
  )
}
