/**
 * Validates the default content in src/content. Database content is validated
 * on save by the API. Local asset paths are checked against apps/web/public.
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { staticContent } from '../src/content/index.js'
import { checkContent } from '../src/content/check.js'

const publicDir = fileURLToPath(new URL('../../../apps/web/public', import.meta.url))
const { errors, warnings } = checkContent(staticContent, (src) => existsSync(path.join(publicDir, src)))

for (const w of warnings) console.warn(`  warn  ${w}`)
for (const e of errors) console.error(`  error ${e}`)
if (errors.length) {
  console.error(`\ncontent:check failed — ${errors.length} error(s)\n`)
  process.exit(1)
}
console.log(`content:check passed${warnings.length ? ` with ${warnings.length} warning(s)` : ''}`)
