import { defineSkills } from './schema.js'

/**
 * `level: 'core'` marks the current, strongest stack: the home page features
 * those (and draws their logos in the particle ring); the rest are listed
 * compactly. Regrouped from the résumé's ATS ordering: `ai` leads because it's the
 * differentiator. Category order is defined in index.ts, not here.
 * `icon` is a Simple Icons slug (simpleicons.org), a file in apps/web/public
 * (brands Simple Icons doesn't carry: AWS, OpenAI, Twilio, Salesforce…), or
 * "glyph:<name>" for concepts with no brand. Without one: a lettered tile.
 */
export const skills = defineSkills([
  // Agentic AI & real-time
  { name: 'RAG', category: 'ai', level: 'core', since: 2023, icon: 'glyph:rag' },
  { name: 'Voice agents', category: 'ai', level: 'strong', since: 2024, icon: 'glyph:voice' },
  { name: 'MCP', category: 'ai', level: 'core', since: 2025, icon: 'modelcontextprotocol' },
  { name: 'LiveKit', category: 'ai', level: 'core', since: 2025, icon: 'livekit' },
  { name: 'A2UI', category: 'ai', level: 'strong', since: 2025, icon: '/images/tech/a2ui.svg' },
  { name: 'Agno', category: 'ai', level: 'core', since: 2025, icon: '/images/tech/agno.png' },
  { name: 'LiteLLM', category: 'ai', level: 'core', since: 2025, icon: '/images/tech/litellm.png' },
  { name: 'OpenAI', category: 'ai', level: 'core', since: 2023, icon: '/images/tech/openai.svg' },
  { name: 'Claude', category: 'ai', level: 'core', since: 2024, icon: 'claude' },
  { name: 'Gemini', category: 'ai', level: 'strong', since: 2025, icon: 'googlegemini' },
  { name: 'LLaMA', category: 'ai', level: 'strong', since: 2023, icon: 'meta' },
  { name: 'Sarvam', category: 'ai', level: 'strong', since: 2025, icon: '/images/tech/sarvam.svg' },

  // Frontend
  { name: 'React', category: 'frontend', level: 'core', since: 2022, icon: 'react' },
  { name: 'Next.js', category: 'frontend', level: 'strong', since: 2022, icon: 'nextdotjs' },
  { name: 'TypeScript', category: 'frontend', level: 'strong', since: 2022, icon: 'typescript' },
  { name: 'JavaScript', category: 'frontend', level: 'strong', since: 2021, icon: 'javascript' },
  { name: 'Vite', category: 'frontend', level: 'strong', since: 2023, icon: 'vite' },
  { name: 'Redux', category: 'frontend', level: 'strong', since: 2022, icon: 'redux' },
  { name: 'Tailwind CSS', category: 'frontend', level: 'strong', since: 2023, icon: 'tailwindcss' },
  { name: 'MUI', category: 'frontend', level: 'strong', since: 2023, icon: 'mui' },
  { name: 'HTML5', category: 'frontend', level: 'strong', since: 2021, icon: 'html5' },
  { name: 'CSS3', category: 'frontend', level: 'strong', since: 2021, icon: 'css' },

  // Backend & data
  { name: 'Node.js', category: 'backend', level: 'core', since: 2022, icon: 'nodedotjs' },
  { name: 'Express.js', category: 'backend', level: 'strong', since: 2022, icon: 'express' },
  { name: 'Python', category: 'backend', level: 'core', since: 2021, icon: 'python' },
  { name: 'FastAPI', category: 'backend', level: 'strong', since: 2025, icon: 'fastapi' },
  { name: 'Django', category: 'backend', level: 'working', since: 2025, icon: 'django' },
  { name: 'PostgreSQL', category: 'backend', level: 'core', since: 2023, icon: 'postgresql' },
  { name: 'MongoDB', category: 'backend', level: 'core', since: 2023, icon: 'mongodb' },
  { name: 'Redis', category: 'backend', level: 'core', since: 2023, icon: 'redis' },
  { name: 'REST APIs', category: 'backend', level: 'strong', since: 2022, icon: 'glyph:api' },

  // Cloud & DevOps
  { name: 'AWS', category: 'devops', level: 'core', since: 2023, icon: '/images/tech/aws.svg' },
  { name: 'Docker', category: 'devops', level: 'strong', since: 2023, icon: 'docker' },
  { name: 'GitHub Actions', category: 'devops', level: 'strong', since: 2023, icon: 'githubactions' },
  { name: 'Vercel', category: 'devops', level: 'strong', since: 2023, icon: 'vercel' },
  { name: 'Git', category: 'devops', level: 'strong', since: 2021, icon: 'git' },

  // Testing
  { name: 'Jest', category: 'testing', level: 'strong', since: 2023, icon: 'jest' },
  { name: 'Cypress', category: 'testing', level: 'strong', since: 2023, icon: 'cypress' },
  { name: 'Mocha', category: 'testing', level: 'working', since: 2023, icon: 'mocha' },

  // Integrations
  { name: 'Stripe', category: 'other', level: 'strong', since: 2024, icon: 'stripe' },
  { name: 'Twilio', category: 'other', level: 'strong', since: 2024, icon: '/images/tech/twilio.svg' },
  { name: 'WhatsApp API', category: 'other', level: 'strong', since: 2024, icon: 'whatsapp' },
  {
    name: 'Salesforce',
    category: 'other',
    level: 'working',
    since: 2024,
    icon: '/images/tech/salesforce.svg',
  },
  { name: 'Zendesk', category: 'other', level: 'working', since: 2023, icon: 'zendesk' },

  // ── add the next skill here ──
])
