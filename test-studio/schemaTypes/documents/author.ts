import {UserIcon} from '@sanity/icons/User'
import {defineField, defineType} from 'sanity'

/**
 * A person who writes posts. A document rather than a nested object because
 * several posts share one author, and editing them once should update every
 * post that points here.
 */
export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 3,
      description: 'A short introduction, shown beneath every post this author writes.',
    }),
  ],
  preview: {
    select: {title: 'name'},
  },
})
