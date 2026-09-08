import {useCallback, type RefCallback} from 'react'

import {ONBOARDING_TARGET_ATTRIBUTE, targetCustom} from './targeting'

/**
 * Mark one of your own elements as a tour target.
 *
 * Attach the returned ref to any element, then point a step at it with
 * {@link targetCustom} using the same id:
 *
 * ```tsx
 * function SeoPanel() {
 *   const ref = useOnboardingTarget('seo-panel')
 *   return <div ref={ref}>...</div>
 * }
 * ```
 *
 * The element does not have to exist when the tour starts. A step waits briefly
 * for its target to mount, so marking something inside a pane that opens later
 * works without any coordination on your part.
 *
 * If you would rather not touch the component itself, {@link OnboardingTarget}
 * wraps it from the outside and does the same thing.
 *
 * @param id - Your own name for this target. Must match the id given to
 *   {@link targetCustom}, and be unique within the Studio.
 * @public
 */
export function useOnboardingTarget(id: string): RefCallback<HTMLElement> {
  return useCallback(
    (element: HTMLElement | null) => {
      // React 19 skips the null call when a cleanup is returned, but the type
      // still permits it and a merged ref may pass one through.
      if (!element) return undefined

      element.setAttribute(ONBOARDING_TARGET_ATTRIBUTE, id)
      warnOnDuplicate(id)

      return () => element.removeAttribute(ONBOARDING_TARGET_ATTRIBUTE)
    },
    [id],
  )
}

/**
 * Two elements answering to one id is always a mistake — a step would silently
 * point at whichever comes first in the document — so it is worth saying so
 * even though the tour still runs.
 */
function warnOnDuplicate(id: string): void {
  const matches = document.querySelectorAll(targetCustom(id))
  if (matches.length < 2) return

  console.warn(
    `[sanity-plugin-editor-onboarding] ${matches.length} elements are registered as onboarding ` +
      `target "${id}". A step pointing at it will highlight whichever comes first in the ` +
      `document. Give each target its own id.`,
  )
}
