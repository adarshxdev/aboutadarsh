/**
 * Admin form layout per collection. Plain data (no Zod, no content imports),
 * so server pages can hand it to the client form. Validation is the Zod
 * schema's job on save; these only decide which input renders.
 */
export type MediaAccept = 'image' | 'audio' | 'video' | 'document'

type Base = { name: string; label: string; help?: string }

export type Field = Base &
  (
    | { kind: 'text' | 'url' | 'email'; placeholder?: string }
    | { kind: 'textarea'; rows?: number }
    | { kind: 'markdown' }
    | { kind: 'number' }
    | { kind: 'boolean' }
    | { kind: 'select'; options: readonly { value: string; label: string }[] }
    /** YYYY-MM. `nullable` adds a "Present" checkbox that stores null. */
    | { kind: 'month'; nullable?: boolean }
    /** YYYY-MM-DD */
    | { kind: 'date' }
    /** string[], comma-separated */
    | { kind: 'tags' }
    /** string[], one per line */
    | { kind: 'lines' }
    /** A URL picked from or uploaded to the media library. */
    | { kind: 'media'; accept: MediaAccept }
    /** Repeatable group → array of objects. */
    | { kind: 'list'; fields: Field[]; itemLabel: string }
    /** Nested object. */
    | { kind: 'group'; fields: Field[] }
  )

const opts = (...values: string[]) => values.map((value) => ({ value, label: value }))

const slug: Field = {
  kind: 'text',
  name: 'slug',
  label: 'Slug',
  help: 'Lowercase words joined by dashes, e.g. "agent-builder". Used in URLs; avoid changing it once published.',
}
const published: Field = {
  kind: 'boolean',
  name: 'published',
  label: 'Published',
  help: 'Untick to hide without deleting.',
}
const featured: Field = {
  kind: 'boolean',
  name: 'featured',
  label: 'Featured',
  help: 'Pin to the top of its section.',
}

const headingLines = (name: string, label: string): Field => ({
  kind: 'group',
  name,
  label,
  fields: [{ kind: 'lines', name: 'heading', label: 'Heading', help: 'One line per row.' }],
})

