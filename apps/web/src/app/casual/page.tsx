import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import type { Moment } from '@portfolio/shared/content'
import { getSite } from '@/lib/content'
import { techIcon } from '@/lib/tech-icons'
import { TechLogo } from '@/components/ui/TechLogo'
import { ModeToggle } from '@/components/ui/ModeToggle'
import { neon, script } from './fonts'
import { Palm } from './Palm'
import '@/styles/casual.css'

export const viewport: Viewport = { themeColor: '#1a0633' }

export async function generateMetadata(): Promise<Metadata> {
  const { casual, profile } = await getSite()
  return {
    title: 'Casual',
    description: `${profile.name}, off the clock. ${casual.intro}`.slice(0, 160),
    alternates: { canonical: '/casual' },
  }
}

/** Tile shown until a moment has a real image. */
function Placeholder({ label }: { label: string }) {
  return (
    <div className="cz-ph" aria-hidden="true">
      <span>{label}</span>
    </div>
  )
}

function Media({ moment, label }: { moment: Moment; label: string }) {
  if (moment.video) {
    return (
      <video className="cz-media" src={moment.video} muted loop playsInline autoPlay preload="metadata" />
    )
  }
  if (moment.image) {
    // Uploaded media can live on any storage host, so a plain <img>.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="cz-media" src={moment.image} alt="" loading="lazy" />
  }
  return <Placeholder label={label} />
}

export default async function CasualPage() {
  const { casual, profile, momentsOf, allPosts } = await getSite()
  const adventures = [...momentsOf('adventure'), ...momentsOf('travel')]
  const fitness = momentsOf('fitness')
  const memes = momentsOf('meme')
  const hobbies = [...momentsOf('hobby'), ...momentsOf('food')]

  return (
    <div className={`casual ${neon.variable} ${script.variable}`}>
      <header className="cz-header">
        <Link href="/casual" className="cz-logo" aria-label={`${profile.shortName} — casual`}>
          {profile.shortName.toLowerCase()}
          <span>.</span>
        </Link>
        <nav aria-label="Sections" className="cz-nav">
          <a href="#socials">Socials</a>
          <a href="#adventures">Adventures</a>
          <a href="#fitness">Fitness</a>
          <a href="#memes">Memes</a>
        </nav>
        <ModeToggle mode="casual" />
      </header>

      <main>
        {/* Hero: sunset, palms, neon grid. */}
        <section className="cz-hero" aria-labelledby="cz-title">
          <div className="cz-sky" aria-hidden="true">
            <div className="cz-sun" />
            {/* Floor first, palms after: they stand on it. */}
            <div className="cz-grid">
              <div className="cz-road" />
            </div>
            <Palm className="cz-palm cz-palm--l" />
            <Palm className="cz-palm cz-palm--r" />
          </div>
          <div className="cz-hero__copy">
            <p className="cz-kicker">{profile.name}, after hours</p>
            <h1 id="cz-title" className="cz-title">
              {casual.tagline}
            </h1>
            <p className="cz-intro">{casual.intro}</p>
            {casual.facts.length > 0 && (
              <ul className="cz-stickers" aria-label="Quick facts">
                {casual.facts.map((fact, i) => (
                  <li key={fact} style={{ '--r': `${((i * 37) % 11) - 5}deg` } as React.CSSProperties}>
                    {fact}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {casual.accounts.length > 0 && (
          <section id="socials" className="cz-section" aria-labelledby="cz-socials">
            <h2 id="cz-socials" className="cz-h2">
              Find me <em>everywhere</em>
            </h2>
            <ul className="cz-accounts">
              {casual.accounts.map((a) => {
                const icon = techIcon(a.icon, a.platform)
                return (
                  <li key={a.href + a.platform}>
                    <a href={a.href} target="_blank" rel="noopener noreferrer" className="cz-account">
                      <TechLogo icon={icon} name={a.platform} className="cz-account__icon" />
                      <span className="cz-account__platform">{a.platform}</span>
                      <span className="cz-account__handle">{a.handle}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {adventures.length > 0 && (
          <section id="adventures" className="cz-section" aria-labelledby="cz-adv">
            <h2 id="cz-adv" className="cz-h2">
              Adventures <em>& escapes</em>
            </h2>
            <ul className="cz-polaroids">
              {adventures.map((m, i) => (
                <li
                  key={m.slug}
                  className="cz-polaroid"
                  style={{ '--r': `${(i % 2 ? 1 : -1) * (2 + (i % 3))}deg` } as React.CSSProperties}
                >
                  <Media moment={m} label="Photo soon" />
                  <p className="cz-polaroid__title">{m.title}</p>
                  {(m.location || m.date) && (
                    <p className="cz-polaroid__meta">
                      {[m.location, m.date?.slice(0, 4)].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {m.caption && <p className="cz-polaroid__caption">{m.caption}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {fitness.length > 0 && (
          <section id="fitness" className="cz-section" aria-labelledby="cz-fit">
            <h2 id="cz-fit" className="cz-h2">
              Iron <em>& miles</em>
            </h2>
            <ul className="cz-stats">
              {fitness.map((m) => (
                <li key={m.slug} className="cz-stat">
                  {m.stat && <p className="cz-stat__value">{m.stat}</p>}
                  <p className="cz-stat__label">{m.title}</p>
                  {m.caption && <p className="cz-stat__caption">{m.caption}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {memes.length > 0 && (
          <section id="memes" className="cz-section" aria-labelledby="cz-memes">
            <h2 id="cz-memes" className="cz-h2">
              Meme <em>wall</em>
            </h2>
            <ul className="cz-memes">
              {memes.map((m) => (
                <li key={m.slug} className="cz-meme">
                  {m.image || m.video ? (
                    <Media moment={m} label="" />
                  ) : (
                    <div className="cz-meme__blank" aria-hidden="true">
                      <span className="cz-meme__top">{m.title}</span>
                      <span className="cz-meme__bottom">meme coming soon</span>
                    </div>
                  )}
                  <p className="cz-meme__caption">{m.image || m.video ? m.title : m.caption}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {hobbies.length > 0 && (
          <section className="cz-section" aria-labelledby="cz-hob">
            <h2 id="cz-hob" className="cz-h2">
              Things I <em>love</em>
            </h2>
            <ul className="cz-cards">
              {hobbies.map((m) => (
                <li key={m.slug} className="cz-card">
                  <Media moment={m} label={m.kind === 'food' ? 'Food pic soon' : 'Pic soon'} />
                  <div className="cz-card__body">
                    <p className="cz-card__kind">{m.kind}</p>
                    <p className="cz-card__title">{m.title}</p>
                    {m.caption && <p className="cz-card__caption">{m.caption}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {allPosts.length > 0 && (
          <section className="cz-section" aria-labelledby="cz-posts">
            <h2 id="cz-posts" className="cz-h2">
              Latest <em>posts</em>
            </h2>
            <ul className="cz-posts">
              {allPosts.slice(0, 6).map((p) => (
                <li key={p.slug}>
                  <a href={p.url} target="_blank" rel="noopener noreferrer">
                    <span className="cz-posts__platform">{p.platform}</span>
                    {p.title} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="cz-footer">
        <p className="cz-footer__sign">see you on the beach</p>
        <Link href="/" className="cz-footer__back">
          ← The professional side
        </Link>
      </footer>
    </div>
  )
}
