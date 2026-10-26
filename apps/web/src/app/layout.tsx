import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { heading } from '@/lib/fonts'
import { INTRO_SESSION_KEY } from '@/lib/immersive/session-key'
import { getSite } from '@/lib/content'
import { siteMetadata, JsonLd, personJsonLd, websiteJsonLd } from '@/lib/seo'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

/**
 * Every page refreshes at least every 5 minutes, even one first rendered while
 * the API was unreachable (e.g. a Docker build). Admin edits refresh sooner,
 * via /api/revalidate.
 */
export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return siteMetadata((await getSite()).profile)
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Notch and rounded-corner devices — plan.md §6.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfbfc' },
    { media: '(prefers-color-scheme: dark)', color: '#111318' },
  ],
}

/*
 * Chrome (nav, footer, skip link) lives in the route-group layouts:
 * (site)/layout.tsx for content pages, while the immersive home at page.tsx
 * brings its own masthead — immersive-plan.md §3.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite()
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${heading.variable}`}
      // Tells Next to pause CSS smooth scrolling during route changes.
      data-scroll-behavior="smooth"
    >
      <head>
        {/*
          Runs before first paint on every full page load: marks visitors who've
          seen the home intro this session so it never flashes (immersive.css).
          A plain inline script, not next/script: beforeInteractive only queues
          code for later. Safe here because the root layout is never re-rendered
          on the client, so React never has to create this element in the browser.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('${INTRO_SESSION_KEY}'))document.documentElement.classList.add('imm-returning')}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans">
        <ThemeProvider>{children}</ThemeProvider>
        <JsonLd data={personJsonLd(site)} />
        <JsonLd data={websiteJsonLd(site.profile)} />
        <Analytics />
      </body>
    </html>
  )
}
