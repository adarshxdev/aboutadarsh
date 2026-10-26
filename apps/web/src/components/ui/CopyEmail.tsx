'use client'

import { useEffect, useState } from 'react'
import { MailIcon } from '@/components/ui/Icons'
import { track } from '@/lib/track'

/**
 * Click-to-copy, with the address assembled after hydration.
 *
 * The address is split into `user` and `domain` props so it is never
 * contiguous in the served HTML — not in the markup, and not in the RSC flight
 * payload, which serializes client-component props verbatim. Pre-hydration the
 * page shows "user [at] domain"; real visitors get the live address and a
 * working mailto: the moment JS runs (plan.md §9).
 */
export function CopyEmail({ user, domain, className }: { user: string; domain: string; className?: string }) {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const email = `${user}@${domain}`

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const onClick = async (e: React.MouseEvent) => {
    // Let modified clicks open the mail client normally.
    if (e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      track('email_copy')
    } catch {
      window.location.href = `mailto:${email}`
    }
  }

  const classes = `group inline-flex min-h-11 items-center gap-2 text-[length:var(--text-step--1)] text-fg-muted transition-colors hover:text-fg ${className ?? ''}`

  const label = (
    <>
      <MailIcon className="size-4 shrink-0" />
      <span className="font-mono">{mounted ? email : `${user} [at] ${domain}`}</span>
      <span
        aria-live="polite"
        className={`text-success transition-opacity ${copied ? 'opacity-100' : 'opacity-0'}`}
      >
        {copied ? 'Copied' : ''}
      </span>
    </>
  )

  // Pre-hydration there is no mailto: in the markup at all.
  if (!mounted) {
    return (
      <span className={classes} aria-label="Email address">
        {label}
      </span>
    )
  }

  return (
    <a href={`mailto:${email}`} onClick={onClick} className={classes}>
      {label}
    </a>
  )
}
