import { hashPassword } from '../src/lib/password.js'

/**
 * Known test credentials, and no external services: unit tests never touch a
 * real database, Redis, storage or email. DB-backed tests opt in per file.
 */
export const TEST_ADMIN = { email: 'admin@example.test', password: 'correct horse battery staple' }

process.env.NODE_ENV = 'test'
process.env.SITE_URL = 'http://localhost:3000'
process.env.AUTH_SECRET = 'test-secret-that-is-at-least-32-characters-long'
process.env.ADMIN_EMAIL = TEST_ADMIN.email
process.env.ADMIN_PASSWORD_HASH = await hashPassword(TEST_ADMIN.password)
for (const key of [
  'DATABASE_URL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'RESEND_API_KEY',
  'S3_BUCKET',
  'REVALIDATE_SECRET',
  'TURNSTILE_SECRET_KEY',
]) {
  delete process.env[key]
}
