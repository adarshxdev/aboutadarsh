import { jwtVerify, SignJWT } from 'jose'
import { env } from '../env.js'

/**
 * Admin session: a signed JWT in an httpOnly cookie. No session store, so it
 * works the same on Vercel and in Docker.
 */
export const SESSION_COOKIE = 'admin_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

const secret = () => {
  // env.ts rejects secrets under 32 characters; short ones make HS256 brute-forceable.
  return env.AUTH_SECRET ? new TextEncoder().encode(env.AUTH_SECRET) : null
}

/** Admin is usable only when every credential is configured. */
export const isAuthConfigured = () => Boolean(secret() && env.ADMIN_EMAIL && env.ADMIN_PASSWORD_HASH)

export async function createSessionToken(email: string) {
  const key = secret()
  if (!key) throw new Error('AUTH_SECRET is missing or shorter than 32 characters')
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key)
}

/** The signed-in admin's email, or null. */
export async function verifySessionToken(token: string | undefined) {
  const key = secret()
  if (!token || !key) return null
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
    // A token for a previous admin email stops working once the email changes.
    return payload.role === 'admin' && payload.sub === env.ADMIN_EMAIL ? payload.sub : null
  } catch {
    return null
  }
}
