'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GPUComputationRenderer, type Variable } from 'three/examples/jsm/misc/GPUComputationRenderer.js'
import { formColors, isFrontFacing, type FormName, type ParticleLogo } from '@/lib/immersive/chapters'
import { getState, live, subscribe } from '@/lib/immersive/store'
import { buildForms, ringPalette, ringSlot, RING } from './forms'
import { pointsFragment, pointsVertex, positionShader, velocityShader } from './shaders'

const MORPH_SECONDS = 2.2
/** Logo ring spin, radians per second: a full turn in about 40 seconds. */
const RING_SPEED = 0.16
/** How quickly a formed shape stops drifting and goes crisp. */
const SETTLE_SECONDS = 0.9

function dataTexture(data: Float32Array, size: number) {
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.needsUpdate = true
  return texture
}

/** A 1×1 white texture, so the video sampler is always bound. */
const blank = (() => {
  const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)
  t.needsUpdate = true
  return t
})()

export function Particles({
  size,
  pointSize,
  fontFamily,
  portraitImage,
  logos,
  ringSplit,
  name,
}: {
  /** Particles per side: size² in total. */
  size: number
  pointSize: number
  fontFamily: string
  /** Photo for the hero bust; null draws the placeholder torso. */
  portraitImage: HTMLImageElement | null
  /** Tech logos for the Skills panel, drawn as forms `logo:0…`. */
  logos: ParticleLogo[]
  /** How many logos go on the top ring. */
  ringSplit: number
  /** Nameplate under the hero bust. */
  name: string
}) {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const group = useRef<THREE.Group>(null)

  const forms = useMemo(() => {
    const raw = buildForms(size, fontFamily, portraitImage, logos, ringSplit, name)
    return Object.fromEntries(
      Object.entries(raw).map(([name, data]) => [name, dataTexture(data, size)]),
    ) as Record<FormName, THREE.DataTexture>
  }, [size, fontFamily, portraitImage, logos, ringSplit, name])

  // Brand colours for the logo ring, one per particle (linear RGB, like the tones).
  const palette = useMemo(() => {
    const color = new THREE.Color()
    const rgb = logos.map((l) => {
      color.set(l.color)
      return [color.r, color.g, color.b] as [number, number, number]
    })
    return dataTexture(ringPalette(size, rgb), size)
  }, [logos, size])

  const sim = useMemo(() => {
    const gpu = new GPUComputationRenderer(size, size, gl)
    // Half floats where float render targets aren't supported (older iOS).
    if (!gl.extensions.has('EXT_color_buffer_float')) gpu.setDataType(THREE.HalfFloatType)

    const pos0 = gpu.createTexture()
    const vel0 = gpu.createTexture()
    const start = forms[getState().form].image.data as Float32Array
    const p = pos0.image.data as Float32Array
    // Begin scattered, so the first shape assembles itself.
    for (let i = 0; i < p.length; i += 4) {
      p[i] = start[i] + (Math.random() - 0.5) * 6
      p[i + 1] = start[i + 1] + (Math.random() - 0.5) * 6
      p[i + 2] = start[i + 2] + (Math.random() - 0.5) * 6
      p[i + 3] = 1
    }

    const velocity: Variable = gpu.addVariable('textureVelocity', velocityShader, vel0)
    const position: Variable = gpu.addVariable('texturePosition', positionShader, pos0)
    gpu.setVariableDependencies(velocity, [position, velocity])
    gpu.setVariableDependencies(position, [position, velocity])

    const initial = forms[getState().form]
    Object.assign(velocity.material.uniforms, {
      uTime: { value: 0 },
      uDelta: { value: 0 },
      uMorph: { value: 1 },
      uSpring: { value: 4.5 },
      uDamping: { value: 0.9 },
      uNoise: { value: 0.1 },
      uScatter: { value: 2.4 },
      uPulse: { value: 0 },
      uPointer: { value: new THREE.Vector3(99, 99, 0) },
      uPointerRadius: { value: 0.9 },
      uPointerStrength: { value: 6 },
      uFormA: { value: initial },
      uFormB: { value: initial },
    })
    position.material.uniforms.uDelta = { value: 0 }

    const error = gpu.init()
    if (error) console.error(error)
    return { gpu, velocity, position }
  }, [gl, size, forms])

  const { geometry, material } = useMemo(() => {
    const count = size * size
    const geometry = new THREE.BufferGeometry()
    const reference = new Float32Array(count * 2)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      reference[i * 2] = ((i % size) + 0.5) / size
      reference[i * 2 + 1] = (Math.floor(i / size) + 0.5) / size
      seeds[i] = Math.random()
    }
    // `position` is unused by the shader but sets the draw count.
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    geometry.setAttribute('reference', new THREE.BufferAttribute(reference, 2))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

    const [a, b] = formColors(getState().form, logos)
    const material = new THREE.ShaderMaterial({
      vertexShader: pointsVertex,
      fragmentShader: pointsFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPositions: { value: null },
        uTarget: { value: forms[getState().form] },
        uDirect: { value: 0 },
        uSize: { value: pointSize },
        uPixelRatio: { value: 1 },
        uTime: { value: 0 },
        uLevel: { value: 0 },
        uGlow: { value: 0.6 },
        uColorA: { value: new THREE.Color(a) },
        uColorB: { value: new THREE.Color(b) },
        uVideo: { value: blank },
        uVideoMix: { value: 0 },
        uPalette: { value: palette },
        uPaletteMix: { value: 0 },
      },
    })
    return { geometry, material }
  }, [size, pointSize, forms, logos, palette])

  // Morph bookkeeping, outside React state.
  const morph = useRef({ form: getState().form, progress: 1, settled: 0 })
  const colors = useRef({ a: new THREE.Color(), b: new THREE.Color() })
  const video = useRef<{ el: HTMLVideoElement; texture: THREE.VideoTexture } | null>(null)

  useEffect(() => {
    const apply = () => {
      const { form, motion, video: src, thanks } = getState()
      const u = sim.velocity.material.uniforms

      if (form !== morph.current.form) {
        // Retarget from wherever the last morph was heading; the springs keep it continuous.
        u.uFormA.value = u.uFormB.value
        u.uFormB.value = forms[form]
        material.uniforms.uTarget.value = forms[form]
        morph.current = { form, progress: 0, settled: 0 }
      }
      material.uniforms.uDirect.value = motion ? 0 : 1
      material.uniforms.uGlow.value = thanks ? 1.6 : 0.6

      const current = video.current?.el.dataset.src ?? null
      if (src !== current) {
        if (video.current) {
          video.current.el.pause()
          video.current.el.removeAttribute('src')
          video.current.el.load()
          video.current.texture.dispose()
          video.current = null
        }
        material.uniforms.uVideo.value = blank
        if (src) {
          const el = document.createElement('video')
          el.dataset.src = src
          el.src = src
          el.muted = true
          el.loop = true
          el.playsInline = true
          el.crossOrigin = 'anonymous'
          const texture = new THREE.VideoTexture(el)
          texture.colorSpace = THREE.SRGBColorSpace
          video.current = { el, texture }
          el.addEventListener(
            'canplay',
            () => {
              if (video.current?.el === el) material.uniforms.uVideo.value = texture
            },
            { once: true },
          )
          if (motion) void el.play().catch(() => {})
        }
      }
      invalidate()
    }
    apply()
    return subscribe(apply)
  }, [sim, forms, material, invalidate])

  useEffect(
    () => () => {
      sim.gpu.dispose()
      geometry.dispose()
      material.dispose()
      Object.values(forms).forEach((t) => t.dispose())
      palette.dispose()
      video.current?.el.pause()
      video.current?.texture.dispose()
    },
    [sim, geometry, material, forms, palette],
  )

  const pointer = useMemo(() => new THREE.Vector3(), [])
  const ring = useRef({ active: false, angle: 0 })
  const origin = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30)
    const time = state.clock.elapsedTime
    const { motion, form } = getState()
    const vu = sim.velocity.material.uniforms
    const mu = material.uniforms

    if (morph.current.progress < 1) {
      morph.current.progress = motion ? Math.min(1, morph.current.progress + delta / MORPH_SECONDS) : 1
    }
    vu.uMorph.value = morph.current.progress

    // Once a shape has formed, let it settle sharp: fade the drift out and pull
    // particles home harder. Drift comes back with the next morph.
    morph.current.settled = morph.current.progress >= 1 ? morph.current.settled + delta : 0
    const calm = 1 - Math.exp(-morph.current.settled / SETTLE_SECONDS)
    vu.uNoise.value = 0.1 * (1 - calm) + 0.004
    vu.uSpring.value = 4.5 + 4 * calm
    vu.uDamping.value = 0.9 - 0.08 * calm

    // Ease the palette toward the active form.
    const [a, b] = formColors(form, logos)
    const k = motion ? 1 - Math.exp(-delta * 2.5) : 1
    mu.uColorA.value.lerp(colors.current.a.set(a), k)
    mu.uColorB.value.lerp(colors.current.b.set(b), k)

    const hasVideo = mu.uVideo.value !== blank
    mu.uVideoMix.value += ((hasVideo ? 1 : 0) - mu.uVideoMix.value) * k
    mu.uPaletteMix.value += ((form === 'logos' ? 1 : 0) - mu.uPaletteMix.value) * k
    // Finer points on the ring, so many small logos stay crisp.
    mu.uSize.value += ((form === 'logos' ? pointSize * 0.62 : pointSize) - mu.uSize.value) * k

    // Pointer → the particles' local plane at z = 0.
    if (group.current) {
      pointer.set(live.pointer.x, live.pointer.y, 0.5).unproject(state.camera)
      pointer.sub(state.camera.position).normalize()
      const planeZ = group.current.getWorldPosition(origin).z
      const distance = (planeZ - state.camera.position.z) / pointer.z
      pointer.multiplyScalar(distance).add(state.camera.position)
      group.current.worldToLocal(pointer)
      vu.uPointer.value.copy(pointer)
      vu.uPointerStrength.value = 3 + Math.min(live.pointerSpeed, 1) * 10
      live.pointerSpeed *= Math.exp(-delta * 3)
    }

    vu.uTime.value = time
    vu.uDelta.value = delta
    vu.uPulse.value = live.level * 4
    sim.position.material.uniforms.uDelta.value = delta
    if (motion) sim.gpu.compute()

    mu.uPositions.value = sim.gpu.getCurrentRenderTarget(sim.position).texture
    mu.uTime.value = motion ? time : 0
    mu.uLevel.value = live.level
    mu.uPixelRatio.value = state.viewport.dpr

    // Drift: slow sway plus a turn that follows scroll. Front-facing shapes (the
    // bust, video) only sway a little so they stay readable.
    if (group.current && form === 'logos') {
      // The logo ring revolves slowly, tilted so you see it from just above.
      const g = group.current
      if (!ring.current.active) ring.current = { active: true, angle: g.rotation.y }
      if (motion) ring.current.angle += delta * RING_SPEED
      g.rotation.y += (ring.current.angle - g.rotation.y) * k
      g.rotation.x += (RING.tilt - g.rotation.x) * k
      // The logo facing the viewer on each ring, for the skill tiles to light up.
      const n = logos.length
      const front: number[] = []
      for (const top of [true, false]) {
        let best = -1
        let bestCos = -2
        for (let k = 0; k < n; k++) {
          if (k < ringSplit !== top) continue
          const c = Math.cos(ringSlot(k, n, ringSplit).theta + g.rotation.y)
          if (c > bestCos) {
            bestCos = c
            best = k
          }
        }
        if (best >= 0) front.push(best)
      }
      live.frontLogos = front
    } else if (group.current) {
      const g = group.current
      if (ring.current.active) {
        // Leaving the ring: unwind to the nearest equivalent angle, not back through every lap.
        ring.current.active = false
        g.rotation.y = Math.atan2(Math.sin(g.rotation.y), Math.cos(g.rotation.y))
      }
      const front = isFrontFacing(form)
      const turn = front
        ? Math.sin(time * 0.25) * 0.12
        : Math.sin(time * 0.12) * 0.3 + Math.sin(live.progress * Math.PI * 4) * 0.35
      const tilt = front ? 0 : Math.sin(time * 0.08) * 0.1
      g.rotation.y += (turn - g.rotation.y) * k
      g.rotation.x += (tilt - g.rotation.x) * k
    }
  })

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}
