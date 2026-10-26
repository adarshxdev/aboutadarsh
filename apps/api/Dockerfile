# syntax=docker/dockerfile:1
# Build from the repo root:  docker build -f apps/api/Dockerfile .

FROM node:22-alpine AS deps
WORKDIR /repo
# Manifests only, so dependency layers cache until a package.json changes.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --ignore-scripts

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @portfolio/shared && npm run build -w @portfolio/api

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=4000
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --ignore-scripts -w @portfolio/api -w @portfolio/shared && npm cache clean --force
COPY --from=build /repo/packages/shared/dist packages/shared/dist
COPY --from=build /repo/apps/api/dist apps/api/dist
COPY apps/api/drizzle apps/api/drizzle
COPY apps/api/scripts/migrate.mjs apps/api/scripts/migrate.mjs

USER node
WORKDIR /repo/apps/api
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://localhost:4000/api/health || exit 1
# Apply migrations, then serve.
CMD ["sh", "-c", "node scripts/migrate.mjs && exec node dist/server.js"]
