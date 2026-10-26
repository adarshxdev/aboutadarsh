'use client'

import { api, type MediaItem } from './client'

/**
 * Upload one file: ask the API for a presigned URL, PUT the bytes straight to
 * storage (XHR, for progress), then have the API verify and record it.
 */
export async function uploadFile(file: File, onProgress?: (fraction: number) => void): Promise<MediaItem> {
  const contentType = file.type || 'application/octet-stream'
  const signed = await api<{ key: string; url: string }>('/admin/media/uploads', {
    body: { filename: file.name, contentType, size: file.size },
  })

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signed.url)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Storage rejected the upload (${xhr.status}).`))
    xhr.onerror = () => reject(new Error('Could not reach storage. Check the bucket CORS settings.'))
    xhr.send(file)
  })

  const done = await api<{ item: MediaItem }>('/admin/media', {
    body: { key: signed.key, filename: file.name },
  })
  return done.item
}

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`

/** `accept` attribute per media kind. */
export const ACCEPT: Record<string, string> = {
  image: 'image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml',
  audio: 'audio/*',
  video: 'video/mp4,video/webm,video/quicktime',
  document: 'application/pdf',
  any: 'image/*,audio/*,video/mp4,video/webm,video/quicktime,application/pdf',
}
