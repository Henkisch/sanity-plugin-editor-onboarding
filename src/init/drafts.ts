import {classifiableFields, editableDocumentTypes, type ExtractedType, type FieldKind} from './schema'

/**
 * Draft copy per field kind.
 *
 * Written the way every string in this plugin is: for an editor, in plain
 * language, at most three sentences, and about what the field *means* rather
 * than what it is called. These are starting points a human is expected to
 * rewrite in their project's own voice — `init` says so, and so does the file
 * it generates.
 *
 * @internal
 */
const DRAFTS: Record<Exclude<FieldKind, 'slug'>, {title: string; content: string}> = {
  reference: {
    title: 'This points at another document',
    content:
      'It links to a separate document rather than copying it, so editing that document updates every page using it. If you cannot find the one you want here, it may not exist yet.',
  },
  image: {
    title: 'Images live in a shared library',
    content:
      'Choose one that has already been uploaded, or add a new one. The same image can be used in several places without uploading it twice.',
  },
  file: {
    title: 'Files live in a shared library',
    content:
      'Upload once and the same file can be linked from several documents, so there is no need to add it again elsewhere.',
  },
  portableText: {
    title: 'Formatting comes from the site',
    content:
      'The styles here describe what the text is — a heading, a quote — not how it looks. The site decides the appearance, so a heading will match the rest of the site rather than what you see in this editor.',
  },
  array: {
    title: 'Add as many as you need',
    content: 'Drag to reorder. The order you set here is the order they appear in on the site.',
  },
}

/** A drafted guide, before it is written out. @internal */
export interface DraftedGuide {
  field: string
  documentType: string
  kind: FieldKind
  title: string
  content: string
}

/**
 * Guides drafted for every field the extract could classify.
 *
 * Slug fields are deliberately left out: `coreConcepts()` already ships a slug
 * guide covering every document type, and generating one per type would shadow
 * a translated, hand-written string with an untranslated copy.
 *
 * @internal
 */
export function draftGuides(schema: ExtractedType[]): DraftedGuide[] {
  return editableDocumentTypes(schema).flatMap((type) =>
    classifiableFields(type).flatMap(({field, kind}) => {
      if (kind === 'slug') return []
      const draft = DRAFTS[kind]
      return [{field, documentType: type.name, kind, title: draft.title, content: draft.content}]
    }),
  )
}

/** Slug fields found, which `init` reports as already covered. @internal */
export function slugFields(schema: ExtractedType[]): string[] {
  return editableDocumentTypes(schema).flatMap((type) =>
    classifiableFields(type)
      .filter(({kind}) => kind === 'slug')
      .map(({field}) => `${type.name}.${field}`),
  )
}
