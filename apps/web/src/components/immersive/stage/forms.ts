import type { FormName, ParticleLogo } from '@/lib/immersive/chapters'

/**
 * Procedural particle shapes. Each returns `size * size` points packed as RGBA
 * floats (xyz + spare), one texel per particle, ready for a DataTexture the
 * simulation samples as its spring target. Units: the field spans roughly ±2.
 *
 * Seeded, so every visit draws the same shapes.
 */

type Vec3 = [number, number, number]
type Rand = () => number

function rng(seed: number): Rand {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const gauss = (r: Rand) => {
  // Box–Muller; one value is enough here.
  const u = Math.max(r(), 1e-6)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r())
}

function pack(size: number, point: (i: number, u: number, v: number) => Vec3) {
  const data = new Float32Array(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    const u = ((i % size) + 0.5) / size
    const v = (Math.floor(i / size) + 0.5) / size
    const [x, y, z] = point(i, u, v)
    data[i * 4] = x
    data[i * 4 + 1] = y
    data[i * 4 + 2] = z
    data[i * 4 + 3] = 1
  }
  return data
}

/** Length-weighted sampler over line segments, with a little thickness. */
function lines(segments: [Vec3, Vec3][], r: Rand, thickness = 0.015) {
  const lengths = segments.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]))
  const total = lengths.reduce((s, l) => s + l, 0)
  const cumulative: number[] = []
  lengths.reduce((acc, l, i) => (cumulative[i] = acc + l / total), 0)
  return (): Vec3 => {
    const pick = r()
    let i = cumulative.findIndex((c) => c >= pick)
    if (i < 0) i = segments.length - 1
    const [a, b] = segments[i]
    const t = r()
    return [
      a[0] + (b[0] - a[0]) * t + gauss(r) * thickness,
      a[1] + (b[1] - a[1]) * t + gauss(r) * thickness,
      a[2] + (b[2] - a[2]) * t + gauss(r) * thickness,
    ]
  }
}

/** Closed rectangle outline in the z = `z` plane. */
const rect = (x: number, y: number, w: number, h: number, z = 0): [Vec3, Vec3][] => [
  [
    [x, y, z],
    [x + w, y, z],
  ],
  [
    [x + w, y, z],
    [x + w, y - h, z],
  ],
  [
    [x + w, y - h, z],
    [x, y - h, z],
  ],
  [
    [x, y - h, z],
    [x, y, z],
  ],
]

/** A dot of particles, for nodes and commits. */
const blob = (c: Vec3, r: Rand, radius: number): Vec3 => [
  c[0] + gauss(r) * radius,
  c[1] + gauss(r) * radius,
  c[2] + gauss(r) * radius,
]

/* ---------- hero ---------- */

/**
 * The name, rasterised in the heading font and sampled, laid out as a nameplate
 * under the hero bust. Returns a point sampler, or null if the font produced
 * nothing (the bust then keeps every particle).
 */
