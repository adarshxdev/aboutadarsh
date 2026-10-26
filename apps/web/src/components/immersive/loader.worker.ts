/**
 * Loader particles, simulated off the main thread so the logo keeps moving
 * while the 3D bundle parses. The main thread samples the glyph targets (it
 * owns the fonts), and draws whatever positions come back.
 *
 * Protocol (the worker announces itself first; bundlers may load it async,
 * and anything posted before then would be dropped):
 *   out { type: 'ready' }
 *   in  { type: 'init', targets: Float32Array, width, height }
 *   in  { type: 'step', dt, buffer: Float32Array }   ← buffer is transferred and returned
 *   in  { type: 'scatter' }
 *   out { type: 'frame', buffer: Float32Array }
 */

type Message =
  | { type: 'init'; targets: Float32Array; width: number; height: number }
  | { type: 'step'; dt: number; buffer: Float32Array }
  | { type: 'scatter' }

let targets: Float32Array = new Float32Array(0)
let pos = new Float32Array(0)
let vel = new Float32Array(0)
let seed = new Float32Array(0)
let size = { width: 0, height: 0 }
let scattered = false

self.onmessage = (event: MessageEvent<Message>) => {
  const msg = event.data

  if (msg.type === 'init') {
    targets = msg.targets
    size = { width: msg.width, height: msg.height }
    const count = targets.length / 2
    pos = new Float32Array(count * 2)
    vel = new Float32Array(count * 2)
    seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      seed[i] = Math.random()
      pos[i * 2] = Math.random() * size.width
      pos[i * 2 + 1] = Math.random() * size.height
    }
    return
  }

  if (msg.type === 'scatter') {
    scattered = true
    return
  }

  const dt = Math.min(msg.dt, 1 / 30)
  const count = pos.length / 2
  const spring = scattered ? 0 : 40
  const damping = Math.pow(0.86, dt * 60)

  for (let i = 0; i < count; i++) {
    const ix = i * 2
    const iy = ix + 1
    if (scattered) {
      // Fall away like sediment, each grain at its own speed.
      vel[iy] += (120 + seed[i] * 380) * dt
      vel[ix] += (seed[i] - 0.5) * 60 * dt
    } else {
      vel[ix] += (targets[ix] - pos[ix]) * spring * dt
      vel[iy] += (targets[iy] - pos[iy]) * spring * dt
      // Small idle shimmer.
      vel[ix] += Math.sin(seed[i] * 50 + pos[iy] * 0.05) * 6 * dt
    }
    vel[ix] *= damping
    vel[iy] *= scattered ? 0.99 : damping
    pos[ix] += vel[ix] * dt
    pos[iy] += vel[iy] * dt
  }

  const out = msg.buffer.length === pos.length ? msg.buffer : new Float32Array(pos.length)
  out.set(pos)
  ;(self as unknown as Worker).postMessage({ type: 'frame', buffer: out }, [out.buffer])
}

;(self as unknown as Worker).postMessage({ type: 'ready' })

export {}
