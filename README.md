# Adarsh Bajpai — Portfolio

Built to [`plan.md`](plan.md). Next.js 16 (App Router, RSC), TypeScript strict,
Tailwind v4, Postgres via Drizzle.

```bash
npm install
cp .env.example .env.local     # every variable is optional
npm run dev                    # http://localhost:3000
```

**The app runs and builds with no environment variables at all.** Each
integration degrades to a sensible fallback, so nothing is blocked on
provisioning accounts — see [Environment](#environment).

## Editing content

**You never edit a `.tsx` file to change what the site says.** Every page
derives from typed data in [`content/`](content/):

| To change | Edit |
|---|---|
| A job | `content/experience.ts` |
| A project | `content/projects.ts` |
| A skill | `content/skills.ts` |
| A degree | `content/education.ts` |
| An award | `content/achievements.ts` |
| A quote | `content/testimonials.ts` |
| Name, headline, socials, availability | `content/profile.ts` |
| A case study's prose | `content/work/<slug>.mdx` |

Add an entry by appending an object; remove one by deleting it, or set
`published: false` to hide it without losing the text.

**Ordering is derived, never hand-maintained** — experience sorts by `start`,
projects by `year`, and `featured: true` pins to the top.

Everything downstream updates on its own: the timeline, `/work` and its filter
chips, `/work/[slug]` routes, `/resume` (web and print), JSON-LD, OG images,
`sitemap.xml`, and the aggregate stats ("3+ yrs", "20+ technologies"), which are
computed rather than written down.

### Adding a case study

1. Add the project to `content/projects.ts` with `links.caseStudy: true`
2. Create `content/work/<slug>.mdx` with `problem`, `constraints[]` and
   `outcome` frontmatter
3. `/work/<slug>` starts working — no routing changes

### NDA-restricted work

Set `confidential: true`. The gallery is suppressed and a "Details generalised
under NDA" badge appears; the narrative and architecture still render.
`content:check` fails the build if a confidential project ever ships a gallery.

### Guardrails

```bash
npm run content:check
```

Zod validates fields at import (so a typo fails `next build`, naming the file
and field). `content:check` adds the cross-file rules a single schema can't see:
unique slugs, `caseStudy` references that resolve, MDX files that exist for
projects claiming one, images present in `public/`, sane date ranges, and no
confidential entry with media. It runs in CI.

## Environment

| Variable | Unset behaviour |
|---|---|
| `DATABASE_URL` | Submissions are emailed and logged, not stored |
| `RESEND_API_KEY` | Submissions are logged to the server console |
| `UPSTASH_REDIS_*` | In-memory rate limiter (per-instance only) |
| `TURNSTILE_SECRET_KEY` | Honeypot + timing check only |
| `NEXT_PUBLIC_CAL_LINK` | Booking card is hidden |
| `IP_HASH_SALT` | **Set this in production** — it salts the IP hash |
| `NEXT_PUBLIC_SITE_URL` | Falls back to `localhost:3000` (affects OG/canonical) |

With a database: `npm run db:generate && npm run db:push`.

## Scripts

| | |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run content:check` | Cross-file content validation |
| `npm run db:generate` / `db:push` | Drizzle migrations |

## Notes on the implementation

**No animation library.** Every effect in plan.md §5 (1–9) is CSS or a few lines
of vanilla JS. Motion was in the original stack, but it cost ~55KB gzipped —
against a 150KB budget where the React 19 + Next 16 baseline is already ~148KB.
Removing it took mobile Lighthouse performance from 90 to 96–98.

**Nothing above the fold waits for JS.** The hero uses CSS animations, not
scroll-triggered ones. Gating it on hydration put LCP at 3.5s on throttled
mobile.

**Client components never import `@/content`.** Doing so pulls Zod and every
collection into the browser bundle. Server components read content and pass
plain data down (see `ExperienceTimeline.tsx`).

**The email address is never contiguous in the HTML.** It's split into
`user`/`domain` props and reassembled after hydration, so it doesn't match the
regex harvesters run — pre-hydration the page shows `user [at] domain`. The
phone number appears only in the PDF, never on the site.

**Reduced motion removes reveals entirely** rather than shortening them, so no
content can be left invisible waiting for a scroll trigger.

## Measured

Lighthouse mobile, production build, localhost:

| Route | Perf | A11y | BP | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` | 98 | 100 | 96* | 100 | 2.5s | 0 |
| `/work` | 96 | 100 | 96* | 100 | 2.7s | 0 |
| `/about` | 96 | 100 | 96* | 100 | 2.7s | 0 |
| `/resume` | 98 | 100 | 96* | 100 | 2.5s | 0.013 |
| `/contact` | 94 | 100 | 96* | 100 | 3.2s | 0 |

\* The only deduction is a 404 on `/_vercel/insights/script.js`, which exists
only on Vercel. Expect 100 in production.

- **0 WCAG A/AA violations** (axe-core, 8 pages × light and dark)
- **No horizontal overflow** at 320/375/390/768/1440/1920
- **Initial JS ≤ 150KB** on every route except `/contact` (246KB — react-hook-form
  + Zod, kept for the shared client/server schema)
- Real-device-equivalent LCP (slow 4G, 4× CPU): **1.45s**. Lighthouse's higher
  figure comes from its more pessimistic simulated throttling.
# aboutadarsh
# aboutadarsh
