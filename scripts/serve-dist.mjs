// Serves the production build in dist/ the way Netlify and Cloudflare Pages do, to test it
// before deploying:
// - a file that exists is served as it is; /statistics also finds statistics.html or
//   statistics/index.html;
// - otherwise the rules in dist/_redirects apply (e.g. `/*  /index.html  200` opens the app);
// - otherwise dist/404.html is served with a 404 status;
// - every response gets the headers dist/_headers gives for its address.
// Usage: npm run build && npm run preview:host   (PORT=4173 by default)
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const dist = new URL('../dist/', import.meta.url).pathname
const port = Number(process.env.PORT ?? 4173)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
}

const read = (name) => (existsSync(join(dist, name)) ? readFileSync(join(dist, name), 'utf8') : '')
const lines = (text) =>
  text.split('\n').filter((line) => line.trim() !== '' && !line.trim().startsWith('#'))

/** `/assets/*` matches /assets/anything; other patterns match exactly. */
const matches = (pattern, path) =>
  pattern.endsWith('*') ? path.startsWith(pattern.slice(0, -1)) : path === pattern

// _headers: a path pattern, then indented `Name: value` lines.
const headerRules = []
for (const line of lines(read('_headers'))) {
  if (!line.startsWith(' ')) headerRules.push({ pattern: line.trim(), headers: {} })
  else {
    const [name, ...value] = line.trim().split(':')
    headerRules.at(-1).headers[name.trim()] = value.join(':').trim()
  }
}
// _redirects: `from  to  status`.
const redirects = lines(read('_redirects')).map((line) => {
  const [from, to, status = '301'] = line.trim().split(/\s+/)
  return { from, to, status: Number(status) }
})

const isFile = (file) => existsSync(file) && statSync(file).isFile()

/** The file for an address, the way these hosts look for it. */
function findFile(path) {
  const file = join(dist, normalize(path).replace(/^(\.\.[/\\])+/, ''))
  if (isFile(file)) return file
  if (isFile(`${file}.html`)) return `${file}.html`
  if (isFile(join(file, 'index.html'))) return join(file, 'index.html')
  return null
}

createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
  for (const rule of headerRules) {
    if (matches(rule.pattern, path)) {
      for (const [name, value] of Object.entries(rule.headers)) response.setHeader(name, value)
    }
  }

  let status = 200
  let file = findFile(path)
  if (!file) {
    const rule = redirects.find((r) => matches(r.from, path))
    if (rule && rule.status === 200) file = findFile(rule.to)
    else if (rule) {
      response.writeHead(rule.status, { Location: rule.to })
      response.end()
      return
    }
  }
  if (!file) {
    status = 404
    file = join(dist, '404.html')
  }
  response.writeHead(status, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
  response.end(readFileSync(file))
}).listen(port, () => {
  console.log(`Serving dist/ like Netlify and Cloudflare Pages at http://localhost:${port}/`)
})
