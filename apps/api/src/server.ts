import app from './app.js'
import { env } from './env.js'
import { logger } from './lib/logger.js'

/** Long-running server for Docker and local dev. Vercel uses app.ts directly. */
const server = app.listen(env.PORT, () => {
  logger.info(`api listening on http://localhost:${env.PORT}`)
})

// Finish in-flight requests on shutdown (docker stop sends SIGTERM).
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    logger.info(`${signal} received, closing`)
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 10_000).unref()
  })
}
