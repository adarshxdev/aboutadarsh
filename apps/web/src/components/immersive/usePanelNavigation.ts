'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PANELS } from '@/lib/immersive/chapters'
import { getState, live, setState } from '@/lib/immersive/store'

gsap.registerPlugin(Observer, ScrollToPlugin, ScrollTrigger)

const FORM_FIELDS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/**
 * The page scrolls natively (so find-in-page, Tab focus and touch all work);
 * on top of that:
 *
 * - ScrollTrigger tracks the active panel, scroll progress, per-panel parallax
 *   (`--p`) and one-shot reveals (`.is-in`).
 * - With motion on and a fine pointer, wheel and keys step panel to panel.
 *   Panels taller than the viewport are stepped through in screens first.
 * - `[data-go]` links scroll to their panel; with motion off they jump.
 */
export function usePanelNavigation(enabled: boolean, motion: boolean) {
  useEffect(() => {
    if (!enabled) return
    const panels = gsap.utils.toArray<HTMLElement>('[data-panel]')
    if (!panels.length) return

    const ctx = gsap.context(() => {
      panels.forEach((el, i) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => self.isActive && setState({ panel: i }),
        })
        ScrollTrigger.create({
          trigger: el,
          start: 'top 80%',
          once: true,
          onEnter: () => el.classList.add('is-in'),
        })
        ScrollTrigger.create({
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => el.style.setProperty('--p', (self.progress * 2 - 1).toFixed(3)),
        })
      })
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          live.progress = self.progress
        },
      })
    })

    /* ---------- stepping ---------- */

    let busy = false
    const duration = motion ? 1.15 : 0

    const currentIndex = () => {
      const mid = window.innerHeight / 2
      const i = panels.findIndex((el) => {
        const r = el.getBoundingClientRect()
        return r.top <= mid && r.bottom > mid
      })
      return i < 0 ? getState().panel : i
    }

    const scrollTo = (y: number | HTMLElement, after?: () => void) => {
      busy = true
      gsap.to(window, {
        scrollTo: { y, autoKill: false },
        duration,
        ease: 'power3.inOut',
        onComplete: () => {
          after?.()
          // Swallow trackpad inertia that arrives after the tween.
          window.setTimeout(() => (busy = false), motion ? 380 : 0)
        },
      })
    }

    const goTo = (i: number) => {
      const target = panels[Math.max(0, Math.min(panels.length - 1, i))]
      scrollTo(target, () => {
        target.querySelector<HTMLElement>('[data-panel-heading]')?.focus({ preventScroll: true })
      })
    }

    const step = (dir: 1 | -1) => {
      if (busy || getState().thanks) return
      const i = currentIndex()
      const r = panels[i].getBoundingClientRect()
      const vh = window.innerHeight
      if (dir > 0 && r.bottom > vh + 4) return scrollTo(window.scrollY + Math.min(r.bottom - vh, vh * 0.85))
      if (dir < 0 && r.top < -4) return scrollTo(window.scrollY + Math.max(r.top, -vh * 0.85))
      goTo(i + dir)
    }

    const hijack = motion && window.matchMedia('(hover: hover) and (pointer: fine)').matches

    const observer = hijack
      ? Observer.create({
          target: window,
          type: 'wheel',
          wheelSpeed: 1,
          tolerance: 12,
          preventDefault: true,
          onDown: () => step(1),
          onUp: () => step(-1),
        })
      : null

    const onKey = (e: KeyboardEvent) => {
      if (!hijack || e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement
      if (FORM_FIELDS.has(el.tagName) || el.isContentEditable) return
      const onControl = el.tagName === 'BUTTON' || el.tagName === 'A'
      let dir: 1 | -1 | 0 = 0
      if (e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1
      if (e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1
      if (e.key === ' ' && !onControl) dir = e.shiftKey ? -1 : 1
      if (e.key === 'Home') {
        e.preventDefault()
        return goTo(0)
      }
      if (e.key === 'End') {
        e.preventDefault()
        return goTo(panels.length - 1)
      }
      if (!dir) return
      e.preventDefault()
      step(dir)
    }

    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLElement>('[data-go]')
      if (!link) return
      const i = PANELS.findIndex((p) => p.id === link.dataset.go)
      if (i < 0) return
      e.preventDefault()
      history.replaceState(null, '', i === 0 ? location.pathname : `#${PANELS[i].id}`)
      busy = false
      goTo(i)
    }

    window.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)

    return () => {
      ctx.revert()
      observer?.kill()
      gsap.killTweensOf(window)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [enabled, motion])
}
