import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { TEST_ADMIN } from './setup.js'

/**
 * Against a real Postgres. Opt in with TEST_DATABASE_URL pointing at a
 * throwaway database — the tables are truncated. Locally:
 *   docker compose exec db createdb -U portfolio portfolio_test
 *   TEST_DATABASE_URL=postgres://portfolio:portfolio@localhost:5433/portfolio_test npm test -w @portfolio/api
 */
const url = process.env.TEST_DATABASE_URL

describe.skipIf(!url)('content with a database', () => {
  let app: import('express').Express
  let cookie: string[]
  let close: () => Promise<void>

  beforeAll(async () => {
    process.env.DATABASE_URL = url
    const { drizzle } = await import('drizzle-orm/postgres-js')
    const { migrate } = await import('drizzle-orm/postgres-js/migrator')
    const postgres = (await import('postgres')).default
    const client = postgres(url!, { max: 1, onnotice: () => {} })
    await migrate(drizzle(client), { migrationsFolder: new URL('../drizzle', import.meta.url).pathname })
    await client`truncate content_entries, media`
    close = async () => void (await client.end())

    app = (await import('../src/app.js')).default
    const res = await request(app).post('/api/auth/login').send(TEST_ADMIN)
    cookie = res.headers['set-cookie'] as unknown as string[]
  })
  afterAll(async () => close?.())

  it('imports the defaults once, then becomes the source of truth', async () => {
    const first = await request(app).post('/api/admin/import-defaults').set('Cookie', cookie).send({})
    expect(first.body).toMatchObject({ ok: true, skipped: false })
    const again = await request(app).post('/api/admin/import-defaults').set('Cookie', cookie).send({})
    expect(again.body).toMatchObject({ ok: true, skipped: true })
  })

  it('creates, updates, reorders and deletes entries, visible in public content', async () => {
    const create = (slug: string) =>
      request(app)
        .post('/api/admin/collections/hobbies')
        .set('Cookie', cookie)
        .send({ slug, title: slug, description: `About ${slug}` })
    const a = (await create('alpha')).body.id
    const b = (await create('beta')).body.id
    expect((await create('alpha')).status).toBe(400) // duplicate slug

    await request(app)
      .put(`/api/admin/collections/hobbies/${a}`)
      .set('Cookie', cookie)
      .send({ slug: 'alpha', title: 'Alpha!', description: 'Updated' })
    await request(app)
      .post(`/api/admin/collections/hobbies/${b}/move`)
      .set('Cookie', cookie)
      .send({ direction: 'up' })

    const content = (await request(app).get('/api/content')).body
    expect(content.hobbies.map((h: { slug: string }) => h.slug)).toEqual(['beta', 'alpha'])
    expect(content.hobbies[1].title).toBe('Alpha!')

    await request(app).delete(`/api/admin/collections/hobbies/${a}`).set('Cookie', cookie)
    const after = (await request(app).get('/api/content')).body
    expect(after.hobbies.map((h: { slug: string }) => h.slug)).toEqual(['beta'])
  })

  it('updates singletons in place', async () => {
    const current = (await request(app).get('/api/admin/collections/profile').set('Cookie', cookie)).body
    const res = await request(app)
      .post('/api/admin/collections/profile')
      .set('Cookie', cookie)
      .send({ ...current.data, tagline: 'Test tagline.' })
    expect(res.body.id).toBe(current.id)
    expect((await request(app).get('/api/content')).body.profile.tagline).toBe('Test tagline.')
  })
})
