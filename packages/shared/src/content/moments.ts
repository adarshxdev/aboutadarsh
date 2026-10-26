import { defineMoments } from './schema.js'

/**
 * Everything on the casual page. PLACEHOLDERS — replace titles, captions and
 * add images (/admin → Moments, or edit here). Kinds: adventure, fitness,
 * meme, hobby, travel, food.
 */
export const moments = defineMoments([
  // Adventures
  {
    slug: 'adventure-1',
    kind: 'adventure',
    title: 'Placeholder trek',
    caption: 'Where, when, and the one moment you still think about.',
    location: 'Somewhere high',
    date: '2025-01-01',
  },
  {
    slug: 'adventure-2',
    kind: 'adventure',
    title: 'Placeholder dive / ride / jump',
    caption: 'Add a photo and a one-line story.',
    location: 'Somewhere wild',
  },
  {
    slug: 'adventure-3',
    kind: 'adventure',
    title: 'Placeholder road trip',
    caption: 'Kilometres, playlists, chai stops.',
    location: 'Somewhere far',
  },

  // Fitness
  {
    slug: 'fitness-1',
    kind: 'fitness',
    title: 'Deadlift PR',
    stat: '— kg',
    caption: 'Placeholder: your current best.',
  },
  {
    slug: 'fitness-2',
    kind: 'fitness',
    title: 'Longest run',
    stat: '— km',
    caption: 'Placeholder: race or long run.',
  },
  {
    slug: 'fitness-3',
    kind: 'fitness',
    title: 'Training streak',
    stat: '— days',
    caption: 'Placeholder: consistency brag.',
  },

  // Memes
  {
    slug: 'meme-1',
    kind: 'meme',
    title: 'When the build passes on the first try',
    caption: 'Placeholder meme — upload the image in /admin.',
  },
  { slug: 'meme-2', kind: 'meme', title: 'Me explaining RAG to my family', caption: 'Placeholder meme.' },
  { slug: 'meme-3', kind: 'meme', title: 'Leg day vs. production incident', caption: 'Placeholder meme.' },
  { slug: 'meme-4', kind: 'meme', title: 'Hanma blood, Monday energy', caption: 'Placeholder meme.' },

  // Hobbies, travel, food
  {
    slug: 'hobby-1',
    kind: 'hobby',
    title: 'Placeholder hobby',
    caption: 'What you do, and why it hooks you.',
  },
  { slug: 'hobby-2', kind: 'hobby', title: 'Another hobby', caption: 'Music, games, cooking, sketching…' },
  {
    slug: 'travel-1',
    kind: 'travel',
    title: 'Placeholder trip',
    caption: 'City, season, best meal.',
    location: 'Somewhere new',
  },
  {
    slug: 'food-1',
    kind: 'food',
    title: 'Placeholder food spot',
    caption: 'The order you always get.',
    location: 'Your city',
  },

  // ── add the next moment here ──
])
