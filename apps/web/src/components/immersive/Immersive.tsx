'use client'

import { useEffect, useRef, useState, type ComponentType } from 'react'
import { PANELS, WIDE_QUERY, type FormName, type ParticleLogo } from '@/lib/immersive/chapters'
import { detectQuality, TIERS, type Quality } from '@/lib/immersive/quality'
import { useMounted } from '@/lib/hooks'
import { setMusic } from '@/lib/immersive/audio'
import { useReturningVisitor } from '@/lib/immersive/session'
import { getState, live, setState, subscribe, useImmersive } from '@/lib/immersive/store'
import { heading } from '@/lib/fonts'
import { Hud } from './Hud'
import { Loader } from './Loader'
import { Masthead } from './Masthead'
import { SvgFilters } from './SvgFilters'
import { ThankYou } from './ThankYou'
import { usePanelNavigation } from './usePanelNavigation'

type StageProps = {
  quality: Exclude<Quality, 'off'>
  fontFamily: string
  portraitImage: HTMLImageElement | null
  logos: ParticleLogo[]
  ringSplit: number
  name: string
  onReady: () => void
  onLost: () => void
}

/**
 * Client shell around the server-rendered panels. Everything here is an
 * enhancement: with JS or WebGL off, the panels below are the whole page.
 */
