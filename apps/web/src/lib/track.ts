/**
 * First-party event tracking. Fire-and-forget, never blocks interaction, and
 * silently no-ops when the endpoint is unavailable.
 */
export type TrackEvent =
  'email_copy' | 'resume_download' | 'cta_click' | 'outbound_click' | 'contact_submit' | 'booking_open'

export function track(type: TrackEvent, meta: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return

  const body = JSON.stringify({ type, path: window.location.pathname, meta })

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))
      return
    }
    void fetch('/api/track', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Tracking must never break the page.
  }
}
