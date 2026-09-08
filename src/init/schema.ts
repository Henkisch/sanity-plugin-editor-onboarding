/**
 * Reading a schema extracted by `sanity schema extract`.
 *
 * That command emits `groq-type-nodes`, a type-level view built for TypeGen
 * rather than for describing the editing experience. Two consequences shape
 * everything here:
 *
 * - Field titles are gone, so generated copy can never quote the label an
 *   editor sees.
 * - `datetime`, `text` and `string` all arrive as `{type: 'string'}`, so they
 *   cannot be told apart. Fields we cannot classify are skipped rather than
 *   guessed at.
 *
 * What survives the round trip is exactly the set of fields editors find
 * confusing — slugs, references, images, arrays — which is why this is still
 * worth doing.
 *
 * The command is marked experimental by Sanity. If its output stops matching
 * these shapes, `init` says so and exits; nothing an editor sees depends on it.
 *
 * @internal
 */

/**
 * A field's type as the extract represents it.
 *
 * Modelled as one open shape rather than a discriminated union: the extract
 * emits many `type` values this code has no opinion about, and reading an
 * optional property off a wider shape is honest about that, where narrowing by
 * assertion would not be.
 */
export interface TypeNode {
  type: string
  /** Set on `inline` nodes: the name of the type being referred to. */
  name?: string
  /** Set on `object` nodes. */
  attributes?: Record<string, Attribute>
  /** A single node on `array`, a list on `union`. */
  of?: TypeNode | TypeNode[]
}

export interface Attribute {
  type: 'objectAttribute'
  value: TypeNode
  optional?: boolean
}

export interface ExtractedType {
  name: string
  type: string
  attributes?: Record<string, Attribute>
}

/** What a field is, as far as it can be told from the extract. */
export type FieldKind = 'slug' | 'image' | 'file' | 'reference' | 'portableText' | 'array'

/** Document types a Studio's editors actually see. */
export function editableDocumentTypes(schema: ExtractedType[]): ExtractedType[] {
  return schema.filter(
    (type) => type.type === 'document' && !type.name.startsWith('sanity.') && type.attributes,
  )
}

function assetKind(node: TypeNode): FieldKind | undefined {
  if (node.type !== 'object') return undefined

  const asset = node.attributes?.asset?.value
  if (asset?.type !== 'inline' || !asset.name) return undefined

  if (asset.name.startsWith('sanity.imageAsset')) return 'image'
  if (asset.name.startsWith('sanity.fileAsset')) return 'file'
  return undefined
}

/** The members of a `union`, or the single element type of an `array`. */
function members(node: TypeNode): TypeNode[] {
  if (!node.of) return []
  return Array.isArray(node.of) ? node.of : [node.of]
}

function isBlock(node: TypeNode | undefined): boolean {
  if (!node) return false
  if (node.type === 'inline') return node.name === 'block' || Boolean(node.name?.endsWith('.block'))
  if (node.type === 'union') return members(node).some(isBlock)
  return false
}

/**
 * What kind of field this is, or `undefined` when the extract cannot say.
 *
 * Erring towards `undefined` is deliberate: a wrong guide on a field is worse
 * than no guide, because an editor has no way to know it is wrong.
 */
export function classifyField(node: TypeNode): FieldKind | undefined {
  if (node.type === 'inline') {
    if (node.name === 'slug') return 'slug'
    // Anything else pointing at another document. Asset references arrive as
    // objects rather than bare inlines, so they do not land here.
    if (node.name?.endsWith('.reference')) return 'reference'
    return undefined
  }

  if (node.type === 'object') return assetKind(node)

  if (node.type === 'array') {
    const [element] = members(node)
    if (isBlock(element)) return 'portableText'
    // A gallery reads better as "images live in a library" than as a bare list.
    const inner = element && classifyField(element)
    return inner === 'image' || inner === 'file' ? inner : 'array'
  }

  return undefined
}

/** Every classifiable field on a document type, in schema order. */
export function classifiableFields(
  type: ExtractedType,
): {field: string; kind: FieldKind}[] {
  return Object.entries(type.attributes ?? {})
    .filter(([name]) => !name.startsWith('_'))
    .flatMap(([name, attribute]) => {
      const kind = classifyField(attribute.value)
      return kind ? [{field: name, kind}] : []
    })
}
