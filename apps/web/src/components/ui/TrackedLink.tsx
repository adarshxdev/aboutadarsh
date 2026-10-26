'use client'

import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { track, type TrackEvent } from '@/lib/track'

export function TrackedLink({
  href,
  event,
  meta,
  children,
  external,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  event: TrackEvent
  meta?: Record<string, unknown>
  external?: boolean
  children: ReactNode
}) {
  return (
    <a
      href={href}
      onClick={() => track(event, { href, ...meta })}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...props}
    >
      {children}
    </a>
  )
}
