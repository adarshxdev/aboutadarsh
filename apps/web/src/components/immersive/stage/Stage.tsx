'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { TIERS, type Quality } from '@/lib/immersive/quality'
import type { ParticleLogo } from '@/lib/immersive/chapters'
import { getState, live, useImmersive } from '@/lib/immersive/store'
import { Particles } from './Particles'

/**
 * React Three Fiber 9 (latest stable) still creates a THREE.Clock, which
 * three r183+ flags as deprecated on every load. It's harmless and ours to
 * ignore until R3F 10 switches to THREE.Timer; every other three.js message
 * still goes to the console. Remove this once on R3F 10.
 */
THREE.setConsoleFunction((level, message, ...rest) => {
  if (typeof message === 'string' && message.startsWith('THREE.Clock: This module has been deprecated'))
    return
  const log = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  log(message, ...rest)
})

/** Ink at the surface, deeper blue at the bottom of the page. */
const SURFACE = new THREE.Color('#04070c')
const DEPTHS = new THREE.Color('#020611')

const chromaOffset = new THREE.Vector2(0.0009, 0.0006)

/** Places the field beside the text on wide screens, behind it on narrow ones. */
function Rig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null)
  const scene = useThree((s) => s.scene)
  const motion = useImmersive((s) => s.motion)
  const background = useRef(SURFACE.clone())

  useEffect(() => {
    scene.background = background.current
  }, [scene])

  useFrame((state, delta) => {
    const { width, height } = state.size
    const wide = width / height > 1.05
    const k = motion ? 1 - Math.exp(-Math.min(delta, 1 / 30) * 2) : 1

    if (group.current) {
      const g = group.current
      // Centre of the right half on wide screens. On contact the form fills that
      // half, so the envelope sits smaller in the gap between text and form.
      const { form } = getState()
      const contact = form === 'envelope'
      // The logo rings are wide: further right and a touch smaller, clear of the skill tiles.
      const rings = form === 'logos'
      const x = wide
        ? contact
          ? -0.3
          : Math.min(rings ? 3.5 : 3, state.viewport.width * (rings ? 0.29 : 0.24))
        : 0
      const y = wide ? 0 : 0.5
      const s = wide ? (contact ? 0.62 : rings ? 0.84 : 1) : 0.72
      g.position.x += (x - g.position.x) * k
      g.position.y += (y - g.position.y) * k
      g.scale.setScalar(g.scale.x + (s - g.scale.x) * k)
    }

    // Gentle pointer parallax on the camera.
    const cam = state.camera
    const px = motion ? live.pointer.x * 0.35 : 0
    const py = motion ? live.pointer.y * 0.2 : 0
    cam.position.x += (px - cam.position.x) * k
    cam.position.y += (py - cam.position.y) * k
    cam.lookAt(0, 0, 0)

    background.current.copy(SURFACE).lerp(DEPTHS, live.progress)
  })

  return <group ref={group}>{children}</group>
}

/** Tells the loader the GPU is warm: two frames in, so shaders have compiled. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0)
  const done = useRef(false)
  const invalidate = useThree((s) => s.invalidate)
  useFrame(() => {
    if (done.current) return
    frames.current += 1
    if (frames.current >= 2) {
      done.current = true
      onReady()
    } else {
      // With motion off the loop is on-demand, so ask for the next frame explicitly.
      invalidate()
    }
  })
  return null
}

function Effects({ mode }: { mode: 'full' | 'bloom' }) {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.08} luminanceSmoothing={0.3} radius={0.7} />
      {mode === 'full' ? (
        <ChromaticAberration
          offset={chromaOffset}
          radialModulation
          modulationOffset={0.35}
          blendFunction={BlendFunction.NORMAL}
        />
      ) : (
        <></>
      )}
      {mode === 'full' ? (
        <Noise premultiply opacity={0.18} blendFunction={BlendFunction.SOFT_LIGHT} />
      ) : (
        <></>
      )}
      <Vignette offset={0.25} darkness={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

export default function Stage({
  quality,
  fontFamily,
  portraitImage,
  logos,
  ringSplit,
  name,
  onReady,
  onLost,
}: {
  quality: Exclude<Quality, 'off'>
  fontFamily: string
  portraitImage: HTMLImageElement | null
  logos: ParticleLogo[]
  ringSplit: number
  name: string
  onReady: () => void
  onLost: () => void
}) {
  const tier = TIERS[quality]
  const motion = useImmersive((s) => s.motion)
  const [visible, setVisible] = useState(true)

  // Stop rendering entirely in background tabs.
  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  return (
    <Canvas
      className="stage__canvas"
      dpr={tier.dpr}
      frameloop={!visible ? 'never' : motion ? 'always' : 'demand'}
      camera={{ fov: 45, position: [0, 0, 7], near: 0.1, far: 40 }}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          'webglcontextlost',
          (e) => {
            e.preventDefault()
            onLost()
          },
          { once: true },
        )
      }}
      aria-hidden="true"
    >
      <Rig>
        <Particles
          size={tier.particles}
          pointSize={quality === 'high' ? 34 : quality === 'medium' ? 44 : 56}
          fontFamily={fontFamily}
          portraitImage={portraitImage}
          logos={logos}
          ringSplit={ringSplit}
          name={name}
        />
      </Rig>
      <ReadySignal onReady={onReady} />
      {tier.post !== 'none' && <Effects mode={tier.post} />}
    </Canvas>
  )
}
