# syntax=docker/dockerfile:1
# Build from the repo root:  docker build -f apps/web/Dockerfile --build-arg API_URL=http://api:4000 .

FROM node:22-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --ignore-scripts

FROM deps AS build
# Rewrites to the API are resolved at build time, so the API's address is a build arg.
ARG API_URL=http://api:4000
ENV API_URL=$API_URL BUILD_STANDALONE=1 NEXT_TELEMETRY_DISABLED=1
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build -w @portfolio/shared && npm run build -w @portfolio/web

FROM node:22-alpine AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public

USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://localhost:3000/ >/dev/null || exit 1
CMD ["node", "apps/web/server.js"]
