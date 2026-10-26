import Link from 'next/link'
import { COLLECTION_KEYS, COLLECTIONS } from '@portfolio/shared/cms'
import { adminApi } from '@/lib/api'
import { ImportDefaultsButton } from '@/components/admin/RowActions'

type Status = {
  database: 'ok' | 'down' | 'off'
  storage: boolean
  redis: boolean
  email: boolean
  counts: Record<string, number> | null
}

function StatusCard({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="rounded-xl border border-border p-4">
      <p className="flex items-center gap-2 font-medium">
        <span aria-hidden="true" className={`size-2.5 rounded-full ${ok ? 'bg-success' : 'bg-danger'}`} />
        {label} <span className="sr-only">{ok ? '(ok)' : '(not configured)'}</span>
      </p>
      <p className="mt-1 text-[length:var(--text-step--1)] text-fg-muted">{detail}</p>
    </li>
  )
}

export default async function Dashboard() {
  const { database, storage, redis, email, counts } = await adminApi<Status>('/admin/status')
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="max-w-5xl space-y-10">
      <h1 className="text-[length:var(--text-step-4)]">Dashboard</h1>

      <section aria-labelledby="setup">
        <h2 id="setup" className="mb-4 text-[length:var(--text-step-1)]">
          Setup
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatusCard
            ok={database === 'ok'}
            label="Database"
            detail={
              database === 'off'
                ? 'DATABASE_URL not set — the site shows default content.'
                : database === 'down'
                  ? 'Set, but unreachable.'
                  : 'Connected.'
            }
          />
          <StatusCard
            ok={storage}
            label="File storage"
            detail={storage ? 'Uploads enabled.' : 'S3_* variables not set — uploads disabled.'}
          />
          <StatusCard
            ok={redis}
            label="Redis"
            detail={redis ? 'Shared rate limiting.' : 'In-memory rate limiting (fine locally).'}
          />
          <StatusCard
            ok={email}
            label="Email"
            detail={email ? 'Contact form emails you.' : 'RESEND_API_KEY not set — messages are logged.'}
          />
        </ul>
      </section>

      {counts && total === 0 && (
        <section className="rounded-2xl border border-accent bg-accent-subtle p-6">
          <h2 className="text-[length:var(--text-step-1)]">The database is empty</h2>
          <p className="mt-2 mb-4 text-fg-muted">
            Until you import, the site keeps showing the default content from the repository. Import it once,
            then edit everything here.
          </p>
          <ImportDefaultsButton />
        </section>
      )}

      <section aria-labelledby="content">
        <h2 id="content" className="mb-4 text-[length:var(--text-step-1)]">
          Content
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTION_KEYS.map((key) => (
            <li key={key}>
              <Link
                href={`/admin/${key}`}
                className="block h-full rounded-xl border border-border p-4 transition-colors hover:border-accent"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{COLLECTIONS[key].label}</span>
                  {counts && !('singleton' in COLLECTIONS[key]) && (
                    <span className="text-fg-subtle tabular-nums">{counts[key] ?? 0}</span>
                  )}
                </span>
                <span className="mt-1 block text-[length:var(--text-step--1)] text-fg-muted">
                  {COLLECTIONS[key].description}
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/admin/media"
              className="block h-full rounded-xl border border-border p-4 hover:border-accent"
            >
              <span className="font-medium">Media</span>
              <span className="mt-1 block text-[length:var(--text-step--1)] text-fg-muted">
                Images, résumé PDFs, music and video.
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  )
}
