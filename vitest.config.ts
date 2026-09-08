import {defineConfig} from 'vitest/config'

export default defineConfig({
  // The package's own tsconfig leaves JSX untransformed for pkg-utils to
  // handle, so tests have to name the runtime themselves.
  esbuild: {jsx: 'automatic'},
  test: {
    // The plugin is DOM-bound throughout — selector resolution, ref callbacks,
    // localStorage — so there is no meaningful node-environment subset.
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    globals: false,
  },
})
