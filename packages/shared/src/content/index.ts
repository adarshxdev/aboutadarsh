import { profile } from './profile.js'
import { home } from './home.js'
import { experience } from './experience.js'
import { projects } from './projects.js'
import { skills } from './skills.js'
import { education } from './education.js'
import { achievements } from './achievements.js'
import { testimonials } from './testimonials.js'
import { hobbies } from './hobbies.js'
import { posts } from './posts.js'
import { caseStudies } from './case-studies.js'
import { casual } from './casual.js'
import { moments } from './moments.js'
import type {
  Casual,
  Moment,
  MomentKind,
  Achievement,
  CaseStudy,
  Education,
  Experience,
  Hobby,
  Home,
  Post,
  Profile,
  Project,
  Skill,
  SkillCategory,
  Testimonial,
} from './schema.js'

export * from './schema.js'

/**
 * Everything the site is built from, before derivation. The API serves it from
 * the database (edited at /admin); these files are the default and the seed.
 */
export type RawContent = {
  profile: Profile
  home: Home
  experience: Experience[]
  projects: Project[]
  caseStudies: CaseStudy[]
  skills: Skill[]
  education: Education[]
  achievements: Achievement[]
  testimonials: Testimonial[]
  hobbies: Hobby[]
  posts: Post[]
  casual: Casual
  moments: Moment[]
}

/** The files in this folder, as raw content. Also the seed for a fresh database. */
export const staticContent: RawContent = {
  profile,
  home,
  experience,
  projects,
  caseStudies,
  skills,
  education,
  achievements,
  testimonials,
  hobbies,
  posts,
  casual,
  moments,
}

/* ---------- pure helpers ---------- */

export const SKILL_CATEGORIES: { key: SkillCategory; label: string }[] = [
  { key: 'ai', label: 'Agentic AI & Real-time' },
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend & data' },
  { key: 'devops', label: 'Cloud & DevOps' },
  { key: 'testing', label: 'Testing' },
  { key: 'other', label: 'Integrations' },
]

export const formatPeriod = (start: string, end: string | null) => {
  const fmt = (ym: string) => {
    const [y, m] = ym.split('-').map(Number)
    return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
  return `${fmt(start)} — ${end ? fmt(end) : 'Present'}`
}

const live = <T extends { published: boolean }>(xs: readonly T[]): T[] => xs.filter((x) => x.published)

/** Newest first. Featured entries float to the top. */
const byStart = (a: { start: string; featured: boolean }, b: { start: string; featured: boolean }) =>
  Number(b.featured) - Number(a.featured) || b.start.localeCompare(a.start)

const byYear = (a: { year: number; featured: boolean }, b: { year: number; featured: boolean }) =>
  Number(b.featured) - Number(a.featured) || b.year - a.year

const monthsBetween = (start: string, end: string | null) => {
  const [sy, sm] = start.split('-').map(Number)
  const now = new Date()
  const [ey, em] = end ? end.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1]
  return (ey - sy) * 12 + (em - sm)
}

/**
 * Derives everything pages need from raw content: published-only, sorted
 * collections, and computed stats. Ordering is derived, never hand-maintained.
 */
export function buildSite(raw: RawContent) {
  const allExperience = live(raw.experience).sort(byStart)
  const allProjects = live(raw.projects).sort(byYear)
  const allEducation = live(raw.education).sort((a, b) => b.start.localeCompare(a.start))
  const allTestimonials = live(raw.testimonials)
  const allHobbies = live(raw.hobbies)
  const allPosts = live(raw.posts).sort((a, b) => b.date.localeCompare(a.date))
  const allMoments = live(raw.moments).sort((a, b) => Number(b.featured) - Number(a.featured))
  const allSkills = raw.skills

  /** Grouped in SKILL_CATEGORIES order, empty categories dropped. */
  const skillsByCategory = SKILL_CATEGORIES.map((category) => ({
    ...category,
    skills: allSkills.filter((s) => s.category === category.key),
  })).filter((group) => group.skills.length > 0)

  /** Every stack string used anywhere — powers the /work filter chips. */
  const allStacks = [...new Set([...allProjects, ...allExperience].flatMap((x) => x.stack))].sort((a, b) =>
    a.localeCompare(b),
  )
  const allDomains = [...new Set(allProjects.flatMap((p) => p.domains))].sort((a, b) => a.localeCompare(b))
  /** Kinds that actually have projects, in a fixed order. */
  const projectKinds = (['work', 'freelance', 'side', 'personal'] as const).filter((k) =>
    allProjects.some((p) => p.kind === k),
  )

  /** Union of employment months, so overlapping roles aren't double-counted. */
  const earliest = allExperience.reduce(
    (min, e) => (e.start < min ? e.start : min),
    allExperience[0]?.start ?? '2023-02',
  )
  const yearsOfExperience = Math.floor(monthsBetween(earliest, null) / 12)

  /** Strongest outcome per role, newest first — feeds the impact tiles. */
  const impactMetrics = allExperience
    .flatMap((e) => e.metrics.map((m) => ({ ...m, company: e.company, team: e.team, slug: e.slug })))
    .sort((a, b) => b.value - a.value)

  /**
   * The address pre-split. Passed to <CopyEmail> so the full string is never
   * serialized contiguously into HTML or the RSC payload — plan.md §9.
   */
  const [user, domain] = raw.profile.email.split('@')

  return {
    profile: raw.profile,
    home: raw.home,
    casual: raw.casual,
    allMoments,
    momentsOf: (kind: MomentKind) => allMoments.filter((m) => m.kind === kind),
    achievements: raw.achievements,
    getCaseStudy: (slug: string) => raw.caseStudies.find((c) => c.slug === slug),
    allExperience,
    allProjects,
    allEducation,
    allTestimonials,
    allHobbies,
    allPosts,
    allSkills,
    skillsByCategory,
    allStacks,
    allDomains,
    projectKinds,
    featuredWork: allProjects.filter((p) => p.featured).slice(0, 3),
    caseStudies: allProjects.filter((p) => p.links.caseStudy),
    getProject: (slug: string) => allProjects.find((p) => p.slug === slug),
    getExperience: (slug: string) => allExperience.find((e) => e.slug === slug),
    yearsOfExperience,
    stats: {
      years: yearsOfExperience,
      companies: new Set(allExperience.map((e) => e.company)).size,
      projects: allProjects.length,
      technologies: allStacks.length,
    },
    impactMetrics,
    emailParts: { user, domain },
  }
}

export type Site = ReturnType<typeof buildSite>
export { checkContent } from './check.js'
