'use client'

import { useEffect, useRef } from 'react'
import { CHAPTERS, PANELS } from '@/lib/immersive/chapters'
import { live, useImmersive } from '@/lib/immersive/store'

/** Section list plus a scroll-progress rail. Decorative: the live region announces changes. */
export function Hud() {
  const panel = useImmersive((s) => s.panel)
  const chapter = PANELS[panel]?.chapter
  // Out of the way where the content owns the corner: the hero's nameplate, the form, the footer.
  const hidden = ['hero', 'contact', 'finale'].includes(PANELS[panel]?.id ?? '')
  const rail = useRef<HTMLElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      rail.current?.style.setProperty('--progress', live.progress.toFixed(4))
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="hud" data-hidden={hidden || undefined} aria-hidden="true">
      <ol className="hud__chapters">
        {CHAPTERS.map((c) => (
          <li key={c} data-active={c === chapter || undefined}>
            {c}
          </li>
        ))}
      </ol>
      <div className="hud__rail">
        <i ref={rail} />
      </div>
    </div>
  )
}
