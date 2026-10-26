import type { Viewport } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { formatPeriod, PROJECT_KIND_LABELS } from '@portfolio/shared/content'
import { getSite } from '@/lib/content'
import { CopyEmail } from '@/components/ui/CopyEmail'
import { TechLogo } from '@/components/ui/TechLogo'
import type { ParticleLogo } from '@/lib/immersive/chapters'
import { techIcon } from '@/lib/tech-icons'
import { Immersive } from '@/components/immersive/Immersive'
import { SplitChars } from '@/components/immersive/SplitChars'
import { ContactPanelForm } from '@/components/immersive/ThankYou'
import { WorksViewer, type WorkItem } from '@/components/immersive/WorksViewer'
import { JsonLd, worksJsonLd } from '@/lib/seo'
import '@/styles/immersive.css'

export const viewport: Viewport = {
  themeColor: '#04070c',
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Cut-out stone head the hero draws in particles when no portrait photo is set. */
const DEFAULT_PORTRAIT = '/images/moai.png'

/** Logos the particle field cycles through on the Skills panel, in order. */
/** Logos that are image files: brand colour, and how to find the mark in the picture. */
const IMAGE_LOGOS: Record<string, { color: string; mask: 'alpha' | 'tile' }> = {
  AWS: { color: '#FF9900', mask: 'alpha' },
  Agno: { color: '#FF5A1F', mask: 'tile' },
  OpenAI: { color: '#e9ecef', mask: 'alpha' },
}

/** Section label: "01 About". */
function Label({ no, children }: { no?: number; children: React.ReactNode }) {
  return (
    <p className="label" data-depth="0.6">
      {no !== undefined && <span className="label__no">{pad(no)}</span>}
      {children}
    </p>
  )
}

/** Fills `{years}` / `{count}` in home.ts headings. */
const fill = (lines: readonly string[], values: Record<string, string | number>) =>
  lines.map((l) => l.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? '')))

/**
 * Immersive home — immersive-plan.md. Every word is server-rendered here, so
 * crawlers, screen readers and no-JS visitors get the full page; <Immersive>
 * layers the WebGL field, loader and panel navigation on top.
 */
