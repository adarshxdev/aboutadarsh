import type { Metadata } from 'next'
import Link from 'next/link'
import { Section } from '@/components/ui/Section'

export const metadata: Metadata = { title: 'Subscription', robots: { index: false } }

/** Where the newsletter confirmation link lands (the API redirects here). */
export default async function SubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const confirmed = status === 'confirmed'
  return (
    <Section>
      <div className="max-w-xl">
        <h1 className="text-[length:var(--text-step-4)]">
          {confirmed ? 'You’re subscribed.' : 'That link didn’t work.'}
        </h1>
        <p className="mt-4 text-fg-muted">
          {confirmed
            ? 'Thanks for confirming. Expect occasional notes on agentic AI — unsubscribe any time.'
            : 'It may have expired or already been used. You can sign up again from the contact form.'}
        </p>
        <Link
          href="/#contact"
          className="mt-8 inline-flex min-h-11 items-center font-medium text-accent hover:underline"
        >
          Back to the site
        </Link>
      </div>
    </Section>
  )
}
