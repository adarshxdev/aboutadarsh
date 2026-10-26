import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/motion/Reveal'

export function Section({
  children,
  className,
  id,
  bleed = false,
}: {
  children: ReactNode
  className?: string
  id?: string
  bleed?: boolean
}) {
  return (
    <section id={id} className={cn('py-[var(--spacing-section)]', className)}>
      <div className={bleed ? '' : 'container-page'}>{children}</div>
    </section>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  className?: string
}) {
  return (
    <Reveal className={cn('mb-10 max-w-2xl md:mb-14', className)}>
      {eyebrow && (
        <p className="mb-3 font-mono tracking-[0.14em] text-[var(--text-step--1)] text-accent uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="text-[length:var(--text-step-3)] font-semibold">{title}</h2>
      {description && <p className="mt-4 text-[length:var(--text-step-0)] text-fg-muted">{description}</p>}
    </Reveal>
  )
}
