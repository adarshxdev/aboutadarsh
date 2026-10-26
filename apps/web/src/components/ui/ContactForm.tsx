'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  COMMERCIAL_INTENTS,
  INTENTS,
  INTENT_LABELS,
  SOURCES,
  contactSchema,
  type ContactInput,
} from '@portfolio/shared/validation'
import { track } from '@/lib/track'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const MESSAGE_MAX = 4000

/**
 * Contact form, styled by `.cf-*` in immersive.css. Compact by design: the
 * essentials (what it's about, who you are, the message) are always visible;
 * company, budget, timeline and source sit behind "Add details".
 * Validation is the shared Zod schema the API also uses.
 */
export function ContactForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [status, setStatus] = useState<Status>('idle')
  const [serverError, setServerError] = useState<string | null>(null)
  // Minimum time-to-submit check — plan.md §10.
  const startedAt = useMemo(() => Date.now(), [])

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { intent: 'hiring', subscribe: false, website: '', message: '' },
  })

  const intent = watch('intent')
  const messageLength = watch('message')?.length ?? 0
  const showCommercial = COMMERCIAL_INTENTS.includes(intent as (typeof COMMERCIAL_INTENTS)[number])

  const onSubmit = async (values: ContactInput) => {
    setStatus('submitting')
    setServerError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, startedAt }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setServerError(data.error ?? 'Something went wrong. Please email me directly.')
        setStatus('error')
        return
      }
      track('contact_submit', { intent: values.intent })
      setStatus('success')
      reset()
      onSuccess?.()
    } catch {
      setServerError('Network error. Please email me directly.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div role="status" aria-live="polite" className="cf-done">
        <span className="cf-done__mark" aria-hidden="true">
          ✓
        </span>
        <p className="cf-done__title">Message sent</p>
        <p className="cf-done__text">
          I&apos;ll reply within a couple of days — check your inbox for a confirmation.
        </p>
        <button type="button" className="cf-link" onClick={() => setStatus('idle')}>
          Send another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="cf">
      {/* Honeypot. Hidden from sight and from assistive tech, but present in the DOM. */}
      <div className="cf-trap" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <fieldset className="cf-intents">
        <legend className="cf-legend">What&apos;s this about?</legend>
        <div className="cf-chips">
          {INTENTS.map((value) => (
            <label key={value} className="cf-chip">
              <input type="radio" value={value} {...register('intent')} />
              <span>{INTENT_LABELS[value]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="cf-row">
        <Field id="name" label="Your name" error={errors.name?.message}>
          <input
            id="name"
            autoComplete="name"
            placeholder=" "
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            {...register('name')}
          />
        </Field>
        <Field id="email" label="Email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder=" "
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
        </Field>
      </div>

      <Field id="message" label="What are you building?" error={errors.message?.message}>
        <textarea
          id="message"
          rows={4}
          maxLength={MESSAGE_MAX}
          placeholder=" "
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-error' : 'message-count'}
          {...register('message')}
        />
        <span id="message-count" className="cf-count" aria-live="off">
          {messageLength}/{MESSAGE_MAX}
        </span>
      </Field>

      <details className="cf-more">
        <summary>Add details — company, budget, timeline</summary>
        <div className="cf-more__body">
          <div className="cf-row">
            <Field id="company" label="Company (optional)">
              <input id="company" autoComplete="organization" placeholder=" " {...register('company')} />
            </Field>
            <Field id="source" label="How did you find me?" select>
              <select id="source" defaultValue="" {...register('source')}>
                <option value="">Prefer not to say</option>
                {SOURCES.map((value) => (
                  <option key={value} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {showCommercial && (
            <div className="cf-row">
              <Field id="budget" label="Budget (a range is fine)">
                <input id="budget" placeholder=" " {...register('budget')} />
              </Field>
              <Field id="timeline" label="Timeline">
                <input id="timeline" placeholder=" " {...register('timeline')} />
              </Field>
            </div>
          )}
        </div>
      </details>

      {/* Never pre-checked, never bundled with sending the message — plan.md §9. */}
      <label className="cf-switch">
        <input type="checkbox" role="switch" {...register('subscribe')} />
        <span className="cf-switch__track" aria-hidden="true" />
        <span>Also send me occasional notes on agentic AI</span>
      </label>

      {serverError && (
        <p role="alert" className="cf-error cf-error--server">
          {serverError}
        </p>
      )}

      <button type="submit" className="cf-submit" disabled={status === 'submitting'}>
        <span>{status === 'submitting' ? 'Sending…' : 'Send message'}</span>
        <span aria-hidden="true" className="cf-submit__arrow">
          →
        </span>
      </button>
    </form>
  )
}

/** Floating-label field: the label sits in the input until it has focus or a value. */
function Field({
  id,
  label,
  error,
  select,
  children,
}: {
  id: string
  label: string
  error?: string
  select?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="cf-field" data-invalid={error ? true : undefined} data-select={select || undefined}>
      {children}
      <label htmlFor={id}>{label}</label>
      {error && (
        <p id={`${id}-error`} role="alert" className="cf-error">
          {error}
        </p>
      )}
    </div>
  )
}
