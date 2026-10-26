---
name: frontend
description: Conventions for building or changing UI in apps/web (Next.js 16 App Router, Tailwind v4, React Three Fiber home page, admin UI). Use when adding a page or component, changing styles, or touching the immersive home.
---

# Frontend (apps/web)

Next.js 16 has breaking changes — check `node_modules/next/dist/docs/` before using an unfamiliar API
(e.g. `middleware` is now `src/proxy.ts`; `revalidateTag` takes a second argument).

## Data
- Server components: `const site = await getSite()` from `@/lib/content`. Never fetch the API ad hoc.
- Client components get plain props. Don't import `@portfolio/shared/content` into a client component
  (it pulls every default entry into the bundle). Types only: `import type`.
- Admin pages: `adminApi()` (server, forwards the cookie) or `api()` from `components/admin/client.ts` (browser).

## Site structure
The home page is the site: About, Skills, Experience, Projects and Contact are panels in `src/app/page.tsx`.
`src/app/(site)/` holds only what can't be a panel — the printable résumé, case studies (`/work/[slug]`),
privacy, the newsletter confirmation, and hobbies/content (404 until they have entries). `/justme` (outside
the group) is the intro as a standalone page. The logo everywhere is `<ParticleName>` (bead text). `/casual` is the off-the-clock version (its own Miami theme in `styles/casual.css`, content from the
`casual` singleton and `moments`); the `<ModeToggle>` in every header switches between the two. `/baki` (noindex) rebuilds
`public/images/baki.jpg` from coloured beads via `<ParticleImage>`. These pages use
the same dark palette (`.site-theme` in globals.css). Prefer a new home panel over a new page.

## Adding a page
1. `src/app/(site)/<route>/page.tsx` (gets the header/footer layout). Export `metadata` via `pageMetadata()`,
   or `generateMetadata` if it needs content.
2. If it depends on a collection that may be empty, `notFound()` when empty and gate its nav link in
   `src/app/(site)/layout.tsx` and the sitemap (`src/app/sitemap.ts`).
3. Add an e2e smoke test in `e2e/site.spec.ts`.

## Styling
- Tokens in `src/styles/globals.css` (`--bg`, `--fg`, `--accent`, …); use them via Tailwind (`bg-bg`, `text-accent`).
  Light/dark both must work. Headings get the heading font automatically.
- Fluid type: `text-[length:var(--text-step-N)]`. Touch targets ≥ 44px (`min-h-11`).
- Home page styles are separate: `src/styles/immersive.css`, dark only.

## Immersive home (`src/components/immersive/`)
- `src/app/page.tsx` server-renders all text; `Immersive.tsx` layers loader, WebGL stage, navigation.
- Particle shapes: `stage/forms.ts` (one function per shape, `PANELS` in `src/lib/immersive/chapters.ts` maps sections to shapes).
- Must keep working with motion off, `prefers-reduced-motion`, no WebGL and no JS.

## Accessibility checklist
Real headings in order, labelled inputs, visible focus, `aria-live` for async status, no information
only on hover, alt text on content images.
