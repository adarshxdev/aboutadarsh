'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type Mode = 'professional' | 'casual'

const HREF: Record<Mode, string> = { professional: '/', casual: '/casual' }

/**
 * Professional ↔ Casual switch: a two-option radio group styled as a sliding
 * pill. Each option is the other version of the site, so changing it navigates.
 * Real radio inputs, so it's keyboard- and screen-reader-native (arrow keys work).
 */
export function ModeToggle({ mode, className }: { mode: Mode; className?: string }) {
  const router = useRouter()
  // Flips at once so the thumb slides on click; the route follows. Navigation
  // remounts the header, so this never drifts from the page you end up on.
  const [selected, setSelected] = useState(mode)
  const choose = (value: Mode) => {
    if (value === selected) return
    setSelected(value)
    router.prefetch(HREF[value])
    window.setTimeout(() => router.push(HREF[value]), 260)
  }
  return (
    <fieldset className={`mode ${className ?? ''}`} data-mode={selected}>
      <legend className="sr-only">Site version</legend>
      <span className="mode__thumb" aria-hidden="true" />
      {(['professional', 'casual'] as const).map((value) => (
        <label key={value} className="mode__option">
          <input
            type="radio"
            name="site-mode"
            value={value}
            checked={selected === value}
            onChange={() => choose(value)}
          />
          <span>{value === 'professional' ? 'Professional' : 'Casual'}</span>
        </label>
      ))}
    </fieldset>
  )
}
