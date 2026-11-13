import {createSchema, type Rule} from 'sanity'
import {describe, expect, it} from 'vitest'

import {
  fingerprint,
  MAX_DEPTH,
  serializeSchema,
  stableStringify,
  summarizeValidation,
  type SerializedField,
} from './serializeSchema'

/**
 * Compiled with `createSchema` from `sanity` — the same call the Studio makes —
 * so validation arrives as normalised `Rule` instances rather than the raw
 * functions `@sanity/schema` alone would leave.
 */
function compile(types: unknown[]) {
  return createSchema({name: 'test', types})
}

const post = {
  name: 'post',
  title: 'Blog post',
  type: 'document',
  groups: [{name: 'meta', title: 'Meta'}],
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule: Rule) => rule.required(),
    },
    {name: 'excerpt', title: 'Excerpt', type: 'text', description: 'Shown in listings.'},
    {name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}},
    {name: 'author', title: 'Author', type: 'reference', to: [{type: 'author'}]},
    {name: 'publishedAt', title: 'Published at', type: 'datetime', group: 'meta'},
    {
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      fields: [{name: 'alt', title: 'Alternative text', type: 'string'}],
    },
    {name: 'body', title: 'Body', type: 'array', of: [{type: 'block'}]},
    {name: 'seo', title: 'Search appearance', type: 'seo'},
  ],
}

const seo = {
  name: 'seo',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule: Rule) => rule.max(60).warning('Too long'),
    },
  ],
}

const author = {
  name: 'author',
  type: 'document',
  fields: [{name: 'name', title: 'Name', type: 'string'}],
}

function fieldsOf(types: unknown[], typeName: string): SerializedField[] {
  const serialized = serializeSchema(compile(types)).find((type) => type.name === typeName)
  if (!serialized) throw new Error(`no ${typeName}`)
  return serialized.fields
}

function field(fields: SerializedField[], path: string): SerializedField | undefined {
  return fields.find((candidate) => candidate.path === path)
}

