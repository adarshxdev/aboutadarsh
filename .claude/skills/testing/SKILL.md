---
name: testing
description: Run, write or debug tests at every layer — Vitest unit tests (shared, web), supertest API tests (with and without Postgres), Playwright end-to-end tests, lint/typecheck. Use when adding features (write tests), fixing bugs (add a regression test) or when CI fails.
---

# Testing

| Layer | Where | Run |
|---|---|---|
| Schemas, content rules, CMS helpers | `packages/shared/test` | `npm test -w @portfolio/shared` |
| API (no DB) | `apps/api/test/*.test.ts` | `npm test -w @portfolio/api` |
| API + Postgres | `apps/api/test/*.db.test.ts` | set `TEST_DATABASE_URL` (see database skill) |
| Web helpers | `apps/web/src/**/*.test.ts` | `npm test -w @portfolio/web` |
| End-to-end | `e2e/*.spec.ts` | stack running, then `npm run test:e2e` |

All unit/integration: `npm test`. Static checks: `npm run lint && npm run typecheck && npm run format:check`.

## Writing tests
- API: use supertest against the exported app; `test/setup.ts` provides test admin credentials and strips
  external services. Cover: success, validation (400 + `fieldErrors`), unauthenticated (401), cross-origin (403).
- DB tests truncate tables — only ever point `TEST_DATABASE_URL` at a throwaway database.
- E2E admin tests need `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`; they clean up what they create.
  Against a deployment: `E2E_BASE_URL=https://… npm run test:e2e`.
- Bug fix = failing test first, then the fix.

## CI (`.github/workflows/ci.yml`)
checks (format, lint, typecheck, content check, tests with Postgres, build) → e2e (Docker stack + Playwright)
and docker (image builds). Lighthouse runs in e2e and is reported, not blocking.
