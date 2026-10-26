import { buildSite, type RawContent } from './index.js'

/**
 * Cross-entry rules a single schema can't see: unique slugs, references that
 * resolve, sane dates, no NDA media. Pure, so the CLI and the tests share it.
 * `assetExists` decides whether a local path (e.g. "/resume/cv.pdf") is present.
 */
export function checkContent(raw: RawContent, assetExists: (path: string) => boolean = () => true) {
  const errors: string[] = []
  const warnings: string[] = []
  const { allEducation, allExperience, allProjects, allTestimonials, profile } = buildSite(raw)

  const uniqueSlugs = (items: { slug: string }[], label: string) => {
    const seen = new Set<string>()
    for (const { slug } of items) {
      if (seen.has(slug)) errors.push(`${label}: duplicate slug "${slug}"`)
      seen.add(slug)
    }
  }
  uniqueSlugs(raw.projects, 'projects')
  uniqueSlugs(raw.experience, 'experience')
  uniqueSlugs(raw.education, 'education')
  uniqueSlugs(raw.testimonials, 'testimonials')
  uniqueSlugs(raw.hobbies, 'hobbies')
  uniqueSlugs(raw.posts, 'posts')
  uniqueSlugs(raw.moments, 'moments')
  uniqueSlugs(raw.caseStudies, 'caseStudies')

  for (const role of allExperience) {
    if (role.caseStudy && !allProjects.some((p) => p.slug === role.caseStudy)) {
      errors.push(`experience "${role.slug}": caseStudy "${role.caseStudy}" matches no project`)
    }
  }

  for (const project of allProjects) {
    const hasStudy = raw.caseStudies.some((c) => c.slug === project.slug)
    if (project.links.caseStudy && !hasStudy) {
      errors.push(
        `project "${project.slug}": links.caseStudy is true but there is no case study with that slug`,
      )
    }
    if (!project.links.caseStudy && hasStudy) {
      warnings.push(
        `project "${project.slug}": a case study exists but links.caseStudy is false — it won't render`,
      )
    }
    if (project.confidential && project.gallery.length > 0) {
      errors.push(
        `project "${project.slug}": confidential is true but a gallery is set — NDA media would be published`,
      )
    }
  }

  const asset = (src: string | undefined, where: string) => {
    if (src && src.startsWith('/') && !assetExists(src)) errors.push(`${where}: asset "${src}" not found`)
  }
  for (const project of allProjects) {
    asset(project.logo, `project "${project.slug}" logo`)
    asset(project.cover, `project "${project.slug}" cover`)
    project.gallery.forEach((img, i) => asset(img.src, `project "${project.slug}" gallery[${i}]`))
  }
  for (const role of allExperience) {
    asset(role.logo, `experience "${role.slug}" logo`)
    asset(role.teamLogo, `experience "${role.slug}" teamLogo`)
  }
  for (const skill of raw.skills) asset(skill.icon, `skill "${skill.name}" icon`)
  for (const m of raw.moments) {
    asset(m.image, `moment "${m.slug}" image`)
    asset(m.video, `moment "${m.slug}" video`)
  }
  for (const t of allTestimonials) asset(t.avatar, `testimonial "${t.slug}" avatar`)
  asset(profile.resumePdf, 'profile.resumePdf')

  for (const role of allExperience) {
    if (role.end && role.end < role.start) errors.push(`experience "${role.slug}": end precedes start`)
  }
  for (const entry of allEducation) {
    if (entry.end < entry.start) errors.push(`education "${entry.slug}": end precedes start`)
  }

  return { errors, warnings }
}
