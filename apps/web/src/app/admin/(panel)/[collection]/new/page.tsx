import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { COLLECTIONS, FIELDS, isCollection } from '@portfolio/shared/cms'
import { EntryForm } from '@/components/admin/EntryForm'

export default async function NewEntryPage({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params
  if (!isCollection(collection)) notFound()
  const def = COLLECTIONS[collection]
  if ('singleton' in def) redirect(`/admin/${collection}`)
  // New entries start published when the collection has that switch.
  const initial = FIELDS[collection].some((f) => f.name === 'published')
    ? { published: true, featured: false }
    : {}

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/${collection}`} className="text-fg-muted hover:text-fg">
        ← {def.label}
      </Link>
      <h1 className="mt-2 mb-8 text-[length:var(--text-step-4)]">New entry</h1>
      <EntryForm collection={collection} id={null} fields={FIELDS[collection]} initial={initial} />
    </div>
  )
}
