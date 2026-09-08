import {type Path} from 'sanity'

import {targetField} from './targeting'
import {type FieldGuide, type OnboardingStep, type OnboardingTour} from './types'

/**
 * Field-level help, from either of the two places it can be declared.
 *
 * Both collapse to the same thing — one step, shown on its own — so there is a
 * single renderer and a single content model no matter which entry point a
 * developer used.
 *
 * @internal
 */
export interface FieldHelp {
  field: string
  documentType?: string
  step: OnboardingStep
}

/**
 * The field path as a dotted name.
 *
 * Array items contribute a numeric or keyed segment that says *which* item is
 * being edited, never which field it is, so those are dropped: help written for
 * `ingredients.name` should show on every row.
 */
export function pathToFieldName(path: Path): string {
  return path.filter((segment) => typeof segment === 'string').join('.')
}

/**
 * Everything that should put a book icon on a field.
 *
 * Tour steps come first, so a guide's own wording wins over a standalone entry
 * for the same field rather than the other way round.
 *
 * @internal
 */
export function collectFieldHelp(tours: OnboardingTour[], guides: FieldGuide[]): FieldHelp[] {
  const fromSteps = tours.flatMap((tour) =>
    tour.steps.flatMap((step) => (step.field ? [{field: step.field, step}] : [])),
  )

  const fromGuides = guides.map((guide) => ({
    field: guide.field,
    documentType: guide.documentType,
    step: {
      field: guide.field,
      title: guide.title,
      content: guide.content,
      learnMoreUrl: guide.learnMoreUrl,
    },
  }))

  return [...fromSteps, ...fromGuides]
}

/**
 * The help for one field, or `undefined` if it has none.
 *
 * An entry without a `documentType` applies to every type, which is the common
 * case for a field like `slug` that several types share. One that names a type
 * requires a match, so an unknown document type shows nothing rather than
 * showing a recipe's help on a blog post.
 *
 * @internal
 */
export function findFieldHelp(
  help: FieldHelp[],
  fieldName: string,
  documentType: string | undefined,
): FieldHelp | undefined {
  return help.find((candidate) => {
    if (candidate.field !== fieldName) return false
    if (!candidate.documentType) return true
    return candidate.documentType === documentType
  })
}

/**
 * What a step points at.
 *
 * Naming a `field` is enough — the selector for it is derived — but an explicit
 * `target` still wins, so a step can explain a field while pointing somewhere
 * else entirely.
 *
 * @internal
 */
export function stepTarget(step: OnboardingStep): string | undefined {
  if (step.target) return step.target
  return step.field ? targetField(step.field) : undefined
}