function nameplate(text: string, fontFamily: string, r: Rand) {
  if (!text) return null
  const w = 640
  const h = 160
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.font = `800 ${h * 0.62}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText(text, w / 2, h / 2)
  const textWidth = Math.min(w, ctx.measureText(text).width)
  const data = ctx.getImageData(0, 0, w, h).data
  const filled: number[] = []
  for (let y = 0; y < h; y += 1)
    for (let x = 0; x < w; x += 1) if (data[(y * w + x) * 4 + 3] > 140) filled.push(x, y)
  if (!filled.length) return null

  // Fit the word to ~2.5 units wide, centred under the bust.
  const unit = 2.5 / Math.max(textWidth, 1)
  return (): Vec3 => {
    const k = Math.floor(r() * (filled.length / 2)) * 2
    return [(filled[k] - w / 2 + r()) * unit, NAME_Y - (filled[k + 1] - h / 2 + r()) * unit, gauss(r) * 0.04]
  }
}

/** Where the nameplate sits, and how the bust makes room for it. */
const NAME_Y = -1.72
const NAME_SHARE = 0.2
const BUST_SCALE = 0.86
const BUST_LIFT = 0.4

/**
 * Samples a drawn or loaded picture into particles: they land where it is
 * bright and opaque (shadows stay sparse but present, so planes read as
 * light and dark facets), and brightness pushes them forward for relief.
 */
function fromPicture(
  size: number,
  source: CanvasImageSource,
  w: number,
  h: number,
  r: Rand,
  /** Units the picture's taller side spans. */
  span: number,
  /** Faint floor so dark areas keep some particles. */
  floor: number,
) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(source, 0, 0, w, h)
  const px = ctx.getImageData(0, 0, w, h).data
  const weight = (x: number, y: number) => {
    const k = (y * w + x) * 4
    const lum = (0.2126 * px[k] + 0.7152 * px[k + 1] + 0.0722 * px[k + 2]) / 255
    return { w: (px[k + 3] / 255) * (floor + (1 - floor) * lum), lum }
  }
  const scale = span / Math.max(w, h)
  return (): Vec3 => {
    for (let attempt = 0; attempt < 60; attempt++) {
      const x = Math.floor(r() * w)
      const y = Math.floor(r() * h)
      const { w: wt, lum } = weight(x, y)
      if (r() < wt) return [(x - w / 2) * scale, -(y - h / 2) * scale, (lum - 0.5) * 0.45 + gauss(r) * 0.015]
    }
    return [gauss(r) * 1.2, gauss(r) * 1.4, -1.5]
  }
}

/**
 * Fallback hero, if the default cut-out (public/images/moai.png) fails to load:
 * a stylised stone head (a moai), drawn as flat-shaded
 * geometric planes — block brow, long nose, pursed lips, long ear, square
 * chin. Original drawing; facing left, toward the headline. Replaced by
 * `portraitFromImage` once a photo is configured.
 */
function moaiCanvas() {
  const W = 220
  const H = 300
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  // Drawn facing right, then mirrored so it faces the text on the left.
  ctx.translate(W, 0)
  ctx.scale(-1, 1)
  const poly = (lum: number, pts: [number, number][]) => {
    const v = Math.round(lum * 255)
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.beginPath()
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.closePath()
    ctx.fill()
  }
  // Back to front.
  poly(0.16, [
    [58, 250],
    [130, 270],
    [152, 274],
    [168, 300],
    [36, 300],
  ]) // neck and shoulders
  poly(0.26, [
    [42, 42],
    [118, 26],
    [124, 242],
    [62, 252],
    [46, 202],
  ]) // side of the head
  // Long ear with a carved slot.
  ctx.fillStyle = 'rgb(84,84,84)'
  ctx.beginPath()
  ctx.roundRect(30, 96, 22, 122, 11)
  ctx.fill()
  ctx.fillStyle = 'rgb(28,28,28)'
  ctx.beginPath()
  ctx.roundRect(38, 110, 8, 92, 4)
  ctx.fill()
  poly(0.95, [
    [96, 22],
    [150, 14],
    [178, 28],
    [180, 60],
    [110, 70],
  ]) // top of the head
  poly(0.82, [
    [110, 70],
    [180, 60],
    [186, 86],
    [114, 93],
  ]) // brow
  poly(0.05, [
    [114, 93],
    [186, 86],
    [178, 102],
    [120, 110],
  ]) // shadow under the brow
  poly(0.44, [
    [114, 93],
    [124, 108],
    [128, 250],
    [100, 256],
    [94, 112],
  ]) // side plane of the face
  poly(0.6, [
    [124, 108],
    [132, 182],
    [140, 198],
    [138, 250],
    [128, 250],
  ]) // cheek
  poly(0.38, [
    [124, 108],
    [140, 100],
    [160, 180],
    [132, 183],
  ]) // side of the nose
  poly(0.93, [
    [140, 100],
    [165, 96],
    [186, 174],
    [160, 180],
  ]) // bridge of the nose, lit
  poly(0.07, [
    [132, 183],
    [160, 180],
    [190, 174],
    [189, 192],
    [140, 199],
  ]) // under the nose
  poly(0.86, [
    [138, 204],
    [192, 199],
    [197, 217],
    [140, 222],
  ]) // upper lip
  poly(0.04, [
    [140, 222],
    [197, 217],
    [195, 228],
    [142, 232],
  ]) // mouth
  poly(0.6, [
    [142, 232],
    [195, 228],
    [191, 242],
    [146, 246],
  ]) // lower lip
  poly(0.9, [
    [130, 246],
    [191, 242],
    [187, 268],
    [128, 272],
  ]) // chin
  poly(0.24, [
    [100, 256],
    [130, 246],
    [128, 272],
    [104, 279],
  ]) // jaw
  return { canvas: c, w: W, h: H }
}

function portrait(size: number, name: string, fontFamily: string) {
  const r = rng(2)
  const plate = nameplate(name, fontFamily, r)
  const { canvas, w, h } = moaiCanvas()
  const head = fromPicture(size, canvas, w, h, r, 3.9, 0.08)
  return pack(size, () => {
    if (plate && r() < NAME_SHARE) return plate()
    const [x, y, z] = head()
    return plate ? [x * BUST_SCALE, y * BUST_SCALE + BUST_LIFT, z * BUST_SCALE] : [x, y, z]
  })
}

/**
 * Bust from a photo: particles land where the image is bright and opaque, and
 * brightness pushes them forward for a little relief. Best with a cut-out
 * (transparent or dark background), head-and-shoulders, roughly square.
 */
function portraitFromImage(size: number, image: HTMLImageElement, name: string, fontFamily: string) {
  const r = rng(4)
  const plate = nameplate(name, fontFamily, r)
  const w = 256
  const h = Math.round((w * image.naturalHeight) / image.naturalWidth) || w
  // A faint floor keeps shadowed planes (eye sockets, under the brow) visible.
  const body = fromPicture(size, image, w, h, r, 3.7, 0.1)
  return pack(size, () => {
    if (plate && r() < NAME_SHARE) return plate()
    const [x, y, z] = body()
    return plate ? [x * 0.85, y * 0.85 + 0.35, z * 0.85] : [x, y, z]
  })
}

/* ---------- sections ---------- */

/** A small neural network: layers of nodes, fully connected. */
function network(size: number) {
  const r = rng(3)
  const layers = [4, 6, 6, 3]
  const nodes = layers.map((count, l) =>
    Array.from({ length: count }, (_, i): Vec3 => [
      (l - (layers.length - 1) / 2) * 1.25,
      (i - (count - 1) / 2) * 0.62,
      (r() - 0.5) * 0.3,
    ]),
  )
  const edges: [Vec3, Vec3][] = []
  for (let l = 0; l < nodes.length - 1; l++)
    for (const a of nodes[l]) for (const b of nodes[l + 1]) edges.push([a, b])
  const edge = lines(edges, r, 0.008)
  const all = nodes.flat()
  return pack(size, () => (r() < 0.38 ? blob(all[Math.floor(r() * all.length)], r, 0.06) : edge()))
}

/** Stacked layers, like an architecture diagram, tilted so the tops show. */
function stack(size: number) {
  const r = rng(5)
  const tilt = 0.55
  const cos = Math.cos(tilt)
  const sin = Math.sin(tilt)
  const levels = [-1.15, -0.38, 0.38, 1.15]
  const half = 1.3
  return pack(size, () => {
    const y = levels[Math.floor(r() * levels.length)]
    let x: number
    let z: number
    if (r() < 0.62) {
      // Slab edge.
      const t = r() * 2 - 1
      const side = Math.floor(r() * 4)
      x = side < 2 ? t * half : (side === 2 ? 1 : -1) * half
      z = side < 2 ? (side === 0 ? 1 : -1) * half : t * half
    } else {
      // Sparse top surface.
      x = (r() * 2 - 1) * half
      z = (r() * 2 - 1) * half
    }
    const py = y + gauss(r) * 0.012
    // Rotate about x.
    return [x, py * cos - z * sin, py * sin + z * cos]
  })
}

/** A git history: main line with feature branches forking and merging back. */
function graph(size: number) {
  const r = rng(7)
  const segments: [Vec3, Vec3][] = [
    [
      [0, -1.9, 0],
      [0, 1.9, 0],
    ],
  ]
  const commits: Vec3[] = []
  for (let y = -1.8; y <= 1.8; y += 0.45) commits.push([0, y, 0])
  const branches = [
    { from: -1.6, to: -0.4, x: 0.85 },
    { from: -1.0, to: 0.7, x: -0.85 },
    { from: 0.2, to: 1.5, x: 0.85 },
    { from: 0.5, to: 1.2, x: 1.7 },
  ]
  for (const b of branches) {
    const rise = 0.3
    segments.push([
      [0, b.from, 0],
      [b.x, b.from + rise, 0],
    ])
    segments.push([
      [b.x, b.from + rise, 0],
      [b.x, b.to - rise, 0],
    ])
    segments.push([
      [b.x, b.to - rise, 0],
      [0, b.to, 0],
    ])
    for (let y = b.from + rise; y <= b.to - rise + 0.01; y += 0.4) commits.push([b.x, y, 0])
  }
  const edge = lines(segments, r, 0.012)
  return pack(size, () => {
    if (r() < 0.45) {
      // Commit: a ring, like the nodes in a git log graph.
      const c = commits[Math.floor(r() * commits.length)]
      const a = r() * Math.PI * 2
      const rad = 0.09 + gauss(r) * 0.01
      return [c[0] + Math.cos(a) * rad, c[1] + Math.sin(a) * rad, gauss(r) * 0.02]
    }
    return edge()
  })
}

/** Three browser windows, staggered in depth: title bar, controls, lines of content. */
function windows(size: number) {
  const r = rng(9)
  const w = 2.3
  const h = 1.5
  const segments: [Vec3, Vec3][] = []
  const content: [Vec3, Vec3][] = []
  const dots: Vec3[] = []
  for (let i = 0; i < 3; i++) {
    const x = -w / 2 - 0.4 + i * 0.4
    const y = h / 2 + 0.4 - i * 0.4
    const z = -i * 0.5
    segments.push(...rect(x, y, w, h, z))
    segments.push([
      [x, y - 0.26, z],
      [x + w, y - 0.26, z],
    ])
    for (let d = 0; d < 3; d++) dots.push([x + 0.16 + d * 0.14, y - 0.13, z])
    // Only the front window gets readable "content".
    if (i === 2) {
      const widths = [0.75, 0.55, 0.85, 0.4]
      widths.forEach((f, k) =>
        content.push([
          [x + 0.22, y - 0.55 - k * 0.24, z],
          [x + 0.22 + (w - 0.44) * f, y - 0.55 - k * 0.24, z],
        ]),
      )
    }
  }
  const frame = lines(segments, r, 0.01)
  const text = lines(content, r, 0.02)
  return pack(size, () => {
    const roll = r()
    if (roll < 0.06) return blob(dots[Math.floor(r() * dots.length)], r, 0.025)
    if (roll < 0.45) return text()
    return frame()
  })
}

/** An envelope: outline, flap, and the folds underneath. */
function envelope(size: number) {
  const r = rng(11)
  const w = 3.2
  const h = 2.1
  const x = -w / 2
  const y = h / 2
  const segments: [Vec3, Vec3][] = [
    ...rect(x, y, w, h),
    [
      [x, y, 0],
      [0, -0.05, 0.05],
    ],
    [
      [x + w, y, 0],
      [0, -0.05, 0.05],
    ],
    [
      [x, y - h, 0],
      [-0.35, -0.2, 0],
    ],
    [
      [x + w, y - h, 0],
      [0.35, -0.2, 0],
    ],
  ]
  const edge = lines(segments, r, 0.014)
  return pack(size, () => (r() < 0.12 ? [(r() - 0.5) * w, (r() - 0.5) * h, -0.02] : edge()))
}

/* ---------- code ---------- */

/** "</>" rasterised, then sampled. Needs a DOM, so it only runs client-side. */
function glyph(size: number, fontFamily: string) {
  const r = rng(1)
  const w = 512
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${h * 0.7}px ${fontFamily}`
  ctx.fillText('</>', w / 2, h / 2)

  const pixels = ctx.getImageData(0, 0, w, h).data
  const filled: number[] = []
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (pixels[(y * w + x) * 4 + 3] > 128) filled.push(x, y)
    }
  }
  // Empty if the font failed entirely; fall back to the network so the field is never blank.
  if (!filled.length) return network(size)

  const scale = 4.2 / w
  return pack(size, () => {
    const k = Math.floor(r() * (filled.length / 2)) * 2
    return [
      (filled[k] - w / 2 + r() * 2) * scale,
      -(filled[k + 1] - h / 2 + r() * 2) * scale,
      gauss(r) * 0.12,
    ]
  })
}

