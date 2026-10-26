---
name: content-model
description: Add a field to existing content or add a whole new content collection (schema, defaults, admin form, API, pages, tests). Use when the user wants the site/admin to support a new kind of information (e.g. certifications, talks, services, team members).
---

# Changing the content model

Content is schema-driven: one Zod schema powers validation (API), the admin form (fields), seeding and the site.
No database migration is needed — entries are JSON validated by the schema.

## Add a field
1. `packages/shared/src/content/schema.ts`: add it to the schema. Make it `.optional()` or `.default()` so
   existing rows stay valid.
2. `packages/shared/src/cms/fields.ts`: add the form input (kinds: text, textarea, markdown, url, email,
   number, boolean, select, month, date, tags, lines, media, list, group).
3. Render it where needed (read via `getSite()`).
4. `npm test -w @portfolio/shared` — the "fields only use names the schema knows" test catches typos.

## Add a collection (e.g. `certifications`)
1. Schema + type in `schema.ts`; a `define…` helper; default data file `content/<name>.ts`.
2. Add it to `RawContent` and `staticContent` in `content/index.ts`; derive what pages need in `buildSite()`.
3. Register it in `packages/shared/src/cms/collections.ts` (label, description, title/subtitle) and, if it has
   slugs, `SLUGGED`.
4. Form fields in `cms/fields.ts`.
5. Page/section in apps/web; hide when empty (nav link + sitemap).
6. Tests: shared (buildSite), e2e smoke for the page.
The admin sidebar, dashboard counts, API routes and seeding pick the new collection up automatically.

## Existing databases
New collections start empty in an already-seeded database — add entries in /admin. "Import defaults"
only runs on an empty database.
