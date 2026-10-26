---
name: backend
description: How to add or change Express API endpoints in apps/api — routing, Zod validation, auth, errors, logging, env vars and tests. Use for any backend/API work, new integrations, or new environment variables.
---

# Backend (apps/api)

- Entry: `src/app.ts` (exported app; Vercel deploys this) and `src/server.ts` (listen; Docker/dev).
- Routers: `routes/public.ts` (`/api/*`), `routes/auth.ts` (`/api/auth/*`), `routes/admin.ts` (`/api/admin/*`, behind `requireAdmin` + `sameOrigin`).
- Express 5: async handlers can just `throw`; `middleware/errors.ts` turns `HttpError`/`ZodError` into JSON.

## New endpoint
1. Pick the router by audience. Admin writes go in `routes/admin.ts` so auth + CSRF checks apply.
2. Validate input with Zod (`schema.parse(req.body)`); put schemas used by the browser too in
   `packages/shared/src/validation.ts`.
3. Validate params before touching dependencies (`idParam`, `collectionParam`), so bad input is a 4xx even without a DB.
4. Optional dependencies: check `db` / `hasStorage` / `hasEmail` and degrade or `throw new HttpError(503, …)`.
5. Content mutations must call `changed()` (clears the memo, revalidates the web cache).
6. Log with `logger` (pino), never `console`. Never log secrets, cookies or raw IPs (`hashIp`).
7. Tests in `test/` with supertest: happy path, validation error, unauthenticated, and DB-backed in `*.db.test.ts`.

## New environment variable
Add it to `src/env.ts` (validated at startup), `apps/api/.env.example` (documented), the README env table,
and the Vercel API project. Read it via `env.X`, never `process.env.X`.

## Security defaults to keep
helmet headers · JSON body limit 512 KB (files go direct to storage) · rate limits in `lib/rate-limit.ts` ·
`trust proxy` = 1 hop · httpOnly SameSite=Lax session cookie · constant-time password check.
