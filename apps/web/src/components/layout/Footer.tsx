import Link from 'next/link'
import { getSite } from '@/lib/content'
import { socialIcons } from '@/components/ui/Icons'
import { CopyEmail } from '@/components/ui/CopyEmail'

export async function Footer() {
  const { emailParts, profile } = await getSite()
  return (
    <footer className="border-t border-border" data-print="hide">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <CopyEmail {...emailParts} />
          <p className="text-[length:var(--text-step--1)] text-fg-subtle">
            © {new Date().getFullYear()} {profile.name} ·{' '}
            <Link href="/privacy" className="hover:text-fg">
              Privacy
            </Link>
          </p>
        </div>
        <ul className="flex items-center gap-1">
          {profile.socials.map((social) => {
            const Icon = socialIcons[social.icon]
            return (
              <li key={social.href}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${social.label} — ${social.handle}`}
                  className="inline-flex size-11 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-bg-raised hover:text-fg"
                >
                  <Icon className="size-5" />
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </footer>
  )
}
