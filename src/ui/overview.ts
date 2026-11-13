import {type AutoStart, type FieldGuide, type OnboardingTour} from '../core/types'
import {type LocalizedText} from '../i18n/useLocalizedText'

/**
 * What the overview lists, derived from the config the plugin is running with.
 *
 * @internal
 */

/** One field that carries a book icon, and where its text comes from. @internal */
export interface FieldGuideRow {
  /** Stable across renders: the same field can have help from config and from a tour. */
  id: string
  field: string
  /** Absent when the guide applies to every type with a field of that name. */
  documentType?: string
  title: LocalizedText
  /** Set when the help is a tour step rather than a standalone `fieldGuides` entry. */
  tourTitle?: LocalizedText
}

/**
 * Every field with help, standalone guides and tour steps alike.
 *
 * Mirrors `collectFieldHelp`, but keeps which tour a step came from: a
 * developer reading the overview needs to know where to go to change the text.
 */
export function fieldGuideRows(tours: OnboardingTour[], guides: FieldGuide[]): FieldGuideRow[] {
  const fromSteps = tours.flatMap((tour) =>
    tour.steps.flatMap((step) =>
      step.field
        ? [
            {
              id: `tour:${tour.id}:${step.field}`,
              field: step.field,
              title: step.title,
              tourTitle: tour.title,
            },
          ]
        : [],
    ),
  )
  const fromGuides = guides.map((guide) => ({
    id: `guide:${guide.documentType ?? '*'}:${guide.field}`,
    field: guide.field,
    title: guide.title,
    ...(guide.documentType ? {documentType: guide.documentType} : {}),
  }))
  return [...fromGuides, ...fromSteps]
}

/** The i18n key describing when a tour starts by itself. @internal */
export function autoStartKey(autoStart: AutoStart | undefined): string {
  if (autoStart === 'first-login') return 'tool.autostart.first-login'
  if (typeof autoStart === 'function') return 'tool.autostart.custom'
  return 'tool.autostart.manual'
}

/** Field guides for one document type, or for every type when `documentType` is absent. @internal */
export interface FieldGuideGroup {
  documentType?: string
  rows: FieldGuideRow[]
}

/**
 * Rows grouped by document type, in the order types first appear, with the
 * guides that apply to every type last. A Studio with dozens of guides is
 * scanned by type, since that is how a developer thinks about where a field is.
 */
export function groupFieldGuides(rows: FieldGuideRow[]): FieldGuideGroup[] {
  const groups = new Map<string, FieldGuideGroup>()
  for (const row of rows) {
    const key = row.documentType ?? ''
    const group = groups.get(key) ?? {
      ...(row.documentType ? {documentType: row.documentType} : {}),
      rows: [],
    }
    group.rows.push(row)
    groups.set(key, group)
  }
  const all = groups.get('')
  groups.delete('')
  return [...groups.values(), ...(all ? [all] : [])]
}
