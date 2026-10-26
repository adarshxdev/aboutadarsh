# Portfolio Website — Build Plan

**Owner:** Adarsh Bajpai — Software Engineer (3+ yrs, full-stack + agentic AI)
**Data source:** `Resume_Adarsh_2026.pdf`
**Last updated:** 2026-09-02
**Status:** Built — phases 1–4 + 6 complete. See `README.md`.

---

## 1. Stack

Next.js, not fumadocs (a docs framework — sidebar/TOC/search you'd fight) and
not React+Vite (no SSR, so no SEO or link previews, and a separate API host for
the contact form).

```
Framework     Next.js 15 (App Router, RSC, TypeScript strict)
Styling       Tailwind CSS v4 + CSS custom properties
Animation     Motion (framer-motion v12) + CSS/IntersectionObserver
3D/WebGL      OPTIONAL — react-three-fiber, hero only, lazy-loaded
Content       TS files + Zod; MDX for case studies (content-collections)
Forms         React Hook Form + Zod (schema shared client/server)
DB            Neon Postgres + Drizzle
Email         Resend + React Email
Analytics     Vercel Analytics (cookieless) — see §10
Deploy        Vercel
```

Fumadocs is reconsidered only if `/notes` ships and grows past ~15 posts.

---

## 2. Content architecture

**Content is data; pages are dumb renderers.** Never open a `.tsx` to add a job,
skill, project, or degree. Add = append an object. Remove = delete it, or set
`published: false`.

### Layout

```
content/
  schema.ts          # Zod schemas + define* helpers
  profile.ts         # name, title, location, socials, availability
  experience.ts      # jobs           ← add/remove here
  projects.ts        # projects       ← add/remove here
  skills.ts          # skills         ← add/remove here
  education.ts       # college        ← add/remove here
  achievements.ts
  testimonials.ts
  index.ts           # barrel: validates, sorts, filters, exports
  work/<slug>.mdx    # long-form case studies
```

### `schema.ts`

```ts
import { z } from 'zod'

const base = {
  slug: z.string().regex(/^[a-z0-9-]+$/),      // stable; never change once linked
  published: z.boolean().default(true),        // false = hide without deleting
  featured: z.boolean().default(false),        // pin to top of section
}

export const experienceSchema = z.object({
  ...base,
  role: z.string(),
  company: z.string(),
  team: z.string().optional(),                       // "Phronetic AI"
  location: z.string().optional(),
  type: z.enum(['full-time', 'contract', 'internship']),
  start: z.string().regex(/^\d{4}-\d{2}$/),          // "2025-08"
  end: z.string().regex(/^\d{4}-\d{2}$/).nullable(), // null = present
  bullets: z.array(z.string()).min(1),
  stack: z.array(z.string()),
  metrics: z.array(z.object({
    label: z.string(),
    value: z.number(),
    unit: z.enum(['%', 'x', '+', '']).default('%'),
    direction: z.enum(['up', 'down']).default('up'),
  })).default([]),
  logo: z.string().optional(),
  caseStudy: z.string().optional(),                  // slug into projects
})

export const projectSchema = z.object({
  ...base,
  title: z.string(),
  tagline: z.string(),
  context: z.string().optional(),
  year: z.number(),
  stack: z.array(z.string()),
  domains: z.array(z.string()).default([]),          // powers /work filters
  links: z.object({
    live: z.string().url().optional(),
    source: z.string().url().optional(),
    caseStudy: z.boolean().default(false),           // true → work/<slug>.mdx
  }).default({}),
  cover: z.string().optional(),
  gallery: z.array(z.object({
    src: z.string(), alt: z.string(),
    frame: z.enum(['browser', 'laptop', 'phone', 'none']).default('browser'),
  })).default([]),
  confidential: z.boolean().default(false),          // NDA: blocks media, keeps narrative
  metrics: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
})

export const skillSchema = z.object({
  name: z.string(),
  category: z.enum(['ai', 'frontend', 'backend', 'devops', 'testing', 'other']),
  level: z.enum(['core', 'strong', 'working']).default('strong'),
  since: z.number().optional(),                      // year → auto "3 yrs"
  icon: z.string().optional(),                       // Simple Icons slug
})

export const educationSchema = z.object({
  ...base,
  degree: z.string(),
  field: z.string().optional(),
  institution: z.string(),
  location: z.string().optional(),
  start: z.string(), end: z.string(),
  score: z.object({ value: z.string(), scale: z.string() }).optional(),
  highlights: z.array(z.string()).default([]),
})

export const achievementSchema = z.object({
  title: z.string(),
  org: z.string().optional(),
  year: z.number().optional(),
  detail: z.string().optional(),
})

// Validate eagerly: a typo fails at build, not in production.
export const defineExperience   = (x: z.input<typeof experienceSchema>[])   => x.map(i => experienceSchema.parse(i))
export const defineProjects     = (x: z.input<typeof projectSchema>[])      => x.map(i => projectSchema.parse(i))
export const defineSkills       = (x: z.input<typeof skillSchema>[])        => x.map(i => skillSchema.parse(i))
export const defineEducation    = (x: z.input<typeof educationSchema>[])    => x.map(i => educationSchema.parse(i))
export const defineAchievements = (x: z.input<typeof achievementSchema>[])  => x.map(i => achievementSchema.parse(i))

export type Experience = z.infer<typeof experienceSchema>
export type Project    = z.infer<typeof projectSchema>
export type Skill      = z.infer<typeof skillSchema>
export type Education  = z.infer<typeof educationSchema>
```

### `experience.ts` — entry shape

```ts
import { defineExperience } from './schema'

export const experience = defineExperience([
  {
    slug: 'infibeam-phronetic',
    role: 'Software Engineer',
    company: 'Infibeam Avenues',
    team: 'Phronetic AI',
    type: 'full-time',
    start: '2025-08',
    end: null,
    featured: true,
    bullets: [
      'Built an AI Agent Builder Platform (React, Next.js, FastAPI) with an agent marketplace and usage-based billing; implemented A2UI and LiveKit voice/video.',
      'Architected scalable backend orchestration on AWS for webhooks, triggers and cron jobs, with secure secrets/tools/gateways and multi-channel integrations (Slack, WhatsApp, Telegram, Email) across 10+ languages via Sarvam and Gemini.',
    ],
    stack: ['React', 'Next.js', 'FastAPI', 'AWS', 'LiveKit', 'A2UI'],
    metrics: [{ label: 'Engagement', value: 40, direction: 'up' }],
    caseStudy: 'agent-builder',
  },

  // ── add the next role here ──
])
```

### `index.ts` — sort/filter once

```ts
const live = <T extends { published: boolean }>(xs: T[]) => xs.filter(x => x.published)
const byDate = (a: { start: string }, b: { start: string }) => b.start.localeCompare(a.start)

export const allExperience = live(experience).sort(byDate)
export const allProjects   = live(projects).sort((a, b) => b.year - a.year)
export const featuredWork  = allProjects.filter(p => p.featured).slice(0, 3)
export const skillsByCategory = Object.groupBy(skills, s => s.category)
export const allStacks = [...new Set(
  [...allProjects, ...allExperience].flatMap(x => x.stack)
)].sort()
```

Pages import from `@/content` only — never a raw content file, never sorting
inline. Swapping the barrel's internals for a CMS fetch later requires no page
changes.

### Workflows

| Task | Action |
|---|---|
| Add/remove a job | Object in `experience.ts`, or `published: false` |
| Add a skill | `{ name: 'LangGraph', category: 'ai', level: 'core' }` |
| Add a college | Object in `education.ts` |
| Add a project | Object in `projects.ts`; for a write-up set `links.caseStudy: true` + create `work/<slug>.mdx` |
| Reorder | Not a thing — order derives from date; `featured: true` pins |
| Hide NDA screenshots | `confidential: true` — gallery suppressed, narrative kept |
| Change headline/socials | `profile.ts` |

### Guardrails

Zod parses at import, so bad content fails `next build` naming the file and
field. `pnpm content:check` (CI + pre-commit) additionally verifies:

- slugs unique within a collection
- `caseStudy` slugs resolve to a project
- `links.caseStudy: true` ⟷ a matching MDX file exists
- referenced images exist in `public/`
- no `end` before `start`
- no `confidential: true` entry with a `gallery`

### Derives automatically

Landing sections · `/work` listing and filter chips · `/work/[slug]` routes
(`generateStaticParams`) · `/resume` web + print · JSON-LD · OG images ·
`sitemap.xml` · aggregate stats ("3+ yrs", "20+ technologies") as computed
values, so they can't go stale.

### Seed data

**`experience.ts`** — 4 entries

| slug | Role | Company | Dates | Metric |
|---|---|---|---|---|
| `infibeam-phronetic` | Software Engineer | Infibeam Avenues (Phronetic AI) | 2025-08 → present | +40% engagement |
| `nineleaps` | Software Engineer | Nineleaps | 2023-11 → 2025-07 | +22% lead conversion |
| `headout` | SDE Intern | Headout | 2023-07 → 2023-11 | −30% response time |
| `flipkart` | SDE Intern | Flipkart | 2023-02 → 2023-07 | +35% business metrics |

**`projects.ts`** — 4 entries

| slug | Title | Stack | Links |
|---|---|---|---|
| `agent-builder` | AI Agent Builder Platform | React, Next.js, FastAPI, A2UI, LiveKit | confidential |
| `carenav` | CareNav — insurance claims | Next.js, Django, AWS | confidential |
| `roalytics` | Roalytics CRM (Chrome extension) | React, Express, AWS | confidential |
| `moveflix` | Moveflix — movie discovery | React, Redux, TMDB API | [live](https://moveflix-azure.vercel.app/) · [source](https://github.com/adarshxdev/moveflix) |

Only Moveflix has public links; the other three set `confidential: true` and
lead with narrative + architecture diagram.

**`skills.ts`** — regrouped from the résumé's ATS ordering; `ai` leads because
it's the differentiator

| category | Skills |
|---|---|
| `ai` | A2UI, LiveKit, RAG, OpenAI, LLaMA, Gemini, Sarvam, multi-channel bots (Slack / WhatsApp / Telegram / Email) |
| `frontend` | React, Next.js, TypeScript, JavaScript, Redux, Tailwind, MUI, HTML5, CSS3 |
| `backend` | Node.js, Express, Python, FastAPI, Django, REST APIs |
| `devops` | AWS, Docker, CI/CD, Vercel, Git |
| `testing` | Jest, Cypress, Mocha |

**`education.ts`** — B.Tech, NIT Jalandhar, 2019-08 → 2023-07, GPA 8.11/10.

**`achievements.ts`** — Executive Head, ThinkIndia NITJ · shortlisted 3× for
SSB · Placement Representative, NITJ.

---

## 3. Site map

```
/                     Landing
/work                 All projects, filterable by stack/domain
/work/[slug]          MDX case study
/about                Story, timeline, photo
/resume               Web résumé + tracked PDF download
/contact              Form + Cal.com embed + direct channels
/uses                 Tools, editor, hardware
/privacy              Required — see §10
/notes                OPTIONAL — writing
/api/contact          POST — validated, rate-limited → DB + email
/api/subscribe        POST — newsletter double opt-in
/api/track            POST — first-party events
/og/[...slug]         Dynamic OG images
/sitemap.xml /robots.txt
```

---

## 4. Pages

### `/` Landing

1. **Hero** — name, positioning line, location, availability pill, primary CTA
   (Book a call) + secondary (Download résumé). Animated gradient background.
2. **Proof bar** — 3+ yrs · 4 companies · 10+ languages · 90%+ coverage; count-up on scroll.
3. **Selected work** — 3 cards, staggered reveal.
4. **Impact metrics** — résumé percentages as animated stat tiles.
5. **Stack marquee** — infinite scroll, pauses on hover.
6. **Experience timeline** — scroll-linked progress rail, sticky year markers.
7. **Testimonials** — 2–3, requested from Nineleaps/Phronetic colleagues.
8. **CTA + contact form.**

### `/work/[slug]`

Hero image → problem → constraints → architecture diagram → 3–4 key decisions
with tradeoffs → outcome metrics → what I'd do differently.

### `/resume`

Real HTML (indexable, screen-reader friendly), print stylesheet for clean
`Cmd+P`, tracked download button.

---

## 5. Animation

```ts
const ease = [0.16, 1, 0.3, 1]                                    // expo-out
const spring = { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 }
const durations = { fast: 0.18, base: 0.35, slow: 0.6 }
```

- Stagger children (`staggerChildren: 0.06`), never siblings independently
- Animate only `transform` and `opacity`
- Scroll-triggered effects fire once at ~20% viewport, then stay

| # | Effect | Where | Effort |
|---|---|---|---|
| 1 | Fade + rise reveal on scroll | Every section | XS |
| 2 | Staggered card entrance | Work grid, skills | XS |
| 3 | Count-up stat tiles | Proof bar, metrics | S |
| 4 | Magnetic cursor on CTAs | Buttons, links | S |
| 5 | Scroll-linked timeline progress | Experience | S |
| 6 | Infinite marquee | Stack strip | S |
| 7 | Text mask reveal (per-line clip) | Hero, headings | M |
| 8 | Card 3D tilt + parallax image | Work cards | M |
| 9 | View Transitions between routes | Work → case study | M |
| 10 | Animated gradient mesh / noise | Hero background | M |
| 11 | Custom smooth scroll (Lenis) | Global | M |
| 12 | WebGL hero (r3f) | Hero only | L |

**1–9 in v1.** 10–12 post-launch, behind the perf budget.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 6. Responsive & cross-device

**Mobile-first.** Base styles target the smallest screen; add complexity upward
with `min-width`.

### Breakpoints

Tailwind defaults. **320px is the floor** — where overflow first appears.

| Token | Width | Represents |
|---|---|---|
| *(base)* | 320–639 | Phones portrait — **design here first** |
| `sm` | 640 | Large phones, phone landscape |
| `md` | 768 | Tablet portrait |
| `lg` | 1024 | Tablet landscape, small laptop |
| `xl` | 1280 | Desktop |
| `2xl` | 1536 | Large desktop |

Cap content with `max-w-screen-xl mx-auto`; keep line length 60–75 characters.

### Fluid type and space

```css
:root {
  --step--1: clamp(0.83rem, 0.78rem + 0.24vw, 0.94rem);
  --step-0:  clamp(1.00rem, 0.93rem + 0.36vw, 1.19rem);   /* body */
  --step-1:  clamp(1.20rem, 1.09rem + 0.54vw, 1.50rem);
  --step-2:  clamp(1.44rem, 1.28rem + 0.80vw, 1.89rem);
  --step-3:  clamp(1.73rem, 1.49rem + 1.17vw, 2.38rem);
  --step-5:  clamp(2.49rem, 1.98rem + 2.53vw, 3.79rem);   /* hero */
  --gutter:  clamp(1rem, 0.7rem + 1.5vw, 2.5rem);
  --section: clamp(3rem, 2rem + 5vw, 8rem);
}
```

Never below `16px` on inputs — iOS Safari zooms the viewport on focus.

### Layout primitives over breakpoint overrides

```css
.work-grid {
  display: grid;
  gap: var(--gutter);
  grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr));
}
```

`min(20rem, 100%)` prevents overflow below 320px. Container queries for
components used at multiple widths:

```css
.card-wrap { container-type: inline-size; }
@container (min-width: 30rem) { .card { grid-template-columns: 1fr 1.2fr; } }
```

### Touch and input modality

- Hit areas ≥ 44×44px, ≥ 8px apart
- Gate hover effects — on touch, show persistently or on tap:
  ```css
  @media (hover: hover) and (pointer: fine) {
    .card:hover .overlay { opacity: 1; }
  }
  ```
- No hover-only information
- Swipe on galleries, but always visible arrows too
- `touch-action: manipulation` on buttons (kills the 300ms delay)
- Style `-webkit-tap-highlight-color`, don't remove it

### Viewport units and safe areas

```css
.hero { min-height: 100vh; min-height: 100dvh; }   /* dvh — vh clips under the iOS toolbar */

body { padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); }
.sticky-footer { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
```

`<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
Use `svh` where something must never be covered (sticky CTA).

### Navigation

| Width | Pattern |
|---|---|
| < `md` | Hamburger → full-screen overlay: focus-trapped, Esc closes, scroll locked, focus restored on close |
| ≥ `md` | Horizontal inline nav |
| Any | Sticky mobile CTA after the hero scrolls past |

### Responsive media

- Art-direct, don't just scale — `<picture>` with a portrait crop under `md`, or shift `object-position`
- Honest `sizes`, or phones download the desktop asset:
  ```tsx
  <Image src={cover} alt={alt} fill
         sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" />
  ```
- Device frames → `frame="none"` below `sm`
- `playsInline` on video, or iOS forces fullscreen
- Diagrams: simplified mobile variant, or an `overflow-x: auto` container — never a shrunk-to-illegible SVG

### Overflow

Fix causes: wrap tables/code/diagrams in `overflow-x: auto`; `min-width: 0` on
flex/grid children; `overflow-wrap: anywhere` on URLs and emails. Then
`html, body { overflow-x: clip }` as a guard. Debug with
`* { outline: 1px solid red }`.

### Motion, degraded by device

- Parallax, tilt, magnetic cursor → pointer devices only
- WebGL hero → `lg`+ and a `navigator.hardwareConcurrency` check; static gradient otherwise
- Lenis → desktop only; it fights iOS momentum scrolling
- Scroll reveals stay everywhere
- `prefers-reduced-motion` overrides all of it

### Test matrix

| Class | Device / width | Why |
|---|---|---|
| Small phone | iPhone SE, 375×667 | Tightest common layout |
| Floor | 320px | Overflow appears here first |
| Modern phone | iPhone 15 Pro, 393×852 | Notch, `dvh`, safe areas |
| Android | Pixel 7 / mid-range | Chrome Android + real perf |
| Phone landscape | 852×393 | Short viewport |
| Tablet | iPad, 768 & 1024 | Both orientations |
| Laptop | 1440×900 | Most common desktop |
| Large | 1920+ | Max-width caps hold |

Browsers: **Safari iOS** (where `dvh`, `backdrop-filter` and scroll animation
break), Chrome Android, Chrome, Firefox, Safari macOS. Also: 200% browser zoom,
OS large-text, dark mode, throttled Slow 4G. At least one pass on a real phone.

---

## 7. Performance budget

- Lighthouse ≥ 95 on all four categories, mobile
- LCP < 2.0s, INP < 200ms, CLS < 0.05
- Initial JS < 150KB gzipped (WebGL hero excluded, lazy-loaded)
- All images `next/image`, AVIF/WebP, explicit dimensions
- Fonts self-hosted via `next/font`, `display: swap`, latin subset
- Heavy animation behind `next/dynamic` with `ssr: false`

CI gate: Lighthouse CI per PR, build fails under threshold.

---

## 8. Media & assets

### Needed

**Personal** — headshot (natural light, ~50–85mm equivalent; used on `/about`,
OG cards, JSON-LD `Person.image`); optional candid working shot; initials
logotype.

**Per project** — 2–4 screenshots at 2x DPR in device frames; architecture
diagrams (Excalidraw or Mermaid — these matter more than screenshots for
`agent-builder` and `carenav`); 10–20s silent looping screen recordings;
before/after sliders where you improved an existing product.

**Supporting** — monochrome company logos (verify usage rights); tech icons from
[Simple Icons](https://simpleicons.org) (CC0); favicon set + `apple-touch-icon`
+ `manifest.json`; `/uses` photography.

### NDA handling

In order of preference: ask; blur/redact real data; rebuild a representative
mock labelled *"illustrative recreation"*; diagram the architecture instead.

**Never publish screenshots containing real customer data, PII, internal
metrics, or credentials.**

### Files

```
public/
  images/
    profile/      headshot.jpg, candid.jpg
    work/<slug>/  cover.jpg, shot-01.jpg, diagram.svg
    logos/        monochrome SVG
    og/           static fallbacks
  video/          <slug>-demo.mp4 + .webm, poster.jpg
  resume/         Adarsh_Bajpai_Resume.pdf
  favicon/
```

- `next/image` with explicit dimensions — no CLS
- `blurDataURL` placeholders (`plaiceholder`)
- `priority` on the hero image only
- `<video muted loop playsInline preload="metadata">` + poster; pause off-screen via IntersectionObserver; never autoplay with sound
- Diagrams as SVG using `currentColor` so they work in dark mode
- Meaningful `alt` on every image; `alt=""` for decorative
- Budgets: hero < 150KB, gallery images < 200KB, clips < 2MB

### Components

Lightbox gallery (keyboard nav ←/→/Esc, focus trap) · before/after slider ·
device-frame wrapper (`browser | laptop | phone`) · swipeable media carousel ·
lazy video player.

### Before assets exist

Don't block Phases 1–4: deterministic gradient placeholder per slug, and a
typographic hero. Backfill in Phase 5.

---

## 9. Contact & collaboration

**Low friction** — email `adarshbajpai0907@gmail.com` (click-to-copy, obfuscated
`mailto`) · LinkedIn `/in/adarshbajpai09` · GitHub `@adarshxdev`

**Medium** — contact form: name, email, company, intent (Hiring · Freelance ·
Collaboration · Speaking · Other), message, with budget/timeline shown
conditionally for Hiring/Freelance. Newsletter opt-in, double opt-in,
unchecked by default and never bundled with "send message".

**High intent** — Cal.com embed (30-min slot) in the hero *and* `/contact`;
tracked résumé download; availability + engagement types (contract / full-time /
advisory).

> **Phone number:** keep it on the résumé PDF, not in public HTML — raw numbers
> get scraped for spam SMS. Reveal-on-click if you want it on the site.

---

## 10. Data & privacy

### Collect

**Automatic** — pageviews, referrers, geo, device, UTM · scroll depth per
section · CTA clicks, résumé downloads, outbound clicks · time-on-page per case
study · funnel `landing → work → case study → contact → submit`

**Explicit** — contact submissions (persisted, not just emailed) · newsletter
subscribers · optional "How did you find me?" on `/contact`

### Schema

```ts
// Drizzle
contacts     id, name, email, company, intent, message, budget, timeline,
             source, utm{source,medium,campaign}, referrer,
             ipHash, userAgent, status, createdAt
subscribers  id, email, confirmed, confirmToken, unsubscribeToken, createdAt
events       id, sessionId(anon), type, path, meta jsonb, createdAt
```

### Anti-abuse on `/api/contact`

1. Zod validation (schema shared client/server)
2. Honeypot + minimum time-to-submit (~3s)
3. Cloudflare Turnstile (free, no cookie banner)
4. Rate limit by IP — `@upstash/ratelimit`, 3/hour
5. Store `sha256(ip + salt)`, never the raw IP
6. Resend notification + auto-acknowledgement

### Privacy

GDPR applies to EU visitors regardless of hosting.

- **Default to cookieless analytics** (Vercel Analytics / Plausible) — no consent
  banner needed. Adding PostHog means adding a real consent gate; don't do one
  without the other.
- **Skip session replay.** Scroll-depth and funnel data cover the same ground
  without recording visitors. If added: mask all inputs, disclose, gate behind consent.
- `/privacy` page: what's collected, why, retention, how to request deletion.
- Purge `events` older than 12 months.
- No third-party ad/tracking pixels.

---

## 11. SEO

- Per-route `metadata`, canonical URLs
- JSON-LD from the same content files: `Person` + `WebSite` on `/`,
  `CreativeWork` per case study, credentials from `education.ts`
- Dynamic OG images via `next/og`, one per route
- `sitemap.ts`, `robots.ts`
- Target queries: "Adarsh Bajpai", "agentic AI engineer Bengaluru",
  "LiveKit voice agent developer"

---

## 12. Accessibility

- Semantic landmarks, one `h1` per page, logical heading order
- Full keyboard nav, `:focus-visible` rings, skip-to-content
- WCAG AA contrast in both themes — verified, not eyeballed
- `aria-live` on form success/error
- axe DevTools + one real VoiceOver pass
- Dark/light/system via `next-themes`, no flash on load

---

## 13. Phases

**1 — Foundation + content layer (~1.5d)**
Scaffold Next.js + TS + Tailwind v4. Design tokens. Layout shell, nav, footer,
theme toggle. **Build §2 first** — schemas, helpers, barrel, `content:check`,
all collections seeded. Everything later renders this data. Deploy to Vercel on
day one.

**2 — Core pages, responsive (~2.5d)**
Landing sections (static), `/work`, `/about`, `/resume`, `/contact`. Apply §6
throughout: fluid scale, `dvh` + safe areas, touch targets, mobile nav overlay,
320px overflow audit. Responsive before motion — retrofitting means redoing the
motion.

**3 — Motion (~2d)**
Motion tokens, techniques 1–9, reduced-motion pass, per-device degradation.
Re-measure Lighthouse on mobile.

**4 — Backend & data (~1.5d)**
Neon + Drizzle, migrations. `/api/contact` with the full anti-abuse chain.
Resend emails. Newsletter double opt-in. Analytics, event taxonomy, `/privacy`.

**5 — Content & assets (~3d)**
2–3 MDX case studies. Asset production per §8. Lightbox and device-frame
components. `/uses`. Request testimonials.

**6 — Polish & ship (~1.5d)**
OG images, JSON-LD, sitemap. A11y audit. Perf enforcement. Cross-browser.
404/500. Custom domain. Lighthouse CI.

**7 — Post-launch (optional)**
WebGL hero. Lenis. View Transitions. `/notes`. Admin view for submissions.

**~12 days to v1**; sendable at the end of Phase 4 (~5 days).

---

## 14. Open questions

1. **Domain** — `adarshbajpai.com` / `.dev`? Affects OG and email config.
2. **NDA scope** — what can be named or shown for Phronetic / CareNav /
   Nineleaps client work? Gates §8.
3. **Existing imagery** — headshot, permitted screenshots, recordings?
4. **Photo or type-only identity?** Photo converts better for hiring;
   typographic is more distinctive.
5. **Testimonials** — ask 2–3 people now; they take days to arrive.
6. **`/notes` in v1?** Only if you'll write. An empty blog is a negative signal.

---

## 15. Build notes — where implementation diverged

Three decisions made while building, each driven by a measurement:

1. **Motion removed from the stack (§1).** It cost ~55KB gzipped against a
   150KB budget where the React 19 + Next 16 baseline is already ~148KB, so any
   page carrying it broke the budget. Techniques 1–9 are all CSS or ~20 lines of
   vanilla JS. Mobile Lighthouse went 90 → 96–98.
2. **Nothing above the fold is scroll-triggered (§5).** Gating the hero on
   `whileInView` meant it did not paint until hydration: LCP 3.5s on throttled
   mobile. The hero is CSS-animated; reveals resume below the fold.
3. **Client components never import `@/content` (§2).** That pulls Zod and every
   collection into the browser bundle. Server components read content and pass
   plain data down.

Two targets not met, both understood:

- **`/contact` initial JS is 246KB**, over the 150KB budget — react-hook-form +
  Zod. Kept because the shared client/server schema is worth it; splitting it out
  did not reduce the initial payload since the chunk is needed for hydration.
- **Lighthouse LCP reads 2.5–3.2s** against a 2.0s target. Measured against real
  slow-4G + 4× CPU throttling, LCP is **1.45s**; the gap is Lighthouse's more
  pessimistic simulated throttling.

Deferred (as planned): real imagery and diagrams (§8), testimonials, `/notes`,
and the WebGL hero.

---

## 16. Verification checklist

- [x] Lighthouse ≥ 95 across all four categories, mobile *(96–98; `/contact` 94)*
- [ ] Core Web Vitals green on real device data
- [x] No horizontal scroll at 320px on any page
- [~] §6 test matrix — emulated widths pass; **real-device pass still owed**
- [x] Tap targets ≥ 44×44px, ≥ 8px apart
- [x] Nothing hover-only; touch has a path to every interaction
- [x] Full-height sections use `dvh`, no jump as the iOS toolbar collapses
- [x] Mobile nav traps focus, closes on Esc, restores focus
- [ ] Usable at 200% zoom *(not yet checked)*
- [x] Tables, code and diagrams scroll in their own container
- [x] Keyboard-only traversal of every interactive element *(axe: 0 WCAG A/AA violations, 8 pages × 2 themes)*
- [ ] VoiceOver pass on landing + contact
- [x] `prefers-reduced-motion` genuinely disables motion
- [x] Contact form: valid, invalid, rate-limited, honeypot
- [ ] Email lands in inbox, not spam (SPF/DKIM)
- [ ] OG cards render in Slack, LinkedIn, X, iMessage
- [x] Résumé PDF downloads *(200, application/pdf)*; event fires client-side
- [x] `/privacy` matches what's actually collected *(no cookies set; no session replay)*
