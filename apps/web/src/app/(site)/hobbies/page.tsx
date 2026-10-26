import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSite } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { Section, SectionHeading } from '@/components/ui/Section'
import { RevealGroup, RevealItem } from '@/components/motion/Reveal'

export const metadata: Metadata = pageMetadata({
  title: 'Hobbies',
  description: 'What I do when I am not writing software.',
  path: '/hobbies',
})

export default async function HobbiesPage() {
  const { allHobbies } = await getSite()
  // Hidden from nav and sitemap until there's something to show.
  if (!allHobbies.length) notFound()

  return (
    <Section>
      <SectionHeading eyebrow="Hobbies" title="Outside work" />
      <RevealGroup className="auto-grid">
        {allHobbies.map((hobby) => (
          <RevealItem key={hobby.slug}>
            <article className="h-full overflow-hidden rounded-2xl border border-border bg-bg-raised">
              {hobby.image && (
                // Uploaded images can live on any storage host, so a plain <img>.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hobby.image} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />
              )}
              <div className="p-6">
                <h2 className="text-[length:var(--text-step-2)]">{hobby.title}</h2>
                <p className="mt-3 text-fg-muted">{hobby.description}</p>
                {hobby.links.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                    {hobby.links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center font-medium text-accent underline-offset-4 hover:underline"
                        >
                          {link.label} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  )
}
