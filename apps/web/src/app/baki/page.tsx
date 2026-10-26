import type { Metadata } from 'next'
import Link from 'next/link'
import { ParticleImage } from '@/components/ui/ParticleImage'

/**
 * A personal tribute page: a Baki picture rebuilt from coloured beads.
 * The artwork is the rights holders', so the page isn't indexed or linked
 * from the site — it's for sharing directly.
 */
export const metadata: Metadata = {
  title: 'Baki',
  robots: { index: false, follow: false },
}

/** Drop the picture here (any size; portrait works best). */
const IMAGE = '/images/baki.jpg'

export default function BakiPage() {
  return (
    <main className="baki">
      <ParticleImage src={IMAGE} alt="Baki Hanma, drawn in coloured beads" className="baki__image" />
      <div className="baki__caption">
        <p className="baki__title">The Hanma blood</p>
        <p className="baki__hint">Move your pointer through him.</p>
        <Link href="/" className="baki__back">
          ← Back to the site
        </Link>
      </div>
    </main>
  )
}
