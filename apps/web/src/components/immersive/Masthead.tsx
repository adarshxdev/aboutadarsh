'use client'

import Link from 'next/link'
import { ParticleName } from '@/components/ui/ParticleName'
import { ModeToggle } from '@/components/ui/ModeToggle'
import { useEffect, useRef } from 'react'
import { live, setState, useImmersive } from '@/lib/immersive/store'
import { startAudio, stopAudio } from '@/lib/immersive/audio'

const links = [
  { href: '#about', label: 'About' },
  { href: '#stack', label: 'Skills' },
  { href: '#works', label: 'Projects' },
  { href: '#contact', label: 'Contact' },
]

export function Masthead({ name }: { name: string }) {
  const motion = useImmersive((s) => s.motion)
  const sound = useImmersive((s) => s.sound)
  const bars = useRef<HTMLSpanElement>(null)

  // Bars follow the analyser level without re-rendering React.
  useEffect(() => {
    if (!sound) return
    let raf = 0
    const tick = () => {
      bars.current?.style.setProperty('--level', live.level.toFixed(3))
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [sound])

  const toggleSound = async () => {
    if (sound) {
      stopAudio()
      setState({ sound: false })
    } else {
      setState({ sound: await startAudio() })
    }
  }

  return (
    <header className="masthead">
      <a className="masthead__name" href="#top" data-go="hero" aria-label={`${name} — back to top`}>
        <ParticleName text={`${name}.`} className="particle-name--lg" />
      </a>
      <nav className="masthead__nav" aria-label="Sections">
        {links.map((l) => (
          <a key={l.href} href={l.href} data-go={l.href.slice(1)}>
            {l.label}
          </a>
        ))}
        <Link href="/resume">Résumé</Link>
      </nav>
      <div className="masthead__toggles">
        <button
          type="button"
          className="toggle"
          aria-pressed={motion}
          onClick={() => setState({ motion: !motion })}
        >
          Motion {motion ? 'on' : 'off'}
        </button>
        <button type="button" className="toggle" aria-pressed={sound} onClick={toggleSound}>
          <span>Sound {sound ? 'on' : 'off'}</span>
          <span ref={bars} className="toggle__bars" data-on={sound || undefined} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        </button>
        <ModeToggle mode="professional" />
      </div>
    </header>
  )
}
