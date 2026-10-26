import { defineEducation } from './schema.js'

export const education = defineEducation([
  {
    slug: 'nit-jalandhar',
    degree: 'Bachelor of Technology',
    institution: 'National Institute of Technology (NIT), Jalandhar',
    location: 'Jalandhar, India',
    start: '2019-08',
    end: '2023-07',
    score: { value: '8.11', scale: '10' },
    highlights: [],
  },

  // ── add the next degree here ──
])
