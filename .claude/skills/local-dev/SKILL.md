---
name: local-dev
description: Start, reset or debug the local stack (Docker Postgres/Redis/S3 storage, Express API, Next web) for this repo. Use when asked to run the project locally, set up env files, seed data, log into /admin locally, or when something "won't start".
---

# Local development

## First run
```bash
npm install                                   # also builds packages/shared
cp apps/api/.env.example apps/api/.env        # Docker defaults are prefilled
cp apps/web/.env.example apps/web/.env.local
npm run admin:hash -- "<password>"            # paste ADMIN_PASSWORD_HASH + AUTH_SECRET into apps/api/.env; set ADMIN_EMAIL
# Set the same random REVALIDATE_SECRET in both env files.
npm run infra:up                              # db :5433, redis :6379 (+ REST :8079), storage :9000
npm run db:migrate && npm run db:seed
npm run dev                                   # api :4000, web :3000
```
Admin: http://localhost:3000/admin · API health: http://localhost:3000/api/health

## Whole production stack in Docker
`docker compose --profile app up -d --build` (api + web images on :4000/:3000). Stop the dev servers first.

## Troubleshooting
- Port 5432 busy: compose maps Postgres to **5433** on purpose.
- `/admin/login` says "Can't reach the API": API not running or `API_URL` wrong in `apps/web/.env.local`.
- Edits don't appear on the site: `REVALIDATE_SECRET` differs between the two env files (pages still refresh within 5 min).
- Upload fails with CORS: re-run `docker compose up storage-init`; bucket CORS allows `http://localhost:3000` only.
- Shared package changes not picked up by the API: `npm run dev` runs `tsc --watch` for shared; if running pieces separately, `npm run build -w @portfolio/shared`.
- Reset everything: `docker compose down -v` (deletes local data), then the first-run steps.
