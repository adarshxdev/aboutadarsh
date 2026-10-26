'use client'

/** A file in the media library, as the API returns it. */
export type MediaItem = {
  id: string
  url: string
  filename: string
  contentType: string
  size: number
  kind: string
  alt: string | null
  createdAt: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message)
  }
}

/**
 * Browser → API, through this site's /api/* proxy, so the session cookie goes
 * along automatically. Throws ApiError with per-field messages on failure.
 */
export async function api<T = { ok: true }>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
    headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    credentials: 'same-origin',
  })
  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    fieldErrors?: Record<string, string>
  }
  if (res.status === 401 && !path.startsWith('/auth/')) {
    // Session expired mid-edit: a full load clears any client state on the way to sign-in.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`
  }
  if (!res.ok)
    throw new ApiError(data.error ?? `Request failed (${res.status}).`, res.status, data.fieldErrors)
  return data as T
}
