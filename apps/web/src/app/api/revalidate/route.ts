import { timingSafeEqual } from 'node:crypto'
import { revalidatePath, revalidateTag } from 'next/cache'
import { CONTENT_TAG } from '@/lib/content'

/**
 * Called by the API after every admin edit, so the next page view shows it.
 * Authorised by a shared secret (REVALIDATE_SECRET on both apps).
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET
  const given = req.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  const ok =
    Boolean(secret) &&
    given.length === secret!.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(secret!))
  if (!ok) return Response.json({ ok: false }, { status: 401 })

  // Expire now rather than serve stale: the admin expects to see the edit.
  revalidateTag(CONTENT_TAG, { expire: 0 })
  revalidatePath('/', 'layout')
  return Response.json({ ok: true })
}
