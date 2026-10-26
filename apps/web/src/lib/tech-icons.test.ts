import { describe, expect, it } from 'vitest'
import { techIcon } from './tech-icons'

describe('techIcon', () => {
  it('returns the Simple Icons path and brand colour', () => {
    const react = techIcon('react')
    expect(react?.title).toBe('React')
    expect(react?.hex).toBe('#61DAFB')
    expect(react?.kind === 'path' && react.path.length).toBeGreaterThan(20)
  })

  it('lifts near-black brands so they show on dark backgrounds', () => {
    const next = techIcon('nextdotjs')!
    if (next.kind !== 'path') throw new Error('expected a path icon')
    expect(next.hex).toBe('#000000')
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(next.onDark.slice(i, i + 2), 16))
    expect((r + g + b) / 3).toBeGreaterThan(120)
  })

  it('keeps bright brands as they are', () => {
    expect(techIcon('react')!.onDark.toLowerCase()).toBe('#61dafb')
  })

  it('supports image files and drawn glyphs for brands Simple Icons lacks', () => {
    expect(techIcon('/images/tech/aws.svg', 'AWS')).toMatchObject({
      kind: 'image',
      src: '/images/tech/aws.svg',
    })
    expect(techIcon('glyph:rag')).toMatchObject({ kind: 'glyph', title: 'RAG' })
    expect(techIcon('glyph:nope')).toBeNull()
  })

  it('returns null for unknown or missing slugs (lettered tile instead)', () => {
    expect(techIcon(undefined)).toBeNull()
    expect(techIcon('not-a-brand')).toBeNull()
  })
})
