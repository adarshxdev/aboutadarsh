import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { logger } from './lib/logger.js'
import { errorHandler, notFoundHandler } from './middleware/errors.js'
import { adminRouter } from './routes/admin.js'
import { authRouter } from './routes/auth.js'
import { publicRouter } from './routes/public.js'

/**
 * The API. Default-exported because that's what Vercel's zero-config Express
 * support deploys (src/app.ts); src/server.ts adds `listen` for Docker and dev.
 *
 * Browsers never call it directly: the web app proxies /api/* here, so cookies
 * stay first-party on the site's own domain.
 */
const app = express()

// One hop (Vercel edge or the web proxy) sits in front; trust it for req.ip.
app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(helmet())
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }))
// Content entries are small; files never pass through here (presigned uploads).
app.use(express.json({ limit: '512kb' }))
app.use(cookieParser())

app.use('/api', publicRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)

app.get('/', (_req, res) => {
  res.json({ ok: true, name: 'portfolio-api', docs: '/api/health' })
})

app.use(notFoundHandler)
app.use(errorHandler)

export default app