/**
 * A brand logo from its SVG path (Simple Icons, 24×24 viewBox), rasterised and
 * sampled like the glyph. Mostly fill, with a share of particles on the edge
 * so the silhouette stays crisp.
 */
/**
 * Point sampler for one logo: returns a function giving points across the
 * mark in a ±1.8 square (mostly fill, ~30% on the edge so the silhouette
 * stays crisp), or null if the mark rendered nothing.
 */
function logoSampler(mark: ParticleLogo, r: Rand) {
  const px = 256
  const canvas = document.createElement('canvas')
  canvas.width = px
  canvas.height = px
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  if (mark.path) {
    const scale = (px * 0.9) / 24
    ctx.translate(px * 0.05, px * 0.05)
    ctx.scale(scale, scale)
    ctx.fillStyle = '#fff'
    ctx.fill(new Path2D(mark.path))
  } else if (mark.image) {
    // Fit the image, keeping its aspect ratio (wordmarks like AWS are wide).
    const img = mark.image
    const fit = (px * 0.9) / Math.max(img.naturalWidth, img.naturalHeight, 1)
    const iw = img.naturalWidth * fit
    const ih = img.naturalHeight * fit
    ctx.drawImage(img, (px - iw) / 2, (px - ih) / 2, iw, ih)
  }
  const raw = ctx.getImageData(0, 0, px, px).data
  const data = mark.path ? raw : imageMask(raw, px, mark.mask ?? 'alpha')

  const fill: number[] = []
  const edge: number[] = []
  const solid = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < px && y < px && data[(y * px + x) * 4 + 3] > 128
  for (let y = 0; y < px; y++) {
    for (let x = 0; x < px; x++) {
      if (!solid(x, y)) continue
      fill.push(x, y)
      if (!solid(x + 2, y) || !solid(x - 2, y) || !solid(x, y + 2) || !solid(x, y - 2)) edge.push(x, y)
    }
  }
  if (!fill.length) return null

  const unit = 3.6 / px
  return (): Vec3 => {
    const pool = edge.length && r() < 0.3 ? edge : fill
    const k = Math.floor(r() * (pool.length / 2)) * 2
    return [(pool[k] - px / 2 + r()) * unit, -(pool[k + 1] - px / 2 + r()) * unit, gauss(r) * 0.06]
  }
}

