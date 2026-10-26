---
name: database
description: Change the Postgres schema (Drizzle) and ship the migration safely; seed or reset data; choose and connect a hosted Postgres. Use for any change to apps/api/src/db/schema.ts or database troubleshooting.
---

# Database (Drizzle + Postgres)

Most content changes do NOT need this — see the content-model skill. Use this for new tables/columns
(e.g. analytics, contacts, media).

## Schema change
1. Edit `apps/api/src/db/schema.ts`.
2. `npm run db:generate` → review the SQL in `apps/api/drizzle/` (commit it).
3. `npm run db:migrate` locally; run the API tests with a DB:
   `TEST_DATABASE_URL=postgres://portfolio:portfolio@localhost:5433/portfolio_test npm test -w @portfolio/api`
   (create it once: `docker compose exec db createdb -U portfolio portfolio_test`).
4. Deploys apply migrations automatically: Vercel runs `vercel-build` (migrate + seed), Docker runs migrate on start.

## Safe migrations
Additive first (new nullable column / new table), backfill, then tighten. Never rename/drop in the same
deploy that stops using a column. Migrations must be re-runnable via the journal (Drizzle handles this).

## Data
- Seed defaults into an empty DB: `npm run db:seed` (no-op when content exists).
- Inspect: `docker compose exec db psql -U portfolio`.
- Reset local: `docker compose down -v && npm run infra:up && npm run db:migrate && npm run db:seed`.

## Hosted Postgres
Supabase (free) — use the **transaction pooler** URL (port 6543); `prepare: false` is already set.
Neon also works as-is. Set `DATABASE_URL` in the Vercel API project only (the web app never touches the DB).
