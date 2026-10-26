/** An error with an HTTP status, turned into a JSON response by the error handler. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: Record<string, string>,
  ) {
    super(message)
  }
}

export const badRequest = (message: string, details?: Record<string, string>) =>
  new HttpError(400, message, details)
export const notFound = (message = 'Not found.') => new HttpError(404, message)