/** One logo, filling the field (hovered skill tile). */
function logo(size: number, mark: ParticleLogo, seedValue: number) {
  const sample = logoSampler(mark, rng(seedValue))
  return sample ? pack(size, sample) : network(size)
}

/** Two stacked rings: the first `split` logos on top, the rest below. */
export const RING = { radius: 1.5, logoScale: 0.29, gap: 0.62, tilt: 0.22 }

/** Ring and slot for logo k, given how many go on the top ring. */
export function ringSlot(k: number, n: number, split: number) {
  const top = k < split
  const count = top ? split : n - split
  const index = top ? k : k - split
  // Bottom ring sits half a slot round, so logos stagger rather than stack.
  const theta = ((index + (top ? 0 : 0.5)) / count) * Math.PI * 2
  return { theta, y: top ? RING.gap : -RING.gap, count }
}

/**
 * All logos at once, on two rings facing outward: particle i belongs to logo
 * i % n, so `ringPalette` can colour each logo in its brand colour. The rings
 * are spun by the scene (Particles), not the simulation.
 */
function logoRing(size: number, logos: ParticleLogo[], split: number) {
  const r = rng(77)
  const samplers = logos.map((l) => logoSampler(l, r))
  const n = logos.length
  return pack(size, (i) => {
    const k = i % n
    const sample = samplers[k]
    const [x, y, z] = sample ? sample() : [gauss(r) * 0.3, gauss(r) * 0.3, 0]
    const { theta, y: ringY } = ringSlot(k, n, split)
    const lx = x * RING.logoScale
    const lz = z * RING.logoScale
    // Rotate the logo to face outward at angle theta, then push it out to the ring.
    return [
      Math.sin(theta) * RING.radius + Math.cos(theta) * lx + Math.sin(theta) * lz,
      ringY + y * RING.logoScale,
      Math.cos(theta) * RING.radius - Math.sin(theta) * lx + Math.cos(theta) * lz,
    ]
  })
}

