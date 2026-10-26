import { Router } from 'express'
import { and, asc, count, desc, eq, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import { staticContent } from '@portfolio/shared/content'
import {
  clean,
  getCollection,
  isCollection,
  issuePath,
  SLUGGED,
  type CollectionKey,
} from '@portfolio/shared/cms'
import { db, schema } from '../db/index.js'
import { invalidateContent } from '../cms/repository.js'
import { seedContent } from '../cms/seed.js'
import { hasEmail } from '../lib/email.js'
import { badRequest, HttpError, notFound } from '../lib/http.js'
import { hasRedis } from '../lib/rate-limit.js'
import { revalidateWeb } from '../lib/revalidate.js'
import {
  deleteObject,
  hasStorage,
  headObject,
  MAX_UPLOAD_BYTES,
  mediaKind,
  newKey,
  presignUpload,
  publicUrl,
} from '../lib/storage.js'
import { requireAdmin, sameOrigin } from '../middleware/auth.js'

export const adminRouter = Router()
adminRouter.use(requireAdmin, sameOrigin)

const database = () => {
  if (!db) throw new HttpError(503, 'No database configured. Set DATABASE_URL to edit content.')
  return db
}

const collectionParam = (value: string | undefined): CollectionKey => {
  if (!value || !isCollection(value)) throw notFound('Unknown collection.')
  return value
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const idParam = (value: string | undefined) => {
  if (!value || !UUID.test(value)) throw notFound()
  return value
}

/** After any content change: drop the API's memo and tell the web app. */
async function changed() {
  invalidateContent()
  await revalidateWeb()
}

/* ---------- status ---------- */

adminRouter.get('/status', async (req, res) => {
  let counts: Record<string, number> | null = null
  let database: 'ok' | 'down' | 'off' = 'off'
  if (db) {
    try {
      const rows = await db
        .select({ collection: schema.contentEntries.collection, total: count() })
        .from(schema.contentEntries)
        .groupBy(schema.contentEntries.collection)
      counts = Object.fromEntries(rows.map((r) => [r.collection, r.total]))
      database = 'ok'
    } catch {
      database = 'down'
    }
  }
  res.json({
    ok: true,
    admin: req.admin,
    database,
    storage: hasStorage,
    redis: hasRedis,
    email: hasEmail,
    counts,
  })
})

/* ---------- content ---------- */

adminRouter.get('/collections/:collection', async (req, res) => {
  const collection = collectionParam(req.params.collection)
  const rows = db
    ? await db
        .select()
        .from(schema.contentEntries)
        .where(eq(schema.contentEntries.collection, collection))
        .orderBy(asc(schema.contentEntries.position), asc(schema.contentEntries.createdAt))
    : []
  // Singletons fall back to the default content until first saved.
  if (getCollection(collection).singleton) {
    res.json({
      ok: true,
      editable: Boolean(db),
      id: rows[0]?.id ?? null,
      data: rows[0]?.data ?? staticContent[collection],
    })
    return
  }
  res.json({
    ok: true,
    editable: Boolean(db),
    entries: rows.map((r) => ({ id: r.id, data: r.data, updatedAt: r.updatedAt })),
  })
})

adminRouter.get('/collections/:collection/:id', async (req, res) => {
  // Validate input before checking dependencies, so bad requests are 4xx even without a database.
  const collection = collectionParam(req.params.collection)
  const id = idParam(req.params.id)
  const [row] = await database()
    .select()
    .from(schema.contentEntries)
    .where(and(eq(schema.contentEntries.id, id), eq(schema.contentEntries.collection, collection)))
  if (!row) throw notFound()
  res.json({ ok: true, id: row.id, data: row.data })
})

/** Validate with the collection's schema; field messages come back keyed by path. */
async function validate(collection: CollectionKey, values: unknown, id: string | null) {
  const parsed = getCollection(collection).schema.safeParse(clean(values) ?? {})
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) fieldErrors[issuePath(issue.path)] ??= issue.message
    throw badRequest('Some fields need attention.', fieldErrors)
  }
  const data = parsed.data as Record<string, unknown>
  if (SLUGGED.includes(collection) && typeof data.slug === 'string') {
    const clash = await database()
      .select({ id: schema.contentEntries.id })
      .from(schema.contentEntries)
      .where(
        and(
          eq(schema.contentEntries.collection, collection),
          sql`${schema.contentEntries.data}->>'slug' = ${data.slug}`,
          id ? ne(schema.contentEntries.id, id) : undefined,
        ),
      )
      .limit(1)
    if (clash.length) throw badRequest('Slug already used.', { slug: 'Another entry uses this slug.' })
  }
  return data
}

adminRouter.post('/collections/:collection', async (req, res) => {
  const collection = collectionParam(req.params.collection)
  const data = await validate(collection, req.body, null)
  const d = database()
  const [last] = await d
    .select({ id: schema.contentEntries.id, position: schema.contentEntries.position })
    .from(schema.contentEntries)
    .where(eq(schema.contentEntries.collection, collection))
    .orderBy(desc(schema.contentEntries.position))
    .limit(1)

  let id: string
  if (getCollection(collection).singleton && last) {
    // Singletons are updated in place.
    await d
      .update(schema.contentEntries)
      .set({ data, updatedAt: new Date() })
      .where(eq(schema.contentEntries.id, last.id))
    id = last.id
  } else {
    const [row] = await d
      .insert(schema.contentEntries)
      .values({ collection, data, position: (last?.position ?? -1) + 1 })
      .returning({ id: schema.contentEntries.id })
    id = row.id
  }
  await changed()
  res.status(201).json({ ok: true, id })
})

