import Link from 'next/link'
import { notFound } from 'next/navigation'
import { COLLECTIONS, FIELDS, isCollection } from '@portfolio/shared/cms'
import { adminApi } from '@/lib/api'
import { EntryForm } from '@/components/admin/EntryForm'

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ collection: string; id: string }>
}) {
  const { collection, id } = await params
  if (!isCollection(collection)) notFound()
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const row = await adminApi<{ id: string; data: Record<string, unknown> }>(
    `/admin/collections/${collection}/${id}`,
  ).catch(() => null)
  if (!row) notFound()
  const def = COLLECTIONS[collection]
  const data = row.data

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/${collection}`} className="text-fg-muted hover:text-fg">
        ← {def.label}
      </Link>
      <h1 className="mt-2 mb-8 text-[length:var(--text-step-4)]">{def.title(data) || 'Untitled'}</h1>
      {/* Keyed by row, so navigating between entries resets the form. */}
      <EntryForm
        key={row.id}
        collection={collection}
        id={row.id}
        fields={FIELDS[collection]}
        initial={data}
      />
    </div>
  )
}
