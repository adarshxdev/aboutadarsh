import { createHash, randomUUID } from 'node:crypto'
import { Router } from 'express'
import { eq, sql } from 'drizzle-orm'
import { contactSchema, subscribeSchema, trackSchema } from '@portfolio/shared/validation'
import { db, schema } from '../db/index.js'
import { env } from '../env.js'
import { loadContent } from '../cms/repository.js'
import {
  sendContactAcknowledgement,
  sendContactNotification,
  sendSubscribeConfirmation,
  hasEmail,
} from '../lib/email.js'
import { hasRedis, rateLimit } from '../lib/rate-limit.js'
import { clientIp, hashIp, parseUtm, verifyTurnstile } from '../lib/request.js'
import { hasStorage } from '../lib/storage.js'
import { logger } from '../lib/logger.js'

export const publicRouter = Router()

/** Liveness plus which integrations are configured. Never exposes values. */
publicRouter.get('/health', async (_req, res) => {
  let database: 'ok' | 'down' | 'off' = 'off'
  if (db) {
    try {
      await db.execute(sql`select 1`)
      database = 'ok'
    } catch {
      database = 'down'
    }
  }
  res.json({ ok: database !== 'down', database, storage: hasStorage, redis: hasRedis, email: hasEmail })
})

/** Everything the site renders. Cached at the edge; the web app caches too. */
publicRouter.get('/content', async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300')
  res.json(await loadContent())
})

/** Bots submit instantly; humans don't — plan.md §10. */
const MIN_SUBMIT_MS = 3000

publicRouter.post('/contact', async (req, res) => {
  const ip = clientIp(req)
  if (!(await rateLimit(hashIp(ip), 'contact')).success) {
    res.status(429).json({ ok: false, error: 'Too many messages from this address. Please try again later.' })
    return
  }

  const parsed = contactSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form.' })
    return
  }
  const data = parsed.data

  // Honeypot and minimum time-to-submit both answer 200, so bots learn nothing.
  if (data.website) return void res.json({ ok: true })
  if (data.startedAt && Date.now() - data.startedAt < MIN_SUBMIT_MS) return void res.json({ ok: true })

  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    res.status(400).json({ ok: false, error: 'Verification failed. Please retry.' })
    return
  }

  const referrer = req.get('referer') ?? null
  if (db) {
    try {
      await db.insert(schema.contacts).values({
        name: data.name,
        email: data.email,
        company: data.company || null,
        intent: data.intent,
        message: data.message,
        budget: data.budget || null,
        timeline: data.timeline || null,
        source: data.source ?? null,
        referrer,
        ipHash: hashIp(ip), // never the raw IP — plan.md §10
        userAgent: req.get('user-agent') ?? null,
        ...parseUtm(referrer),
      })
      if (data.subscribe) {
        await db
          .insert(schema.subscribers)
          .values({ email: data.email, confirmToken: randomUUID(), unsubscribeToken: randomUUID() })
          .onConflictDoNothing()
      }
    } catch (err) {
      // A storage failure must not lose the message — the email still goes out.
      logger.error({ err }, 'contact: persist failed')
    }
  }

  try {
    await sendContactNotification(data)
  } catch (err) {
    logger.error({ err }, 'contact: notification failed')
    if (!db) {
      res.status(502).json({ ok: false, error: 'Could not send right now. Please email me directly.' })
      return
    }
  }
  try {
    await sendContactAcknowledgement(data)
  } catch (err) {
    logger.error({ err }, 'contact: acknowledgement failed')
  }
  res.json({ ok: true })
})

publicRouter.post('/subscribe', async (req, res) => {
  if (!(await rateLimit(hashIp(clientIp(req)), 'subscribe')).success) {
    res.status(429).json({ ok: false, error: 'Too many attempts.' })
    return
  }
  const parsed = subscribeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid email.' })
    return
  }
  if (parsed.data.website) return void res.json({ ok: true })

  const email = parsed.data.email.toLowerCase()
  const confirmToken = randomUUID()
  if (db) {
    const [existing] = await db
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.email, email))
      .limit(1)
    // Already confirmed: say nothing more, so the endpoint can't enumerate subscribers.
    if (existing?.confirmed) return void res.json({ ok: true })
    if (existing) {
      await db.update(schema.subscribers).set({ confirmToken }).where(eq(schema.subscribers.email, email))
    } else {
      await db.insert(schema.subscribers).values({ email, confirmToken, unsubscribeToken: randomUUID() })
    }
  }
  try {
    await sendSubscribeConfirmation(email, confirmToken)
  } catch (err) {
    logger.error({ err }, 'subscribe: confirmation failed')
  }
  res.json({ ok: true })
})

/** Double opt-in step two — plan.md §9. */
publicRouter.get('/subscribe/confirm', async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : null
  let outcome = 'invalid'
  if (token && db) {
    const result = await db
      .update(schema.subscribers)
      .set({ confirmed: true, confirmedAt: new Date(), confirmToken: null })
      .where(eq(schema.subscribers.confirmToken, token))
      .returning({ id: schema.subscribers.id })
    if (result.length) outcome = 'confirmed'
  }
  res.redirect(303, `${env.SITE_URL}/subscribed?status=${outcome}`)
})

/**
 * First-party events. No cookies, no fingerprinting: the session id is a daily
 * rotating hash of IP + UA + salt, so it can't be joined across days or to an
 * identity — plan.md §10. Always 204, so analytics never surfaces an error.
 */
publicRouter.post('/track', async (req, res) => {
  const parsed = trackSchema.safeParse(req.body)
  if (parsed.success && db) {
    const day = new Date().toISOString().slice(0, 10)
    const sessionId = createHash('sha256')
      .update(`${clientIp(req)}|${req.get('user-agent') ?? ''}|${day}|${env.IP_HASH_SALT ?? 'dev-only-salt'}`)
      .digest('hex')
      .slice(0, 32)
    try {
      await db.insert(schema.events).values({
        sessionId,
        type: parsed.data.type,
        path: parsed.data.path ?? null,
        meta: parsed.data.meta ?? null,
      })
    } catch (err) {
      logger.error({ err }, 'track: insert failed')
    }
  }
  res.status(204).end()
})
