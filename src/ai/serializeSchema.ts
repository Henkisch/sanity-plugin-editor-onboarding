import {type Schema} from 'sanity'

/**
 * The Studio's compiled schema, reduced to what a writer needs to explain a
 * field to an editor.
 *
 * This is the runtime counterpart to `src/init/schema.ts`. That one reads
 * `sanity schema extract`, which has already thrown away titles, descriptions
 * and validation; this one reads the schema the Studio itself is running, so
 * a guide can quote the label an editor actually sees and know that a field is
 * required or capped at 60 characters.
 *
 * The output goes into a prompt, so every property is optional and omitted
 * when it says nothing. A field with no title, no description and no rules is
 * one line, not ten.
 *
 * @internal
 */

/** One field, as the writer sees it. @internal */
export interface SerializedField {
  /** Dotted path, array segments dropped — the same key `findFieldHelp` matches on. */
  path: string
  title?: string
  description?: string
  /** The declared type name: `text`, not `string`; `seo`, not `object`. */
  type: string
  /** Reference targets. */
  to?: string[]
  /** Array member type names. */
  of?: string[]
  /** `options.list`. The title is kept only where it differs from the value. */
  list?: Array<string | number | {value: string | number; title: string}>
  /** Human-readable rule summary, e.g. `['required', 'max 60 (warning)']`. */
  validation?: string[]
  hidden?: true | 'conditional'
  readOnly?: true | 'conditional'
  group?: string | string[]
  fieldset?: string
}

/** One document type and every field an editor can reach in it. @internal */
export interface SerializedDocumentType {
  name: string
  title?: string
  description?: string
  fields: SerializedField[]
}

/**
 * How deep nested objects are followed.
 *
 * A self-referencing type — a menu item with child menu items — would
 * otherwise recurse forever, and anything past four levels is rarely a field
 * an editor gets stuck on by name.
 */
export const MAX_DEPTH = 4

/**
 * Prefixes of types that belong to Sanity or to plugins, not to the project.
 *
 * A guide for `sanity.imageAsset` or for this plugin's own progress documents
 * would be explaining machinery nobody edits by hand.
 */
const EXCLUDED_PREFIXES = ['sanity.', 'onboarding.', 'assist.', 'media.']

/**
 * Fields every image or file carries, managed by the Studio's own input.
 *
 * Only the fields a project adds — `alt`, `caption` — are worth explaining.
 */
const ASSET_INTERNAL_FIELDS = new Set(['asset', 'hotspot', 'crop', 'media'])

/**
 * Object-shaped types whose insides are the Studio's business, not the editor's.
 *
 * A slug is one input, not `current` and `source`; a reference is a picker,
 * not `_ref`. Descending into them would invent fields no editor has seen.
 */
const OPAQUE_TYPES = new Set([
  'reference',
  'crossDatasetReference',
  'globalDocumentReference',
  'slug',
  'block',
  'span',
  'geopoint',
])

/**
 * A compiled schema type, typed only as far as this module reads it.
 *
 * The compiled shape is richer than `SchemaType` admits — `fields` on an
 * anonymous subtype, `_rules` on a rule — so it is described here rather than
 * cast at every read.
 *
 * @internal
 */
export interface CompiledType {
  name: string
  jsonType?: string
  title?: unknown
  description?: unknown
  type?: CompiledType
  fields?: CompiledField[]
  of?: CompiledType[]
  to?: CompiledType[]
  options?: {list?: unknown[]}
  validation?: unknown
  hidden?: unknown
  readOnly?: unknown
}

interface CompiledField {
  name: string
  type: CompiledType
  group?: string | string[]
  fieldset?: string
}

/** Every editable document type in the schema, in schema order. @internal */
export function serializeSchema(schema: Schema): SerializedDocumentType[] {
  return (
    schema
      .getTypeNames()
      .filter((name) => !EXCLUDED_PREFIXES.some((prefix) => name.startsWith(prefix)))
      .flatMap((name) => {
        const type: unknown = schema.get(name)
        return isCompiledType(type) ? [type] : []
      })
      // `type.type` excludes the built-in `document` itself, which is in every
      // schema and extends nothing.
      .filter((type) => !!type.type && typeChain(type).includes('document'))
      .map(serializeDocumentType)
  )
}

/** One document type. Exported for the spike, which works a type at a time. @internal */
export function serializeDocumentType(type: CompiledType): SerializedDocumentType {
  const result: SerializedDocumentType = {
    name: type.name,
    fields: serializeFields(type.fields ?? [], [], 1),
  }
  const title = text(type.title)
  const description = text(type.description)
  if (title) result.title = title
  if (description) result.description = description
  return result
}

function serializeFields(
  fields: CompiledField[],
  parentPath: string[],
  depth: number,
): SerializedField[] {
  return fields.flatMap((field) => {
    const path = [...parentPath, field.name]
    return [serializeField(field, path), ...childFields(field.type, path, depth)]
  })
}

function serializeField(field: CompiledField, path: string[]): SerializedField {
  const type = field.type
  const result: SerializedField = {path: path.join('.'), type: type.name}

  // Assigned one by one rather than spread, so an empty property is absent
  // from the prompt instead of present as `undefined` or `[]`.
  const title = text(type.title)
  const description = text(type.description)
  const list = summarizeList(type.options?.list)
  const validation = summarizeValidation(type.validation)
  const hidden = conditional(type.hidden)
  const readOnly = conditional(type.readOnly)

  if (title) result.title = title
  if (description) result.description = description
  if (type.to?.length) result.to = type.to.map((target) => target.name)
  if (type.of?.length) result.of = type.of.map((member) => member.name)
  if (list.length) result.list = list
  if (validation.length) result.validation = validation
  if (hidden) result.hidden = hidden
  if (readOnly) result.readOnly = readOnly
  if (field.group) result.group = field.group
  if (field.fieldset) result.fieldset = field.fieldset

  return result
}

