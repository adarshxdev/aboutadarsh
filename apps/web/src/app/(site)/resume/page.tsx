import type { Metadata } from 'next'
import { formatPeriod } from '@portfolio/shared/content'
import { getSite } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { TrackedLink } from '@/components/ui/TrackedLink'
import { PrintButton } from '@/components/ui/PrintButton'
import { CopyEmail } from '@/components/ui/CopyEmail'

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getSite()
  return pageMetadata({
    title: 'Résumé',
    description: `${profile.name} — ${profile.title}. ${profile.summary}`,
    path: '/resume',
  })
}

/**
 * Real HTML, indexable and screen-reader friendly, with a print stylesheet so
 * Cmd+P produces a clean PDF — plan.md §4.
 */
export default async function ResumePage() {
  const { achievements, allEducation, allExperience, emailParts, profile, skillsByCategory } = await getSite()
  return (
    <div className="container-page max-w-3xl py-12 md:py-20">
      <div
        className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-8"
        data-print="hide"
      >
        <p className="text-[length:var(--text-step--1)] text-fg-muted">
          Prefer a file? Download the PDF, or print this page.
        </p>
        <div className="flex flex-wrap gap-3">
          <TrackedLink
            href={profile.resumePdf}
            event="resume_download"
            download
            className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-medium text-accent-fg transition-all hover:brightness-110"
          >
            Download PDF
          </TrackedLink>
          <PrintButton />
        </div>
      </div>

      <header className="mb-10">
        <h1 className="text-[length:var(--text-step-4)] font-semibold">{profile.name}</h1>
        <p className="mt-2 text-[length:var(--text-step-1)] text-fg-muted">{profile.title}</p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[length:var(--text-step--1)] text-fg-subtle">
          <span>{profile.location}</span>
          {/* Phone is deliberately absent — it stays in the PDF only (plan.md §9). */}
          <CopyEmail {...emailParts} className="min-h-0 text-[length:var(--text-step--1)]" />
          {profile.socials.map((social) => (
            <a
              key={social.href}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-fg"
            >
              {social.handle}
            </a>
          ))}
        </p>
        <p className="mt-6 text-fg-muted">{profile.summary}</p>
      </header>

      <ResumeSection title="Experience">
        {allExperience.map((role) => (
          <article key={role.slug} className="print-break-inside-avoid mb-8 last:mb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-semibold">
                {role.role}, {role.company}
                {role.team && <span className="font-normal text-fg-muted"> ({role.team})</span>}
              </h3>
              <p className="font-mono text-[length:var(--text-step--1)] text-fg-subtle">
                {formatPeriod(role.start, role.end)}
              </p>
            </div>
            <ul className="mt-3 space-y-2">
              {role.bullets.map((bullet, i) => (
                <li
                  key={i}
                  className="relative pl-5 text-[length:var(--text-step--1)] text-fg-muted before:absolute before:top-[0.7em] before:left-0 before:size-1.5 before:rounded-full before:bg-border-strong"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </ResumeSection>

      <ResumeSection title="Skills">
        <dl className="space-y-3">
          {skillsByCategory.map((group) => (
            <div key={group.key} className="flex flex-wrap gap-x-2">
              <dt className="font-medium">{group.label}:</dt>
              <dd className="min-w-0-fix flex-1 text-fg-muted">
                {group.skills.map((s) => s.name).join(', ')}
              </dd>
            </div>
          ))}
        </dl>
      </ResumeSection>

      <ResumeSection title="Education">
        {allEducation.map((entry) => (
          <div key={entry.slug} className="flex flex-wrap items-baseline justify-between gap-x-4">
            <div>
              <h3 className="font-semibold">{entry.degree}</h3>
              <p className="text-fg-muted">
                {entry.institution}
                {entry.score && ` · GPA ${entry.score.value}/${entry.score.scale}`}
              </p>
            </div>
            <p className="font-mono text-[length:var(--text-step--1)] text-fg-subtle">
              {entry.start.slice(0, 4)} – {entry.end.slice(0, 4)}
            </p>
          </div>
        ))}
      </ResumeSection>

      <ResumeSection title="Achievements">
        <ul className="space-y-1.5">
          {achievements.map((item) => (
            <li key={item.title} className="text-fg-muted">
              <span className="text-fg">{item.title}</span>
              {item.org && ` — ${item.org}`}
              {!item.org && item.detail && ` — ${item.detail}`}
            </li>
          ))}
        </ul>
      </ResumeSection>
    </div>
  )
}

function ResumeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10 border-t border-border pt-8">
      <h2 className="mb-5 text-[length:var(--text-step--1)] font-semibold tracking-[0.14em] text-fg-subtle uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}
