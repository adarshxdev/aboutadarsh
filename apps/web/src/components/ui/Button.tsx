import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:brightness-110 active:brightness-95 shadow-sm',
  secondary: 'bg-bg-raised text-fg border border-border-strong hover:border-accent hover:text-accent',
  ghost: 'text-fg-muted hover:text-fg hover:bg-bg-subtle',
}

/* Every size clears the 44px minimum hit area — plan.md §6. */
const sizes: Record<Size, string> = {
  sm: 'min-h-11 px-4 text-[var(--text-step--1)]',
  md: 'min-h-12 px-5',
  lg: 'min-h-13 px-7',
}

const baseClass =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none'

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: Variant; size?: Size }) {
  return <button className={cn(baseClass, variants[variant], sizes[size], className)} {...props} />
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  href,
  external,
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string
  variant?: Variant
  size?: Size
  external?: boolean
  children: ReactNode
}) {
  const classes = cn(baseClass, variants[variant], sizes[size], className)

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  )
}
