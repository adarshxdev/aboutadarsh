import { Monoton, Pacifico } from 'next/font/google'

/* Casual page only: neon display face and a beach-sign script. */
export const neon = Monoton({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-neon' })
export const script = Pacifico({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-script',
})
