import type { TechIcon } from '@/lib/tech-icons'

/**
 * A technology's logo. Decorative: the technology's name is always rendered
 * next to it. Brand paths and glyphs take `currentColor` (so CSS can tint them
 * on hover); image logos sit on a small white tile so dark marks stay visible.
 */
export function TechLogo({
  icon,
  name,
  className,
}: {
  icon: TechIcon | null
  name: string
  className?: string
}) {
  if (!icon) {
    const letters = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2)
    return (
      <span aria-hidden="true" className={`tech-monogram ${className ?? ''}`}>
        {letters}
      </span>
    )
  }
  if (icon.kind === 'image') {
    return (
      <span aria-hidden="true" className={`tech-img ${className ?? ''}`}>
        {/* Tiny static brand files in public/; next/image would add nothing here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon.src} alt="" loading="lazy" />
      </span>
    )
  }
  if (icon.kind === 'glyph') {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={icon.path} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} fill="currentColor">
      <path d={icon.path} />
    </svg>
  )
}
