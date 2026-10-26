import type { Metadata } from 'next'
import { adminApi } from '@/lib/api'
import type { MediaItem } from '@/components/admin/client'
import { MediaLibrary } from '@/components/admin/MediaLibrary'

export const metadata: Metadata = { title: 'Media' }

export default async function MediaPage() {
  const status = await adminApi<{ database: string; storage: boolean }>('/admin/status')
  const ready = status.storage && status.database === 'ok'
  return (
    <div className="max-w-6xl">
      <h1 className="mb-2 text-[length:var(--text-step-4)]">Media</h1>
      <p className="mb-8 text-fg-muted">
        Images, résumé PDFs, music and video. Pick them from any image or file field, or copy a URL.
      </p>
      {ready ? (
        <MediaLibrary initial={(await adminApi<{ items: MediaItem[] }>('/admin/media')).items} />
      ) : (
        <p role="alert" className="rounded-xl bg-bg-subtle p-4 text-fg-muted">
          Uploads need a database and file storage. Set <code>DATABASE_URL</code> and the <code>S3_*</code>{' '}
          variables — see the README.
        </p>
      )}
    </div>
  )
}
