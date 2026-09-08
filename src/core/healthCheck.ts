import {stepTarget} from './fieldHelp'
import {type OnboardingTour} from './types'
import {query} from './useTargetElement'

/**
 * A development-time look at whether the registered guides can still find what
 * they point at.
 *
 * Sanity's `data-testid` attributes are not a public API, and a step whose
 * target has moved skips itself silently — by design, since a Studio without
 * Content Releases should quietly drop the releases step. The cost of that
 * design is that a genuinely broken selector looks exactly like an absent
 * feature, and an editor is simply shown less than intended.
 *
 * This is the counterweight: once per session, in development only, say what
 * resolved and what did not, so a developer sees it before an editor doesn't.
 *
 * @internal
 */

/** Narrows an unknown to something whose properties can be read. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Whether this is a development build.
 *
 * Walked defensively rather than reading `process.env.NODE_ENV` directly:
 * bundlers replace that expression, but a Studio built by something that does
 * not would throw on a missing global — and a diagnostic must never be the
 * thing that breaks a Studio.
 *
 * @internal
 */
export function isDevelopment(): boolean {
  const global: unknown = globalThis
  if (!isRecord(global)) return false

  const process = global.process
  if (!isRecord(process)) return false

  const env = process.env
  if (!isRecord(env)) return false

  return env.NODE_ENV !== 'production'
}

/** One step that could not find its target. @internal */
export interface MissingTarget {
  tourId: string
  /** 1-based, matching how the step counter reads to an editor. */
  step: number
  selector: string
  /** True when the selector is not valid CSS, which no view will ever fix. */
  invalid: boolean
}

/** @internal */
export interface HealthReport {
  /** Steps that point at something, i.e. excluding unanchored ones. */
  anchored: number
  resolved: number
  missing: MissingTarget[]
}

/** Resolve every anchored step against the document as it currently stands. */
export function checkTargets(tours: OnboardingTour[]): HealthReport {
  const missing: MissingTarget[] = []
  let anchored = 0

  for (const tour of tours) {
    tour.steps.forEach((step, index) => {
      const selector = stepTarget(step)
      if (!selector) return

      anchored += 1
      const found = query(selector)
      if (found) return

      missing.push({
        tourId: tour.id,
        step: index + 1,
        selector,
        invalid: found === undefined,
      })
    })
  }

  return {anchored, resolved: anchored - missing.length, missing}
}

/**
 * The report as a developer should read it.
 *
 * Written to be honest about its own limits: most misses on a given view are
 * expected, because a step describing the document editor cannot resolve on a
 * list. Overstating that would train someone to ignore the whole message.
 */
export function formatReport(report: HealthReport, studioVersion: string): string {
  const lines = [
    `[sanity-plugin-editor-onboarding] ${report.resolved} of ${report.anchored} anchored steps ` +
      `found their target on this view (Sanity ${studioVersion}).`,
  ]

  if (report.missing.length === 0) {
    return lines[0]
  }

  const invalid = report.missing.filter((entry) => entry.invalid)
  const absent = report.missing.filter((entry) => !entry.invalid)

  if (invalid.length > 0) {
    lines.push('', 'Not valid CSS, so these can never match:')
    for (const entry of invalid) {
      lines.push(`  ${entry.tourId} step ${entry.step}: ${entry.selector}`)
    }
  }

  if (absent.length > 0) {
    lines.push(
      '',
      'Not on screen right now. Expected for steps describing a part of the Studio',
      'that is not open — open a document and reload to check those:',
    )
    for (const entry of absent) {
      lines.push(`  ${entry.tourId} step ${entry.step}: ${entry.selector}`)
    }
  }

  lines.push(
    '',
    'A step that never resolves is skipped rather than shown, so a selector Sanity',
    'has renamed looks the same to an editor as a feature you do not have.',
    'This message is development-only and is never shown to editors.',
  )

  return lines.join('\n')
}
