/**
 * Real documents, shrunk to what shows a writer how a field is used.
 *
 * A schema says a field is a `string`; three filled-in examples say it holds
 * "Oat milk, 2 dl" and not a sentence. That is the difference between a guide
 * about strings and a guide about this project. But it goes into a prompt, so
 * anything long is cut and anything binary is named rather than sent.
 *
 * @internal
 */

/** Long enough to show what kind of text a field holds, short enough to keep a prompt small. */
export const MAX_STRING_LENGTH = 200

/** Published documents only: a half-written draft would teach the writer someone's mistake. */
export const SAMPLE_QUERY = `*[_type == $type && !(_id in path("drafts.**")) && !(_id in path("versions.**"))] | order(_updatedAt desc)[0...$limit]`

export const SAMPLE_LIMIT = 3

/** A document with system fields removed and every value shortened. @internal */
export function summarizeDocument(document: unknown): unknown {
  return summarize(document, 0)
}

function summarize(value: unknown, depth: number): unknown {
  if (typeof value === 'string') return truncate(value)
  if (typeof value !== 'object' || value === null) return value
  if (depth > 6) return '[…]'

  if (Array.isArray(value)) return summarizeArray(value, depth)

  const record: Record<string, unknown> = {...value}
  const kind = typeof record._type === 'string' ? record._type : undefined

  if (typeof record._ref === 'string') return '[reference]'
  if (isRecord(record.asset)) return kind === 'file' ? '[file]' : '[image]'
  if (kind === 'slug' && typeof record.current === 'string') return record.current

  const result: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(record)) {
    // `_id`, `_rev`, `_key` and friends say nothing about what a field means.
    if (key.startsWith('_')) continue
    result[key] = summarize(entry, depth + 1)
  }
  return result
}

/**
 * Portable text becomes one line of its first paragraph plus a count, which is
 * enough to show it is prose without sending the article.
 */
function summarizeArray(items: unknown[], depth: number): unknown {
  const blocks = items.filter((item) => isRecord(item) && item._type === 'block')
  if (blocks.length > 0 && blocks.length === items.length) {
    return `[${blocks.length} paragraph(s): ${truncate(blockText(blocks[0]))}]`
  }

  const shown = items.slice(0, 3).map((item) => summarize(item, depth + 1))
  return items.length > 3 ? [...shown, `[+${items.length - 3} more]`] : shown
}

function blockText(block: unknown): string {
  if (!isRecord(block) || !Array.isArray(block.children)) return ''
  return block.children
    .map((child: unknown) => (isRecord(child) && typeof child.text === 'string' ? child.text : ''))
    .join('')
}

function truncate(text: string): string {
  return text.length > MAX_STRING_LENGTH ? `${text.slice(0, MAX_STRING_LENGTH)}…` : text
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * A query counting published documents for each of `types`, and its params.
 *
 * One request for every type at once, keyed by position rather than by type
 * name so that a name is only ever a parameter, never spliced into the query.
 *
 * @internal
 */
export function countQuery(types: string[]): {query: string; params: Record<string, string>} {
  const params: Record<string, string> = {}
  const fields = types.map((type, index) => {
    params[`t${index}`] = type
    return `"t${index}": count(*[_type == $t${index} && !(_id in path("drafts.**")) && !(_id in path("versions.**"))])`
  })
  return {query: `{${fields.join(', ')}}`, params}
}

/** The counts back, by type name. @internal */
export function readCounts(types: string[], result: unknown): Record<string, number> {
  const counts: Record<string, number> = {}
  if (typeof result !== 'object' || result === null) return counts
  const record: Record<string, unknown> = {...result}
  types.forEach((type, index) => {
    const value = record[`t${index}`]
    if (typeof value === 'number') counts[type] = value
  })
  return counts
}
