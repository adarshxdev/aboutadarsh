import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdmin } from '@/lib/api'
import { LoginForm } from '@/components/admin/LoginForm'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const admin = await getAdmin()
  if (admin.email) redirect('/admin')
  const { next } = await searchParams

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-bg-raised p-8">
        <h1 className="text-[length:var(--text-step-3)]">Sign in</h1>
        <p className="mt-2 mb-6 text-fg-muted">Edit the site&apos;s content and files.</p>
        {'unreachable' in admin ? (
          <p role="alert" className="rounded-xl bg-bg-subtle p-4 text-fg-muted">
            Can&apos;t reach the API. Start it with <code>npm run dev</code> and check <code>API_URL</code>.
          </p>
        ) : admin.configured ? (
          <LoginForm next={next} />
        ) : (
          <p role="alert" className="rounded-xl bg-bg-subtle p-4 text-fg-muted">
            Admin isn&apos;t configured. Set <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD_HASH</code> and{' '}
            <code>AUTH_SECRET</code> on the API — see the README.
          </p>
        )}
      </div>
    </main>
  )
}
