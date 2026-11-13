import {type FieldStats} from './fieldStats'
import {type SerializedDocumentType} from './serializeSchema'

/**
 * Field guides that come from what editors have already done, not from the schema.
 *
 * The first spike asked a model to explain fields and got the field
 * descriptions back in other words — text the Studio already prints under
 * every label. The one thing it produced that nobody had written down was a
 * pattern in the content itself: every SEO title on a site following
 * "Topic | Brand, Town". This asks for only that, and demands evidence.
 *
 * @internal
 */

/** Patterns need numbers; three examples cannot show one. */
export const CONVENTION_SAMPLE_LIMIT = 12

/** A convention seen in fewer documents than this is an anecdote. */
export const MIN_EVIDENCE = 3

/**
 * The instruction. Schema, samples, stats and language go in as
 * `instructionParams` constants rather than being spliced into the text, so a
 * `$` inside a field description cannot be read as a template variable.
 */
export const CONVENTION_INSTRUCTION = `You find unwritten editorial conventions in the content of one Sanity Studio, so new editors can follow them.

Document type, with every field and its description (JSON):
$schema

Measured facts about how each field is filled in, computed from the full documents (JSON). "filled" is how many of "of" documents have a value; "length" is in characters; "items" counts array entries:
$stats

Published documents of this type (JSON, shortened to save space; trust the measured facts over these for lengths):
$samples

Find patterns that most of these documents follow but that no field description states. Examples of what counts:
- A recurring format, e.g. every SEO title is "Topic | Brand, Town".
- A consistent length, taken from the measured facts, e.g. answers are 60 to 130 characters.
- Consistent wording or naming, e.g. prices always written "från 450 kr".
- A consistent order or set of entries in a list.

Rules:
- Only report a pattern you can see in at least ${MIN_EVIDENCE} of the documents. Count them honestly.
- Only report what an editor should copy when writing a new document. A field that is usually left empty is not a convention: it may be neglected, so never report it.
- Never report anything a field description or title already says, and never report validation rules.
- Never give generic writing advice. If the pattern would be true of any website, leave it out.
- Report at most one convention per field. Reporting none at all is a valid answer.
- Write title and content for an editor, in this language: $language. At most two sentences; state the convention and give one real example from the documents.
- When a field has list options, name them by their title as the editor sees it, never by their stored value.
- Use the field path exactly as given in the schema.

Respond with JSON only, in this shape:
{"conventions": [{"field": "seo.title", "title": "…", "content": "…", "seenIn": 9, "examples": ["…", "…"]}]}`

/** The `instructionParams` for one document type. @internal */
export function conventionParams(input: {
  type: SerializedDocumentType
  stats: FieldStats[]
  samples: unknown[]
  language: string
}): Record<string, {type: 'constant'; value: string}> {
  return {
    schema: {type: 'constant', value: JSON.stringify(input.type)},
    stats: {type: 'constant', value: JSON.stringify(input.stats)},
    samples: {type: 'constant', value: JSON.stringify(input.samples)},
    language: {type: 'constant', value: input.language},
  }
}

/** One convention as the model returned it, after checking. @internal */
export interface Convention {
  field: string
  title: string
  content: string
  seenIn: number
  examples: string[]
}

/**
 * Keep only conventions that name a real field and claim enough evidence.
 *
 * The model's own count is not trusted to be right, only to be honest about
 * thinness: anything it admits is below the bar is dropped, and anything for a
 * field that does not exist is dropped, since a guide there could never show.
 */
export function validateConventions(
  response: unknown,
  type: SerializedDocumentType,
  sampleCount: number,
): {kept: Convention[]; dropped: Array<{item: unknown; reason: string}>} {
  const paths = new Set(type.fields.map((field) => field.path))
  const items =
    isRecord(response) && Array.isArray(response.conventions) ? response.conventions : []
  const kept: Convention[] = []
  const dropped: Array<{item: unknown; reason: string}> = []

  for (const item of items) {
    if (!isRecord(item)) {
      dropped.push({item, reason: 'not an object'})
      continue
    }
    const {field, title, content, seenIn, examples} = item
    if (typeof field !== 'string' || !paths.has(field)) {
      dropped.push({item, reason: 'unknown field'})
    } else if (typeof title !== 'string' || typeof content !== 'string' || !content.trim()) {
      dropped.push({item, reason: 'missing text'})
    } else if (typeof seenIn !== 'number' || seenIn < MIN_EVIDENCE || seenIn > sampleCount) {
      dropped.push({item, reason: `evidence ${String(seenIn)} of ${sampleCount}`})
    } else {
      kept.push({
        field,
        title: title.trim(),
        content: content.trim(),
        seenIn,
        examples: Array.isArray(examples) ? examples.filter((e) => typeof e === 'string') : [],
      })
    }
  }

  return {kept, dropped}
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
