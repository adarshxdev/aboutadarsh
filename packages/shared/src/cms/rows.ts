import { staticContent, type RawContent } from '../content/index.js'
import { COLLECTION_KEYS, getCollection, isCollection, type CollectionKey } from './collections.js'

/**
 * Database rows → RawContent. Each row is re-validated, so one bad row is
 * skipped (and reported) rather than taking the whole site down. Singletons
 * with no valid row fall back to the default content.
 */
export function rowsToRaw(
  rows: { collection: string; data: unknown }[],
  onInvalid: (collection: string, message: string) => void = () => {},
): RawContent {
  const raw = Object.fromEntries(
    COLLECTION_KEYS.map((key) => [key, getCollection(key).singleton ? undefined : []]),
  ) as Record<CollectionKey, unknown>

  for (const row of rows) {
    if (!isCollection(row.collection)) continue
    const key = row.collection
    const def = getCollection(key)
    const parsed = def.schema.safeParse(row.data)
    if (!parsed.success) {
      onInvalid(key, parsed.error.issues[0]?.message ?? 'invalid')
      continue
    }
    if (def.singleton) raw[key] ??= parsed.data
    else (raw[key] as unknown[]).push(parsed.data)
  }

  for (const key of COLLECTION_KEYS) {
    if (getCollection(key).singleton && raw[key] === undefined) raw[key] = staticContent[key]
  }
  return raw as RawContent
}
