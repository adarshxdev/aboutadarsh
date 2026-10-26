import { randomUUID } from 'node:crypto'
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env as config } from '../env.js'

/**
 * File storage over the S3 API, so one code path covers RustFS locally
 * (docker-compose), Cloudflare R2, AWS S3 and Supabase Storage.
 *
 * Browsers upload straight to the bucket with a short-lived presigned PUT, so
 * large files (music, video) never pass through a serverless function and its
 * ~4.5 MB body limit. Files are served from S3_PUBLIC_URL.
 */
const env = {
  bucket: config.S3_BUCKET,
  region: config.S3_REGION,
  endpoint: config.S3_ENDPOINT,
  /** Endpoint the *browser* uploads to, when it differs (Docker: localhost vs service name). */
  presignEndpoint: config.S3_PRESIGN_ENDPOINT ?? config.S3_ENDPOINT,
  accessKeyId: config.S3_ACCESS_KEY_ID,
  secretAccessKey: config.S3_SECRET_ACCESS_KEY,
  publicUrl: config.S3_PUBLIC_URL?.replace(/\/$/, ''),
  // Path-style URLs (host/bucket/key) for RustFS, MinIO and Supabase.
  forcePathStyle: config.S3_FORCE_PATH_STYLE,
}

export const hasStorage = Boolean(env.bucket && env.accessKeyId && env.secretAccessKey && env.publicUrl)

/** Largest accepted upload. Override with UPLOAD_MAX_MB. */
export const MAX_UPLOAD_BYTES = config.UPLOAD_MAX_MB * 1024 * 1024

const client = (endpoint: string | undefined) =>
  new S3Client({
    region: env.region,
    endpoint,
    forcePathStyle: env.forcePathStyle,
    credentials: { accessKeyId: env.accessKeyId!, secretAccessKey: env.secretAccessKey! },
  })

let internal: S3Client | null = null
let presigner: S3Client | null = null
const s3 = () => (internal ??= client(env.endpoint))
const s3Presign = () => (presigner ??= client(env.presignEndpoint))

export type MediaKind = 'image' | 'audio' | 'video' | 'document'

/** What may be uploaded. Anything else is refused before a URL is signed. */
export function mediaKind(contentType: string): MediaKind | null {
  if (/^image\/(png|jpe?g|webp|gif|avif|svg\+xml)$/.test(contentType)) return 'image'
  if (/^audio\/(mpeg|mp3|mp4|aac|ogg|wav|x-wav|webm|flac|x-m4a)$/.test(contentType)) return 'audio'
  if (/^video\/(mp4|webm|quicktime)$/.test(contentType)) return 'video'
  if (contentType === 'application/pdf') return 'document'
  return null
}

/** Lowercase, dash-separated, extension kept; never trust a client filename in a key. */
export function safeFilename(name: string) {
  const dot = name.lastIndexOf('.')
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .slice(0, 60)
  const ext =
    dot > 0
      ? name
          .slice(dot + 1)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 8)
      : ''
  return `${base || 'file'}${ext ? `.${ext}` : ''}`
}

export function newKey(filename: string) {
  const now = new Date()
  const month = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  return `media/${month}/${randomUUID().slice(0, 8)}-${safeFilename(filename)}`
}

export const publicUrl = (key: string) => `${env.publicUrl}/${key}`

export async function presignUpload(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: env.bucket,
    Key: key,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  })
  return getSignedUrl(s3Presign(), command, { expiresIn: 600 })
}

/** Size and type of an uploaded object, or null if it isn't there. */
export async function headObject(key: string) {
  try {
    const res = await s3().send(new HeadObjectCommand({ Bucket: env.bucket, Key: key }))
    return { size: res.ContentLength ?? 0, contentType: res.ContentType ?? '' }
  } catch {
    return null
  }
}

export async function deleteObject(key: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: env.bucket, Key: key }))
}
