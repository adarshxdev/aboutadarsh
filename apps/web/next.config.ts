import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

/** Monorepo root: dependencies are hoisted there, so tracing and Turbopack must start from it. */
const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

/** Where the Express API runs. Browsers never call it directly — see rewrites. */
const apiUrl = (process.env.API_URL ?? 'http://localhost:4000').replace(/\/$/, '')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Self-contained server bundle for the Docker image; Vercel ignores this.
  output: process.env.BUILD_STANDALONE ? 'standalone' : undefined,
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  /**
   * /api/* is proxied to Express, so the browser only ever talks to this
   * origin: the admin session cookie stays first-party, and there's no CORS.
   * Next's own routes (e.g. /api/revalidate) are matched first.
   */
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
    ]
  },
}

export default nextConfig
