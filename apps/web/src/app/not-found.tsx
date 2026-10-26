import Link from 'next/link'
import { ButtonLink } from '@/components/ui/Button'
import { ArrowIcon } from '@/components/ui/Icons'
import SiteLayout from './(site)/layout'

/* Root-level so it catches every unmatched URL, so it wraps itself in the site chrome. */
export default function NotFound() {
  return (
    <SiteLayout>
      <div className="container-page flex min-h-[70dvh] flex-col items-center justify-center py-20 text-center">
        <p className="font-mono text-[length:var(--text-step--1)] tracking-[0.16em] text-accent uppercase">
          404
        </p>
        <h1 className="mt-4 text-[length:var(--text-step-4)] font-semibold">Page not found</h1>
        <p className="mt-4 max-w-md text-fg-muted">
          That link doesn&apos;t point anywhere. It may have moved, or never existed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">
            Home
            <ArrowIcon className="size-4" />
          </ButtonLink>
          <Link
            href="/#works"
            className="inline-flex min-h-12 items-center rounded-full border border-border-strong px-5 font-medium transition-colors hover:border-accent hover:text-accent"
          >
            See projects
          </Link>
        </div>
      </div>
    </SiteLayout>
  )
}
