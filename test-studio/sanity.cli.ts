import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },

  vite: (config) => ({
    ...config,
    optimizeDeps: {
      ...config.optimizeDeps,
      // The plugin is linked from the parent directory, so Vite's dependency
      // pre-bundling would cache a stale copy of dist/ and quietly serve it
      // after a rebuild. Excluding it means edits show up on reload.
      exclude: [...(config.optimizeDeps?.exclude ?? []), 'sanity-plugin-editor-onboarding'],
    },
  }),
})
