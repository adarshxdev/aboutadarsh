import { z } from 'zod'

/**
 * Every environment variable the API reads, validated once at startup.
 * All optional: each missing integration degrades to a fallback (see README).
 * A malformed value fails fast with a readable message instead of a 500 later.
 */
const optional = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? v.trim() : undefined))

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  /** Public site URL, for links in emails and redirects. */
  SITE_URL: z.url().default('http://localhost:3000'),
  /** Where the web app's revalidation endpoint lives (often the same as SITE_URL). */
  WEB_URL: optional,
  /** Shared with the web app; authorises cache revalidation calls. */
  REVALIDATE_SECRET: optional,
  /** Extra origins allowed to call the API from a browser, comma-separated. */
  CORS_ORIGINS: optional,

  DATABASE_URL: optional,

  ADMIN_EMAIL: optional,
  ADMIN_PASSWORD_HASH: optional,
  AUTH_SECRET: optional.refine((v) => !v || v.length >= 32, 'AUTH_SECRET must be at least 32 characters'),

  S3_BUCKET: optional,
  S3_REGION: z.string().default('auto'),
  S3_ENDPOINT: optional,
  S3_PRESIGN_ENDPOINT: optional,
  S3_ACCESS_KEY_ID: optional,
  S3_SECRET_ACCESS_KEY: optional,
  S3_PUBLIC_URL: optional,
  S3_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  UPLOAD_MAX_MB: z.coerce.number().positive().default(200),

  UPSTASH_REDIS_REST_URL: optional,
  UPSTASH_REDIS_REST_TOKEN: optional,

  RESEND_API_KEY: optional,
  CONTACT_TO_EMAIL: optional,
  CONTACT_FROM_EMAIL: optional,

  TURNSTILE_SECRET_KEY: optional,
  IP_HASH_SALT: optional,
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(`Invalid environment:\n${lines}`)
}

export const env = parsed.data
export const isProd = env.NODE_ENV === 'production'
