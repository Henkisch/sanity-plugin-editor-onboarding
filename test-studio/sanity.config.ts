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

import {schemaTypes} from './schemaTypes'

/**
 * A developer-defined tour pointing at this Studio's own components — the
 * Phase 2 surface. Nothing here is a Sanity `data-testid`; both steps resolve
 * through ids registered in `components/SeoPanel.tsx`.
 *
 * Manual by design: the panel only exists inside an open document, so an
 * auto-starting version would find nothing on most views.
 */
const seoTour: OnboardingTour = {
  id: 'seo-panel',
  title: 'The SEO panel',
  description: "A tour of this Studio's own UI, not Sanity's.",
  unavailableMessage: 'Open a blog post first — the SEO panel is part of the document form.',
  steps: [
    {
      target: targetCustom('seo-panel'),
      title: 'Search appearance',
      content:
        'This panel is a custom input component belonging to this Studio. It marks itself with the useOnboardingTarget() hook, so a step can point at it without a fragile CSS selector.',
      placement: 'top',
    },
    {
      target: targetCustom('seo-score'),
      title: 'How the title scores',
      content:
        'The badge is marked from the outside with <OnboardingTarget>, which adds no wrapper element and leaves the component untouched.',
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

  schema: {types: schemaTypes},
})