/**
 * Linear RGB per particle for the ring: each logo in its brand colour.
 * Colours are converted by the caller (three's colour management).
 */
export function ringPalette(size: number, colors: [number, number, number][]) {
  const data = new Float32Array(size * size * 4)
  const n = Math.max(colors.length, 1)
  for (let i = 0; i < size * size; i++) {
    const [r0, g0, b0] = colors[i % n] ?? [1, 1, 1]
    data.set([r0, g0, b0, 1], i * 4)
  }
  return data
}

/**
 * Alpha-only mask (mark = alpha 255) of a logo picture. `alpha`: everything
 * opaque. `tile`: everything opaque that differs clearly from the tile colour,
 * sampled just inside the tile's left edge.
 */
function imageMask(raw: Uint8ClampedArray, px: number, mode: 'alpha' | 'tile') {
  const out = new Uint8ClampedArray(raw.length)
  const opaque = (i: number) => raw[i * 4 + 3] > 128
  let ref = -1
  if (mode === 'tile') {
    const row = Math.floor(px / 2) * px
    for (let x = 0; x < px; x++) {
      if (opaque(row + x)) {
        ref = row + x + 3 // a few pixels in, past any anti-aliased edge
        break
      }
    }
  }
  const [rr, rg, rb] = ref >= 0 ? [raw[ref * 4], raw[ref * 4 + 1], raw[ref * 4 + 2]] : [0, 0, 0]
  for (let i = 0; i < px * px; i++) {
    let on = opaque(i)
    if (on && ref >= 0) {
      on = Math.abs(raw[i * 4] - rr) + Math.abs(raw[i * 4 + 1] - rg) + Math.abs(raw[i * 4 + 2] - rb) > 120
    }
    out[i * 4 + 3] = on ? 255 : 0
  }
  return out
}

