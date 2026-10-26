'use client'

import { useSyncExternalStore } from 'react'
import { INTRO_SESSION_KEY } from './session-key'

/**
 * "Has this visitor been through the intro in this browser session?" The full
 * intro (with the sound choice) is for first visits only.
 *
 * The same key is read by an inline script in app/page.tsx before first paint,
 * which hides the intro overlay for returning visitors so it never flashes.
 */
export const introSession = {
  get: () => {
    try {
      return sessionStorage.getItem(INTRO_SESSION_KEY)
    } catch {
      return null
    }
  },
  set: (value: string) => {
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, value)
    } catch {}
  },
}

const noopSubscribe = () => () => {}

/** False on the server and during hydration (matching the HTML), then the real answer. */
export const useReturningVisitor = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => introSession.get() !== null,
    () => false,
  )
