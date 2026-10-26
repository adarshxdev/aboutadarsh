'use client'

import { useSyncExternalStore } from 'react'
import type { FormName } from './chapters'
import type { Quality } from './quality'

/**
 * Two kinds of state, kept apart on purpose:
 *
 * - `state`: changes a few times per visit (active panel, toggles). React
 *   subscribes through `useImmersive`, so components re-render on change.
 * - `live`: changes every frame (scroll progress, pointer). Read directly in
 *   render loops; never put it in React state or the page re-renders at 60fps.
 */
export type ImmersiveState = {
  /** Index into PANELS. */
  panel: number
  /** Particle shape the stage is morphing toward. */
  form: FormName
  /** Index of the project shown in the works viewer. */
  work: number
  /** Video playing on the particle field, if the active project has one. */
  video: string | null
  motion: boolean
  sound: boolean
  quality: Quality
  /** The loader has been dismissed. */
  entered: boolean
  /** The thank-you scene after a successful contact submit. */
  thanks: boolean
  /** Skills panel: the logo the field is drawing, cycled automatically… */
  logo: number
  /** …unless one is hovered in the grid. */
  logoHover: number | null
}

let state: ImmersiveState = {
  panel: 0,
  form: 'glyph',
  work: 0,
  video: null,
  motion: true,
  sound: false,
  quality: 'high',
  entered: false,
  thanks: false,
  logo: 0,
  logoHover: null,
}

const listeners = new Set<() => void>()

export const getState = () => state

export function setState(patch: Partial<ImmersiveState>) {
  const next = { ...state, ...patch }
  if ((Object.keys(patch) as (keyof ImmersiveState)[]).every((k) => next[k] === state[k])) return
  state = next
  listeners.forEach((fn) => fn())
}

export function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function useImmersive<T>(select: (s: ImmersiveState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(state),
  )
}

/** Per-frame values. Mutated in place. */
export const live = {
  /** Whole-page scroll progress, 0 → 1. */
  progress: 0,
  /** Pointer in normalised device coordinates, -1 → 1. */
  pointer: { x: 0, y: 0 },
  /** Pointer speed, decays toward 0. */
  pointerSpeed: 0,
  /** Skills rings: the logo currently facing the viewer on each ring. */
  frontLogos: [] as number[],
  /** Audio level from the analyser, 0 → 1. */
  level: 0,
}
