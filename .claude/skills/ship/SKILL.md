---
name: ship
description: Pre-merge / pre-push checklist for this repo — format, lint, typecheck, tests, build, env and docs updates, then commit. Use before committing, opening a PR, or when the user says "ship it" / "ready to push".
---

# Ship checklist

```bash
npm run format && npm run lint && npm run typecheck && npm run content:check && npm test && npm run build
```
With the stack running, also `npm run test:e2e` for UI or API changes.

Before committing, confirm:
- [ ] New env vars: `env.ts` + `.env.example` + README table + Vercel projects.
- [ ] Schema changes: migration generated and committed (database skill).
- [ ] New UI: works in light/dark, keyboard, mobile width, reduced motion.
- [ ] No secrets, passwords or real `.env` files staged (`git status`; `.env*` is ignored).
- [ ] README / CLAUDE.md / skills updated if a workflow changed.

Commit with a plain message (no Co-Authored-By trailer). Pushing to `main` deploys both Vercel projects;
open a PR instead to get preview deployments and CI first.
