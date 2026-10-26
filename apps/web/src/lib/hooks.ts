'use client'

import { useEffect, useSyncExternalStore } from 'react'

/** Generic media-query hook, SSR-safe (false on the server and during hydration). */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

const noopSubscribe = () => () => {}

/** False during SSR and hydration, true after — without a setState-in-effect re-render. */
export const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )

/**
 * True only on devices with a real pointer. Parallax, tilt and the magnetic
 * cursor are gated on this — plan.md §6.
 */
export const usePointerFine = () => useMediaQuery('(hover: hover) and (pointer: fine)')

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

/** Locks body scroll without the layout shifting as the scrollbar disappears. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const { overflow, paddingRight } = document.body.style
    const gap = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (gap > 0) document.body.style.paddingRight = `${gap}px`
    return () => {
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
    }
  }, [locked])
}
