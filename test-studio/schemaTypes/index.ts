import {defineField, defineType} from 'sanity'

import {SeoPanel} from '../components/SeoPanel'

/**
 * Two document types with a handful of fields — enough to exercise
 * `targetDocumentType()` (which keys off the title) and `targetField()`.
 *
 * `seoTitle` renders through a Studio-owned input component, so `targetCustom()`
 * has something to point at that no `data-testid` reaches.
 */
export const post = defineType({
  name: 'post',
  title: 'Blog post',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}}),
    defineField({name: 'publishedAt', title: 'Published at', type: 'datetime'}),
    defineField({name: 'coverImage', title: 'Cover image', type: 'image'}),
    defineField({name: 'body', title: 'Body', type: 'text'}),
    defineField({
      name: 'seoTitle',
      title: 'SEO title',
      type: 'string',
      components: {input: SeoPanel},
    }),
  ],
})

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string'}),
    defineField({name: 'bio', title: 'Bio', type: 'text'}),
  ],
})

export const schemaTypes = [post, author]
