import { z } from 'zod'

/** Fields every collection item shares. */
const base = {
  /** Stable, URL-safe id. Never change it once linked. */
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
  /** Set false to hide from the site without deleting the entry. */
  published: z.boolean().default(true),
  /** Pin to the top of its section. Ties break by date. */
  featured: z.boolean().default(false),
}

const yearMonth = z.string().regex(/^\d{4}-\d{2}$/, 'expected "YYYY-MM"')
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected "YYYY-MM-DD"')

export const SOCIAL_ICONS = [
  'github',
  'linkedin',
  'mail',
  'x',
  'youtube',
  'instagram',
  'medium',
  'website',
] as const

/** Where a project came from. Drives the filters on /work. */
export const PROJECT_KINDS = ['work', 'freelance', 'side', 'personal'] as const
export const PROJECT_KIND_LABELS: Record<(typeof PROJECT_KINDS)[number], string> = {
  work: 'Work',
  freelance: 'Freelance',
  side: 'Side project',
  personal: 'Personal',
}

export const POST_PLATFORMS = [
  'youtube',
  'linkedin',
  'x',
  'instagram',
  'blog',
  'medium',
  'podcast',
  'other',
] as const

export const profileSchema = z.object({
  name: z.string(),
  shortName: z.string(),
  title: z.string(),
  positioning: z.string(),
  /** Short display line for the immersive home hero. */
  tagline: z.string().default('Full-stack & AI engineer.'),
  /**
   * Photo the home hero's particle bust is drawn from (path under public/).
   * Best as a head-and-shoulders cut-out on a transparent or dark background.
   * Unset: a placeholder torso.
   */
  portrait: z.string().optional(),
  /** Audio file for the home page's sound toggle. Unset: a generated ambient pad. */
  music: z.string().optional(),
  summary: z.string(),
  location: z.string(),
  availability: z.object({
    open: z.boolean(),
    label: z.string(),
    engagements: z.array(z.string()).default([]),
  }),
  email: z.string(),
  /** Deliberately absent from the site — see plan.md §9. Kept for the PDF only. */
  phone: z.string().optional(),
  socials: z.array(
    z.object({
      label: z.string(),
      href: z.url(),
      handle: z.string(),
      icon: z.enum(SOCIAL_ICONS).default('website'),
    }),
  ),
  resumePdf: z.string(),
})

export const experienceSchema = z.object({
  ...base,
  role: z.string(),
  company: z.string(),
  team: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(['full-time', 'contract', 'internship']),
  start: yearMonth,
  /** null = present */
  end: yearMonth.nullable(),
  bullets: z.array(z.string()).min(1),
  stack: z.array(z.string()),
  metrics: z
    .array(
      z.object({
        label: z.string(),
        value: z.number(),
        unit: z.enum(['%', 'x', '+', '']).default('%'),
        direction: z.enum(['up', 'down']).default('up'),
      }),
    )
    .default([]),
  logo: z.string().optional(),
  /** Logo for `team`, when the team has its own brand (e.g. Phronetic AI). */
  teamLogo: z.string().optional(),
  /** Slug into projects. */
  caseStudy: z.string().optional(),
})

export const projectSchema = z.object({
  ...base,
  kind: z.enum(PROJECT_KINDS).default('work'),
  title: z.string(),
  tagline: z.string(),
  context: z.string().optional(),
  year: z.number().int().min(2000).max(2100),
  role: z.string().optional(),
  stack: z.array(z.string()),
  /** Powers the /work filter chips. */
  domains: z.array(z.string()).default([]),
  links: z
    .object({
      live: z.url().optional(),
      source: z.url().optional(),
      /** true -> render content/work/<slug>.mdx at /work/<slug> */
      caseStudy: z.boolean().default(false),
    })
    .default({ caseStudy: false }),
  /** Product or client logo, shown beside the title. Public brand, so shown even for confidential work. */
  logo: z.string().optional(),
  cover: z.string().optional(),
  /** Short muted loop (MP4), played across the particle field on the home page. */
  video: z.string().optional(),
  /** Still frame for `video`, shown when motion is off. */
  poster: z.string().optional(),
  gallery: z
    .array(
      z.object({
        src: z.string(),
        alt: z.string(),
        frame: z.enum(['browser', 'laptop', 'phone', 'none']).default('browser'),
      }),
    )
    .default([]),
  /** NDA guard: suppresses media, keeps the narrative. */
  confidential: z.boolean().default(false),
  metrics: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
})

export const skillSchema = z.object({
  name: z.string(),
  category: z.enum(['ai', 'frontend', 'backend', 'devops', 'testing', 'other']),
  level: z.enum(['core', 'strong', 'working']).default('strong'),
  /** Year first used -> drives the computed "N yrs" label. */
  since: z.number().int().optional(),
  /** Simple Icons slug. */
  icon: z.string().optional(),
})

export const educationSchema = z.object({
  ...base,
  degree: z.string(),
  field: z.string().optional(),
  institution: z.string(),
  location: z.string().optional(),
  start: yearMonth,
  end: yearMonth,
  score: z.object({ value: z.string(), scale: z.string() }).optional(),
  highlights: z.array(z.string()).default([]),
})