export default async function HomePage() {
  const site = await getSite()
  const {
    allExperience,
    allProjects,
    allHobbies,
    allPosts,
    allSkills,
    allEducation,
    emailParts,
    home,
    profile,
    stats,
  } = site
  const works: WorkItem[] = allProjects.map((p) => ({
    slug: p.slug,
    kind: PROJECT_KIND_LABELS[p.kind],
    logo: p.logo,
    title: p.title,
    tagline: p.tagline,
    context: p.context,
    year: p.year,
    role: p.role,
    stack: p.stack,
    metrics: p.metrics,
    live: p.links.live,
    source: p.links.source,
    caseStudy: p.links.caseStudy,
  }))
  // Confidential work never shows media — plan.md §8.
  const videos = allProjects.map((p) => (!p.confidential && p.video) || null)
  // The focus stack: skills marked `core` (editable in /admin → Skills).
  const coreAi = allSkills.filter((sk) => sk.level === 'core' && sk.category === 'ai')
  const coreProduct = allSkills.filter((sk) => sk.level === 'core' && sk.category !== 'ai')
  const others = allSkills.filter((sk) => sk.level !== 'core')
  // Ring logos: core skills with a drawable mark (vector, or a configured image).
  // Product stack on the top ring, agentic AI below.
  const toLogo = ({ name, icon: slug }: (typeof allSkills)[number]): ParticleLogo[] => {
    const icon = techIcon(slug, name)
    if (icon?.kind === 'path') return [{ name, path: icon.path, color: icon.onDark }]
    if (icon?.kind === 'image' && IMAGE_LOGOS[name]) return [{ name, src: icon.src, ...IMAGE_LOGOS[name] }]
    return []
  }
  const topRing = coreProduct.flatMap(toLogo)
  const logos: ParticleLogo[] = [...topRing, ...coreAi.flatMap(toLogo)]

  return (
    <>
      <Immersive
        name={profile.shortName.toLowerCase()}
        // Your photo once set in /admin; until then, the stone head.
        portrait={profile.portrait || DEFAULT_PORTRAIT}
        music={profile.music}
        videos={videos}
        logos={logos}
        ringSplit={topRing.length}
      >
        <section id="top" className="panel panel--hero" data-panel="hero" aria-labelledby="hero-title">
          <p className="label" data-depth="0.6">
            {profile.title} · {stats.years}+ years · {profile.location}
          </p>
          <h1
            id="hero-title"
            className="imm-display"
            data-depth="1"
            data-reveal="chars"
            data-panel-heading
            tabIndex={-1}
          >
            <span className="sr-only">
              {profile.name}, {profile.title}:{' '}
            </span>
            <SplitChars lines={[profile.tagline]} />
          </h1>
          <p className="imm-body imm-body--hero" data-depth="1.4" data-reveal="sweep">
            {profile.positioning}
          </p>
          <div className="hero__actions" data-depth="1.5" data-reveal="rise">
            <a className="pill pill--solid" href={profile.resumePdf} download>
              Download résumé
            </a>
            <a className="pill" href="#contact" data-go="contact">
              Get in touch
            </a>
          </div>
          {profile.availability.open && (
            <p className="note" data-depth="1.6" data-reveal="sweep">
              <span className="note__dot" aria-hidden="true" />
              {profile.availability.label} — {profile.availability.engagements.join(', ')}
            </p>
          )}
          <p className="scroll-cue" aria-hidden="true">
            Scroll
          </p>
        </section>

        <section id="about" className="panel panel--about" data-panel="about" aria-labelledby="about-title">
          <Label no={1}>About</Label>
          <h2
            id="about-title"
            className="imm-lede"
            data-depth="1"
            data-reveal="chars"
            data-panel-heading
            tabIndex={-1}
          >
            <SplitChars lines={fill(home.about.heading, { years: stats.years })} />
          </h2>
          <p className="imm-body" data-depth="1.3" data-reveal="sweep">
            {profile.summary}
          </p>
          <dl className="stats" data-depth="1.5" data-reveal="rise">
            <div>
              <dt>Years</dt>
              <dd>{stats.years}+</dd>
            </div>
            <div>
              <dt>Companies</dt>
              <dd>{stats.companies}</dd>
            </div>
            <div>
              <dt>Projects</dt>
              <dd>{stats.projects}</dd>
            </div>
            <div>
              <dt>Technologies</dt>
              <dd>{stats.technologies}</dd>
            </div>
          </dl>
          {allEducation.map((edu) => (
            <p key={edu.slug} className="note" data-depth="1.6" data-reveal="sweep">
              {edu.degree}
              {edu.field && `, ${edu.field}`} · {edu.institution} · {edu.start.slice(0, 4)}–
              {edu.end.slice(0, 4)}
              {edu.score && ` · ${edu.score.value}/${edu.score.scale}`}
            </p>
          ))}
        </section>

        <section id="stack" className="panel panel--stack" data-panel="stack" aria-labelledby="stack-title">
          <Label no={2}>Skills</Label>
          <h2
            id="stack-title"
            className="imm-lede"
            data-depth="1"
            data-reveal="chars"
            data-panel-heading
            tabIndex={-1}
          >
            <SplitChars lines={[...home.stack.heading]} />
          </h2>
          <div className="techgrid" data-reveal="rise">
            {[
              { key: 'ai', label: 'Agentic AI', skills: coreAi },
              { key: 'product', label: 'Backend, data & cloud', skills: coreProduct },
            ].map((group) => (
              <div key={group.key} className="techgroup techgroup--core">
                <p className="techgroup__label">{group.label}</p>
                <ul className="techgroup__list">
                  {group.skills.map((skill) => {
                    const icon = techIcon(skill.icon, skill.name)
                    const particle = logos.findIndex((l) => l.name === skill.name)
                    return (
                      <li
                        key={skill.name}
                        className="tech tech--core"
                        data-logo={particle >= 0 ? particle : undefined}
                        data-core
                        style={{ '--brand': icon?.onDark ?? 'var(--paper)' } as React.CSSProperties}
                      >
                        <TechLogo icon={icon} name={skill.name} className="tech__icon" />
                        <span className="tech__name">{skill.name}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
            {others.length > 0 && (
              <div className="techgroup techgroup--more">
                <p className="techgroup__label">Also worked with</p>
                <ul className="techgroup__list">
                  {others.map((skill) => {
                    const icon = techIcon(skill.icon, skill.name)
                    return (
                      <li
                        key={skill.name}
                        className="tech tech--minor"
                        style={{ '--brand': icon?.onDark ?? 'var(--paper)' } as React.CSSProperties}
                      >
                        <TechLogo icon={icon} name={skill.name} className="tech__icon" />
                        <span className="tech__name">{skill.name}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section
          id="experience"
          className="panel panel--experience"
          data-panel="experience"
          aria-labelledby="experience-title"
        >
          <Label no={3}>Experience</Label>
          <h2
            id="experience-title"
            className="imm-lede"
            data-depth="1"
            data-reveal="chars"
            data-panel-heading
            tabIndex={-1}
          >
            <SplitChars lines={[...home.experience.heading]} />
          </h2>
          <ol className="rows" data-reveal="rise">
            {allExperience.map((job) => {
              const top = job.metrics[0]
              return (
                <li key={job.slug} className="row row--job">
                  <span className="row__no">{formatPeriod(job.start, job.end)}</span>
                  <span className="row__title">
                    {job.logo && (
                      // Decorative: the company name follows.
                      <Image src={job.logo} alt="" width={28} height={28} className="row__logo" />
                    )}
                    {job.role} <span className="row__at">at</span> {job.company}
                    {job.team && (
                      <span className="row__team">
                        {' · '}
                        {job.teamLogo && (
                          <Image
                            src={job.teamLogo}
                            alt=""
                            width={20}
                            height={20}
                            className="row__logo row__logo--team"
                          />
                        )}
                        {job.team}
                      </span>
                    )}
                  </span>
                  <span className="row__tags">
                    {top && (
                      <strong>
                        {top.direction === 'down' ? '−' : '+'}
                        {top.value}
                        {top.unit} {top.label.toLowerCase()}
                      </strong>
                    )}
                    {job.stack.slice(0, 4).join(' / ')}
                  </span>
                </li>
              )
            })}
          </ol>
          <p className="note" data-reveal="sweep">
            <Link href="/resume">Full résumé</Link>
          </p>
        </section>

        <section
          id="works-intro"
          className="panel panel--interlude"
          data-panel="works-intro"
          aria-labelledby="works-intro-title"
        >
          <Label no={4}>Projects</Label>
          <h2
            id="works-intro-title"
            className="imm-lede"
            data-depth="1"
            data-reveal="chars"
            data-panel-heading
            tabIndex={-1}
          >
            <SplitChars lines={fill(home.works.heading, { count: works.length })} />
          </h2>
        </section>

        <section id="works" className="panel panel--works" data-panel="works" aria-labelledby="works-title">
          <h2 id="works-title" className="sr-only" data-panel-heading tabIndex={-1}>
            Selected projects
          </h2>
          <WorksViewer works={works} />
          {/* The viewer shows one at a time; this is the whole list, for crawlers and screen readers. */}
          <div className="sr-only">
            <h3>All projects</h3>
            <ol>
              {works.map((w) => (
                <li key={w.slug}>
                  <h4>{w.title}</h4>
                  <p>{w.tagline}</p>
                  <p>
                    {w.year}
                    {w.role && ` · ${w.role}`} · {w.stack.join(', ')}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="contact"
          className="panel panel--contact"
          data-panel="contact"
          aria-labelledby="contact-title"
        >
          <div className="contact__intro">
            <Label no={5}>Contact</Label>
            <h2
              id="contact-title"
              className="imm-lede"
              data-depth="1"
              data-reveal="chars"
              data-panel-heading
              tabIndex={-1}
            >
              <SplitChars lines={[...home.contact.heading]} />
            </h2>
            <p className="imm-body" data-reveal="sweep">
              {profile.availability.label}. Tell me what you&apos;re building — I reply within a couple of
              days.
            </p>
            <ul className="contact__direct" data-reveal="rise">
              <li>
                <CopyEmail {...emailParts} />
              </li>
              {profile.socials.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
              <li>
                <a href={profile.resumePdf} download>
                  Résumé (PDF) <span aria-hidden="true">↓</span>
                </a>
              </li>
            </ul>
          </div>
          <div className="contact__form" data-reveal="rise">
            <ContactPanelForm />
          </div>
        </section>

        <section className="panel panel--finale" data-panel="finale" aria-labelledby="finale-title">
          <h2 id="finale-title" className="sr-only" data-panel-heading tabIndex={-1}>
            Elsewhere
          </h2>
          <div className="finale" data-reveal="rise">
            <nav aria-label="Elsewhere" className="finale__links">
              <Link href="/resume">Résumé</Link>
              {allHobbies.length > 0 && <Link href="/hobbies">Hobbies</Link>}
              {allPosts.length > 0 && <Link href="/content">Content</Link>}
              {profile.socials.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label} ↗
                </a>
              ))}
            </nav>
            <div className="finale__email">
              <CopyEmail {...emailParts} />
            </div>
            <p className="finale__meta">
              © {new Date().getFullYear()} {profile.name} ·{' '}
              <a href="#top" data-go="hero">
                Back to top
              </a>
            </p>
          </div>
        </section>
      </Immersive>
      <JsonLd data={worksJsonLd(site)} />
    </>
  )
}
