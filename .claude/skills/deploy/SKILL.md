---
name: deploy
description: Deploy this monorepo to Vercel (two projects: web and api) with Supabase/Neon Postgres, S3-compatible storage (R2/S3/Supabase), Upstash Redis and Resend; configure env vars, domains, and verify or roll back a release. Use for first-time deployment, adding env vars, or production issues.
---

# Deploy (Vercel, push-to-main)

Two Vercel projects from the same GitHub repo. With the Git integration, every push to `main` deploys
production and every PR gets a preview — no tokens or workflow needed.

## 1. Provision services (free tiers)
- **Postgres:** Supabase → Project → Connect → *Transaction pooler* URL (port 6543). (Or Neon.)
- **Storage:** Cloudflare R2 bucket (or AWS S3 / Supabase Storage S3). Enable public access (r2.dev or custom
  domain) and add CORS: origin = your site URL, methods PUT/GET/HEAD, headers `*`.
- **Redis:** Upstash Redis → REST URL + token.
- **Email:** Resend → API key, verify your sending domain.

## 2. API project
New Project → import repo → **Root Directory `apps/api`** → framework *Express*. Env vars (Production + Preview):
`SITE_URL`, `REVALIDATE_SECRET`, `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `AUTH_SECRET`,
`S3_*` (`S3_FORCE_PATH_STYLE=false` for R2/AWS), `UPSTASH_REDIS_REST_*`, `RESEND_API_KEY`,
`CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `IP_HASH_SALT`, optional `TURNSTILE_SECRET_KEY`.
`vercel-build` runs migrations and seeds an empty database on each deploy.

## 3. Web project
New Project → same repo → **Root Directory `apps/web`** → Next.js. Env vars:
`API_URL` (the API deployment URL, e.g. https://portfolio-api.vercel.app), `NEXT_PUBLIC_SITE_URL`,
`REVALIDATE_SECRET` (same as API). Optional: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_CAL_LINK`.
Then set the API's `SITE_URL`/`WEB_URL` to the web URL and redeploy the API.

Both projects: keep "Include files outside the root directory" on (needed for `packages/shared`).

## 4. Verify
`https://<site>/api/health` → database ok, storage/redis/email true · sign in at `/admin` · edit something and
see it on the site · upload an image · send the contact form ·
`E2E_BASE_URL=https://<site> npm run test:e2e`.

## Rollback
Vercel → Deployments → previous → *Instant Rollback* (per project). Database migrations are additive
(see database skill), so rolling the app back is safe.

## Docker instead of Vercel
`docker compose --profile app up -d --build` locally, or build `apps/api/Dockerfile` and `apps/web/Dockerfile`
(context = repo root; web needs build arg `API_URL`) for any container host.
