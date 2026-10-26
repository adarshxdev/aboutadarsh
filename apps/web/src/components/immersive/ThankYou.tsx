'use client'

import { useEffect, useRef } from 'react'
import { ContactForm } from '@/components/ui/ContactForm'
import { setState, useImmersive } from '@/lib/immersive/store'

/** The contact form, wired to open the thank-you scene on success. */
export function ContactPanelForm() {
  return <ContactForm onSuccess={() => setState({ thanks: true })} />
}

/**
 * Shown after a successful submit, over the brightened envelope; the
 * dialog itself is plain DOM so it works with WebGL off.
 */
export function ThankYou() {
  const open = useImmersive((s) => s.thanks)
  const title = useRef<HTMLHeadingElement>(null)
  const returnTo = useRef<Element | null>(null)
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    returnTo.current = document.activeElement
    title.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setState({ thanks: false })
      // One control inside, so Tab just stays on it.
      if (e.key === 'Tab') {
        e.preventDefault()
        dialog.current?.querySelector('button')?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      ;(returnTo.current as HTMLElement | null)?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <div ref={dialog} className="thanks" role="dialog" aria-modal="true" aria-labelledby="thanks-title">
      <div className="thanks__body">
        <p className="label">Message sent</p>
        <h2 id="thanks-title" ref={title} tabIndex={-1} className="imm-display">
          Thank you.
        </h2>
        <p className="imm-body">
          Your message is on its way. I&apos;ll reply within a couple of days — check your inbox for a
          confirmation.
        </p>
        <button type="button" className="pill pill--solid" onClick={() => setState({ thanks: false })}>
          Back to the field
        </button>
      </div>
    </div>
  )
}
