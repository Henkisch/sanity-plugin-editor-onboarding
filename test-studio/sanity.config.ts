import {svSELocale} from '@sanity/locale-sv-se'
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {
  coreConcepts,
  onboardingTool,
  targetCustom,
  type FieldGuide,
  type OnboardingTour,
} from 'sanity-plugin-editor-onboarding'
import {structureTool} from 'sanity/structure'

import {studioLocaleBundles, studioText} from './i18n/bundle'
import {schemaTypes} from './schemaTypes'

/**
 * A developer-defined tour pointing at this Studio's own components. Nothing
 * here is a Sanity `data-testid`; both steps resolve through ids registered in
 * `components/SeoPanel.tsx`.
 *
 * Every string is a key rather than a sentence, so this guide follows the
 * editor's language the way the built-in ones do. The plugin translates its own
 * chrome either way — but the words in your tour are yours, and plain strings
 * would leave an English guide inside a Swedish Studio.
 *
 * Manual by design: the panel only exists inside an open document, so an
 * auto-starting version would find nothing on most views.
 */
const seoTour: OnboardingTour = {
  id: 'seo-panel',
  title: studioText('tour.seo.title'),
  description: studioText('tour.seo.description'),
  unavailableMessage: studioText('tour.seo.unavailable'),
  steps: [
    {
      target: targetCustom('seo-panel'),
      title: studioText('tour.seo.panel.title'),
      content: studioText('tour.seo.panel.content'),
      placement: 'top',
    },
    {
      target: targetCustom('seo-score'),
      title: studioText('tour.seo.score.title'),
      content: studioText('tour.seo.score.content'),
      placement: 'bottom',
    },
  ],
}

/**
 * Help hung on individual fields, with no tour involved. Each one puts a book
 * icon in that field's own action row.
 */
const fieldGuides: FieldGuide[] = [
  {
    field: 'publishedAt',
    documentType: 'post',
    title: 'This is a publish date, not a switch',
    content:
      'It is what the site prints as the article date. Setting it to the future does not hold the post back — use a release for that.',
  },
  {
    field: 'bio',
    documentType: 'author',
    title: 'Two or three sentences',
    content: 'The bio appears under every article this author writes, so keep it short.',
  },
]

export default defineConfig({
  name: 'default',
  title: 'Onboarding plugin test studio',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [
    structureTool(),
    visionTool(),
    // Installed so the plugin's Swedish bundle can be verified end to end.
    svSELocale(),
    // Phase 1's zero-config library, plus a Phase 2 tour of local components.
    // Progress is synced here so the dataset-backed path gets exercised, not
    // just the localStorage one.
    onboardingTool({fieldGuides, syncProgress: true, tours: [...coreConcepts(), seoTour]}),
  ],

  // Registers this Studio's own strings alongside the plugin's.
  i18n: {bundles: studioLocaleBundles},

  schema: {types: schemaTypes},
})
