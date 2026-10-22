// Reports how much the app downloads on first load, and what is downloaded later, from the
// production build in dist/. Fails if the first load is over budget. Run `npm run build` first.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

/** The most JavaScript and CSS (gzipped) the first page load may download. */
const BUDGET_KB = 125

const dist = new URL('../dist/', import.meta.url).pathname
const html = readFileSync(join(dist, 'index.html'), 'utf8')
// Everything index.html loads: the entry script, preloaded chunks, and stylesheets.
const initial = new Set(
  [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]),
)

const kb = (bytes) => (bytes / 1024).toFixed(1).padStart(7)
const rows = readdirSync(join(dist, 'assets'))
  .filter((file) => /\.(js|css)$/.test(file))
  .map((file) => {
    const content = readFileSync(join(dist, 'assets', file))
    return { file: `assets/${file}`, raw: content.length, gzip: gzipSync(content).length }
  })
  .sort((a, b) => b.gzip - a.gzip)

let initialGzip = 0
for (const group of ['first load', 'later, when needed']) {
  console.log(`\n${group}:`)
  for (const row of rows.filter((r) => initial.has(r.file) === (group === 'first load'))) {
    console.log(`  ${kb(row.raw)} KB  (${kb(row.gzip)} KB gzipped)  ${row.file}`)
    if (group === 'first load') initialGzip += row.gzip
  }
}

console.log(`\nFirst load: ${(initialGzip / 1024).toFixed(1)} KB gzipped (budget ${BUDGET_KB} KB)`)
if (initialGzip / 1024 > BUDGET_KB) {
  console.error('Over budget: something new is downloaded on first load. See docs/PERFORMANCE.md.')
  process.exit(1)
}
