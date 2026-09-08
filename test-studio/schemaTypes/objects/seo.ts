import {SearchIcon} from '@sanity/icons/Search'
import {defineField, defineType} from 'sanity'

import {SeoPanel} from '../../components/SeoPanel'

/**
 * Search metadata, modelled as an object rather than a reference: it belongs to
 * the one document it describes and is never shared.
 *
 * The length guidance comes from Sanity's own validation warnings rather than
 * from a custom widget — those already appear inline, in the editor's language,
 * and they travel with the schema instead of with a component someone has to
 * maintain.
 */
export const seo = defineType({
  name: 'seo',
  title: 'Search appearance',
  type: 'object',
  icon: SearchIcon,
  components: {input: SeoPanel},
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Shown as the headline in search results. Left empty, the page title is used.',
      validation: (rule) =>
        rule.max(60).warning('Search engines usually cut titles off around 60 characters.'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'The paragraph beneath the headline in search results.',
      validation: (rule) =>
        rule.max(155).warning('Search engines usually cut descriptions off around 155 characters.'),
    }),
  ],
})
