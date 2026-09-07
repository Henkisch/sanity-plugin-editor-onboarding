import {useEffect, useState} from 'react'

/** How long to wait for a target to appear before giving up on the step. */
const RESOLVE_TIMEOUT_MS = 2000

/**
 * Resolution state for a step's target.
 *
 * - `pending` — still looking; the popup is not shown yet.
 * - `resolved` — found it.
 * - `missing` — gave up. The step is skipped, not retried.
 * - `none` — the step has no target and is shown centred.
 */
export type TargetState = 'pending' | 'resolved' | 'missing' | 'none'

export interface TargetResult {
  state: TargetState
  element: HTMLElement | null
  /** Viewport-relative box of the element, kept in sync with scroll and resize. */
  rect: DOMRect | null
}

interface Resolution {
  state: TargetState
  element: HTMLElement | null
}

/**
 * `null` when nothing matches yet, `undefined` when the selector itself is
 * invalid and so can never match.
 */
export function query(selector: string): HTMLElement | null | undefined {
  let found: Element | null
  try {
    found = document.querySelector(selector)
  } catch {
    return undefined
  }
  return found instanceof HTMLElement ? found : null
}

function resolveNow(selector: string | undefined): Resolution {
  if (!selector) return {state: 'none', element: null}

  const found = query(selector)
  if (found === undefined) return {state: 'missing', element: null}
  if (found) return {state: 'resolved', element: found}
  return {state: 'pending', element: null}
}

function warnMissing(selector: string, tourId: string, stepIndex: number, reason: string): void {
  console.warn(
    `[sanity-plugin-onboarding] Skipping step ${stepIndex + 1} of tour "${tourId}": ${reason} ` +
      `Selector: \`${selector}\`. The tour continues without this step. If it targets an ` +
      `optional Studio feature this is expected; otherwise check that the selector is still ` +
      `correct for your Sanity version.`,
  )
}

/**
 * Resolve a step's CSS selector to a live element.
 *
 * Studio UI mounts asynchronously, so a target that isn't there on first paint
 * may still arrive — we watch the DOM for a short budget before concluding it
 * is genuinely absent.
 *
 * A missing target is a normal, expected outcome: a Studio without Content
 * Releases has no releases link, and the step covering it should quietly drop
 * out. It is reported to the developer via `console.warn` and never surfaced to
 * the editor.
 *
 * `selector` is read once, on mount. Callers render one step at a time under a
 * key that includes the step index, so each step gets its own instance.
 */
export function useTargetElement(
  selector: string | undefined,
  debug: {tourId: string; stepIndex: number},
): TargetResult {
  const {tourId, stepIndex} = debug

  // Resolved during render where possible, so the common case — the target is
  // already on screen — costs no extra render pass and no flash of nothing.
  const [resolution, setResolution] = useState<Resolution>(() => resolveNow(selector))
  const [rect, setRect] = useState<DOMRect | null>(null)

  const {state, element} = resolution

  // An invalid selector is decided during render; report it once, after commit.
  useEffect(() => {
    if (state === 'missing' && selector) {
      warnMissing(selector, tourId, stepIndex, 'the selector is not valid CSS.')
    }
    // Runs once: `state` only becomes 'missing' from the initial render in this
    // branch, and the timeout branch below warns for itself.
    // oxlint-disable-next-line exhaustive-deps
  }, [])

  // Wait for a target that hasn't mounted yet.
  useEffect(() => {
    if (state !== 'pending' || !selector) return undefined

    let settled = false

    const settle = (found: HTMLElement | null) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      observer.disconnect()

      if (found) {
        setResolution({state: 'resolved', element: found})
        return
      }

      setResolution({state: 'missing', element: null})
      warnMissing(selector, tourId, stepIndex, `no element matched within ${RESOLVE_TIMEOUT_MS}ms.`)
    }

    const observer = new MutationObserver(() => {
      const found = query(selector)
      // `undefined` (invalid selector) was already ruled out during render.
      if (found) settle(found)
    })
    const timeoutId = window.setTimeout(() => settle(null), RESOLVE_TIMEOUT_MS)

    observer.observe(document.body, {childList: true, subtree: true})

    return () => {
      settled = true
      window.clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [state, selector, tourId, stepIndex])

  // Keep the measured box in sync so the spotlight tracks the element.
  useEffect(() => {
    if (!element) return undefined

    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setRect(element.getBoundingClientRect())
      })
    }

    schedule()

    const resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(element)
    // `capture` so that scrolling in any ancestor pane is picked up, not just
    // the window.
    window.addEventListener('scroll', schedule, {passive: true, capture: true})
    window.addEventListener('resize', schedule, {passive: true})

    return () => {
      if (frame) cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('scroll', schedule, {capture: true})
      window.removeEventListener('resize', schedule)
    }
  }, [element])

  return {state, element, rect}
}
