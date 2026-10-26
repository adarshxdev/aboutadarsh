import { afterEach, describe, expect, it, vi } from 'vitest'
import { staticContent } from '@portfolio/shared/content'

vi.mock('@/lib/api', () => ({ apiUrl: 'http://api.test' }))

describe('getSite', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('fills collections missing from the API response with defaults', async () => {
    const { moments: _moments, casual: _casual, ...older } = staticContent
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(older))),
    )
    const { getSite } = await import('./content')
    const site = await getSite()
    expect(site.allMoments.length).toBe(staticContent.moments.filter((m) => m.published).length)
    expect(site.casual.tagline).toBe(staticContent.casual.tagline)
  })

  it('falls back to defaults when the API is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('down'))),
    )
    const { getSite } = await import('./content')
    expect((await getSite()).profile.name).toBe(staticContent.profile.name)
  })
})
