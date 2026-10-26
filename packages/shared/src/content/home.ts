/**
 * Display copy for the immersive home page. Facts (roles, projects, skills)
 * come from the other content files; this is only the headline voice.
 * Each heading is an array of lines. `{years}` and `{count}` are filled in.
 */
import { defineHome } from './schema.js'

export const home = defineHome({
  about: {
    heading: ['{years}+ years shipping', 'production SaaS and AI.'],
  },
  stack: {
    heading: ['Skills and tech stack.'],
  },
  experience: {
    heading: ['Experience.'],
  },
  works: {
    heading: ['{count} selected projects.'],
  },
  contact: {
    heading: ["Let's work together."],
  },
})
