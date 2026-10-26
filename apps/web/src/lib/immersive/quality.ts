/**
 * Rendering tier, picked once on load. `off` means no WebGL at all: the page
 * is still complete, with a static backdrop behind the text.
 */
export type Quality = 'high' | 'medium' | 'low' | 'off'

export const TIERS: Record<
  Exclude<Quality, 'off'>,
  { particles: number; dpr: [number, number]; post: 'full' | 'bloom' | 'none' }
> = {
  // Particle counts are squares: the sim runs one texel per particle.
  high: { particles: 256, dpr: [1, 2], post: 'full' },
  medium: { particles: 160, dpr: [1, 1.5], post: 'bloom' },
  low: { particles: 96, dpr: [1, 1], post: 'none' },
}

type NavigatorHints = Navigator & {
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

export function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'off'

  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2')
  if (!gl) return 'off'
  // Lose the probe context now rather than waiting for GC; browsers cap live contexts.
  gl.getExtension('WEBGL_lose_context')?.loseContext()

  const nav = navigator as NavigatorHints
  if (nav.connection?.saveData) return 'low'

  const memory = nav.deviceMemory ?? 8
  const cores = nav.hardwareConcurrency ?? 8
  const coarse = window.matchMedia('(pointer: coarse)').matches

  if (memory <= 2 || cores <= 2) return 'low'
  if (coarse || memory <= 4 || cores <= 4) return 'medium'
  return 'high'
}
