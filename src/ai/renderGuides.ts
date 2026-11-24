import {literal} from '../init/render'
import {type Convention} from './conventions'

/**
 * Chosen conventions as `fieldGuides` entries, ready to paste into a config.
 *
 * Code rather than a write to the dataset: the guide then goes through the
 * same review as every other change to the Studio, and nothing reaches an
 * editor until a developer has read it, committed it and deployed it. The
 * evidence count rides along as a comment so the reviewer knows how strong the
 * pattern was without rerunning anything.
 *
 * @internal
 */
export function renderConventionGuides(documentType: string, conventions: Convention[]): string {
  if (conventions.length === 0) return ''

  return conventions
    .map((convention) =>
      [
        '  {',
        `    // Seen in ${convention.seenIn} published documents. Read before shipping.`,
        `    field: ${literal(convention.field)},`,
        `    documentType: ${literal(documentType)},`,
        `    title: ${literal(convention.title)},`,
        `    content:`,
        `      ${literal(convention.content)},`,
        '  },',
      ].join('\n'),
    )
    .join('\n')
}
