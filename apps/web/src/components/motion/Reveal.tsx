'use client'

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Fires once when the element enters ~18% into the viewport, then stays. */
function useRevealed<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Reduced motion (or no IntersectionObserver): show immediately, never
    // leave content waiting on a scroll trigger it may never receive.
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setRevealed(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setRevealed(true)
        io.disconnect()
      },
      // A fraction of the VIEWPORT, not of the element — so a tall block still
      // triggers as it enters, which an element-fraction threshold would not.
      { rootMargin: '0px 0px -18% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return { ref, revealed }
}

type BaseProps = {
  children: ReactNode
  className?: string
  as?: ElementType
}

/** Technique 1 — fade + rise on scroll. */
export function Reveal({ children, className, delay = 0, as: Tag = 'div' }: BaseProps & { delay?: number }) {
  const { ref, revealed } = useRevealed<HTMLDivElement>()
  return (
    <Tag
      ref={ref}
      className={cn('reveal', revealed && 'is-visible', className)}
      style={delay ? ({ '--reveal-delay': `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  )
}

/** Technique 2 — staggered entrance. Children stagger via CSS nth-child. */
export function RevealGroup({ children, className, as: Tag = 'div' }: BaseProps) {
  const { ref, revealed } = useRevealed<HTMLDivElement>()
  return (
    <Tag ref={ref} className={cn('reveal-group', revealed && 'is-visible', className)}>
      {children}
    </Tag>
  )
}

/** A direct child of <RevealGroup>. Carries no state of its own. */
export function RevealItem({ children, className, as: Tag = 'div' }: BaseProps) {
  return <Tag className={className}>{children}</Tag>
}
