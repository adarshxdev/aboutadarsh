import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { env } from '../env.js'
import { logger } from './logger.js'

/** Named limits. Each gets its own Redis key prefix. */
const LIMITS = {
  /** Contact form: 3 messages per hour per IP. */
  contact: { max: 3, windowMs: 60 * 60 * 1000, window: '1 h' },
  /** Newsletter sign-up: 5 per hour per IP. */
  subscribe: { max: 5, windowMs: 60 * 60 * 1000, window: '1 h' },
  /** Admin sign-in: 10 attempts per 15 minutes per IP. */
  login: { max: 10, windowMs: 15 * 60 * 1000, window: '15 m' },
} as const

type LimitName = keyof typeof LIMITS

export const hasRedis = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)

const upstash = new Map<LimitName, Ratelimit>()

function upstashFor(name: LimitName) {
  let limiter = upstash.get(name)
  if (!limiter) {
    const { max, window } = LIMITS[name]
    limiter = new Ratelimit({
      redis: new Redis({ url: env.UPSTASH_REDIS_REST_URL!, token: env.UPSTASH_REDIS_REST_TOKEN! }),
      limiter: Ratelimit.slidingWindow(max, window),
      prefix: `portfolio:${name}`,
      analytics: false,
    })
    upstash.set(name, limiter)
  }
  return limiter
}

/**
 * In-memory fallback. Per-instance only, so it's weaker than Upstash on
 * serverless — but it still blocks the naive case when Redis isn't configured.
 */
const memory = new Map<string, number[]>()

function memoryLimit(name: LimitName, key: string) {
  const { max, windowMs } = LIMITS[name]
  const id = `${name}:${key}`
  const now = Date.now()
  const hits = (memory.get(id) ?? []).filter((t) => now - t < windowMs)
  if (hits.length >= max) return { success: false, remaining: 0 }
  hits.push(now)
  memory.set(id, hits)
  if (memory.size > 5000) memory.clear() // crude bound; process is ephemeral anyway
  return { success: true, remaining: max - hits.length }
}

export async function rateLimit(identifier: string, name: LimitName = 'contact') {
  if (hasRedis) {
    try {
      const { success, remaining } = await upstashFor(name).limit(identifier)
      return { success, remaining }
    } catch (error) {
      // Redis down shouldn't take the form down with it.
      logger.error({ err: error }, 'rate-limit: Redis unavailable, using in-memory limiter')
    }
  }
  return memoryLimit(name, identifier)
}
