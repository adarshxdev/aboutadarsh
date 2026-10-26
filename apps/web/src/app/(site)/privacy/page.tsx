import type { Metadata } from 'next'
import { getSite } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { Section } from '@/components/ui/Section'
import { CopyEmail } from '@/components/ui/CopyEmail'

export const metadata: Metadata = pageMetadata({
  title: 'Privacy',
  description: 'What this site collects, why, how long it is kept, and how to have it deleted.',
  path: '/privacy',
})

export default async function PrivacyPage() {
  const { emailParts } = await getSite()
  return (
    <Section>
      <div className="max-w-2xl">
        <h1 className="text-[length:var(--text-step-4)] font-semibold">Privacy</h1>
        <p className="mt-4 text-fg-muted">
          This page describes exactly what this site collects. If something here doesn&apos;t match what the
          site actually does, that&apos;s a bug — please tell me.
        </p>

        <Block title="No cookies, no tracking pixels">
          <p>
            This site sets no cookies and loads no third-party advertising or tracking pixels. Analytics is
            cookieless and aggregate, which is why you aren&apos;t seeing a consent banner — there&apos;s
            nothing to consent to.
          </p>
          <p>There is no session recording or replay on this site.</p>
        </Block>

        <Block title="What's measured automatically">
          <ul>
            <li>Page views, referrer, approximate country, device type and UTM parameters</li>
            <li>Scroll depth within a page, and clicks on links, CTAs and the résumé download</li>
          </ul>
          <p>
            These events are grouped under a rotating identifier derived from a salted hash of your IP address
            and browser, regenerated daily. It can&apos;t be linked to you, and it can&apos;t be joined across
            days. Your raw IP address is never stored.
          </p>
        </Block>

        <Block title="What you give me deliberately">
          <ul>
            <li>
              <strong>Contact form:</strong> your name, email, and anything you type — plus company, intent,
              budget and timeline if you fill them in. Stored so I have a record of the conversation, and
              emailed to me.
            </li>
            <li>
              <strong>Newsletter:</strong> your email, only if you tick the box and then confirm via the link
              sent to you. Ticking is never required to send a message, and the box is never pre-checked.
            </li>
          </ul>
        </Block>

        <Block title="Who else sees it">
          <p>
            Hosting and cookieless analytics run on Vercel. Email is delivered through Resend. The database is
            hosted on Neon. Each of these processes data on my behalf only. Nothing is sold, and nothing is
            shared for advertising.
          </p>
        </Block>

        <Block title="How long it's kept">
          <ul>
            <li>Analytics events: 12 months, then deleted.</li>
            <li>Contact submissions: kept while the conversation is relevant, then deleted.</li>
            <li>Newsletter: until you unsubscribe — every email has a one-click link.</li>
          </ul>
        </Block>

        <Block title="Deleting your data">
          <p>
            Email me and I&apos;ll delete everything associated with your address, usually the same day. You
            don&apos;t need to explain why.
          </p>
          <div className="mt-3">
            <CopyEmail {...emailParts} />
          </div>
        </Block>

        <p className="mt-12 text-[length:var(--text-step--1)] text-fg-subtle">
          Last updated {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
        </p>
      </div>
    </Section>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="mb-4 text-[length:var(--text-step-1)] font-semibold">{title}</h2>
      <div className="space-y-4 text-fg-muted [&_li]:relative [&_li]:pl-5 [&_li]:before:absolute [&_li]:before:top-[0.7em] [&_li]:before:left-0 [&_li]:before:size-1.5 [&_li]:before:rounded-full [&_li]:before:bg-border-strong [&_strong]:text-fg [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  )
}
