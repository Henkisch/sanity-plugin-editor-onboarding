import {type SerializedDocumentType} from './serializeSchema'

/**
 * Counted facts about how each field is actually filled in.
 *
 * A model reading a dozen shortened documents misses what a count would not:
 * the second spike found that FAQ answers are one paragraph but not that every
 * one of them is 64–134 characters, which is the convention an editor could
 * actually follow. Lengths and fill rates are arithmetic, so they are computed
 * here and handed to the model as fact rather than left for it to estimate.
 *
 * Computed from the full documents, before `summarizeDocument` cuts anything,
 * so a 600-character answer counts as 600 and not as the 200 the prompt sees.
 *
 * @internal
 */

/** One field's numbers. Absent properties had no values to measure. @internal */
export interface FieldStats {
  path: string
  /** Documents where the field holds a value. */
  filled: number
  /** Documents examined. */
  of: number
  /** Character length of text values: plain strings, and portable text as its plain text. */
  length?: {min: number; max: number; median: number}
  /** Item count of arrays. */
  items?: {min: number; max: number}
  /** Range of number values. */
  range?: {min: number; max: number}
}

/** Stats for every field in the type, in field order. @internal */
export function fieldStats(type: SerializedDocumentType, documents: unknown[]): FieldStats[] {
  return type.fields.map((field) => {
    const segments = field.path.split('.')
    const perDocument = documents.map((document) => valuesAt(document, segments))

    // Only filled values are measured: an empty string is a missing answer, not
    // a zero-length one, and would drag every minimum to 0.
    const values = perDocument.flat().filter(isFilled)
    const lengths = values.flatMap((value) => {
      const text = textOf(value)
      return text === undefined ? [] : [text.length]
    })
    const counts = values.flatMap((value) =>
      Array.isArray(value) && !isPortableText(value) ? [value.length] : [],
    )
    const numbers = values.filter((value): value is number => typeof value === 'number')

    const stats: FieldStats = {
      path: field.path,
      filled: perDocument.filter((found) => found.some(isFilled)).length,
      of: documents.length,
    }
    if (lengths.length) stats.length = {...minMax(lengths), median: median(lengths)}
    if (counts.length) stats.items = minMax(counts)
    if (numbers.length) stats.range = minMax(numbers)
    return stats
  })
}

/**
 * Every value at a dotted path, stepping through arrays on the way.
 *
 * `modules.title` on a page with three modules is three values — the same
 * flattening `pathToFieldName` does when it drops array segments at runtime.
 */
function valuesAt(value: unknown, segments: string[]): unknown[] {
  if (segments.length === 0) return value === undefined ? [] : [value]
  if (Array.isArray(value)) return value.flatMap((item) => valuesAt(item, segments))
  if (!isRecord(value)) return []

  const [head, ...rest] = segments
  return head === undefined ? [] : valuesAt(value[head], rest)
}

function textOf(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && isPortableText(value)) {
    return value
      .map((block: unknown) =>
        isRecord(block) && Array.isArray(block.children)
          ? block.children
              .map((child: unknown) =>
                isRecord(child) && typeof child.text === 'string' ? child.text : '',
              )
              .join('')
          : '',
      )
      .join('\n')
  }
  if (isRecord(value) && value._type === 'slug' && typeof value.current === 'string') {
    return value.current
  }
  return undefined
}

function isPortableText(value: unknown[]): boolean {
  return value.length > 0 && value.every((item) => isRecord(item) && item._type === 'block')
}

/** Empty strings and empty arrays are not filled in, whatever the Content Lake thinks. */
function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

function minMax(values: number[]): {min: number; max: number} {
  return {min: Math.min(...values), max: Math.max(...values)}
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const value =
    sorted.length % 2 ? sorted[middle] : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
  return Math.round(value ?? 0)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
