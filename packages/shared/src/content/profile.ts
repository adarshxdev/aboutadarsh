import { defineProfile } from './schema.js'

export const profile = defineProfile({
  name: 'Adarsh Bajpai',
  shortName: 'Adarsh',
  title: 'Software Engineer',
  positioning:
    'I build agentic AI products that ship — voice, RAG, and the billing infrastructure behind them.',
  tagline: 'Full-stack AI engineer.',
  summary:
    'Software Engineer with 3+ years building scalable SaaS and agentic AI platforms with React, Next.js, TypeScript, Node.js, FastAPI and AWS. Strong in full-stack development, system design and real-time AI systems.',
  location: 'Bengaluru, India',
  availability: {
    open: true,
    label: 'Open to new work',
    engagements: ['Full-time', 'Contract', 'Advisory'],
  },
  email: 'adarshbajpai0907@gmail.com',
  // Deliberately not rendered anywhere on the site — see plan.md §9.
  phone: '+91-6387276019',
  socials: [
    {
      label: 'GitHub',
      href: 'https://github.com/adarshxdev',
      handle: '@adarshxdev',
      icon: 'github',
    },
    {
      label: 'LinkedIn',
      href: 'https://linkedin.com/in/adarshbajpai09',
      handle: '/in/adarshbajpai09',
      icon: 'linkedin',
    },
  ],
  resumePdf: '/resume/Adarsh_Bajpai_Resume.pdf',
})
