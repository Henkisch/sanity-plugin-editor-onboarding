import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * A blog post. Deliberately an ordinary content model rather than a showcase:
 * this Studio exists to check that guides land on real Studio UI, so its schema
 * should look like the ones they will land on elsewhere.
 */
export const post = defineType({
  name: 'post',
  title: 'Blog post',
  type: 'document',
  icon: DocumentTextIcon,
  // Two tabs, with a required field on the one that is not open by default, so
  // the validation guide can be checked against an error the editor cannot see.
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'details', title: 'Details'},
  ],
  fields: [
    defineField({
      name: 'title',
      group: 'content',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      group: 'content',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      group: 'details',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
    }),
    defineField({
      name: 'publishedAt',
      group: 'details',
      title: 'Published at',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      group: 'content',
      title: 'Cover image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          description: 'Describes the image for screen readers and when it fails to load.',
        }),
      ],
    }),
    defineField({
      name: 'body',
      group: 'content',
      title: 'Body',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'seo',
      group: 'content',
      title: 'Search appearance',
      type: 'seo',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'author.name', media: 'coverImage'},
  },
})
