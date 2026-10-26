import { Plus_Jakarta_Sans } from 'next/font/google'

/** Every h1–h4 on the site, plus the home page's canvas lettering. */
export const heading = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
  variable: '--font-heading',
})
