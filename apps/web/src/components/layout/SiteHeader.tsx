import Link from 'next/link'
import { ParticleName } from '@/components/ui/ParticleName'
import { ModeToggle } from '@/components/ui/ModeToggle'

/** Home sections, so every page leads back into the one-page site. */
const sections = [
  { href: '/#about', label: 'About' },
  { href: '/#stack', label: 'Skills' },
  { href: '/#works', label: 'Projects' },
  { href: '/#contact', label: 'Contact' },
]

export type ExtraLink = { href: string; label: string }

/**
 * Header for the pages outside the home experience (résumé, case studies,
 * privacy…). Mirrors the home masthead so moving between them feels like one site.
 */
export function SiteHeader({ extra = [] }: { extra?: ExtraLink[] }) {
  return (
    <header className="site-header" data-print="hide">
      <nav aria-label="Main" className="container-page flex h-16 items-center gap-6">
        <Link href="/" aria-label="adarsh — home" className="inline-flex min-h-11 items-center">
          <ParticleName text="adarsh." className="particle-name--sm" />
        </Link>
        <ul className="ml-auto hidden items-center gap-1 sm:flex">
          {[...sections, ...extra].map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="site-header__link">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/resume" className="site-header__cta ml-auto hidden sm:ml-0 sm:inline-flex">
          Résumé
        </Link>
        <ModeToggle mode="professional" className="ml-auto sm:ml-0" />
      </nav>
    </header>
  )
}
