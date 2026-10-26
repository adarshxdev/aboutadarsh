import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export const absoluteUrl = (path = '') => `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`

/**
 * Deterministic gradient per slug, so projects without cover art look
 * intentional rather than broken — plan.md §8.
 */
export const slugGradient = (slug: string) => {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) | 0
  const h1 = Math.abs(hash) % 360
  const h2 = (h1 + 40 + (Math.abs(hash >> 8) % 60)) % 360
  return `linear-gradient(135deg, oklch(72% 0.14 ${h1}) 0%, oklch(58% 0.16 ${h2}) 100%)`
}

/** Splits an address so it is never serialized contiguously — see CopyEmail. */
export const splitEmail = (email: string) => {
  const [user, domain] = email.split('@')
  return { user, domain }
}
