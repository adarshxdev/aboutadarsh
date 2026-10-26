import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/** The Express API's base URL (server-side). Browsers use /api/* via the proxy instead. */
export const apiUrl = (process.env.API_URL ?? 'http://localhost:4000').replace(/\/$/, '')

/**
 * Server-side call to the API on behalf of the signed-in admin: forwards the
 * session cookie, never caches. Throws on non-2xx so pages fail loudly.
 */
export async function adminApi<T>(path: string): Promise<T> {
  const store = await cookies()
  const res = await fetch(`${apiUrl}/api${path}`, {
    headers: { cookie: store.toString() },
    cache: 'no-store',
  })
  if (res.status === 401) redirect('/admin/login')
  if (!res.ok) throw new Error(`API ${path} answered ${res.status}`)
  return (await res.json()) as T
}

/** The signed-in admin's email, or null. */
export async function getAdmin() {
  const store = await cookies()
  try {
    const res = await fetch(`${apiUrl}/api/auth/me`, {
      headers: { cookie: store.toString() },
      cache: 'no-store',
    })
    const data = (await res.json()) as { email: string | null; configured: boolean }
    return data
  } catch {
    return { email: null, configured: false, unreachable: true as const }
  }
}

/** Guard for admin pages. The API enforces auth on every call regardless. */
export async function requireAdmin() {
  const { email } = await getAdmin()
  if (!email) redirect('/admin/login')
  return email
}
