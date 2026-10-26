import { env } from '../env.js'
import { logger } from './logger.js'

/**
 * Tells the web app its cached pages are stale, so an admin edit shows up on
 * the next page view. Best effort: a failure is logged, never thrown; the web
 * cache also expires on its own after a few minutes.
 */
export async function revalidateWeb() {
  const base = env.WEB_URL ?? env.SITE_URL
  if (!env.REVALIDATE_SECRET) return
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/revalidate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.REVALIDATE_SECRET}` },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) logger.warn({ status: res.status }, 'revalidate: web app refused')
  } catch (err) {
    logger.warn({ err }, 'revalidate: web app unreachable')
  }
}
