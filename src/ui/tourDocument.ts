import {type SerializedDocumentType} from '../ai/serializeSchema'
import {
  targetAssetBrowse,
  targetDocumentHistory,
  targetDocumentStatus,
  targetPublishButton,
} from '../core/targeting'
import {type OnboardingTour} from '../core/types'

/**
 * Which document types a guide can run in, so the Onboarding tool can open one
 * before starting it.
 *
 * Without this, starting the publishing guide from the tool only explains that
 * you should open a document first — true, and useless to someone testing a
 * guide. Inferred from what the steps point at, in order of how specific that is:
 *
 * 1. An explicit `documentType` on the tour.
 * 2. Fields the steps name: types that have all of them.
 * 3. The image picker: types with an image field.
 * 4. The publish button, document status or history: any document type.
 *
 * An empty list means the guide runs anywhere, and nothing is opened.
 *
 * @internal
 */
export function documentTypesFor(tour: OnboardingTour, types: SerializedDocumentType[]): string[] {
  if (tour.documentType) return [tour.documentType]

  const fields = tour.steps.flatMap((step) => (step.field ? [step.field] : []))
  if (fields.length > 0) {
    return types
      .filter((type) => fields.every((field) => type.fields.some((f) => f.path === field)))
      .map((type) => type.name)
  }

  const targets = new Set(tour.steps.map((step) => step.target))
  if (targets.has(targetAssetBrowse())) {
    return types
      .filter((type) => type.fields.some((field) => field.asset === 'image'))
      .map((type) => type.name)
  }

  if (DOCUMENT_TARGETS.some((target) => targets.has(target))) {
    return types.map((type) => type.name)
  }

  return []
}

const DOCUMENT_TARGETS = [targetPublishButton(), targetDocumentStatus(), targetDocumentHistory()]

/** The most recently edited document of any of these types, drafts included. @internal */
export const LATEST_DOCUMENT_QUERY = `*[_type in $types && !(_id in path("versions.**"))] | order(_updatedAt desc)[0]{_id, _type}`

/**
 * Resolve once `selector` has matched the same, visible element for
 * `stableMs`, or once `timeoutMs` has passed.
 *
 * Starting a guide the moment navigation is requested would race the form:
 * each step waits only two seconds for its target, and a cold document can
 * take longer than that to render. Waiting for the first appearance is not
 * enough either. Found in a live Studio: a document re-renders its header
 * while it loads, the first match is replaced a moment later, and a guide
 * started on it rings an element that is no longer there — a blue circle in
 * the top-left corner. So this waits for the target to hold still.
 *
 * Resolving on timeout too, rather than rejecting, lets the guide's own
 * "unavailable" notice explain a document that never appeared.
 *
 * @internal
 */
export function waitForElement(
  selector: string,
  {timeoutMs = 10_000, stableMs = 500, intervalMs = 100, isVisible = hasSize} = {},
): Promise<void> {
  return new Promise((resolve) => {
    let last: Element | null = null
    let since = 0
    const started = Date.now()

    const timer = window.setInterval(() => {
      const now = Date.now()
      const current = document.querySelector(selector)
      const visible = current !== null && current.isConnected && isVisible(current)

      if (!visible || current !== last) {
        last = visible ? current : null
        since = now
      } else if (now - since >= stableMs) {
        done()
        return
      }
      if (now - started >= timeoutMs) done()
    }, intervalMs)

    function done() {
      window.clearInterval(timer)
      resolve()
    }
  })
}

/** A zero-sized rect means the element is hidden or not laid out yet. */
function hasSize(element: Element): boolean {
  const rect = element.getBoundingClientRect()
  return rect.width > 0 || rect.height > 0
}
