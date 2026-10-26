'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { api } from './client'

const small =
  'min-h-9 rounded-lg px-3 text-[length:var(--text-step--1)] hover:bg-bg-subtle disabled:opacity-30'

/** Reorder and delete controls for one row of a collection list. */
export function RowActions({
  collection,
  id,
  title,
  first,
  last,
}: {
  collection: string
  id: string
  title: string
  first: boolean
  last: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn()
      router.refresh()
    })

  return (
    <span className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        className={small}
        disabled={pending || first}
        aria-label={`Move ${title} up`}
        onClick={() =>
          run(() => api(`/admin/collections/${collection}/${id}/move`, { body: { direction: 'up' } }))
        }
      >
        ↑
      </button>
      <button
        type="button"
        className={small}
        disabled={pending || last}
        aria-label={`Move ${title} down`}
        onClick={() =>
          run(() => api(`/admin/collections/${collection}/${id}/move`, { body: { direction: 'down' } }))
        }
      >
        ↓
      </button>
      <button
        type="button"
        className={`${small} text-danger`}
        disabled={pending}
        onClick={() => {
          if (confirm(`Delete "${title}"? This can't be undone.`))
            run(() => api(`/admin/collections/${collection}/${id}`, { method: 'DELETE' }))
        }}
      >
        Delete
      </button>
    </span>
  )
}

/** Copies the files in content/ into an empty database. */
export function ImportDefaultsButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await api('/admin/import-defaults', { body: {} })
          router.refresh()
        })
      }
      className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-medium text-accent-fg disabled:opacity-50"
    >
      {pending ? 'Importing…' : 'Import current site content'}
    </button>
  )
}

/** Banner for admin pages when DATABASE_URL is unset. */
export function NoDatabase() {
  return (
    <p role="alert" className="mb-6 rounded-xl bg-bg-subtle p-4 text-fg-muted">
      No database is configured, so this is read-only. Set <code>DATABASE_URL</code> (see the README) to edit.
    </p>
  )
}
