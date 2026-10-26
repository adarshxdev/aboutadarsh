'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { getState, setState, useImmersive } from '@/lib/immersive/store'
import { track } from '@/lib/track'

export type WorkItem = {
  slug: string
  /** Display label: Work, Freelance, Side project, Personal. */
  kind: string
  /** Product or client logo. */
  logo?: string
  title: string
  tagline: string
  context?: string
  year: number
  role?: string
  stack: string[]
  metrics: { label: string; value: string }[]
  live?: string
  source?: string
  caseStudy: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')
const host = (url: string) => new URL(url).host.replace(/^www\./, '')

export function WorksViewer({ works }: { works: WorkItem[] }) {
  const index = useImmersive((s) => s.work)
  const work = works[index] ?? works[0]
  const info = useRef<HTMLDivElement>(null)
  const first = useRef(true)

  // "Seen through water": ripple the text while it swaps.
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!getState().motion || !info.current) return
    const warp = document.querySelector('[data-water-warp]')
    const state = { scale: 70 }
    const tl = gsap.timeline()
    tl.fromTo(
      info.current,
      { opacity: 0.2, filter: 'url(#water-warp)' },
      { opacity: 1, duration: 0.9, ease: 'power2.out' },
    )
    tl.fromTo(
      state,
      { scale: 70 },
      {
        scale: 0,
        duration: 1.1,
        ease: 'power3.out',
        onUpdate: () => warp?.setAttribute('scale', state.scale.toFixed(1)),
        onComplete: () => {
          if (info.current) info.current.style.filter = ''
        },
      },
      0,
    )
    return () => {
      tl.kill()
    }
  }, [index])

  const go = (i: number) => setState({ work: (i + works.length) % works.length })

  return (
    <div
      className="works"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1)
        if (e.key === 'ArrowLeft') go(index - 1)
      }}
    >
      <p className="label works__count" aria-hidden="true">
        <span>{pad(index + 1)}</span> / {pad(works.length)}
      </p>

      <nav className="works__nav" aria-label="Projects">
        <ol>
          {works.map((w, i) => (
            <li key={w.slug}>
              <button type="button" aria-current={i === index || undefined} onClick={() => go(i)}>
                <span className="works__no">{pad(i + 1)}</span>
                {w.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div ref={info} className="works__info" aria-live="polite">
        <h3 className="works__name">
          {work.logo && (
            // Decorative: the title says the same thing.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={work.logo} alt="" width={44} height={44} className="works__logo" />
          )}
          {work.title}
        </h3>
        <p className="works__context">
          <span>{work.kind}</span>
          {work.context && <span>{work.context}</span>}
        </p>
        <p className="imm-body works__summary">{work.tagline}</p>
        {work.metrics.length > 0 && (
          <ul className="works__metrics" aria-label="Highlights">
            {work.metrics.map((m) => (
              <li key={m.label}>
                <strong>{m.value}</strong> {m.label}
              </li>
            ))}
          </ul>
        )}
        <p className="works__facts">
          <span>{work.year}</span>
          {work.role && <span>{work.role}</span>}
        </p>
        <ul className="works__stack" aria-label="Stack">
          {work.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="works__links">
          {work.caseStudy && <Link href={`/work/${work.slug}`}>Case study</Link>}
          {work.live && (
            <a
              href={work.live}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('outbound_click', { href: work.live })}
            >
              {host(work.live)} ↗
            </a>
          )}
          {work.source && (
            <a
              href={work.source}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('outbound_click', { href: work.source })}
            >
              Source ↗
            </a>
          )}
        </p>
      </div>

      <div className="works__step">
        <button type="button" className="pill" onClick={() => go(index - 1)} aria-label="Previous project">
          ←
        </button>
        <button type="button" className="pill" onClick={() => go(index + 1)} aria-label="Next project">
          →
        </button>
      </div>
    </div>
  )
}
