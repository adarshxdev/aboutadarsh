/**
 * Normalises admin form values before Zod sees them: empty inputs become
 * "not set" instead of empty strings, so optional fields stay optional and
 * defaults apply. `null` is kept on purpose (an experience `end` of null means
 * "present").
 */
export function clean(value: unknown): unknown {
  if (value === null) return null
  if (typeof value === 'string') return value.trim() === '' ? undefined : value
  if (typeof value === 'number') return Number.isNaN(value) ? undefined : value
  if (Array.isArray(value)) return value.map(clean).filter((v) => v !== undefined)
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => [k, clean(v)] as const)
      .filter(([, v]) => v !== undefined)
    return entries.length ? Object.fromEntries(entries) : undefined
  }
  return value
}

/** Zod issue path → the dotted key the form uses to show the message. */
export const issuePath = (path: PropertyKey[]) => path.map(String).join('.')