export function Immersive({
  name,
  portrait,
  music,
  videos,
  logos,
  ringSplit,
  children,
}: {
  name: string
  /** Photo the hero bust is drawn from. Without one, a placeholder torso. */
  portrait?: string
  /** Soundtrack file; without one the sound toggle plays a generated pad. */
  music?: string
  /** Per project, in works order: the loop to play on the field, if any. */
  videos: (string | null)[]
  /** Tech logos the field draws on the Skills panel, matched to `[data-logo]` tiles. */
  logos: ParticleLogo[]
  /** How many of `logos` go on the top ring (the rest go below). */
  ringSplit: number
  children: React.ReactNode
}) {
  const mounted = useMounted()
  // Already saw the intro this session: no overlay at all (an inline script hides it pre-paint).
  const returning = useReturningVisitor()
  const [fontsReady, setFontsReady] = useState(false)
  const [Stage, setStage] = useState<ComponentType<StageProps> | null>(null)
  const [stageReady, setStageReady] = useState(false)
  // undefined = still loading; null = none (or it failed), so use the placeholder.
  const [portraitImage, setPortraitImage] = useState<HTMLImageElement | null | undefined>(
    portrait ? undefined : null,
  )
  const [loading, setLoading] = useState(true)
  // Image logos must be decoded before the field can trace them. A failed one
  // stays in the list (so tile indices still line up) and draws a fallback shape.
  const [readyLogos, setReadyLogos] = useState<ParticleLogo[] | null>(logos.some((l) => l.src) ? null : logos)
  useEffect(() => {
    if (!logos.some((l) => l.src)) return
    let cancelled = false
    void Promise.all(
      logos.map(
        (l) =>
          new Promise<ParticleLogo>((resolve) => {
            if (!l.src) return resolve(l)
            const image = new Image()
            image.onload = () => resolve({ ...l, image })
            image.onerror = () => resolve(l)
            image.src = l.src
          }),
      ),
    ).then((all) => !cancelled && setReadyLogos(all))
    return () => {
      cancelled = true
    }
  }, [logos])
  const quality = useImmersive((s) => s.quality)
  const motion = useImmersive((s) => s.motion)
  const panel = useImmersive((s) => s.panel)
  const announcer = useRef<HTMLParagraphElement>(null)

  useEffect(() => setMusic(music), [music])

  // Capabilities and preferences, once.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // The store outlives client-side navigation, so start every visit from the top.
    setState({
      quality: detectQuality(),
      motion: !reduced,
      panel: 0,
      work: 0,
      video: null,
      entered: false,
      thanks: false,
      logo: 0,
      logoHover: null,
    })
    void document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  // The 3D bundle loads after first paint, never on the critical path.
  useEffect(() => {
    if (!mounted || quality === 'off' || Stage) return
    let cancelled = false
    void import('./stage/Stage').then((m) => !cancelled && setStage(() => m.default))
    return () => {
      cancelled = true
    }
  }, [mounted, quality, Stage])

  useEffect(() => {
    if (!portrait) return
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => setPortraitImage(img)
    img.onerror = () => setPortraitImage(null)
    img.src = portrait
  }, [portrait])

  // The field's shape follows the panel, the works video and the thank-you scene.
  useEffect(() => {
    const resolve = () => {
      const s = getState()
      const p = PANELS[s.panel]
      let form: FormName = p.form
      let video: string | null = null
      if (form === 'portrait' && !wide.matches) form = 'portraitBare'
      if (s.thanks) form = 'envelope'
      // Skills: every logo together on a revolving ring; a hovered tile brings its logo forward alone.
      else if (p.id === 'stack' && logos.length) form = s.logoHover !== null ? `logo:${s.logoHover}` : 'logos'
      else if (p.id === 'works' && videos[s.work]) {
        form = 'screen'
        video = videos[s.work]
      }
      setState({ form, video })
    }
    const wide = window.matchMedia(WIDE_QUERY)
    resolve()
    wide.addEventListener('change', resolve)
    const unsubscribe = subscribe(resolve)
    return () => {
      wide.removeEventListener('change', resolve)
      unsubscribe()
    }
  }, [videos, logos])

  // Skills panel: light up the tiles of the logos facing the viewer (one per
  // ring), or the hovered one. Written straight to the DOM, not React state.
  const onSkills = PANELS[panel]?.id === 'stack'
  const logoHover = useImmersive((s) => s.logoHover)
  useEffect(() => {
    const tiles = [...document.querySelectorAll<HTMLElement>('[data-logo]')]
    const paint = (active: number[]) => {
      for (const el of tiles) el.toggleAttribute('data-active', active.includes(Number(el.dataset.logo)))
    }
    if (!onSkills) return paint([])
    if (logoHover !== null) return paint([logoHover])
    let raf = 0
    let last = ''
    const tick = () => {
      const key = live.frontLogos.join(',')
      if (key !== last) {
        last = key
        paint(live.frontLogos)
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [onSkills, logoHover])
  useEffect(() => {
    const tiles = [...document.querySelectorAll<HTMLElement>('[data-logo]')]
    const enter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse')
        setState({ logoHover: Number((e.currentTarget as HTMLElement).dataset.logo) })
    }
    const leave = () => setState({ logoHover: null })
    for (const t of tiles) {
      t.addEventListener('pointerenter', enter)
      t.addEventListener('pointerleave', leave)
    }
    return () => {
      for (const t of tiles) {
        t.removeEventListener('pointerenter', enter)
        t.removeEventListener('pointerleave', leave)
      }
    }
  }, [])

  // Pointer for the particle field.
  useEffect(() => {
    let lastX = 0
    let lastY = 0
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -(e.clientY / window.innerHeight) * 2 + 1
      live.pointerSpeed = Math.min(2, live.pointerSpeed + Math.hypot(x - lastX, y - lastY) * 4)
      live.pointer.x = lastX = x
      live.pointer.y = lastY = y
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  // Say where we are, for screen readers. Skips the first panel on load.
  const announced = useRef(false)
  useEffect(() => {
    if (!announced.current) {
      announced.current = true
      return
    }
    if (announcer.current) announcer.current.textContent = PANELS[panel]?.announce ?? ''
  }, [panel])

  usePanelNavigation(mounted, motion)

  const progress =
    !mounted || !fontsReady ? 0.15 : quality === 'off' ? 1 : !Stage ? 0.45 : stageReady ? 1 : 0.8

  return (
    <div
      className="immersive"
      data-enhanced={mounted || undefined}
      data-motion={motion ? 'on' : 'off'}
      data-webgl={quality !== 'off' || undefined}
    >
      <SvgFilters />
      <a className="skip-link" href="#contact" data-go="contact">
        Skip to contact form
      </a>

      <div className="stage" aria-hidden="true">
        <div className="stage__backdrop" />
        {Stage && quality !== 'off' && portraitImage !== undefined && readyLogos && (
          <Stage
            quality={quality}
            fontFamily={heading.style.fontFamily}
            portraitImage={portraitImage}
            logos={readyLogos}
            ringSplit={ringSplit}
            name={`${name}.`}
            onReady={() => setStageReady(true)}
            onLost={() => setState({ quality: 'off' })}
          />
        )}
      </div>

      {loading && !returning && (
        <Loader
          name={name}
          target={progress}
          particles={quality === 'off' ? 0 : TIERS[quality].particles ** 2}
          onGone={() => {
            setLoading(false)
            // Deep links like /#works land on their section once the intro clears.
            const id = window.location.hash.slice(1)
            if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
          }}
        />
      )}
      <noscript>
        <style>{'.loader{display:none!important}'}</style>
      </noscript>

      <Masthead name={name} />
      <Hud />
      <p ref={announcer} className="sr-only" aria-live="polite" />

      <main id="main" className="panels">
        {children}
      </main>

      <ThankYou />
    </div>
  )
}
