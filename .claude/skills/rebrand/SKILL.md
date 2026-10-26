---
name: rebrand
description: Turn this personal portfolio into another person's or a company's website — content, branding, copy, home-page concept and SEO. Use when the user wants to re-skin, white-label or repurpose the site.
---

# Rebrand / repurpose

Most of it is content, edited in `/admin` — no code.

## Content (admin)
Profile (name, title, headline, pitch, socials, résumé → e.g. company deck, portrait → logo/photo,
music), Home headings, Projects (`kind` = work/freelance/side/personal → rename labels in
`PROJECT_KIND_LABELS` for e.g. "Client work / Products"), Experience, Hobbies → e.g. Culture, Content
(press, talks), Testimonials. Unused sections hide themselves when empty.

## Code-level brand (small)
- Colours: tokens in `apps/web/src/styles/globals.css` (`--accent`, light + dark) and `immersive.css`
  (`--accent`, `--code`, `--ink`) plus particle colours in `apps/web/src/lib/immersive/chapters.ts` (`FORM_COLORS`).
- Fonts: `apps/web/src/lib/fonts.ts` (headings) and `apps/web/src/app/layout.tsx` (Inter body).
- Logo text: `Nav.tsx`, `Masthead.tsx` use `profile.shortName`; favicon `apps/web/src/app/icon.svg`.
- SEO: `apps/web/src/lib/seo.tsx` — switch `Person` JSON-LD to `Organization` for a company; keywords.
- Section names and shapes on the home page: `PANELS` in `chapters.ts`; shapes in `stage/forms.ts`.
- New kinds of content (e.g. Services, Team): use the content-model skill.

## Checklist
Domain + `NEXT_PUBLIC_SITE_URL`/`SITE_URL` · `CONTACT_TO_EMAIL` · new `ADMIN_EMAIL` + password hash ·
OG image (`/og` uses profile name/title) · privacy page text · remove personal résumé PDF from `apps/web/public`.
