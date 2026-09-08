import {describe, expect, it} from 'vitest'

import {classifyField, editableDocumentTypes, type ExtractedType, type TypeNode} from './schema'
import {draftGuides, slugFields} from './drafts'
import {renderFieldGuides} from './render'

const attribute = (value: TypeNode) => ({type: 'objectAttribute' as const, value})

const imageNode = {
  type: 'object',
  attributes: {asset: attribute({type: 'inline', name: 'sanity.imageAsset.reference'})},
}

const schema: ExtractedType[] = [
  {
    name: 'post',
    type: 'document',
    attributes: {
      _id: attribute({type: 'string'}),
      title: attribute({type: 'string'}),
      slug: attribute({type: 'inline', name: 'slug'}),
      author: attribute({type: 'inline', name: 'author.reference'}),
      cover: attribute(imageNode),
      body: attribute({type: 'array', of: {type: 'inline', name: 'block'}}),
      tags: attribute({type: 'array', of: {type: 'string'}}),
    },
  },
  {name: 'sanity.imageAsset', type: 'document', attributes: {}},
]

describe('editableDocumentTypes', () => {
  it('leaves out Sanity’s own document types, which no editor opens', () => {
    expect(editableDocumentTypes(schema).map((type) => type.name)).toEqual(['post'])
  })
})

describe('classifyField', () => {
  it('recognises a slug', () => {
    expect(classifyField({type: 'inline', name: 'slug'})).toBe('slug')
  })

  it('recognises a reference to another document', () => {
    expect(classifyField({type: 'inline', name: 'author.reference'})).toBe('reference')
  })

  it('recognises an image by its asset', () => {
    expect(classifyField(imageNode)).toBe('image')
  })

  it('recognises a file by its asset', () => {
    expect(
      classifyField({
        type: 'object',
        attributes: {asset: attribute({type: 'inline', name: 'sanity.fileAsset.reference'})},
      }),
    ).toBe('file')
  })

  it('recognises portable text rather than calling it a list', () => {
    expect(classifyField({type: 'array', of: {type: 'inline', name: 'block'}})).toBe('portableText')
  })

  it('recognises portable text when blocks are one of several members', () => {
    expect(
      classifyField({
        type: 'array',
        of: {type: 'union', of: [{type: 'inline', name: 'block'}, imageNode]},
      }),
    ).toBe('portableText')
  })

  it('describes a gallery as images rather than as a plain list', () => {
    expect(classifyField({type: 'array', of: imageNode})).toBe('image')
  })

  it('falls back to a plain array for anything else repeated', () => {
    expect(classifyField({type: 'array', of: {type: 'string'}})).toBe('array')
  })

  // The extract collapses datetime, text and string into one shape, so a guess
  // here would be wrong often and invisibly.
  it('declines to classify a bare string, since datetime and text look identical', () => {
    expect(classifyField({type: 'string'})).toBeUndefined()
  })

  it('declines to classify an object that is not an asset', () => {
    expect(classifyField({type: 'object', attributes: {}})).toBeUndefined()
  })
})

describe('draftGuides', () => {
  const guides = draftGuides(schema)

  it('drafts one guide per classifiable field', () => {
    expect(guides.map((guide) => guide.field)).toEqual(['author', 'cover', 'body', 'tags'])
  })

  it('scopes every guide to the type it was found on', () => {
    for (const guide of guides) expect(guide.documentType).toBe('post')
  })

  // The built-in publishing guide already explains slugs for every type, in
  // every language the plugin ships. Generating one here would shadow it with
  // untranslated English.
  it('leaves slugs to the built-in guide', () => {
    expect(guides.some((guide) => guide.field === 'slug')).toBe(false)
    expect(slugFields(schema)).toEqual(['post.slug'])
  })

  it('skips fields it could not classify rather than guessing', () => {
    expect(guides.some((guide) => guide.field === 'title')).toBe(false)
  })

  it('writes every draft for an editor, not a developer', () => {
    for (const guide of guides) {
      expect(guide.title).toBeTruthy()
      expect(guide.content.length).toBeGreaterThan(20)
      expect(guide.content).not.toMatch(/schema|field type|portable text/i)
    }
  })
})

describe('renderFieldGuides', () => {
  const source = renderFieldGuides(draftGuides(schema))

  it('emits a module that imports the type it declares', () => {
    expect(source).toContain("import {type FieldGuide} from 'sanity-plugin-editor-onboarding'")
    expect(source).toContain('export const fieldGuides: FieldGuide[] = [')
  })

  it('says in the file that the copy still needs a human', () => {
    expect(source).toContain('starting point, not an answer')
  })

  it('escapes quotes so generated copy cannot break the file', () => {
    const rendered = renderFieldGuides([
      {field: "it's", documentType: 'post', kind: 'array', title: "don't", content: "won't"},
    ])

    // The apostrophe has to arrive escaped, or the emitted file will not parse.
    expect(rendered).toContain("field: 'it\\'s'")
    expect(rendered).toContain("title: 'don\\'t'")
  })
})