export const achievementSchema = z.object({
  title: z.string(),
  org: z.string().optional(),
  year: z.number().int().optional(),
  detail: z.string().optional(),
})

export const testimonialSchema = z.object({
  ...base,
  quote: z.string(),
  author: z.string(),
  role: z.string(),
  company: z.string(),
  avatar: z.string().optional(),
})

export const hobbySchema = z.object({
  ...base,
  title: z.string(),
  description: z.string(),
  image: z.string().optional(),
  links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
})

/** Things published elsewhere: videos, posts, talks, articles. */
export const postSchema = z.object({
  ...base,
  title: z.string(),
  platform: z.enum(POST_PLATFORMS),
  url: z.url(),
  date: isoDate,
  summary: z.string().optional(),
  thumbnail: z.string().optional(),
})

/** What a moment on the casual page is. Drives its section and card style. */
export const MOMENT_KINDS = ['adventure', 'fitness', 'meme', 'hobby', 'travel', 'food'] as const

/** One thing on the casual page: a trek, a PR at the gym, a meme, a trip… */
export const momentSchema = z.object({
  ...base,
  kind: z.enum(MOMENT_KINDS),
  title: z.string(),
  caption: z.string().optional(),
  /** Photo or meme image. Without one the card shows a placeholder tile. */
  image: z.string().optional(),
  /** Short clip, shown instead of the image when set. */
  video: z.string().optional(),
  /** Big number for fitness cards, e.g. "140 kg" or "21 km". */
  stat: z.string().optional(),
  date: isoDate.optional(),
  location: z.string().optional(),
  link: z.url().optional(),
})

/** The casual (off-the-clock) page: headline copy and personal accounts. */
export const casualSchema = z.object({
  tagline: z.string(),
  intro: z.string(),
  accounts: z
    .array(
      z.object({
        platform: z.string(),
        handle: z.string(),
        href: z.url(),
        /** Simple Icons slug, e.g. "instagram", "strava", "spotify". */
        icon: z.string().optional(),
      }),
    )
    .default([]),
  /** Little facts shown as stickers, e.g. "Coffee: black". */
  facts: z.array(z.string()).default([]),
})

/** Long-form write-up for a project; `slug` matches the project's. */
export const caseStudySchema = z.object({
  slug: base.slug,
  problem: z.string().optional(),
  constraints: z.array(z.string()).default([]),
  outcome: z.string().optional(),
  /** MDX body. */
  body: z.string(),
})

/** Headline copy for the immersive home page. `{years}`/`{count}` are filled in. */
export const homeSchema = z.object({
  about: z.object({ heading: z.array(z.string()).min(1) }),
  stack: z.object({ heading: z.array(z.string()).min(1) }),
  experience: z.object({ heading: z.array(z.string()).min(1) }),
  works: z.object({ heading: z.array(z.string()).min(1) }),
  contact: z.object({ heading: z.array(z.string()).min(1) }),
})

/* Typed helpers. These validate eagerly, so a typo fails at build, not in production. */
const list =
  <S extends z.ZodType>(schema: S, label: string) =>
  (items: z.input<S>[]): z.output<S>[] =>
    items.map((item, i) => {
      const parsed = schema.safeParse(item)
      if (!parsed.success) {
        const issues = parsed.error.issues
          .map((issue) => `    ${issue.path.join('.') || '(root)'}: ${issue.message}`)
          .join('\n')
        throw new Error(`Invalid ${label} entry at index ${i}:\n${issues}`)
      }
      return parsed.data
    })

export const defineProfile = (p: z.input<typeof profileSchema>) => profileSchema.parse(p)
export const defineExperience = list(experienceSchema, 'experience')
export const defineProjects = list(projectSchema, 'project')
export const defineSkills = list(skillSchema, 'skill')
export const defineEducation = list(educationSchema, 'education')
export const defineAchievements = list(achievementSchema, 'achievement')
export const defineTestimonials = list(testimonialSchema, 'testimonial')
export const defineHobbies = list(hobbySchema, 'hobby')
export const definePosts = list(postSchema, 'post')
export const defineHome = (h: z.input<typeof homeSchema>) => homeSchema.parse(h)
export const defineMoments = list(momentSchema, 'moment')
export const defineCasual = (c: z.input<typeof casualSchema>) => casualSchema.parse(c)

export type Profile = z.output<typeof profileSchema>
export type Experience = z.output<typeof experienceSchema>
export type Project = z.output<typeof projectSchema>
export type Skill = z.output<typeof skillSchema>
export type Education = z.output<typeof educationSchema>
export type Achievement = z.output<typeof achievementSchema>
export type Testimonial = z.output<typeof testimonialSchema>
export type Hobby = z.output<typeof hobbySchema>
export type Post = z.output<typeof postSchema>
export type CaseStudy = z.output<typeof caseStudySchema>
export type Home = z.output<typeof homeSchema>
export type Moment = z.output<typeof momentSchema>
export type MomentKind = Moment['kind']
export type Casual = z.output<typeof casualSchema>
export type ProjectKind = Project['kind']
export type SkillCategory = Skill['category']
