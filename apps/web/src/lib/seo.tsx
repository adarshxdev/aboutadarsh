import type { Metadata } from 'next'
import type { Profile, Site } from '@portfolio/shared/content'
import { absoluteUrl, siteUrl } from '@/lib/utils'

/** Site-wide defaults; the root layout builds these from the current profile. */
export const siteMetadata = (profile: Profile): Metadata => ({
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} — ${profile.title}`,
    template: `%s · ${profile.name}`,
  },
  description: profile.summary,
  applicationName: profile.name,
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  keywords: [
    profile.name,
    'agentic AI engineer',
    'full-stack engineer',
    'React',
    'Next.js',
    'FastAPI',
    'LiveKit',
    'Bengaluru',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: profile.name,
    title: `${profile.name} — ${profile.title}`,
    description: profile.summary,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${profile.name} — ${profile.title}`,
    description: profile.summary,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: '/' },
})

/** Builds per-page metadata, including the dynamic OG image. */
export function pageMetadata({
  title,
  description,
  path,
  ogTitle,
  ogSubtitle,
}: {
  title: string
  description: string
  path: string
  ogTitle?: string
  ogSubtitle?: string
}): Metadata {
  // Without a subtitle the OG route falls back to the profile's title.
  const og = new URLSearchParams({ title: ogTitle ?? title })
  if (ogSubtitle) og.set('subtitle', ogSubtitle)
  const image = absoluteUrl(`/og?${og.toString()}`)

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { title, description, images: [image] },
  }
}

/** JSON-LD, generated from the same content files — plan.md §11. */
export function personJsonLd({ profile, allEducation }: Site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.title,
    description: profile.summary,
    url: siteUrl,
    // Email is deliberately omitted: JSON-LD is raw HTML on every page, which
    // would hand harvesters the address the CopyEmail component hides (§9).
    address: { '@type': 'PostalAddress', addressLocality: profile.location },
    sameAs: profile.socials.map((s) => s.href),
    alumniOf: allEducation.map((e) => ({
      '@type': 'CollegeOrUniversity',
      name: e.institution,
    })),
    knowsAbout: [
      'Agentic AI',
      'Retrieval-Augmented Generation',
      'Real-time voice systems',
      'Full-stack web development',
      'System design',
    ],
  }
}

export function websiteJsonLd(profile: Profile) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: profile.name,
    url: siteUrl,
    author: { '@type': 'Person', name: profile.name },
  }
}

export function projectJsonLd({ profile, allProjects }: Site, slug: string) {
  const project = allProjects.find((p) => p.slug === slug)
  if (!project) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    abstract: project.tagline,
    url: absoluteUrl(`/work/${project.slug}`),
    dateCreated: String(project.year),
    creator: { '@type': 'Person', name: profile.name },
    keywords: [...project.stack, ...project.domains].join(', '),
  }
}

/** The home page's works, as an ItemList of CreativeWork. */
export function worksJsonLd({ profile, allProjects }: Site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Selected work',
    itemListElement: allProjects.map((project, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CreativeWork',
        name: project.title,
        abstract: project.tagline,
        url: project.links.caseStudy ? absoluteUrl(`/work/${project.slug}`) : project.links.live,
        dateCreated: String(project.year),
        creator: { '@type': 'Person', name: profile.name },
        keywords: project.stack.join(', '),
      },
    })),
  }
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Content is authored by us, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
