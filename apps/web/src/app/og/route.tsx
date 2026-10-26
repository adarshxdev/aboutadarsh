import { ImageResponse } from 'next/og'
import { getSite } from '@/lib/content'

export const runtime = 'nodejs'

const SIZE = { width: 1200, height: 630 }

/** Dynamic OG images — plan.md §11. One per route, driven by query params. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const { profile } = await getSite()
  const title = (searchParams.get('title') ?? profile.name).slice(0, 90)
  const subtitle = (searchParams.get('subtitle') ?? profile.title).slice(0, 90)

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px',
        background: '#111318',
        color: '#f5f6f8',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -180,
          left: -120,
          width: 620,
          height: 620,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(110,110,255,0.42) 0%, rgba(17,19,24,0) 68%)',
          display: 'flex',
        }}
      />
      <div style={{ display: 'flex', fontSize: 30, color: '#8f94a3', letterSpacing: '-0.01em' }}>
        {profile.name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.05 }}>
          {title}
        </div>
        <div style={{ fontSize: 34, color: '#8f94a3' }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', gap: 20, fontSize: 26, color: '#6e7383' }}>
        <span>{profile.location}</span>
        <span>·</span>
        <span>adarshxdev</span>
      </div>
    </div>,
    SIZE,
  )
}
