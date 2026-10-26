import { describe, expect, it } from 'vitest'
import { buildSite, checkContent, staticContent, type RawContent } from '../src/content/index.js'

describe('default content', () => {
  it('passes the cross-entry checks', () => {
    const { errors } = checkContent(staticContent)
    expect(errors).toEqual([])
  })
})

describe('buildSite', () => {
  const site = buildSite(staticContent)

  it('hides unpublished entries', () => {
    const raw: RawContent = {
      ...staticContent,
      projects: staticContent.projects.map((p, i) => (i === 0 ? { ...p, published: false } : p)),
    }
    expect(buildSite(raw).allProjects).toHaveLength(staticContent.projects.length - 1)
  })

  it('sorts experience newest first, featured on top', () => {
    const starts = site.allExperience.filter((e) => !e.featured).map((e) => e.start)
    expect(starts).toEqual([...starts].sort().reverse())
  })

  it('lists only project kinds that have projects', () => {
    for (const kind of site.projectKinds) expect(site.allProjects.some((p) => p.kind === kind)).toBe(true)
  })

  it('never puts the whole email address in one string', () => {
    expect(site.emailParts.user).not.toContain('@')
    expect(`${site.emailParts.user}@${site.emailParts.domain}`).toBe(staticContent.profile.email)
  })

  it('finds case studies by slug', () => {
    expect(site.getCaseStudy('carenav')?.body).toContain('##')
    expect(site.getCaseStudy('missing')).toBeUndefined()
  })
})

describe('checkContent', () => {
  it('catches duplicate slugs and dangling case-study links', () => {
    const raw: RawContent = {
      ...staticContent,
      projects: [
        ...staticContent.projects,
        { ...staticContent.projects[0] },
        { ...staticContent.projects[1], slug: 'no-study', links: { caseStudy: true } },
      ],
    }
    const { errors } = checkContent(raw)
    expect(errors.some((e) => e.includes('duplicate slug'))).toBe(true)
    expect(errors.some((e) => e.includes('"no-study"'))).toBe(true)
  })

  it('reports missing local assets', () => {
    const { errors } = checkContent(staticContent, () => false)
    expect(errors.some((e) => e.includes('resumePdf'))).toBe(true)
  })
})