describe('serializeSchema', () => {
  it('lists document types and leaves objects out — an object is only reached through a field', () => {
    const names = serializeSchema(compile([post, seo, author])).map((type) => type.name)
    expect(names).toEqual(['post', 'author'])
  })

  it('skips Sanity, plugin and onboarding types, which no editor writes by hand', () => {
    const own = {name: 'onboarding.fieldGuide', type: 'document', fields: author.fields}
    const assist = {name: 'assist.instruction', type: 'document', fields: author.fields}
    const names = serializeSchema(compile([author, own, assist])).map((type) => type.name)
    expect(names).toEqual(['author'])
  })

  it('keeps the document title, so a guide can name the type the way the Studio does', () => {
    expect(serializeSchema(compile([post, seo, author]))[0]?.title).toBe('Blog post')
  })

  it('tells `text` from `string` — the distinction `init` cannot make', () => {
    const fields = fieldsOf([post, seo, author], 'post')
    expect(field(fields, 'title')?.type).toBe('string')
    expect(field(fields, 'excerpt')?.type).toBe('text')
    expect(field(fields, 'publishedAt')?.type).toBe('datetime')
  })

  it('keeps the title and description an editor actually sees', () => {
    expect(field(fieldsOf([post, seo, author], 'post'), 'excerpt')).toMatchObject({
      title: 'Excerpt',
      description: 'Shown in listings.',
    })
  })

  it('names reference targets, so a guide can say what the field points at', () => {
    expect(field(fieldsOf([post, seo, author], 'post'), 'author')?.to).toEqual(['author'])
  })

  it('reports a required field — the single most useful thing to tell an editor', () => {
    expect(field(fieldsOf([post, seo, author], 'post'), 'title')?.validation).toEqual(['required'])
  })

  it('marks a warning as a warning, because a soft limit is not a hard one', () => {
    expect(field(fieldsOf([post, seo, author], 'post'), 'seo.title')?.validation).toEqual([
      'max 60 (warning)',
    ])
  })

  it('reports a named object by its own name, not as `object`', () => {
    expect(field(fieldsOf([post, seo, author], 'post'), 'seo')?.type).toBe('seo')
  })

  it('follows nested objects with a dotted path, matching how field help is looked up', () => {
    expect(field(fieldsOf([post, seo, author], 'post'), 'seo.title')).toBeDefined()
  })

  it('marks image fields as images whatever they are named, so a tour can find one', () => {
    const imageWithAlt = {name: 'imageWithAlt', type: 'image', fields: []}
    const doc = {
      name: 'doc',
      type: 'document',
      fields: [
        {name: 'cover', type: 'image'},
        {name: 'hero', type: 'imageWithAlt'},
        {name: 'pdf', type: 'file'},
        {name: 'title', type: 'string'},
      ],
    }
    const fields = fieldsOf([doc, imageWithAlt], 'doc')
    expect(field(fields, 'cover')?.asset).toBe('image')
    expect(field(fields, 'hero')?.asset).toBe('image')
    expect(field(fields, 'pdf')?.asset).toBe('file')
    expect(field(fields, 'title')?.asset).toBeUndefined()
  })

  it("includes a project's own image fields but not the Studio's asset plumbing", () => {
    const paths = fieldsOf([post, seo, author], 'post').map((candidate) => candidate.path)
    expect(paths).toContain('coverImage.alt')
    expect(paths).not.toContain('coverImage.asset')
    expect(paths).not.toContain('coverImage.hotspot')
  })

  it('does not open up a slug or a reference — an editor sees one input, not its parts', () => {
    const paths = fieldsOf([post, seo, author], 'post').map((candidate) => candidate.path)
    expect(paths.filter((path) => path.startsWith('slug.'))).toEqual([])
    expect(paths.filter((path) => path.startsWith('author.'))).toEqual([])
  })

  it('lists array members without descending into portable text blocks', () => {
    const fields = fieldsOf([post, seo, author], 'post')
    expect(field(fields, 'body')?.of).toEqual(['block'])
    expect(fields.some((candidate) => candidate.path.startsWith('body.'))).toBe(false)
  })

  it('drops the array segment from member fields, so help shows on every row', () => {
    const recipe = {
      name: 'recipe',
      type: 'document',
      fields: [
        {
          name: 'ingredients',
          type: 'array',
          of: [{type: 'object', name: 'ingredient', fields: [{name: 'name', type: 'string'}]}],
        },
      ],
    }
    expect(field(fieldsOf([recipe], 'recipe'), 'ingredients.name')).toBeDefined()
  })

  it('stops at the depth limit, so a self-referencing type cannot recurse forever', () => {
    const menuItem = {
      name: 'menuItem',
      type: 'object',
      fields: [
        {name: 'label', type: 'string'},
        {name: 'child', type: 'menuItem'},
      ],
    }
    const menu = {name: 'menu', type: 'document', fields: [{name: 'root', type: 'menuItem'}]}
    const deepest = Math.max(
      ...fieldsOf([menu, menuItem], 'menu').map((candidate) => candidate.path.split('.').length),
    )
    expect(deepest).toBe(MAX_DEPTH)
  })

  it('keeps list values, and their titles only where those add something', () => {
    const doc = {
      name: 'doc',
      type: 'document',
      fields: [
        {
          name: 'kind',
          type: 'string',
          options: {
            list: ['news', {title: 'Long read', value: 'feature'}, {title: 'x', value: 'x'}],
          },
        },
      ],
    }
    expect(field(fieldsOf([doc], 'doc'), 'kind')?.list).toEqual([
      'news',
      {value: 'feature', title: 'Long read'},
      'x',
    ])
  })

  it('reports conditional visibility without calling it — there is no document to call it with', () => {
    let called = false
    const doc = {
      name: 'doc',
      type: 'document',
      fields: [
        {
          name: 'a',
          type: 'string',
          hidden: () => {
            called = true
            return true
          },
        },
        {name: 'b', type: 'string', readOnly: true},
      ],
    }
    const fields = fieldsOf([doc], 'doc')
    expect(field(fields, 'a')?.hidden).toBe('conditional')
    expect(field(fields, 'b')?.readOnly).toBe(true)
    expect(called).toBe(false)
  })

  it('keeps the group, so a guide can tell an editor which tab to look in', () => {
    expect(field(fieldsOf([post, seo, author], 'post'), 'publishedAt')?.group).toBe('meta')
  })

  it('omits empty properties, because every byte goes into a prompt', () => {
    expect(field(fieldsOf([post, seo, author], 'post'), 'publishedAt')).toEqual({
      path: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'meta',
    })
  })
})

describe('summarizeValidation', () => {
  it("reads Sanity's compiled rule shape — if this fails, Sanity changed an internal", () => {
    const doc = {
      name: 'doc',
      type: 'document',
      fields: [
        {
          name: 'n',
          type: 'number',
          validation: (rule: Rule) => [
            rule.required().min(1).max(5).integer(),
            rule.custom(() => true),
          ],
        },
      ],
    }
    expect(field(fieldsOf([doc], 'doc'), 'n')?.validation).toEqual([
      'required',
      'min 1',
      'max 5',
      'integer',
      'custom rule',
    ])
  })

  it('returns nothing rather than throwing on a shape it does not know', () => {
    expect(summarizeValidation(undefined)).toEqual([])
    expect(summarizeValidation(() => true)).toEqual([])
    expect(summarizeValidation([{unexpected: true}])).toEqual([])
  })
})

describe('fingerprint', () => {
  const base: SerializedField = {path: 'title', title: 'Title', type: 'string'}

  it('is stable for the same definition', () => {
    expect(fingerprint(base)).toBe(fingerprint({...base}))
  })

  it('changes when the meaning changes, which is what marks a guide outdated', () => {
    expect(fingerprint({...base, description: 'New'})).not.toBe(fingerprint(base))
    expect(fingerprint({...base, validation: ['required']})).not.toBe(fingerprint(base))
    expect(fingerprint({...base, type: 'text'})).not.toBe(fingerprint(base))
  })

  it('ignores where the field sits — moving it to another tab does not make its guide wrong', () => {
    expect(fingerprint({...base, group: 'meta', hidden: 'conditional'})).toBe(fingerprint(base))
  })
})

describe('stableStringify', () => {
  it('ignores key order', () => {
    expect(stableStringify({a: 1, b: [2, {d: 3, c: 4}]})).toBe(
      stableStringify({b: [2, {c: 4, d: 3}], a: 1}),
    )
  })
})
