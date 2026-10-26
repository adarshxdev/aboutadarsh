import 'server-only'
import { cache } from 'react'
import { buildSite, staticContent, type RawContent } from '@portfolio/shared/content'
import { apiUrl } from '@/lib/api'

/** Cache tag for everything derived from content. The API expires it after admin edits. */
export const CONTENT_TAG = 'content'

/**
 * Raw content from the API, cached across requests and expired by tag (see
 * /api/revalidate) with a time-based backstop. Falls back to the defaults in
 * @portfolio/shared when the API is unset or unreachable, so the site always
 * renders — including at build time.
 */
let warned = false

async function loadRaw(): Promise<RawContent> {
  try {
    const res = await fetch(`${apiUrl}/api/content`, {
      next: { tags: [CONTENT_TAG], revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`API answered ${res.status}`)
    // Fill any collection the API didn't send (an older API, or a cached
    // response from before a collection existed) from the defaults, so a
    // deploy that adds a collection can't take the site down.
    return { ...staticContent, ...((await res.json()) as Partial<RawContent>) }
  } catch (error) {
    if (!warned)
      console.warn('[content] API unavailable, rendering default content:', (error as Error).message)
    warned = true
    return staticContent
  }
}

/** Everything pages need, derived. Deduplicated per request. */
export const getSite = cache(async () => buildSite(await loadRaw()))
