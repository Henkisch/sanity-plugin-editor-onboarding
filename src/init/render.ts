import {type DraftedGuide} from './drafts'

/** A TypeScript string literal, safe for any content. @internal */
function literal(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

/**
 * The generated `fieldGuides` module.
 *
 * Emitted as source a human edits and commits, not as a build artefact — the
 * copy is drafted from field types alone and knows nothing about the project,
 * so it is wrong until someone who does rewrites it. The header says exactly
 * that, because a generated file with no provenance gets treated as finished.
 *
 * @internal
 */
export function renderFieldGuides(guides: DraftedGuide[]): string {
  const header = [
    "import {type FieldGuide} from 'sanity-plugin-editor-onboarding'",
    '',
    '/**',
    ' * Drafted by `sanity-plugin-editor-onboarding init` from your schema.',
    ' *',
    ' * These are a starting point, not an answer. The wording was chosen from each',
    " * field's type alone — it knows nothing about your project, your editors, or",
    ' * what they actually get wrong. Read every one, rewrite it in your own words,',
    ' * and delete the ones that state the obvious. A guide that tells an editor',
    ' * something they already know teaches them to ignore the next one.',
    ' *',
    ' * Fields whose type could not be determined were skipped rather than guessed',
    ' * at. Add those by hand.',
    ' */',
    'export const fieldGuides: FieldGuide[] = [',
  ]

  const body = guides.map((guide) =>
    [
      '  {',
      `    // ${guide.kind}`,
      `    field: ${literal(guide.field)},`,
      `    documentType: ${literal(guide.documentType)},`,
      `    title: ${literal(guide.title)},`,
      `    content:`,
      `      ${literal(guide.content)},`,
      '  },',
    ].join('\n'),
  )

  return [...header, ...body, ']', ''].join('\n')
}
