import { describe, expect, it } from 'vitest'
import { clean, COLLECTION_KEYS, COLLECTIONS, FIELDS, rowsToRaw, type Field } from '../src/cms/index.js'
import { staticContent } from '../src/content/index.js'

describe('clean', () => {
  it('drops empty strings, empty objects and NaN; keeps null and false', () => {
    expect(
      clean({ a: '', b: '  ', c: 'x', d: { e: '' }, f: [' ', 'y'], g: Number.NaN, h: null, i: false }),
    ).toEqual({ c: 'x', f: ['y'], h: null, i: false })
  })
})

describe('admin fields', () => {
  it('exist for every collection', () => {
    for (const key of COLLECTION_KEYS) expect(FIELDS[key], key).toBeDefined()
  })

  // A form field the schema doesn't know would be silently dropped on save.
  it('only use names the schema knows', () => {
    const check = (fields: Field[], shape: Record<string, unknown>, where: string) => {
      for (const field of fields) {
        expect(Object.keys(shape), `${where}.${field.name}`).toContain(field.name)
      }
    }
    for (const key of COLLECTION_KEYS) {
      const shape = (COLLECTIONS[key].schema as unknown as { shape: Record<string, unknown> }).shape
      check(FIELDS[key], shape, key)
    }
  })
})

describe('rowsToRaw', () => {
  it('skips invalid rows and falls back for missing singletons', () => {
    const invalid: string[] = []
    const raw = rowsToRaw(
      [
        { collection: 'hobbies', data: { slug: 'ok', title: 'Ok', description: 'Fine' } },
        { collection: 'hobbies', data: { slug: 'Not A Slug' } },
        { collection: 'unknown', data: {} },
      ],
      (collection) => invalid.push(collection),
    )
    expect(raw.hobbies.map((h) => h.slug)).toEqual(['ok'])
    expect(invalid).toEqual(['hobbies'])
    expect(raw.profile).toEqual(staticContent.profile)
    expect(raw.projects).toEqual([])
  })
})
