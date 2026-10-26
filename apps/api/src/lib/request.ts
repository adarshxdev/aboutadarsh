import { createHash } from 'node:crypto'
import type { Request } from 'express'
import { env } from '../env.js'

/**
 * Best-effort client IP. `trust proxy` is on (see app.ts), so Express already
 * resolves X-Forwarded-For from the web proxy / Vercel edge into req.ip.
 */
export const clientIp = (req: Request) => req.ip ?? '0.0.0.0'

/** Never store a raw IP — plan.md §10. */
export function hashIp(ip: string): string {
  const salt = env.IP_HASH_SALT ?? 'dev-only-salt-set-IP_HASH_SALT-in-production'
  return createHash('sha256').update(`${ip}${salt}`).digest('hex')
}

export function parseUtm(referer: string | null) {
  if (!referer) return {}
  try {
    const url = new URL(referer)
    return {
      utmSource: url.searchParams.get('utm_source') ?? undefined,
      utmMedium: url.searchParams.get('utm_medium') ?? undefined,
      utmCampaign: url.searchParams.get('utm_campaign') ?? undefined,
    }
  } catch {
    return {}
  }
}

/** Cloudflare Turnstile. Passes when unconfigured, so local dev isn't blocked. */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    })
    const data = (await res.json()) as { success: boolean }
    return data.success
  } catch {
    return false
  }
}
