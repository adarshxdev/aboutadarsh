'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container-page flex min-h-[70dvh] flex-col items-center justify-center py-20 text-center">
      <p className="font-mono text-[length:var(--text-step--1)] tracking-[0.16em] text-danger uppercase">
        Error
      </p>
      <h1 className="mt-4 text-[length:var(--text-step-4)] font-semibold">Something broke</h1>
      <p className="mt-4 max-w-md text-fg-muted">
        This one&apos;s on me. Try again, or email me if it keeps happening.
      </p>
      <Button className="mt-8" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
