import {svSELocale} from '@sanity/locale-sv-se'
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {coreConcepts, onboardingTool} from 'sanity-plugin-editor-onboarding'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schemaTypes'

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
    // The whole Phase 1 surface: no project-specific configuration.
    onboardingTool({tours: coreConcepts()}),
  ],

  schema: {types: schemaTypes},
})