/** Flat grid where a particle's texel uv is its position, so video maps 1:1. */
function screen(size: number) {
  const width = 4.2
  const height = width * (9 / 16)
  return pack(size, (_, u, v) => [(u - 0.5) * width, (v - 0.5) * height, 0])
}

/** Every form at the given particle resolution. */
export function buildForms(
  size: number,
  fontFamily: string,
  portraitImage: HTMLImageElement | null,
  logos: ParticleLogo[],
  /** How many of `logos` go on the top ring. */
  ringSplit: number,
  /** Drawn as a nameplate under the hero bust. */
  name: string,
): Record<FormName, Float32Array> {
  const logoForms = Object.fromEntries(logos.map((l, i) => [`logo:${i}`, logo(size, l, 100 + i)]))
  return {
    ...logoForms,
    logos: logos.length ? logoRing(size, logos, ringSplit) : network(size),
    portrait: portraitImage
      ? portraitFromImage(size, portraitImage, name, fontFamily)
      : portrait(size, name, fontFamily),
    // Same bust without the nameplate, for narrow screens.
    portraitBare: portraitImage
      ? portraitFromImage(size, portraitImage, '', fontFamily)
      : portrait(size, '', fontFamily),
    network: network(size),
    stack: stack(size),
    graph: graph(size),
    windows: windows(size),
    envelope: envelope(size),
    glyph: glyph(size, fontFamily),
    screen: screen(size),
  }
}