adminRouter.put('/collections/:collection/:id', async (req, res) => {
  const collection = collectionParam(req.params.collection)
  const id = idParam(req.params.id)
  const data = await validate(collection, req.body, id)
  const updated = await database()
    .update(schema.contentEntries)
    .set({ data, updatedAt: new Date() })
    .where(and(eq(schema.contentEntries.id, id), eq(schema.contentEntries.collection, collection)))
    .returning({ id: schema.contentEntries.id })
  if (!updated.length) throw notFound('That entry no longer exists.')
  await changed()
  res.json({ ok: true, id })
})

adminRouter.delete('/collections/:collection/:id', async (req, res) => {
  const collection = collectionParam(req.params.collection)
  const id = idParam(req.params.id)
  await database()
    .delete(schema.contentEntries)
    .where(and(eq(schema.contentEntries.id, id), eq(schema.contentEntries.collection, collection)))
  await changed()
  res.json({ ok: true })
})

/** Swap an entry with its neighbour, then rewrite positions densely (collections are small). */
adminRouter.post('/collections/:collection/:id/move', async (req, res) => {
  const collection = collectionParam(req.params.collection)
  const id = idParam(req.params.id)
  const { direction } = z.object({ direction: z.enum(['up', 'down']) }).parse(req.body)
  const d = database()
  const rows = await d
    .select({ id: schema.contentEntries.id })
    .from(schema.contentEntries)
    .where(eq(schema.contentEntries.collection, collection))
    .orderBy(asc(schema.contentEntries.position), asc(schema.contentEntries.createdAt))
  const from = rows.findIndex((r) => r.id === id)
  const to = direction === 'up' ? from - 1 : from + 1
  if (from >= 0 && to >= 0 && to < rows.length) {
    ;[rows[from], rows[to]] = [rows[to], rows[from]]
    await d.transaction(async (tx) => {
      for (const [position, row] of rows.entries()) {
        await tx.update(schema.contentEntries).set({ position }).where(eq(schema.contentEntries.id, row.id))
      }
    })
    await changed()
  }
  res.json({ ok: true })
})

/** Copies the default content into an empty database. */
adminRouter.post('/import-defaults', async (_req, res) => {
  const result = await seedContent(database(), staticContent)
  await changed()
  res.json({ ok: true, ...result })
})

/* ---------- media ---------- */

const toItem = (row: typeof schema.media.$inferSelect) => ({
  id: row.id,
  url: publicUrl(row.key),
  filename: row.filename,
  contentType: row.contentType,
  size: row.size,
  kind: row.kind,
  alt: row.alt,
  createdAt: row.createdAt.toISOString(),
})

adminRouter.get('/media', async (req, res) => {
  const kind = typeof req.query.kind === 'string' ? req.query.kind : undefined
  const rows = db
    ? await db
        .select()
        .from(schema.media)
        .where(kind ? eq(schema.media.kind, kind) : undefined)
        .orderBy(desc(schema.media.createdAt))
    : []
  res.json({ ok: true, items: rows.map(toItem) })
})

const uploadSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().max(100),
  size: z.number().int().nonnegative(),
})

/** Step 1: validate, then hand back a presigned URL the browser PUTs the file to. */
adminRouter.post('/media/uploads', async (req, res) => {
  if (!hasStorage) throw new HttpError(503, 'File storage is not configured.')
  database()
  const file = uploadSchema.parse(req.body)
  if (!mediaKind(file.contentType))
    throw badRequest(`${file.contentType || 'This file type'} is not allowed.`)
  if (file.size > MAX_UPLOAD_BYTES)
    throw badRequest(`Larger than ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`)
  const key = newKey(file.filename)
  res.json({ ok: true, key, url: await presignUpload(key, file.contentType) })
})

/** Step 2: confirm the object landed and is within limits (presigned PUTs can't cap size), then record it. */
adminRouter.post('/media', async (req, res) => {
  const { key, filename } = z
    .object({ key: z.string().startsWith('media/').max(300), filename: z.string().max(200) })
    .parse(req.body)
  const d = database()
  const head = await headObject(key)
  const kind = head && mediaKind(head.contentType)
  if (!head || !kind || head.size > MAX_UPLOAD_BYTES) {
    if (head) await deleteObject(key)
    throw badRequest('Upload failed verification.')
  }
  const [row] = await d
    .insert(schema.media)
    .values({ key, filename, contentType: head.contentType, size: head.size, kind })
    .returning()
  res.status(201).json({ ok: true, item: toItem(row) })
})

adminRouter.patch('/media/:id', async (req, res) => {
  const id = idParam(req.params.id)
  const { alt } = z.object({ alt: z.string().max(300) }).parse(req.body)
  await database()
    .update(schema.media)
    .set({ alt: alt || null })
    .where(eq(schema.media.id, id))
  res.json({ ok: true })
})

adminRouter.delete('/media/:id', async (req, res) => {
  const id = idParam(req.params.id)
  const d = database()
  const [row] = await d.select().from(schema.media).where(eq(schema.media.id, id))
  if (row) {
    await deleteObject(row.key)
    await d.delete(schema.media).where(eq(schema.media.id, row.id))
  }
  res.json({ ok: true })
})
