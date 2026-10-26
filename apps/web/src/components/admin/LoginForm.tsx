'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { api } from './client'
import { inputClass } from './EntryForm'

/** Only same-site admin paths; never an open redirect. */
const safeNext = (next?: string) => (next?.startsWith('/admin') && !next.startsWith('//') ? next : '/admin')

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        start(async () => {
          try {
            await api('/auth/login', { body: { email: form.get('email'), password: form.get('password') } })
            router.replace(safeNext(next))
            router.refresh()
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign-in failed.')
          }
        })
      }}
    >
      <div>
        <label htmlFor="email" className="mb-1.5 block font-medium">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-medium text-accent-fg disabled:opacity-50"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

/** Clears the session cookie via the API, then returns to the login page. */
export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await api('/auth/logout', { body: {} }).catch(() => {})
        router.replace('/admin/login')
        router.refresh()
      }}
    >
      Sign out
    </button>
  )
}
