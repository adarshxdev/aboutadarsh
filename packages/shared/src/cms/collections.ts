import { z } from 'zod'
import {
  achievementSchema,
  caseStudySchema,
  educationSchema,
  experienceSchema,
  hobbySchema,
  homeSchema,
  postSchema,
  casualSchema,
  momentSchema,
  profileSchema,
  projectSchema,
  skillSchema,
  testimonialSchema,
  type RawContent,
} from '../content/index.js'

/**
 * Every collection the admin can edit. The key matches RawContent, so a
 * database row's `collection` maps straight onto the content the site reads.
 * Form fields for each live in ./fields.ts (kept free of Zod and content data
 * so they can be passed to client components).
 */
type Def = {
  label: string
  /** One entry only (profile, home); the list view is skipped. */
  singleton?: boolean
  schema: z.ZodType
  description: string
  /** Row title in the admin list. */
  title: (d: Record<string, unknown>) => string
  subtitle?: (d: Record<string, unknown>) => string
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

export const COLLECTIONS = {
  profile: {
    label: 'Profile',
    singleton: true,
    schema: profileSchema,
    description: 'Name, headline, summary, socials, résumé file, photo and music.',
    title: (d) => str(d.name),
  },
  home: {
    label: 'Home headings',
    singleton: true,
    schema: homeSchema,
    description: 'The big headings on the home page sections.',
    title: () => 'Home headings',
  },
  experience: {
    label: 'Experience',
    schema: experienceSchema,
    description: 'Jobs and internships.',
    title: (d) => `${str(d.role)} — ${str(d.company)}`,
    subtitle: (d) => `${str(d.start)} → ${str(d.end) || 'present'}`,
  },
  projects: {
    label: 'Projects',
    schema: projectSchema,
    description: 'Work, freelance, side and personal projects.',
    title: (d) => str(d.title),
    subtitle: (d) => `${str(d.kind)} · ${String(d.year ?? '')}`,
  },
  caseStudies: {
    label: 'Case studies',
    schema: caseStudySchema,
    description: 'Long-form write-ups, linked to a project by slug.',
    title: (d) => str(d.slug),
  },
  skills: {
    label: 'Skills',
    schema: skillSchema,
    description: 'Technologies, grouped by category.',
    title: (d) => str(d.name),
    subtitle: (d) => str(d.category),
  },
  education: {
    label: 'Education',
    schema: educationSchema,
    description: 'Degrees and courses.',
    title: (d) => str(d.degree),
    subtitle: (d) => str(d.institution),
  },
  achievements: {
    label: 'Achievements',
    schema: achievementSchema,
    description: 'Awards, roles and recognitions.',
    title: (d) => str(d.title),
    subtitle: (d) => str(d.org),
  },
  testimonials: {
    label: 'Testimonials',
    schema: testimonialSchema,
    description: 'Quotes from people you have worked with.',
    title: (d) => str(d.author),
    subtitle: (d) => str(d.company),
  },
  hobbies: {
    label: 'Hobbies',
    schema: hobbySchema,
    description: 'What you do outside work.',
    title: (d) => str(d.title),
  },
  casual: {
    label: 'Casual page',
    singleton: true,
    schema: casualSchema,
    description: 'The off-the-clock page: headline, intro, personal accounts and stickers.',
    title: () => 'Casual page',
  },
  moments: {
    label: 'Moments',
    schema: momentSchema,
    description: 'Casual page: adventures, fitness, memes, hobbies, travel and food.',
    title: (d) => str(d.title),
    subtitle: (d) => str(d.kind),
  },
  posts: {
    label: 'Content',
    schema: postSchema,
    description: 'Videos, posts, talks and articles published elsewhere.',
    title: (d) => str(d.title),
    subtitle: (d) => `${str(d.platform)} · ${str(d.date)}`,
  },
} satisfies Record<keyof RawContent, Def>

export type CollectionKey = keyof typeof COLLECTIONS

export const COLLECTION_KEYS = Object.keys(COLLECTIONS) as CollectionKey[]

export const isCollection = (key: string): key is CollectionKey => key in COLLECTIONS

export const getCollection = (key: CollectionKey): Def => COLLECTIONS[key]

/** Collections whose entries carry a URL slug that must be unique. */
export const SLUGGED: CollectionKey[] = [
  'experience',
  'projects',
  'caseStudies',
  'education',
  'testimonials',
  'hobbies',
  'posts',
  'moments',
]
