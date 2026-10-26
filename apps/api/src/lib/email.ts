import { Resend } from 'resend'
import { INTENT_LABELS, type ContactData } from '@portfolio/shared/validation'
import { loadContent } from '../cms/repository.js'
import { env } from '../env.js'
import { logger } from './logger.js'

const apiKey = env.RESEND_API_KEY
const resend = apiKey ? new Resend(apiKey) : null

const FROM = env.CONTACT_FROM_EMAIL ?? 'onboarding@resend.dev'

export const hasEmail = Boolean(apiKey)

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Notification to the site owner. */
export async function sendContactNotification(data: ContactData) {
  if (!resend) {
    logger.info(
      { name: data.name, intent: data.intent },
      'contact: RESEND_API_KEY unset — submission logged only',
    )
    return { sent: false as const }
  }

  const rows: [string, string | undefined][] = [
    ['Name', data.name],
    ['Email', data.email],
    ['Company', data.company || undefined],
    ['Intent', INTENT_LABELS[data.intent]],
    ['Budget', data.budget || undefined],
    ['Timeline', data.timeline || undefined],
    ['Found via', data.source],
    ['Newsletter', data.subscribe ? 'Yes' : 'No'],
  ]

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;line-height:1.6">
      <h2 style="margin:0 0 16px">New contact — ${escape(INTENT_LABELS[data.intent])}</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        ${rows
          .filter(([, v]) => v)
          .map(
            ([k, v]) =>
              `<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top">${k}</td><td style="padding:6px 0">${escape(String(v))}</td></tr>`,
          )
          .join('')}
      </table>
      <h3 style="margin:24px 0 8px;font-size:14px;color:#666">Message</h3>
      <p style="white-space:pre-wrap;margin:0;padding:16px;background:#f6f6f7;border-radius:8px;font-size:14px">${escape(data.message)}</p>
    </div>`

  await resend.emails.send({
    from: FROM,
    to: env.CONTACT_TO_EMAIL ?? (await loadContent()).profile.email,
    replyTo: data.email,
    subject: `[Portfolio] ${data.name} — ${INTENT_LABELS[data.intent]}`,
    html,
  })

  return { sent: true as const }
}

/** Auto-acknowledgement to the sender. */
export async function sendContactAcknowledgement(data: ContactData) {
  const { profile } = await loadContent()
  if (!resend) return { sent: false as const }

  await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: `Thanks for reaching out — ${profile.shortName}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;line-height:1.6">
        <p>Hi ${escape(data.name.split(' ')[0])},</p>
        <p>Thanks for getting in touch — your message reached me and I'll reply within a couple of days.</p>
        <p style="color:#666;font-size:14px">For reference, here's what you sent:</p>
        <blockquote style="margin:0;padding:12px 16px;border-left:3px solid #ddd;color:#444;white-space:pre-wrap;font-size:14px">${escape(data.message)}</blockquote>
        <p>— ${escape(profile.name)}<br><span style="color:#666;font-size:14px">${escape(profile.title)}</span></p>
      </div>`,
  })

  return { sent: true as const }
}

export async function sendSubscribeConfirmation(email: string, token: string) {
  const { profile } = await loadContent()
  if (!resend) {
    logger.info('subscribe: RESEND_API_KEY unset — confirmation not sent')
    return { sent: false as const }
  }

  const link = `${env.SITE_URL}/api/subscribe/confirm?token=${encodeURIComponent(token)}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Confirm your subscription',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;line-height:1.6">
        <p>Please confirm you'd like occasional notes on agentic AI from ${escape(profile.name)}.</p>
        <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#4f46e5;color:#fff;border-radius:999px;text-decoration:none">Confirm subscription</a></p>
        <p style="color:#888;font-size:13px">If you didn't request this, ignore this email — nothing will be sent.</p>
      </div>`,
  })

  return { sent: true as const }
}
