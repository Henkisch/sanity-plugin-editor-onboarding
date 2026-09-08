#!/usr/bin/env node
/**
 * The plugin's command line. One command for now; parsed here so adding another
 * does not mean changing how the first is invoked.
 */
const [command] = process.argv.slice(2)

if (command === 'init') {
  await import('./init.mjs')
} else {
  console.log(
    'sanity-plugin-editor-onboarding\n\n' +
      'USAGE\n' +
      '  npx sanity-plugin-editor-onboarding init [--schema <path>] [--out <path>] [--force]\n\n' +
      'Drafts field guides from your Studio schema, for you to review and edit.\n',
  )
  process.exit(command ? 1 : 0)
}
