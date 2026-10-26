import Link from 'next/link'
import { notFound } from 'next/navigation'
import { COLLECTIONS, FIELDS, isCollection } from '@portfolio/shared/cms'
import { adminApi } from '@/lib/api'
import { EntryForm } from '@/components/admin/EntryForm'
import { NoDatabase, RowActions } from '@/components/admin/RowActions'

export default async function CollectionPage({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params
  if (!isCollection(collection)) notFound()
  const def = COLLECTIONS[collection]

  // Profile and home headings: edit in place, no list.
  if ('singleton' in def) {
    const { id, data, editable } = await adminApi<{
      id: string | null
      data: Record<string, unknown>
      editable: boolean
    }>(`/admin/collections/${collection}`)
    return (
      <div className="max-w-3xl">
        <h1 className="mb-2 text-[length:var(--text-step-4)]">{def.label}</h1>
        <p className="mb-8 text-fg-muted">{def.description}</p>
        {!editable && <NoDatabase />}
        <EntryForm
          collection={collection}
          id={id}
          fields={FIELDS[collection]}
          initial={data}
          disabled={!editable}
        />
      </div>
    )
  }

  const { entries: rows, editable } = await adminApi<{
    entries: { id: string; data: Record<string, unknown> }[]
    editable: boolean
  }>(`/admin/collections/${collection}`)
  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[length:var(--text-step-4)]">{def.label}</h1>
          <p className="mt-2 text-fg-muted">{def.description}</p>
        </div>
        {editable && (
          <Link
            href={`/admin/${collection}/new`}
            className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-medium text-accent-fg"
          >
            + New
          </Link>
        )}
      </div>
      {!editable && <NoDatabase />}
      {rows.length === 0 ? (
        <p className="text-fg-muted">Nothing here yet.</p>
      ) : (
        <ol className="divide-y divide-border rounded-2xl border border-border">
          {rows.map((row, i) => {
            const data = row.data
            const title = def.title(data) || 'Untitled'
            return (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <Link
                  href={`/admin/${collection}/${row.id}`}
                  className="min-w-0-fix flex-1 hover:text-accent"
                >
                  <span className="block truncate font-medium">{title}</span>
                  <span className="block truncate text-[length:var(--text-step--1)] text-fg-subtle">
                    {'subtitle' in def ? def.subtitle(data) : ''}
                    {data.published === false && ' · hidden'}
                  </span>
                </Link>
                <RowActions
                  collection={collection}
                  id={row.id}
                  title={title}
                  first={i === 0}
                  last={i === rows.length - 1}
                />
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
