import { pino } from 'pino'
import { env, isProd } from '../env.js'

/** Structured JSON logs in production; readable lines in development. */
export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
  ...(isProd ? {} : { transport: { target: 'pino-pretty', options: { singleLine: true } } }),
})
