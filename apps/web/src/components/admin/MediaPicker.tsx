'use client'

import { useEffect, useRef, useState } from 'react'
import { api, type MediaItem } from './client'
import { ACCEPT, formatBytes, uploadFile } from './upload'

/**
 * Small preview for any media kind. `controls` off when the preview sits
 * inside a button (players can't nest in interactive elements).
 */
export function MediaPreview({
  url,
  kind,
  className,
  controls = true,
}: {
  url: string
  kind: string
  className?: string
  controls?: boolean
}) {
  if (kind === 'image') {
    // Admin-only preview of arbitrary storage hosts.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={className ?? 'size-full object-cover'} />
  }
  if (kind === 'audio' && controls) return <audio src={url} controls preload="none" className="w-full" />
  if (kind === 'video') {
    return (
      <video
        src={url}
        controls={controls}
        preload="metadata"
        muted
        className={className ?? 'size-full object-cover'}
      />
    )
  }
  return (
    <span className="flex size-full items-center justify-center text-[length:var(--text-step--1)] text-fg-muted">
      {kind === 'audio' ? '♪ Audio' : 'PDF'}
    </span>
  )
}

/**
 * Modal over the media library, filtered to one kind. Pick an existing file
 * or upload a new one; either way `onPick` gets its public URL.
 */
export function MediaPicker({
  open,
  kind,
  onClose,
  onPick,
}: {
  open: boolean
  kind: string
  onClose: () => void
  onPick: (item: MediaItem) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      setItems(null)
      void api<{ items: MediaItem[] }>(`/admin/media?kind=${encodeURIComponent(kind)}`)
        .then((r) => setItems(r.items))
        .catch(() => setItems([]))
    }
    if (!open && el.open) el.close()
  }, [open, kind])

  const upload = async (file: File) => {
    setError(null)
    setProgress(0)
    try {
      const item = await uploadFile(file, setProgress)
      onPick(item)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setProgress(null)
    }
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      className="m-auto w-[min(56rem,calc(100vw-2rem))] rounded-2xl border border-border bg-bg p-0 text-fg backdrop:bg-black/60"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <h2 className="text-[length:var(--text-step-1)]">Choose {kind}</h2>
        <div className="flex items-center gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-accent px-4 font-medium text-accent-fg">
            {progress === null ? 'Upload new' : `Uploading ${Math.round(progress * 100)}%`}
            <input
              type="file"
              accept={ACCEPT[kind] ?? ACCEPT.any}
              className="sr-only"
              disabled={progress !== null}
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </label>
          <button type="button" onClick={onClose} className="min-h-11 rounded-full px-4 hover:bg-bg-subtle">
            Close
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="px-6 pt-4 text-danger">
          {error}
        </p>
      )}
      <div className="max-h-[60vh] overflow-y-auto p-6">
        {items === null ? (
          <p className="text-fg-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-fg-muted">No {kind} files yet. Upload one above.</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onPick(item)}
                  className="w-full overflow-hidden rounded-xl border border-border text-left hover:border-accent"
                >
                  <div className="aspect-square bg-bg-subtle">
                    <MediaPreview url={item.url} kind={item.kind} controls={false} />
                  </div>
                  <p className="truncate px-3 pt-2 text-[length:var(--text-step--1)]">{item.filename}</p>
                  <p className="px-3 pb-2 text-[length:var(--text-step--1)] text-fg-subtle">
                    {formatBytes(item.size)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </dialog>
  )
}
