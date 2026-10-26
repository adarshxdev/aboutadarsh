import type { MetadataRoute } from 'next'
import { getSite } from '@/lib/content'
import { absoluteUrl } from '@/lib/utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const { caseStudies, allHobbies, allPosts } = await getSite()

  const staticRoutes = [
    { path: '/', priority: 1 },
    { path: '/resume', priority: 0.8 },
    { path: '/justme', priority: 0.3 },
    { path: '/casual', priority: 0.5 },
    ...(allHobbies.length ? [{ path: '/hobbies', priority: 0.5 }] : []),
    ...(allPosts.length ? [{ path: '/content', priority: 0.6 }] : []),
    { path: '/privacy', priority: 0.2 },
  ].map(({ path, priority }) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority,
  }))

  // Generated from content/, so a new case study appears automatically.
  const studies = caseStudies.map((project) => ({
    url: absoluteUrl(`/work/${project.slug}`),
    lastModified: now,
    changeFrequency: 'yearly' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...studies]
}
