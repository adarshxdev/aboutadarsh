import { describe, expect, it } from 'vitest'
import { buildSite, staticContent } from '@portfolio/shared/content'
import { pageMetadata, personJsonLd, worksJsonLd } from './seo'

describe('pageMetadata', () => {
  it('builds canonical and OG image URLs for a page', () => {
    const meta = pageMetadata({ title: 'Work', description: 'Projects', path: '/work' })
    expect(meta.alternates?.canonical).toBe('/work')
    const image = (meta.openGraph?.images as { url: string }[])[0].url
    expect(image).toContain('/og?title=Work')
    // No subtitle given: the OG route falls back to the profile title itself.
    expect(image).not.toContain('subtitle')
  })
})

describe('JSON-LD', () => {
  const site = buildSite(staticContent)

  it('never includes the email address (harvesters read JSON-LD)', () => {
    expect(JSON.stringify(personJsonLd(site))).not.toContain(staticContent.profile.email)
  })

  it('lists every published project', () => {
    expect(worksJsonLd(site).itemListElement).toHaveLength(site.allProjects.length)
  })
})
