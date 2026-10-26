/**
 * Coconut palm silhouette, generated: a curved ringed trunk, drooping
 * feathered fronds and a coconut cluster. Dark fill with a neon rim (CSS).
 */
const CROWN = { x: 182, y: 150 }
const r = (n: number) => Math.round(n * 10) / 10

/** One frond: a drooping spine with a serrated, leaflet-like outline. */
function frond(angleDeg: number, length: number, droop: number, width: number) {
  const a = (angleDeg * Math.PI) / 180
  const N = 22
  const upper: string[] = []
  const lower: string[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const x = CROWN.x + Math.cos(a) * length * t
    const y = CROWN.y + Math.sin(a) * length * t + droop * length * t * t
    // Spine direction → normal.
    const dx = Math.cos(a) * length
    const dy = Math.sin(a) * length + 2 * droop * length * t
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    // Leaflets: alternate long and short to read as a feathered frond.
    const w = width * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - 0.35 * t) * (i % 2 ? 1 : 0.45)
    upper.push(`${r(x + nx * w)},${r(y + ny * w)}`)
    lower.unshift(`${r(x - nx * w * 0.8)},${r(y - ny * w * 0.8)}`)
  }
  return `M${CROWN.x},${CROWN.y} L${upper.join(' L')} L${lower.join(' L')} Z`
}

// [angle (y-down degrees), length, droop, width]
const FRONDS: [number, number, number, number][] = [
  [-172, 150, 0.55, 26],
  [-148, 140, 0.45, 24],
  [-118, 115, 0.3, 20],
  [-88, 95, 0.25, 18],
  [-58, 120, 0.32, 20],
  [-28, 145, 0.48, 24],
  [-4, 155, 0.6, 26],
  [168, 125, 0.75, 22],
  [12, 120, 0.8, 22],
]

const FRONDS_D = FRONDS.map((f) => frond(...f))

/** Trunk: tapered, leaning, bending at the top. */
const TRUNK_D = `M148,500 C150,400 160,280 ${CROWN.x - 9},${CROWN.y + 6} L${CROWN.x + 7},${CROWN.y + 8} C176,280 172,400 176,500 Z`

/** Rings across the trunk, following its curve. */
const RINGS = Array.from({ length: 16 }, (_, i) => {
  const t = (i + 1) / 17
  const y = 500 - t * (500 - CROWN.y - 10)
  const cx = 162 + (CROWN.x - 162) * Math.pow(t, 1.6)
  const half = 14 - 7 * t
  return `M${r(cx - half)},${r(y + 2)} Q${r(cx)},${r(y - 3)} ${r(cx + half)},${r(y + 2)}`
}).join(' ')

export function Palm({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 360 500" aria-hidden="true">
      <path className="cz-palm__trunk" d={TRUNK_D} />
      <path className="cz-palm__rings" d={RINGS} />
      {FRONDS_D.map((d, i) => (
        <path key={i} className="cz-palm__frond" d={d} />
      ))}
      {[
        [CROWN.x - 9, CROWN.y + 12],
        [CROWN.x + 7, CROWN.y + 14],
        [CROWN.x - 1, CROWN.y + 24],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} className="cz-palm__nut" cx={cx} cy={cy} r={8} />
      ))}
    </svg>
  )
}
