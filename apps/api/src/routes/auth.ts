import { Router } from 'express'
import { z } from 'zod'
import { env, isProd } from '../env.js'
import { verifyPassword } from '../lib/password.js'
import {
  createSessionToken,
  isAuthConfigured,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  verifySessionToken,
} from '../lib/session.js'
import { rateLimit } from '../lib/rate-limit.js'
import { clientIp, hashIp } from '../lib/request.js'
import { sameOrigin } from '../middleware/auth.js'

export const authRouter = Router()
authRouter.use(sameOrigin)

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/',
}

const loginSchema = z.object({ email: z.string().max(320), password: z.string().max(1024) })

authRouter.post('/login', async (req, res) => {
  if (!isAuthConfigured()) {
    res.status(503).json({ ok: false, error: 'Admin is not configured. See README → Admin.' })
    return
  }
  if (!(await rateLimit(hashIp(clientIp(req)), 'login')).success) {
    res.status(429).json({ ok: false, error: 'Too many attempts. Try again in 15 minutes.' })
    return
  }
  const { email, password } = loginSchema.parse(req.body)
  const emailOk = email.trim().toLowerCase() === env.ADMIN_EMAIL!.toLowerCase()
  // Always hash, so a wrong email takes as long as a wrong password.
  const passwordOk = await verifyPassword(password, env.ADMIN_PASSWORD_HASH!)
  if (!emailOk || !passwordOk) {
    res.status(401).json({ ok: false, error: 'Email or password is incorrect.' })
    return
  }
  res.cookie(SESSION_COOKIE, await createSessionToken(env.ADMIN_EMAIL!), {
    ...cookieOptions,
    maxAge: SESSION_TTL_SECONDS * 1000,
  })
  res.json({ ok: true, email: env.ADMIN_EMAIL })
})

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, cookieOptions)
  res.json({ ok: true })
})

authRouter.get('/me', async (req, res) => {
  const email = await verifySessionToken(req.cookies?.[SESSION_COOKIE])
  res.json({ ok: true, email, configured: isAuthConfigured() })
})
