import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto'

/**
 * Password hashing with scrypt (Node built-in, no native dependency).
 * Stored format: `scrypt:<salt>:<hash>`, base64url. No `$` characters, because
 * Next's .env loader expands `$name` as a variable.
 */
const PARAMS: ScryptOptions = { N: 16384, r: 8, p: 1 }
const KEY_LENGTH = 64

const scrypt = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCb(password, salt, KEY_LENGTH, PARAMS, (err, key) => (err ? reject(err) : resolve(key))),
  )

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await scrypt(password, salt)
  return `scrypt:${salt.toString('base64url')}:${key.toString('base64url')}`
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, saltB64, keyB64] = stored.split(':')
  if (scheme !== 'scrypt' || !saltB64 || !keyB64) return false
  const expected = Buffer.from(keyB64, 'base64url')
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64url'))
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
