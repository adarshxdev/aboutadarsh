/**
 * Prints the env lines for the admin login.
 *   npm run admin:hash -- 'your password'
 * Paste the output into apps/api/.env (and the API project's env vars on Vercel).
 * Never commit the password itself.
 */
import { randomBytes } from 'node:crypto'
import { hashPassword } from '../src/lib/password.js'

const password = process.argv[2]
if (!password || password.length < 10) {
  console.error('Usage: npm run admin:hash -- "<password, at least 10 characters>"')
  process.exit(1)
}

console.log(`ADMIN_PASSWORD_HASH=${await hashPassword(password)}`)
console.log(`AUTH_SECRET=${randomBytes(32).toString('base64url')}`)
