import { SiteHeader, type ExtraLink } from '@/components/layout/SiteHeader'
import { Footer } from '@/components/layout/Footer'
import { getSite } from '@/lib/content'

/**
 * Pages outside the home experience: résumé, case studies, privacy, and
 * hobbies/content when they have entries. Same dark palette as the home page.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { allHobbies, allPosts } = await getSite()
  const extra: ExtraLink[] = [
    ...(allPosts.length ? [{ href: '/content', label: 'Content' }] : []),
    ...(allHobbies.length ? [{ href: '/hobbies', label: 'Hobbies' }] : []),
  ]
  return (
    <div className="site-theme flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-5 focus:py-3 focus:text-accent-fg"
      >
        Skip to content
      </a>
      <SiteHeader extra={extra} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
