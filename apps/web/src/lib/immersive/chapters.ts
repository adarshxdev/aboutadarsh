/**
 * Panels and the particle shape each one shows. Plain section names, so the
 * page reads like a résumé: who, skills, experience, work, contact.
 */
export type BaseForm =
  | 'portraitBare'
  | 'logos'
  | 'portrait'
  | 'network'
  | 'stack'
  | 'graph'
  | 'windows'
  | 'envelope'
  | 'glyph'
  | 'screen'

/** Tech logos drawn on the Skills panel are forms too: `logo:0`, `logo:1`, … */
export type FormName = BaseForm | `logo:${number}`

/**
 * A logo the particle field can draw: an SVG path (24×24 viewBox) or an image
 * file. Images are loaded in the browser (`image`) before the field is built.
 */
export type ParticleLogo = {
  name: string
  color: string
  path?: string
  src?: string
  /**
   * How to find the mark in an image: `alpha` (transparent background, e.g. the
   * AWS wordmark) or `tile` (a mark on a solid square, e.g. Agno's app icon).
   */
  mask?: 'alpha' | 'tile'
  image?: HTMLImageElement
}

export type PanelId =
  'hero' | 'about' | 'stack' | 'experience' | 'works-intro' | 'works' | 'contact' | 'finale'

export type Panel = {
  id: PanelId
  /** Section shown in the HUD rail. Null panels sit between sections. */
  chapter: string | null
  form: FormName
  /** Spoken by the live region when the panel becomes active. */
  announce: string
}

export const PANELS: Panel[] = [
  // The hero shows the person; the rest illustrate the section.
  { id: 'hero', chapter: null, form: 'portrait', announce: 'Introduction' },
  { id: 'about', chapter: 'About', form: 'network', announce: 'About' },
  { id: 'stack', chapter: 'Skills', form: 'logos', announce: 'Skills' },
  { id: 'experience', chapter: 'Experience', form: 'graph', announce: 'Experience' },
  { id: 'works-intro', chapter: 'Projects', form: 'windows', announce: 'Projects' },
  { id: 'works', chapter: 'Projects', form: 'windows', announce: 'Selected projects' },
  { id: 'contact', chapter: 'Contact', form: 'envelope', announce: 'Contact' },
  { id: 'finale', chapter: null, form: 'glyph', announce: 'End of page' },
]

export const CHAPTERS = [...new Set(PANELS.flatMap((p) => (p.chapter ? [p.chapter] : [])))]

export const panelIndex = (id: PanelId) => PANELS.findIndex((p) => p.id === id)

/** Shapes that face the camera head-on; the field doesn't turn while showing them. */
export const isFrontFacing = (form: FormName) =>
  form === 'portrait' || form === 'portraitBare' || form === 'screen' || form.startsWith('logo:')

/** Index of a logo form, or -1. */
export const logoIndex = (form: FormName) => (form.startsWith('logo:') ? Number(form.slice(5)) : -1)

/** Two tones per form, blended across the particles. */
export const FORM_COLORS: Record<BaseForm, [string, string]> = {
  portrait: ['#c9d2dc', '#efeae4'],
  portraitBare: ['#c9d2dc', '#efeae4'],
  logos: ['#efeae4', '#efeae4'],
  network: ['#7df3d6', '#6f8fff'],
  stack: ['#9fb8ff', '#7df3d6'],
  graph: ['#7df3d6', '#ff9dbf'],
  windows: ['#efeae4', '#9fb8ff'],
  envelope: ['#ff9dbf', '#ffe6a3'],
  glyph: ['#7df3d6', '#ff9dbf'],
  screen: ['#ffffff', '#ffffff'],
}

/**
 * Two tones for any form. Logos use their brand colour for both: a pale second
 * tone washes them out to white under additive blending and bloom.
 */
export function formColors(form: FormName, logos: ParticleLogo[]): [string, string] {
  const i = logoIndex(form)
  if (i >= 0) {
    const color = logos[i]?.color ?? '#efeae4'
    return [color, color]
  }
  return FORM_COLORS[form as BaseForm]
}

/**
 * Wide screens put the field beside the text (see Rig in stage/Stage.tsx); narrow
 * ones put it behind the text, where the hero's nameplate would sit under the buttons.
 */
export const WIDE_QUERY = '(min-aspect-ratio: 21/20)'