/**
 * The fields beneath one, if an editor can reach them.
 *
 * Array members contribute no path segment: help for `ingredients.name` is
 * meant for every row, which is how `pathToFieldName` reads the path at
 * runtime. Two member types that share a field name collapse to one entry for
 * the same reason — the runtime could not tell them apart either.
 */
function childFields(type: CompiledType, path: string[], depth: number): SerializedField[] {
  if (depth >= MAX_DEPTH) return []

  if (type.jsonType === 'array') {
    const seen = new Set<string>()
    return (type.of ?? [])
      .flatMap((member) => childFields(member, path, depth))
      .filter((field) => (seen.has(field.path) ? false : (seen.add(field.path), true)))
  }

  if (type.jsonType !== 'object' || !type.fields) return []

  const chain = typeChain(type)
  if (chain.some((name) => OPAQUE_TYPES.has(name))) return []

  const fields =
    chain.includes('image') || chain.includes('file')
      ? type.fields.filter((field) => !ASSET_INTERNAL_FIELDS.has(field.name))
      : type.fields

  return serializeFields(fields, path, depth + 1)
}

/**
 * Every type name from this one down to the built-in it extends:
 * `[seo, object]`, `[slug, slug, object]`.
 *
 * The whole chain, not just the root, because the root is often `object` —
 * a slug and an image are both objects underneath, and what matters is which
 * built-in they pass through on the way.
 */
export function typeChain(type: CompiledType): string[] {
  const names: string[] = []
  for (let current: CompiledType | undefined = type; current; current = current.type) {
    names.push(current.name)
  }
  return names
}

/**
 * Validation rules, in words.
 *
 * Reads `_rules` off each compiled rule, which is internal to Sanity. There is
 * no public way to ask a rule what it checks, and without this the writer
 * cannot know a field is required — the single most useful thing to tell an
 * editor. If the shape changes, this returns nothing and guides are written
 * without it; the tests pin the shape so that happens loudly, not silently.
 */
export function summarizeValidation(validation: unknown): string[] {
  if (!Array.isArray(validation)) return []

  const summary = validation.flatMap((rule: unknown) => {
    if (!isRecord(rule) || !Array.isArray(rule._rules)) return []
    const suffix =
      rule._level === 'warning' ? ' (warning)' : rule._level === 'info' ? ' (info)' : ''

    return rule._rules.flatMap((entry: unknown) => {
      const text = describeRule(entry)
      return text ? [text + suffix] : []
    })
  })

  return [...new Set(summary)]
}

function describeRule(entry: unknown): string | undefined {
  if (!isRecord(entry)) return undefined
  const {flag, constraint} = entry

  switch (flag) {
    case 'presence':
      return constraint === 'required' ? 'required' : undefined
    case 'min':
    case 'max':
    case 'length':
      return typeof constraint === 'number' ? `${flag} ${constraint}` : `${flag} (computed)`
    case 'integer':
    case 'unique':
    case 'precision':
    case 'positive':
    case 'negative':
      return flag
    case 'regex':
      return 'pattern'
    case 'uri':
      return 'url'
    case 'email':
      return 'email'
    case 'custom':
      return 'custom rule'
    // `type` is implied by the field type and `valid` by `options.list`, so
    // both would only repeat what the writer is already told.
    default:
      return undefined
  }
}

function summarizeList(list: unknown[] | undefined): NonNullable<SerializedField['list']> {
  if (!list) return []

  return list.flatMap((item): NonNullable<SerializedField['list']> => {
    if (typeof item === 'string' || typeof item === 'number') return [item]
    if (!isRecord(item)) return []

    const {value, title} = item
    if (typeof value !== 'string' && typeof value !== 'number') return []
    return typeof title === 'string' && title !== String(value) ? [{value, title}] : [value]
  })
}

/**
 * `hidden` and `readOnly` as the writer needs them.
 *
 * A function is reported as `'conditional'` without being called: its
 * arguments are a live document and user, which a schema walk does not have,
 * and "sometimes hidden" is exactly what a guide should mention.
 */
function conditional(value: unknown): true | 'conditional' | undefined {
  if (typeof value === 'function') return 'conditional'
  return value === true ? true : undefined
}

/** Descriptions may be React nodes; only text is useful in a prompt. */
function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/**
 * Whether `schema.get` handed back something this module can walk.
 *
 * Only the name is checked: the rest of the compiled shape is Sanity's own,
 * and every optional property is read defensively from there on.
 */
function isCompiledType(value: unknown): value is CompiledType {
  return isRecord(value) && typeof value.name === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * A short, stable hash of what a field *means*.
 *
 * Stored on a generated guide so a later visit can tell the field has changed
 * underneath it. Only the parts a guide's wording depends on are hashed —
 * moving a field to another group does not make its explanation wrong.
 *
 * FNV-1a rather than SubtleCrypto: this needs to be synchronous and
 * collision-resistant only against accidental change, and the plugin takes no
 * runtime dependencies.
 *
 * @internal
 */
export function fingerprint(field: SerializedField): string {
  const relevant = {
    title: field.title,
    description: field.description,
    type: field.type,
    to: field.to,
    of: field.of,
    list: field.list,
    validation: field.validation,
  }
  return fnv1a(stableStringify(relevant))
}

/** JSON with sorted keys, so property order never changes a hash. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (isRecord(value)) {
    const entries = Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}
