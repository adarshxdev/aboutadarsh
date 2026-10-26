import { z } from 'zod'

export const INTENTS = ['hiring', 'freelance', 'collaboration', 'speaking', 'other'] as const
export type Intent = (typeof INTENTS)[number]

export const INTENT_LABELS: Record<Intent, string> = {
  hiring: 'Hiring',
  freelance: 'Freelance / contract',
  collaboration: 'Collaboration',
  speaking: 'Speaking',
  other: 'Something else',
}

/** Intents that reveal the budget and timeline fields. */
export const COMMERCIAL_INTENTS: Intent[] = ['hiring', 'freelance']

export const SOURCES = ['search', 'linkedin', 'github', 'referral', 'conference', 'other'] as const

/** Shared by the client form and the route handler — plan.md §10. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: z.email('Please enter a valid email').max(200),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  intent: z.enum(INTENTS),
  message: z.string().trim().min(20, 'A little more detail helps — 20 characters minimum').max(4000),
  budget: z.string().trim().max(100).optional().or(z.literal('')),
  timeline: z.string().trim().max(100).optional().or(z.literal('')),
  // The select's "Prefer not to say" option submits '' — treat it as not given.
  source: z
    .enum(SOURCES)
    .or(z.literal(''))
    .optional()
    .transform((v) => v || undefined),
  subscribe: z.boolean().default(false),
  /**
   * Honeypot. Deliberately NOT constrained here: the route handler accepts a
   * filled value with a 200 so bots learn nothing about which field is the trap.
   */
  website: z.string().max(200).optional(),
  /** Client render timestamp, for the minimum time-to-submit check. */
  startedAt: z.number().int().optional(),
  turnstileToken: z.string().optional(),
})

export type ContactInput = z.input<typeof contactSchema>
export type ContactData = z.output<typeof contactSchema>

export const subscribeSchema = z.object({
  email: z.email('Please enter a valid email').max(200),
  /** Honeypot — see contactSchema. */
  website: z.string().max(200).optional(),
})

export const trackSchema = z.object({
  type: z.string().min(1).max(64),
  path: z.string().max(300).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})
