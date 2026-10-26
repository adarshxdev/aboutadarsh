import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function Pill({
  children,
  className,
  tone = 'neutral',
}: {
  children: ReactNode
  className?: string
  tone?: 'neutral' | 'accent' | 'success'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 leading-tight text-[var(--text-step--1)]',
        tone === 'neutral' && 'border-border bg-bg-subtle text-fg-muted',
        tone === 'accent' && 'border-transparent bg-accent-subtle text-accent',
        tone === 'success' && 'border-transparent bg-accent-subtle text-success',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function AvailabilityPill({ label }: { label: string }) {
  return (
    <Pill tone="success">
      <span className="relative flex size-2 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      {label}
    </Pill>
  )
}
