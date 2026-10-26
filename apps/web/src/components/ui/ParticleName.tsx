'use client'

import { useEffect, useRef, useState } from 'react'
import { heading } from '@/lib/fonts'
import { gridText } from '@/lib/immersive/name-sampler'

const INK = '#efeae4'
const ACCENT = '#ff9dbf'

/**
 * Text drawn as beads that fly in and settle — the logo on every page, and
 * the centrepiece of /justme. Main-thread simulation (a few hundred to a couple
 * of thousand points), and the loop stops once everything has settled, so an
 * idle logo costs nothing. Hover scatters it and it re-forms; with `repel`,
 * the pointer pushes beads aside as it moves.
 *
 * The plain text renders underneath until the canvas is ready, so there's no
 * empty gap before hydration and it still reads without JavaScript.
 */
export function ParticleName({
  text,
  className,
  density = 1,
  align = 'left',
  repel = false,
}: {
  text: string
  className?: string
  /** >1 packs beads closer together (more of them); <1 spreads them out. */
  density?: number
  align?: 'left' | 'center'
  /** Push beads away from the pointer as it moves over the canvas. */
  repel?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let cancelled = false
    let sim: {
      width: number
      height: number
      dot: number
      round: boolean
      targets: Float32Array
      accent: Uint8Array
      pos: Float32Array
      vel: Float32Array
    } | null = null
    const pointer = { x: -1e4, y: -1e4, active: false }

    const draw = () => {
      if (!sim) return
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, sim.width, sim.height)
      const pts = reduced ? sim.targets : sim.pos
      for (const [color, flag] of [
        [INK, 0],
        [ACCENT, 1],
      ] as const) {
        ctx.fillStyle = color
        if (sim.round) {
          // Large sizes: round beads, so it reads as beads rather than pixels.
          ctx.beginPath()
          for (let i = 0; i < sim.accent.length; i++) {
            if (sim.accent[i] !== flag) continue
            ctx.moveTo(pts[i * 2] + sim.dot, pts[i * 2 + 1])
            ctx.arc(pts[i * 2], pts[i * 2 + 1], sim.dot, 0, Math.PI * 2)
          }
          ctx.fill()
        } else {
          for (let i = 0; i < sim.accent.length; i++) {
            if (sim.accent[i] === flag) ctx.fillRect(pts[i * 2], pts[i * 2 + 1], sim.dot, sim.dot)
          }
        }
      }
    }

    let last = 0
    const step = (now: number) => {
      if (!sim) return
      const dt = Math.min((now - (last || now)) / 1000, 1 / 30) || 1 / 60
      last = now
      const damping = Math.pow(0.82, dt * 60)
      let moving = 0
      for (let i = 0; i < sim.accent.length; i++) {
        const ix = i * 2
        const iy = ix + 1
        let ax = (sim.targets[ix] - sim.pos[ix]) * 90
        let ay = (sim.targets[iy] - sim.pos[iy]) * 90
        if (pointer.active) {
          const dx = sim.pos[ix] - pointer.x
          const dy = sim.pos[iy] - pointer.y
          const d2 = dx * dx + dy * dy
          const r = sim.height * 0.35
          if (d2 < r * r) {
            const f = (1 - Math.sqrt(d2) / r) * 9000
            const d = Math.sqrt(d2) || 1
            ax += (dx / d) * f
            ay += (dy / d) * f
          }
        }
        sim.vel[ix] = (sim.vel[ix] + ax * dt) * damping
        sim.vel[iy] = (sim.vel[iy] + ay * dt) * damping
        sim.pos[ix] += sim.vel[ix] * dt
        sim.pos[iy] += sim.vel[iy] * dt
        moving = Math.max(moving, Math.abs(sim.vel[ix]) + Math.abs(sim.vel[iy]))
      }
      draw()
      // Settled: stop until something stirs it again.
      raf = moving > 0.6 || pointer.active ? requestAnimationFrame(step) : 0
    }
    const wake = () => {
      if (!raf && !reduced) {
        last = 0
        raf = requestAnimationFrame(step)
      }
    }

    const build = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (!width || !height) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Bead spacing scales with size: dense enough to read at 26px, chunky at 300px.
      const spacing = Math.min(6, Math.max(1.6, height / 20)) / density
      const { targets, accent } = gridText(text, width, height, spacing, heading.style.fontFamily, align)
      const count = accent.length
      // Big: loosen the grid a little so it looks hand-strung, not printed.
      const round = spacing >= 3
      if (round) {
        for (let i = 0; i < targets.length; i++) targets[i] += (Math.random() - 0.5) * spacing * 0.45
      }
      const pos = new Float32Array(count * 2)
      for (let i = 0; i < count; i++) {
        // Fly in from a loose cloud around the word.
        pos[i * 2] = targets[i * 2] + (Math.random() - 0.5) * width * 0.9
        pos[i * 2 + 1] = targets[i * 2 + 1] + (Math.random() - 0.5) * height * 3
      }
      sim = {
        width,
        height,
        dot: round ? spacing * 0.34 : Math.max(1, spacing * 0.78),
        round,
        targets,
        accent,
        pos,
        vel: new Float32Array(count * 2),
      }
      setReady(true)
      draw()
      wake()
    }

    // Sample only with the real font loaded, or the beads trace the fallback's shapes.
    let fontReady = false
    void document.fonts.load(`800 1em ${heading.style.fontFamily}`, text).then(() => {
      fontReady = true
      if (!cancelled) build()
    })
    const resize = new ResizeObserver(() => fontReady && !cancelled && build())
    resize.observe(canvas)

    // Hover scatters the beads; they re-form when the pointer leaves.
    const host = canvas.parentElement ?? canvas
    const onEnter = () => {
      if (!sim || reduced || repel) return
      for (let i = 0; i < sim.vel.length; i++) sim.vel[i] += (Math.random() - 0.5) * sim.height * 14
      wake()
    }
    const onMove = (e: PointerEvent) => {
      if (!repel) return
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
    host.addEventListener('pointerenter', onEnter)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      resize.disconnect()
      host.removeEventListener('pointerenter', onEnter)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
    }
  }, [text, density, align, repel])

  return (
    <span className={`particle-name ${className ?? ''}`} data-ready={ready || undefined}>
      <span className="particle-name__text" aria-hidden="true">
        {text.endsWith('.') ? (
          <>
            {text.slice(0, -1)}
            <span className="particle-name__dot">.</span>
          </>
        ) : (
          text
        )}
      </span>
      <canvas ref={canvasRef} className="particle-name__canvas" aria-hidden="true" />
    </span>
  )
}
