# Portfolio — project guide

Personal site + CMS, built as a capstone and meant to be re-skinned into a
company site by changing content, not code.

## Architecture

```
apps/web         Next.js 16 (App Router): public site + /admin UI. No database access.
apps/api         Express 5: content API, admin auth, uploads, contact form. Owns the database.
packages/shared  Zod schemas, default content, CMS collection + form definitions. Used by both.
```

- The browser only talks to the web origin. `apps/web/next.config.ts` rewrites `/api/*` to the API, so
  the admin cookie is first-party and there is no CORS.
- Content: API `GET /api/content` → web `getSite()` (`apps/web/src/lib/content.ts`), cached with tag
  `content`. Admin writes call the web's `/api/revalidate` webhook.
- With no env vars at all, everything still runs on the defaults in `packages/shared/src/content`.

## Conventions

- Content is data. Never hard-code profile/project/etc. in components; read `getSite()`.
- Validation lives in `packages/shared` and is shared by client and server. Don't duplicate rules.
- Server components read data; client components receive plain props (never import content modules).
- API routes: validate with Zod, throw `HttpError`, let `errorHandler` respond. Admin routes are behind
  `requireAdmin` + `sameOrigin`.
- Secrets only in env files (gitignored) or Vercel. Never commit a password; store `ADMIN_PASSWORD_HASH`.
- Commit messages: no `Co-Authored-By` trailers.

## Commands

`npm run infra:up` (Docker services) · `npm run dev` (shared + api + web) · `npm test` ·
`npm run test:e2e` · `npm run lint` · `npm run typecheck` · `npm run format`

Workflows for common jobs are in `.claude/skills/` (local-dev, frontend, backend, content-model,
database, testing, deploy, rebrand, ship).
