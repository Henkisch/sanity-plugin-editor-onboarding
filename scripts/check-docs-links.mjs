/**
 * Fails if any Sanity docs URL in `src/` no longer resolves.
 *
 * Sanity moves docs paths without leaving redirects, and a dead "Learn more" is
 * invisible from inside the plugin — nothing throws, the editor just lands on a
 * 404. Every URL this plugin shipped with had rotted that way before anyone
 * noticed, so this runs weekly in CI rather than waiting for a bug report.
 *
 * Reads the source directly, so a URL inlined outside `src/concepts/docs.ts` is
 * still checked.
 */
import {readdir, readFile} from 'node:fs/promises'
import {join} from 'node:path'

const URL_PATTERN = /https:\/\/www\.sanity\.io\/docs\/[^\s`'"()<>]+/g
const TIMEOUT_MS = 15000

async function sourceFiles(dir) {
  const entries = await readdir(dir, {withFileTypes: true})
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name)
      return entry.isDirectory() ? sourceFiles(path) : [path]
    }),
  )
  return files.flat()
}

/** Where each URL was found, so a failure names the file to edit. */
async function collectUrls() {
  const found = new Map()

  for (const file of await sourceFiles('src')) {
    const contents = await readFile(file, 'utf8')
    for (const [url] of contents.matchAll(URL_PATTERN)) {
      if (!found.has(url)) found.set(url, new Set())
      found.get(url).add(file)
    }
  }

  return found
}

/**
 * HEAD first, then GET: some pages answer HEAD with 405 while serving fine, and
 * a false alarm on a weekly job is worse than a slightly slower check.
 */
async function status(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const response = await fetch(url, {method, signal: AbortSignal.timeout(TIMEOUT_MS)})
      if (response.ok) return response.status
      if (method === 'GET') return response.status
    } catch (error) {
      if (method === 'GET') return error.name === 'TimeoutError' ? 'timeout' : 'unreachable'
    }
  }
  return 'unreachable'
}

const urls = await collectUrls()

if (urls.size === 0) {
  console.error('No Sanity docs URLs found in src/. The pattern in this script is probably stale.')
  process.exit(1)
}

const failures = []

for (const [url, files] of urls) {
  const result = await status(url)
  const ok = result === 200
  console.log(`${ok ? 'ok  ' : 'DEAD'}  ${String(result).padEnd(11)}  ${url}`)
  if (!ok) failures.push({url, result, files: [...files]})
}

if (failures.length > 0) {
  console.error(`\n${failures.length} of ${urls.size} docs links are dead:\n`)
  for (const {url, result, files} of failures) {
    console.error(`  ${url}\n    ${result}, referenced from ${files.join(', ')}`)
  }
  console.error('\nFind the page that replaced it and update src/concepts/docs.ts.')
  process.exit(1)
}

console.log(`\nAll ${urls.size} docs links resolve.`)
