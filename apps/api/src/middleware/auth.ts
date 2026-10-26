import type { NextFunction, Request, Response } from 'express'
import { env } from '../env.js'
import { SESSION_COOKIE, verifySessionToken } from '../lib/session.js'
import { HttpError } from '../lib/http.js'

declare module 'express-serve-static-core' {
  interface Request {
    /** Signed-in admin's email; set by requireAdmin. */
    admin?: string
  }
}

/** 401 unless the request carries a valid admin session cookie. */
export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const admin = await verifySessionToken(req.cookies?.[SESSION_COOKIE])
  if (!admin) throw new HttpError(401, 'Sign in required.')
  req.admin = admin
  next()
}

/**
 * CSRF defence in depth for cookie-authenticated writes. SameSite=Lax already
 * keeps the cookie off cross-site POSTs; this also rejects any write whose
 * Origin isn't the site itself.
 */
export function sameOrigin(req: Request, _res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD') return next()
  const origin = req.get('origin')
  if (!origin) return next() // non-browser clients (curl, tests) send none
  const allowed = [env.SITE_URL, ...(env.CORS_ORIGINS?.split(',') ?? [])].map((o) =>
    o.trim().replace(/\/$/, ''),
  )
  if (!allowed.includes(origin)) throw new HttpError(403, 'Cross-origin request refused.')
  next()
}
