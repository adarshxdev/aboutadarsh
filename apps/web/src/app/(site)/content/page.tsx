import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { Post } from '@portfolio/shared/content'
import { getSite } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { Section, SectionHeading } from '@/components/ui/Section'
import { RevealGroup, RevealItem } from '@/components/motion/Reveal'

export const metadata: Metadata = pageMetadata({
  title: 'Content',
  description: 'Videos, posts, talks and articles I have published.',
  path: '/content',
})

const PLATFORM_LABELS: Record<Post['platform'], string> = {
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  x: 'X',
  instagram: 'Instagram',
  blog: 'Blog',
  medium: 'Medium',
  podcast: 'Podcast',
  other: 'Link',
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

export default async function ContentPage() {
  const { allPosts } = await getSite()
  // Hidden from nav and sitemap until there's something to show.
  if (!allPosts.length) notFound()

  return (
    <Section>
      <SectionHeading
        eyebrow="Content"
        title="Published elsewhere"
        description="Videos, posts, talks and articles, newest first."
      />
      <RevealGroup className="auto-grid">
        {allPosts.map((post) => (
          <RevealItem key={post.slug}>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-bg-raised transition-colors hover:border-border-strong"
            >
              {post.thumbnail && (
                // Uploaded images can live on any storage host, so a plain <img>.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.thumbnail}
                  alt=""
                  loading="lazy"
                  className="aspect-video w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col p-6">
                <p className="text-[length:var(--text-step--1)] text-fg-subtle">
                  {PLATFORM_LABELS[post.platform]} · <time dateTime={post.date}>{formatDate(post.date)}</time>
                </p>
                <h2 className="mt-2 text-[length:var(--text-step-1)] group-hover:text-accent">
                  {post.title} <span aria-hidden="true">↗</span>
                </h2>
                {post.summary && <p className="mt-3 text-fg-muted">{post.summary}</p>}
              </div>
            </a>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  )
}
