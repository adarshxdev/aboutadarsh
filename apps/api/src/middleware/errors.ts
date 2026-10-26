import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { HttpError } from '../lib/http.js'
import { logger } from '../lib/logger.js'

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ ok: false, error: 'Not found.' })
}

/**
 * Last stop for every error (Express 5 forwards rejected promises here).
 * Known errors become their status; anything else is logged and becomes a
 * generic 500 so internals never leak to the client.
 */
// `_next` is unused but required: Express identifies error handlers by their four arguments.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ ok: false, error: err.message, fieldErrors: err.details })
    return
  }
  if (err instanceof ZodError) {
    res.status(400).json({ ok: false, error: err.issues[0]?.message ?? 'Invalid request.' })
    return
  }
  // body-parser marks malformed JSON and oversized bodies with a status.
  const status = (err as { status?: number }).status
  if (status && status >= 400 && status < 500) {
    res.status(status).json({ ok: false, error: 'Invalid request.' })
    return
  }
  logger.error({ err, url: req.originalUrl }, 'unhandled error')
  res.status(500).json({ ok: false, error: 'Something went wrong.' })
}
