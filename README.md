# Adarsh Bajpai — Portfolio & CMS

A personal site with its own content management system: an immersive WebGL home page, résumé,
experience, work/freelance/side/personal projects, hobbies and published content, all editable from
a password-protected admin with file uploads. Built to be re-skinned into a company website by
changing content, not code.

**Stack:** Next.js 16 · React 19 · Tailwind v4 · Three.js (React Three Fiber) · GSAP · Express 5 ·
Postgres (Drizzle) · S3-compatible storage · Upstash Redis · Resend · Zod · Vitest · Playwright ·
Docker · GitHub Actions · Vercel.

## Architecture

```
                 browser
                    │  only ever talks to the site's own origin
                    ▼
 ┌──────────────── apps/web (Next.js) ────────────────┐
 │ public pages · /admin UI · /api/revalidate          │
 │ /api/*  ── rewrite ──────────────────────┐          │
 └──────────────────────────────────────────┼──────────┘
                                            ▼
 ┌──────────────── apps/api (Express) ────────────────┐
 │ /api/content · /api/auth · /api/admin · /api/contact│──► Postgres (content, media, contacts)
 │ validation, auth, rate limits, uploads, email       │──► S3 storage (presigned browser uploads)
 └─────────────────────────────────────────────────────┘──► Redis (rate limits) · Resend (email)

 packages/shared — Zod schemas, default content, admin form definitions (used by both apps)
```

- **One origin.** `/api/*` on the site is proxied to Express, so the admin session cookie is
  first-party and there's no CORS to manage.
- **Content is data.** Every entry is validated by a Zod schema in `packages/shared`; the same schema
  drives the admin form, the API validation, seeding and the pages. Adding a field needs no migration.
- **Instant updates.** Pages are cached; an admin save calls the web app's revalidation webhook, so
  the change is live on the next view (with a 5-minute backstop).
- **Degrades gracefully.** With no environment variables at all, the site still builds and runs on
  the default content in `packages/shared/src/content`.

## Quick start

Requires Node 22+ and Docker.

```bash
npm install
cp apps/api/.env.example apps/api/.env          # local Docker values are prefilled
cp apps/web/.env.example apps/web/.env.local
npm run admin:hash -- "<your password>"         # paste the two lines into apps/api/.env, set ADMIN_EMAIL
# put the same random string in REVALIDATE_SECRET in both env files
npm run infra:up                                # Postgres, Redis, S3 storage
npm run db:migrate && npm run db:seed
npm run dev                                     # api :4000 + web :3000
```

- Site: http://localhost:3000 · Admin: http://localhost:3000/admin · Health: http://localhost:3000/api/health
- Full production build in Docker instead: `docker compose --profile app up -d --build`

## Admin

Sign in at `/admin` with `ADMIN_EMAIL` and the password whose hash is in `ADMIN_PASSWORD_HASH`. The
password itself is never stored anywhere — only a scrypt hash. Sessions are signed, httpOnly,
SameSite=Lax cookies (7 days); sign-in is rate limited.

| Section | What it edits |
|---|---|
| Profile | Name, headline, pitch, summary, socials, résumé PDF, portrait (drawn as particles on the home page), music |
| Home headings | Section headings on the home page |
| Experience, Education, Skills, Achievements, Testimonials | Résumé content |
| Projects | Work, freelance, side and personal projects; cover, video, gallery, metrics |
| Case studies | Long-form write-ups (MDX) linked to a project |
| Hobbies, Content | Life outside work; videos, posts, talks, articles |
| Media | Upload images, PDFs, audio and video (drag and drop, up to 200 MB) |

Sections with no entries hide themselves on the site. Files upload straight from the browser to
storage with presigned URLs, then the API verifies type and size.

## Environment

All optional; each missing integration falls back as shown. Full annotated lists:
[`apps/api/.env.example`](apps/api/.env.example), [`apps/web/.env.example`](apps/web/.env.example).

**API** (`apps/api/.env`)

| Variable | Without it |
|---|---|
| `DATABASE_URL` | Default content, read-only admin, contact messages emailed/logged only |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `AUTH_SECRET` | Admin sign-in disabled |
| `S3_*` | Uploads disabled |
| `UPSTASH_REDIS_REST_URL`, `_TOKEN` | Per-instance in-memory rate limits |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | Contact messages logged, not emailed |
| `SITE_URL`, `WEB_URL`, `REVALIDATE_SECRET` | Admin edits appear within 5 minutes instead of instantly |
| `TURNSTILE_SECRET_KEY` | Honeypot + timing checks only |
| `IP_HASH_SALT` | Development salt (set it in production) |

**Web** (`apps/web/.env.local`): `API_URL`, `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET`, optional
`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_CAL_LINK`.

## Testing

```bash
npm test                 # Vitest: shared, API (supertest), web
npm run test:e2e         # Playwright against the running stack (desktop + mobile)
npm run lint && npm run typecheck && npm run format:check
```

API integration tests run against a real Postgres when `TEST_DATABASE_URL` is set (CI does this).
Admin end-to-end tests run when `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` are set.

CI (`.github/workflows/ci.yml`) runs every check and test, the end-to-end suite on a Docker stack,
the Docker image builds, and a non-blocking Lighthouse report.

## Deployment

Two Vercel projects from this repo — `apps/web` (Next.js) and `apps/api` (Express, zero-config). With
Vercel's GitHub integration, **every push to `main` deploys both**, and pull requests get preview
deployments. The API's build applies database migrations and seeds an empty database.

Free-tier services that fit: Supabase or Neon (Postgres), Cloudflare R2 (files), Upstash (Redis),
Resend (email). Step-by-step setup, env vars per project, verification and rollback:
[`.claude/skills/deploy/SKILL.md`](.claude/skills/deploy/SKILL.md).

## Project structure

```
apps/web/            Next.js app
  src/app/(site)/    résumé, project case studies, privacy, and hobbies/content (shown when they have entries)
  src/app/justme/    the intro as its own page: the name in beads
  src/app/casual/    the casual, off-the-clock version (Miami theme); content in /admin → Casual page, Moments
  src/app/admin/     admin UI
  src/components/    immersive/ (WebGL home), admin/, sections/, ui/
apps/api/            Express app
  src/routes/        public, auth, admin
  src/db/ drizzle/   schema and migrations
packages/shared/     schemas, default content, CMS definitions, validation
e2e/                 Playwright tests
docker/              local storage bootstrap
.claude/skills/      workflows for Claude Code: local-dev, frontend, backend, content-model,
                     database, testing, deploy, rebrand, ship
```

## Notes on the implementation

- **The email address is never contiguous in the HTML.** It's split into `user`/`domain` and
  reassembled after hydration, so address harvesters don't match it; it's also kept out of JSON-LD.
- **Privacy.** Raw IPs are never stored (salted hashes only); analytics events use a daily-rotating
  anonymous id and no cookies.
- **The home page works without its effects.** All text is server-rendered; the WebGL stage loads
  after first paint and respects reduced motion, a Motion toggle, and devices without WebGL.
- **Security defaults.** Helmet headers, HSTS, strict body limits, rate-limited contact/sign-in,
  same-origin checks on admin writes, constant-time password verification, no secrets in the repo.

Background and design decisions: [`plan.md`](plan.md) (original build) and
[`immersive-plan.md`](immersive-plan.md) (home page).