export const FIELDS: Record<string, Field[]> = {
  profile: [
    { kind: 'text', name: 'name', label: 'Full name' },
    { kind: 'text', name: 'shortName', label: 'Short name', help: 'Used in the logo and greetings.' },
    { kind: 'text', name: 'title', label: 'Job title', placeholder: 'Software Engineer' },
    { kind: 'text', name: 'tagline', label: 'Home headline', help: 'The big line on the home page.' },
    { kind: 'textarea', name: 'positioning', label: 'One-line pitch', rows: 2 },
    { kind: 'textarea', name: 'summary', label: 'Summary', rows: 4 },
    { kind: 'text', name: 'location', label: 'Location' },
    { kind: 'email', name: 'email', label: 'Public email' },
    { kind: 'text', name: 'phone', label: 'Phone', help: 'Never shown on the site.' },
    {
      kind: 'group',
      name: 'availability',
      label: 'Availability',
      fields: [
        { kind: 'boolean', name: 'open', label: 'Open to work' },
        { kind: 'text', name: 'label', label: 'Label', placeholder: 'Open to new work' },
        { kind: 'tags', name: 'engagements', label: 'Engagement types', help: 'Comma-separated.' },
      ],
    },
    {
      kind: 'list',
      name: 'socials',
      label: 'Social profiles',
      itemLabel: 'Profile',
      fields: [
        { kind: 'text', name: 'label', label: 'Label', placeholder: 'GitHub' },
        { kind: 'url', name: 'href', label: 'URL' },
        { kind: 'text', name: 'handle', label: 'Handle', placeholder: '@you' },
        {
          kind: 'select',
          name: 'icon',
          label: 'Icon',
          options: opts('github', 'linkedin', 'x', 'youtube', 'instagram', 'medium', 'mail', 'website'),
        },
      ],
    },
    { kind: 'media', name: 'resumePdf', label: 'Résumé (PDF)', accept: 'document' },
    {
      kind: 'media',
      name: 'portrait',
      label: 'Portrait photo',
      accept: 'image',
      help: 'Drawn as particles on the home page. Best as a head-and-shoulders cut-out on a transparent or dark background.',
    },
    {
      kind: 'media',
      name: 'music',
      label: 'Home page music',
      accept: 'audio',
      help: 'Plays when visitors turn sound on. Empty: a generated ambient sound.',
    },
  ],

  home: [
    headingLines('about', 'About section'),
    headingLines('stack', 'Skills section'),
    headingLines('experience', 'Experience section'),
    headingLines('works', 'Projects section'),
    headingLines('contact', 'Contact section'),
  ],

  experience: [
    slug,
    { kind: 'text', name: 'role', label: 'Role' },
    { kind: 'text', name: 'company', label: 'Company' },
    { kind: 'text', name: 'team', label: 'Team / division' },
    { kind: 'text', name: 'location', label: 'Location' },
    { kind: 'select', name: 'type', label: 'Type', options: opts('full-time', 'contract', 'internship') },
    { kind: 'month', name: 'start', label: 'Start' },
    { kind: 'month', name: 'end', label: 'End', nullable: true },
    { kind: 'lines', name: 'bullets', label: 'Highlights', help: 'One bullet per line.' },
    { kind: 'tags', name: 'stack', label: 'Stack', help: 'Comma-separated.' },
    {
      kind: 'list',
      name: 'metrics',
      label: 'Metrics',
      itemLabel: 'Metric',
      fields: [
        { kind: 'text', name: 'label', label: 'Label', placeholder: 'Lead conversion' },
        { kind: 'number', name: 'value', label: 'Value' },
        { kind: 'select', name: 'unit', label: 'Unit', options: opts('%', 'x', '+', '') },
        { kind: 'select', name: 'direction', label: 'Direction', options: opts('up', 'down') },
      ],
    },
    { kind: 'media', name: 'logo', label: 'Company logo', accept: 'image' },
    { kind: 'media', name: 'teamLogo', label: 'Team logo', accept: 'image' },
    { kind: 'text', name: 'caseStudy', label: 'Related project slug' },
    published,
    featured,
  ],

  projects: [
    slug,
    {
      kind: 'select',
      name: 'kind',
      label: 'Type',
      options: [
        { value: 'work', label: 'Work' },
        { value: 'freelance', label: 'Freelance' },
        { value: 'side', label: 'Side project' },
        { value: 'personal', label: 'Personal' },
      ],
    },
    { kind: 'text', name: 'title', label: 'Title' },
    { kind: 'textarea', name: 'tagline', label: 'Tagline', rows: 2 },
    { kind: 'text', name: 'context', label: 'Context', placeholder: 'Client or employer' },
    { kind: 'number', name: 'year', label: 'Year' },
    { kind: 'text', name: 'role', label: 'Your role' },
    { kind: 'tags', name: 'stack', label: 'Stack', help: 'Comma-separated.' },
    { kind: 'tags', name: 'domains', label: 'Domains', help: 'Comma-separated, e.g. "Healthcare, AI".' },
    {
      kind: 'group',
      name: 'links',
      label: 'Links',
      fields: [
        { kind: 'url', name: 'live', label: 'Live URL' },
        { kind: 'url', name: 'source', label: 'Source URL' },
        {
          kind: 'boolean',
          name: 'caseStudy',
          label: 'Has a case study',
          help: 'Add it under Case studies with the same slug.',
        },
      ],
    },
    { kind: 'media', name: 'logo', label: 'Logo', accept: 'image' },
    { kind: 'media', name: 'cover', label: 'Cover image', accept: 'image' },
    {
      kind: 'media',
      name: 'video',
      label: 'Preview video',
      accept: 'video',
      help: 'Short muted loop for the home page.',
    },
    { kind: 'media', name: 'poster', label: 'Video poster', accept: 'image' },
    {
      kind: 'list',
      name: 'gallery',
      label: 'Gallery',
      itemLabel: 'Image',
      fields: [
        { kind: 'media', name: 'src', label: 'Image', accept: 'image' },
        { kind: 'text', name: 'alt', label: 'Alt text' },
        {
          kind: 'select',
          name: 'frame',
          label: 'Frame',
          options: opts('browser', 'laptop', 'phone', 'none'),
        },
      ],
    },
    {
      kind: 'list',
      name: 'metrics',
      label: 'Metrics',
      itemLabel: 'Metric',
      fields: [
        { kind: 'text', name: 'label', label: 'Label' },
        { kind: 'text', name: 'value', label: 'Value', placeholder: '+40%' },
      ],
    },
    { kind: 'boolean', name: 'confidential', label: 'Under NDA', help: 'Hides media; keeps the write-up.' },
    published,
    featured,
  ],

  caseStudies: [
    { ...slug, help: 'Must match the project’s slug.' },
    { kind: 'textarea', name: 'problem', label: 'Problem', rows: 3 },
    { kind: 'lines', name: 'constraints', label: 'Constraints', help: 'One per line.' },
    { kind: 'textarea', name: 'outcome', label: 'Outcome', rows: 3 },
    { kind: 'markdown', name: 'body', label: 'Body (MDX)' },
  ],

  skills: [
    { kind: 'text', name: 'name', label: 'Name' },
    {
      kind: 'select',
      name: 'category',
      label: 'Category',
      options: opts('ai', 'frontend', 'backend', 'devops', 'testing', 'other'),
    },
    { kind: 'select', name: 'level', label: 'Level', options: opts('core', 'strong', 'working') },
    { kind: 'number', name: 'since', label: 'Using since (year)' },
    { kind: 'text', name: 'icon', label: 'Simple Icons slug' },
  ],

  education: [
    slug,
    { kind: 'text', name: 'degree', label: 'Degree' },
    { kind: 'text', name: 'field', label: 'Field of study' },
    { kind: 'text', name: 'institution', label: 'Institution' },
    { kind: 'text', name: 'location', label: 'Location' },
    { kind: 'month', name: 'start', label: 'Start' },
    { kind: 'month', name: 'end', label: 'End' },
    {
      kind: 'group',
      name: 'score',
      label: 'Score',
      fields: [
        { kind: 'text', name: 'value', label: 'Value', placeholder: '8.11' },
        { kind: 'text', name: 'scale', label: 'Out of', placeholder: '10' },
      ],
    },
    { kind: 'lines', name: 'highlights', label: 'Highlights', help: 'One per line.' },
    published,
    featured,
  ],

  achievements: [
    { kind: 'text', name: 'title', label: 'Title' },
    { kind: 'text', name: 'org', label: 'Organisation' },
    { kind: 'number', name: 'year', label: 'Year' },
    { kind: 'text', name: 'detail', label: 'Detail' },
  ],

  testimonials: [
    slug,
    { kind: 'textarea', name: 'quote', label: 'Quote', rows: 4 },
    { kind: 'text', name: 'author', label: 'Author' },
    { kind: 'text', name: 'role', label: 'Their role' },
    { kind: 'text', name: 'company', label: 'Company' },
    { kind: 'media', name: 'avatar', label: 'Photo', accept: 'image' },
    published,
    featured,
  ],

  hobbies: [
    slug,
    { kind: 'text', name: 'title', label: 'Title' },
    { kind: 'textarea', name: 'description', label: 'Description', rows: 4 },
    { kind: 'media', name: 'image', label: 'Image', accept: 'image' },
    {
      kind: 'list',
      name: 'links',
      label: 'Links',
      itemLabel: 'Link',
      fields: [
        { kind: 'text', name: 'label', label: 'Label' },
        { kind: 'url', name: 'href', label: 'URL' },
      ],
    },
    published,
    featured,
  ],

  casual: [
    { kind: 'text', name: 'tagline', label: 'Headline', placeholder: 'Off the clock.' },
    { kind: 'textarea', name: 'intro', label: 'Intro', rows: 3 },
    {
      kind: 'list',
      name: 'accounts',
      label: 'Personal accounts',
      itemLabel: 'Account',
      fields: [
        { kind: 'text', name: 'platform', label: 'Platform', placeholder: 'Instagram' },
        { kind: 'text', name: 'handle', label: 'Handle', placeholder: '@you' },
        { kind: 'url', name: 'href', label: 'URL' },
        {
          kind: 'text',
          name: 'icon',
          label: 'Icon',
          help: 'Simple Icons slug: instagram, youtube, strava, spotify, x…',
        },
      ],
    },
    { kind: 'lines', name: 'facts', label: 'Stickers', help: 'Short facts, one per line.' },
  ],

  moments: [
    slug,
    {
      kind: 'select',
      name: 'kind',
      label: 'Kind',
      options: opts('adventure', 'fitness', 'meme', 'hobby', 'travel', 'food'),
    },
    { kind: 'text', name: 'title', label: 'Title' },
    { kind: 'textarea', name: 'caption', label: 'Caption', rows: 2 },
    { kind: 'media', name: 'image', label: 'Image', accept: 'image' },
    { kind: 'media', name: 'video', label: 'Clip', accept: 'video' },
    { kind: 'text', name: 'stat', label: 'Big number', help: 'Fitness cards, e.g. "140 kg".' },
    { kind: 'date', name: 'date', label: 'Date' },
    { kind: 'text', name: 'location', label: 'Location' },
    { kind: 'url', name: 'link', label: 'Link' },
    published,
    featured,
  ],

  posts: [
    slug,
    { kind: 'text', name: 'title', label: 'Title' },
    {
      kind: 'select',
      name: 'platform',
      label: 'Platform',
      options: opts('youtube', 'linkedin', 'x', 'instagram', 'blog', 'medium', 'podcast', 'other'),
    },
    { kind: 'url', name: 'url', label: 'URL' },
    { kind: 'date', name: 'date', label: 'Published on' },
    { kind: 'textarea', name: 'summary', label: 'Summary', rows: 3 },
    { kind: 'media', name: 'thumbnail', label: 'Thumbnail', accept: 'image' },
    published,
    featured,
  ],
}
