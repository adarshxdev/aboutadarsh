import Link from 'next/link'
import { COLLECTION_KEYS, COLLECTIONS } from '@portfolio/shared/cms'
import { requireAdmin } from '@/lib/api'
import { SignOutButton } from '@/components/admin/LoginForm'

const navLink = 'flex min-h-10 items-center rounded-lg px-3 text-fg-muted hover:bg-bg-subtle hover:text-fg'

/** Signed-in chrome. The API re-checks the session on every call these pages make. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div className="md:grid md:min-h-dvh md:grid-cols-[15rem_1fr]">
      <aside className="border-b border-border p-4 md:border-r md:border-b-0">
        <Link href="/admin" className="mb-4 block px-3 font-mono font-semibold">
          admin<span className="text-accent">.</span>
        </Link>
        <nav aria-label="Admin" className="flex flex-wrap gap-1 md:flex-col">
          <Link href="/admin" className={navLink}>
            Dashboard
          </Link>
          {COLLECTION_KEYS.map((key) => (
            <Link key={key} href={`/admin/${key}`} className={navLink}>
              {COLLECTIONS[key].label}
            </Link>
          ))}
          <Link href="/admin/media" className={navLink}>
            Media
          </Link>
        </nav>
        <div className="mt-6 space-y-1 border-t border-border pt-4">
          <a href="/" target="_blank" className={navLink}>
            View site ↗
          </a>
          <SignOutButton className={`${navLink} w-full`} />
          <p className="truncate px-3 pt-2 text-[length:var(--text-step--1)] text-fg-subtle" title={admin}>
            {admin}
          </p>
        </div>
      </aside>
      <main className="min-w-0-fix p-4 md:p-8">{children}</main>
    </div>
  )
}
