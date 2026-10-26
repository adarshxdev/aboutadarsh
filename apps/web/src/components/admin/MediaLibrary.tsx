'use client'

import { useState } from 'react'
import { api, type MediaItem } from './client'
import { MediaPreview } from './MediaPicker'
import { ACCEPT, formatBytes, uploadFile } from './upload'

type Upload = { name: string; progress: number; error?: string }

/** Upload (button or drag and drop, several at once) and manage every stored file. */
export function MediaLibrary({ initial }: { initial: MediaItem[] }) {
  const [items, setItems] = useState(initial)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const uploadAll = async (files: FileList | File[]) => {
    const list = [...files]
    setUploads((u) => [...u, ...list.map((f) => ({ name: f.name, progress: 0 }))])
    await Promise.all(
      list.map(async (file) => {
        const patch = (p: Partial<Upload>) =>
          setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, ...p } : x)))
        try {
          const item = await uploadFile(file, (progress) => patch({ progress }))
          setItems((xs) => [item, ...xs])
          setUploads((u) => u.filter((x) => x.name !== file.name))
        } catch (e) {
          patch({ error: e instanceof Error ? e.message : 'Upload failed.' })
        }
      }),
    )
  }

  const copy = async (item: MediaItem) => {
    await navigator.clipboard.writeText(item.url)
    setCopied(item.id)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void uploadAll(e.dataTransfer.files)
        }}
        className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-accent bg-accent-subtle' : 'border-border hover:border-border-strong'
        }`}
      >
        <span className="font-medium">Drop files here, or click to choose</span>
        <span className="mt-1 text-[length:var(--text-step--1)] text-fg-subtle">
          Images, audio, video and PDFs
        </span>
        <input
          type="file"
          multiple
          accept={ACCEPT.any}
          className="sr-only"
          onChange={(e) => e.target.files && uploadAll(e.target.files)}
        />
      </label>

      {uploads.length > 0 && (
        <ul className="mt-4 space-y-2" aria-live="polite">
          {uploads.map((u) => (
            <li key={u.name} className="rounded-xl border border-border px-4 py-3">
              <div className="flex justify-between gap-4">
                <span className="truncate">{u.name}</span>
                <span className={u.error ? 'text-danger' : 'text-fg-muted'}>
                  {u.error ?? `${Math.round(u.progress * 100)}%`}
                </span>
              </div>
              {!u.error && (
                <div className="mt-2 h-1 overflow-hidden rounded bg-bg-subtle">
                  <div className="h-full bg-accent" style={{ width: `${u.progress * 100}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {items.length === 0 ? (
        <p className="mt-8 text-fg-muted">No files yet.</p>
      ) : (
        <ul className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
          {items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-2xl border border-border bg-bg-raised">
              <div className={item.kind === 'audio' ? 'p-3' : 'aspect-video bg-bg-subtle'}>
                <MediaPreview url={item.url} kind={item.kind} />
              </div>
              <div className="space-y-2 p-4">
                <p className="truncate font-medium" title={item.filename}>
                  {item.filename}
                </p>
                <p className="text-[length:var(--text-step--1)] text-fg-subtle">
                  {item.kind} · {formatBytes(item.size)}
                </p>
                {item.kind === 'image' && (
                  <input
                    aria-label={`Alt text for ${item.filename}`}
                    placeholder="Alt text"
                    defaultValue={item.alt ?? ''}
                    onBlur={(e) =>
                      void api(`/admin/media/${item.id}`, { method: 'PATCH', body: { alt: e.target.value } })
                    }
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-[length:var(--text-step--1)]"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copy(item)}
                    className="min-h-9 rounded-lg px-3 text-[length:var(--text-step--1)] hover:bg-bg-subtle"
                  >
                    {copied === item.id ? 'Copied' : 'Copy URL'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`Delete ${item.filename}? Pages using it will show a broken link.`)) return
                      await api(`/admin/media/${item.id}`, { method: 'DELETE' })
                      setItems((xs) => xs.filter((x) => x.id !== item.id))
                    }}
                    className="min-h-9 rounded-lg px-3 text-[length:var(--text-step--1)] text-danger hover:bg-bg-subtle"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
