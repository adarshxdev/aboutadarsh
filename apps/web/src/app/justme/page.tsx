import type { Metadata } from 'next'
import Link from 'next/link'
import { getSite } from '@/lib/content'
import { ParticleName } from '@/components/ui/ParticleName'

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getSite()
  return {
    title: 'Just me',
    description: `${profile.name} — ${profile.title}.`,
    alternates: { canonical: '/justme' },
  }
}

/** The intro screen as a page of its own: the name in beads, and a way in. */
export default async function JustMePage() {
  const { profile } = await getSite()
  const name = `${profile.shortName.toLowerCase()}.`
  return (
    <main className="justme">
      <h1 className="sr-only">
        {profile.name}, {profile.title}
      </h1>
      <ParticleName text={name} align="center" repel density={1.5} className="justme__name" />
      <div className="justme__rule" aria-hidden="true">
        <i />
      </div>
      <p className="justme__meta">
        <span>{profile.title}</span>
        <span>{profile.location}</span>
        {profile.availability.open && <span>{profile.availability.label}</span>}
      </p>
      <div className="justme__actions">
        <Link href="/" className="justme__btn justme__btn--solid">
          Enter the site
        </Link>
        <Link href="/resume" className="justme__btn">
          Résumé
        </Link>
      </div>
      <p className="justme__hint" aria-hidden="true">
        Move your pointer through the name.
      </p>
    </main>
  )
}
