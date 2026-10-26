import 'server-only'
import * as simpleIcons from 'simple-icons'

/**
 * Logos for skills. A skill's `icon` is one of:
 * - a Simple Icons slug (CC0), e.g. "react" — a recolourable SVG path;
 * - a file under public/, e.g. "/images/tech/aws.svg" — for brands Simple
 *   Icons doesn't carry (AWS, OpenAI, Twilio, Salesforce…), shown as-is;
 * - "glyph:<name>" — a drawn icon for concepts with no brand (RAG, APIs…).
 * Resolved on the server, so only what's used reaches the page.
 */
export type TechIcon =
  | {
      kind: 'path'
      title: string
      /** SVG path in a 24×24 viewBox. */
      path: string
      hex: string
      /** The brand colour, lifted when it would vanish on a dark background (Next.js, Express…). */
      onDark: string
    }
  | { kind: 'glyph'; title: string; path: string; hex: string; onDark: string }
  | { kind: 'image'; title: string; src: string; hex: string; onDark: string }

type SimpleIcon = { title: string; path: string; hex: string }
const registry = simpleIcons as unknown as Record<string, SimpleIcon | undefined>

/** Stroke icons (24×24, 2px) for concepts. Drawn for this site. */
const GLYPHS: Record<string, { title: string; path: string; hex: string }> = {
  // A document under a magnifier: retrieval over your own data.
  rag: {
    title: 'RAG',
    path: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M14 3l5 5v1M14 3v5h5M17 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM21 22l-1.8-1.8',
    hex: '#7DF3D6',
  },
  // A voice waveform.
  voice: { title: 'Voice agents', path: 'M3 10v4M7 7v10M11 3v18M15 7v10M19 5v14M23 10v4', hex: '#FF9DBF' },
  // Braces: an interface.
  api: {
    title: 'REST APIs',
    path: 'M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1',
    hex: '#9FB8FF',
  },
}

const luminance = (hex: string) => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Mix toward white until the colour reads on near-black. */
const liftForDark = (hex: string) => {
  const l = luminance(hex)
  if (l >= 0.35) return `#${hex}`
  const t = Math.min(1, (0.55 - l) / 0.55)
  const mix = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16)
    return Math.round(c + (255 - c) * t)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${mix(0)}${mix(2)}${mix(4)}`
}

export function techIcon(icon: string | undefined, name = ''): TechIcon | null {
  if (!icon) return null
  if (icon.startsWith('/'))
    return { kind: 'image', title: name, src: icon, hex: '#efeae4', onDark: '#efeae4' }
  if (icon.startsWith('glyph:')) {
    const glyph = GLYPHS[icon.slice(6)]
    return glyph ? { kind: 'glyph', ...glyph, onDark: glyph.hex } : null
  }
  const found = registry[`si${icon.charAt(0).toUpperCase()}${icon.slice(1)}`]
  if (!found) return null
  return {
    kind: 'path',
    title: found.title,
    path: found.path,
    hex: `#${found.hex}`,
    onDark: liftForDark(found.hex),
  }
}
