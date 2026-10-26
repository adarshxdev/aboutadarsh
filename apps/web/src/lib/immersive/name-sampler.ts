/**
 * Rasterise text and pick `count` target points on its strokes — the bead
 * layout behind the intro, the logo and /justme. Points on the trailing "."
 * are flagged so they can be drawn in the accent colour.
 */
export function sampleText(
  text: string,
  width: number,
  height: number,
  count: number,
  fontFamily: string,
  align: 'left' | 'center' = 'center',
) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  // As large as fits: by height, then shrink if the word is too wide.
  let size = height * (align === 'left' ? 0.78 : 0.5)
  ctx.font = `800 ${size}px ${fontFamily}`
  const fit = (width * (align === 'left' ? 0.98 : 0.85)) / Math.max(ctx.measureText(text).width, 1)
  if (fit < 1) {
    size *= fit
    ctx.font = `800 ${size}px ${fontFamily}`
  }
  const x0 = align === 'left' ? 1 : width / 2
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText(text, x0, height / 2)

  // Where the trailing dot starts, if there is one.
  const body = text.endsWith('.') ? text.slice(0, -1) : text
  const bodyWidth = ctx.measureText(body).width
  const left = align === 'left' ? x0 : x0 - ctx.measureText(text).width / 2
  const dotFrom = text.endsWith('.') ? left + bodyWidth : Infinity

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const step = height < 80 ? 1 : 2
  const filled: number[] = []
  for (let y = 0; y < canvas.height; y += step)
    for (let x = 0; x < canvas.width; x += step)
      if (data[(y * canvas.width + x) * 4 + 3] > 140) filled.push(x, y)

  const targets = new Float32Array(count * 2)
  const accent = new Uint8Array(count)
  for (let i = 0; i < count; i++) {
    const k = filled.length ? Math.floor(Math.random() * (filled.length / 2)) * 2 : 0
    targets[i * 2] = filled[k] ?? width / 2
    targets[i * 2 + 1] = filled[k + 1] ?? height / 2
    accent[i] = targets[i * 2] >= dotFrom ? 1 : 0
  }
  return { targets, accent }
}

/**
 * Dot-matrix layout: one bead per grid cell inside the letters, `spacing` px
 * apart. Crisper than random sampling at small sizes, where random points pile
 * up and blur the letterforms. The bead count follows from the text and size.
 */
export function gridText(
  text: string,
  width: number,
  height: number,
  spacing: number,
  fontFamily: string,
  align: 'left' | 'center' = 'center',
) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  let size = height * (align === 'left' ? 0.78 : 0.5)
  ctx.font = `800 ${size}px ${fontFamily}`
  const fit = (width * (align === 'left' ? 0.98 : 0.86)) / Math.max(ctx.measureText(text).width, 1)
  if (fit < 1) {
    size *= fit
    ctx.font = `800 ${size}px ${fontFamily}`
  }
  const x0 = align === 'left' ? 1 : width / 2
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText(text, x0, height / 2)

  const body = text.endsWith('.') ? text.slice(0, -1) : text
  const left = align === 'left' ? x0 : x0 - ctx.measureText(text).width / 2
  const dotFrom = text.endsWith('.') ? left + ctx.measureText(body).width : Infinity

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const xs: number[] = []
  for (let y = spacing / 2; y < canvas.height; y += spacing) {
    for (let x = spacing / 2; x < canvas.width; x += spacing) {
      if (data[(Math.floor(y) * canvas.width + Math.floor(x)) * 4 + 3] > 110) xs.push(x, y)
    }
  }
  const count = xs.length / 2
  const targets = Float32Array.from(xs)
  const accent = new Uint8Array(count)
  for (let i = 0; i < count; i++) accent[i] = targets[i * 2] >= dotFrom ? 1 : 0
  return { targets, accent }
}
