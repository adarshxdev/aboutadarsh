import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getSite } from '@/lib/content'
import { JsonLd, pageMetadata, projectJsonLd } from '@/lib/seo'
import { slugGradient } from '@/lib/utils'
import { Pill } from '@/components/ui/Pill'
import { ArrowIcon, ExternalIcon, LockIcon } from '@/components/ui/Icons'
import { ButtonLink } from '@/components/ui/Button'
import { mdxComponents } from '@/components/ui/MdxComponents'

export async function generateStaticParams() {
  const { caseStudies } = await getSite()
  return caseStudies.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { getProject } = await getSite()
  const project = getProject(slug)
  if (!project) return {}

  return pageMetadata({
    title: project.title,
    description: project.tagline,
    path: `/work/${project.slug}`,
    ogSubtitle: project.context ?? `${project.year}`,
  })
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await getSite()
  const { caseStudies, getProject } = site
  const project = getProject(slug)
  if (!project || !project.links.caseStudy) notFound()

  const study = site.getCaseStudy(slug)
  if (!study) notFound()

  // Same shape as the old MDX frontmatter + body.
  const frontmatter = { problem: study.problem, constraints: study.constraints, outcome: study.outcome }
  const content = study.body
  const next = caseStudies.find((p) => p.slug !== slug)

  return (
    <>
      <JsonLd data={projectJsonLd(site, slug)!} />

      <article>
        {/* Hero */}
        <header className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.13]"
            style={{ background: slugGradient(project.slug) }}
          />
          <div className="relative container-page py-16 md:py-24">
            <Link
              href="/#works"
              className="mb-8 inline-flex min-h-11 items-center gap-2 text-[length:var(--text-step--1)] text-fg-muted transition-colors hover:text-fg"
            >
              <ArrowIcon className="size-4 rotate-180" />
              All projects
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              {project.confidential && (
                <Pill>
                  <LockIcon className="size-3.5" />
                  Details generalised under NDA
                </Pill>
              )}
              <Pill>{project.year}</Pill>
              {project.role && <Pill>{project.role}</Pill>}
            </div>

            <h1 className="mt-6 flex max-w-3xl items-center gap-4 text-[length:var(--text-step-4)] font-semibold">
              {project.logo && (
                // Decorative: the title names the project.
                <Image
                  src={project.logo}
                  alt=""
                  width={56}
                  height={56}
                  className="size-12 shrink-0 rounded-2xl bg-white object-contain sm:size-14"
                />
              )}
              <span className="min-w-0-fix">{project.title}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-[length:var(--text-step-1)] text-fg-muted">{project.tagline}</p>

            {project.metrics.length > 0 && (
              <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
                {project.metrics.map((metric) => (
                  <div key={metric.label}>
                    <dt className="text-[length:var(--text-step--1)] text-fg-subtle">{metric.label}</dt>
                    <dd className="mt-1 text-[length:var(--text-step-2)] font-semibold">{metric.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              {project.links.live && (
                <ButtonLink href={project.links.live} external variant="secondary" size="sm">
                  Live site
                  <ExternalIcon className="size-4" />
                </ButtonLink>
              )}
              {project.links.source && (
                <ButtonLink href={project.links.source} external variant="secondary" size="sm">
                  Source
                  <ExternalIcon className="size-4" />
                </ButtonLink>
              )}
            </div>
          </div>
        </header>

        <div className="container-page grid gap-12 py-16 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
          {/* Not wrapped in a scroll reveal: the article body is the page's
              reason for existing, so it renders immediately and unconditionally. */}
          <div className="min-w-0-fix">
            {frontmatter.problem && (
              <p className="mb-10 border-l-2 border-accent pl-6 text-[length:var(--text-step-1)] text-fg-muted">
                {frontmatter.problem}
              </p>
            )}
            <div className="prose-page">
              <MDXRemote source={content} components={mdxComponents} />
            </div>
          </div>

          <aside className="min-w-0-fix lg:sticky lg:top-24 lg:self-start">
            <h2 className="mb-3 text-[length:var(--text-step--1)] font-semibold tracking-wider text-fg-subtle uppercase">
              Stack
            </h2>
            <ul className="flex flex-wrap gap-1.5">
              {project.stack.map((tech) => (
                <li key={tech}>
                  <Pill>{tech}</Pill>
                </li>
              ))}
            </ul>

            {frontmatter.constraints && frontmatter.constraints.length > 0 && (
              <>
                <h2 className="mt-8 mb-3 text-[length:var(--text-step--1)] font-semibold tracking-wider text-fg-subtle uppercase">
                  Constraints
                </h2>
                <ul className="space-y-2 text-[length:var(--text-step--1)] text-fg-muted">
                  {frontmatter.constraints.map((constraint) => (
                    <li
                      key={constraint}
                      className="relative pl-4 before:absolute before:top-[0.7em] before:left-0 before:size-1.5 before:rounded-full before:bg-border-strong"
                    >
                      {constraint}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </aside>
        </div>

        {next && (
          <nav className="border-t border-border" aria-label="Next case study">
            <Link
              href={`/work/${next.slug}`}
              className="group container-page flex flex-col gap-2 py-12 md:flex-row md:items-center md:justify-between"
            >
              <span>
                <span className="text-[length:var(--text-step--1)] text-fg-subtle">Next</span>
                <span className="mt-1 block text-[length:var(--text-step-2)] font-semibold">
                  {next.title}
                </span>
              </span>
              <ArrowIcon className="size-6 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-1" />
            </Link>
          </nav>
        )}
      </article>
    </>
  )
}
