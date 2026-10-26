import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { staticContent } from '@portfolio/shared/content'
import app from '../src/app.js'
import { TEST_ADMIN } from './setup.js'

const login = async (password = TEST_ADMIN.password) =>
  request(app).post('/api/auth/login').send({ email: TEST_ADMIN.email, password })

const sessionCookie = async () => {
  const res = await login()
  return res.headers['set-cookie'] as unknown as string[]
}

describe('public', () => {
  it('reports health without a database', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ok: true, database: 'off', storage: false })
  })

  it('serves default content when no database is configured', async () => {
    const res = await request(app).get('/api/content')
    expect(res.status).toBe(200)
    expect(res.body.profile.name).toBe(staticContent.profile.name)
    expect(res.headers['cache-control']).toContain('s-maxage')
  })

  it('sets security headers and hides the framework', async () => {
    const res = await request(app).get('/api/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  it('validates the contact form with the shared schema', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'A', email: 'nope', intent: 'hiring', message: 'short' })
    expect(res.status).toBe(400)
    expect(res.body.ok).toBe(false)
  })

  it('answers the honeypot with a silent success', async () => {
    const res = await request(app).post('/api/contact').send({
      name: 'Bot',
      email: 'bot@example.com',
      intent: 'hiring',
      message: 'Buy cheap things now, a very good offer for you',
      website: 'http://spam.example',
    })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('returns JSON 404s and 400s for malformed JSON', async () => {
    expect((await request(app).get('/api/nope')).status).toBe(404)
    const bad = await request(app).post('/api/contact').set('Content-Type', 'application/json').send('{oops')
    expect(bad.status).toBe(400)
    expect(bad.body.ok).toBe(false)
  })
})

describe('auth', () => {
  it('rejects a wrong password without saying which field was wrong', async () => {
    const res = await login('wrong password')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Email or password is incorrect.')
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  it('signs in with an httpOnly, SameSite=Lax cookie (email is case-insensitive)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN.email.toUpperCase(), password: TEST_ADMIN.password })
    expect(res.status).toBe(200)
    const cookie = String(res.headers['set-cookie'])
    expect(cookie).toContain('admin_session=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
  })

  it('reports the session on /me and clears it on logout', async () => {
    const cookie = await sessionCookie()
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).body.email).toBe(TEST_ADMIN.email)
    const out = await request(app).post('/api/auth/logout').set('Cookie', cookie)
    expect(String(out.headers['set-cookie'])).toMatch(/admin_session=;/)
  })

  it('rejects a tampered session', async () => {
    const res = await request(app)
      .get('/api/admin/status')
      .set('Cookie', 'admin_session=eyJhbGciOiJIUzI1NiJ9.e30.bad')
    expect(res.status).toBe(401)
  })
})

describe('admin', () => {
  it('requires a session', async () => {
    expect((await request(app).get('/api/admin/status')).status).toBe(401)
    expect((await request(app).post('/api/admin/collections/hobbies').send({})).status).toBe(401)
  })

  it('refuses cross-origin writes', async () => {
    const res = await request(app)
      .post('/api/admin/collections/hobbies')
      .set('Cookie', await sessionCookie())
      .set('Origin', 'https://evil.example')
      .send({})
    expect(res.status).toBe(403)
  })

  it('returns field errors from the collection schema', async () => {
    const res = await request(app)
      .post('/api/admin/collections/hobbies')
      .set('Cookie', await sessionCookie())
      .send({ slug: 'Not A Slug' })
    expect(res.status).toBe(400)
    expect(res.body.fieldErrors).toHaveProperty('slug')
    expect(res.body.fieldErrors).toHaveProperty('title')
  })

  it('explains that writes need a database', async () => {
    const res = await request(app)
      .post('/api/admin/collections/hobbies')
      .set('Cookie', await sessionCookie())
      .send({ slug: 'ok', title: 'Ok', description: 'Fine' })
    expect(res.status).toBe(503)
  })

  it('404s unknown collections and malformed ids', async () => {
    const cookie = await sessionCookie()
    expect((await request(app).get('/api/admin/collections/nope').set('Cookie', cookie)).status).toBe(404)
    expect(
      (await request(app).get('/api/admin/collections/hobbies/1;drop').set('Cookie', cookie)).status,
    ).toBe(404)
  })

  it('refuses uploads when storage is not configured', async () => {
    const res = await request(app)
      .post('/api/admin/media/uploads')
      .set('Cookie', await sessionCookie())
      .send({ filename: 'a.png', contentType: 'image/png', size: 10 })
    expect(res.status).toBe(503)
  })
})
