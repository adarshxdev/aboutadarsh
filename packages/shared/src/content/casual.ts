import { defineCasual } from './schema.js'

/**
 * The casual page's headline and personal accounts. PLACEHOLDERS — replace
 * with the real thing (here, or in /admin → Casual page).
 */
export const casual = defineCasual({
  tagline: 'Off the clock.',
  intro:
    'Placeholder: the other side — weekends, workouts, wild ideas and whatever made me laugh this week. Swap this for a line in your own voice.',
  accounts: [
    { platform: 'Instagram', handle: '@your.handle', href: 'https://instagram.com/', icon: 'instagram' },
    { platform: 'YouTube', handle: '@yourchannel', href: 'https://youtube.com/', icon: 'youtube' },
    { platform: 'Strava', handle: 'your-name', href: 'https://www.strava.com/', icon: 'strava' },
    { platform: 'Spotify', handle: 'your playlists', href: 'https://open.spotify.com/', icon: 'spotify' },
    { platform: 'X', handle: '@yourhandle', href: 'https://x.com/', icon: 'x' },
  ],
  facts: ['Placeholder fact', 'Coffee: ?', 'Gym: 5×/week', 'Favourite trek: ?', 'Anime: Baki'],
})
