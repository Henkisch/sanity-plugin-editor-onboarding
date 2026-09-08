import {
  cloneElement,
  isValidElement,
  useCallback,
  type ReactNode,
  type Ref,
  type RefCallback,
} from 'react'

import {useOnboardingTarget} from './useOnboardingTarget'

/**
 * Props for {@link OnboardingTarget}.
 *
 * @public
 */
export interface OnboardingTargetProps {
  /** The id a step names via `targetCustom()`. Unique within the Studio. */
  id: string
  /**
   * Exactly one element, which must pass its `ref` down to a DOM node. Host
   * elements (`<div>`, `<button>`) always do; your own components do as long as
   * they hand `ref` on to whatever they render.
   */
  children: ReactNode
}

/**
 * Mark a component as a tour target without editing it.
 *
 * ```tsx
 * <OnboardingTarget id="seo-panel">
 *   <SeoPanel />
 * </OnboardingTarget>
 * ```
 *
 * No element is added to the DOM — the child is cloned with a ref, so layout is
 * untouched and this is safe inside flex and grid parents. That does mean the
 * child has to accept a ref; when it doesn't, reach for {@link useOnboardingTarget}
 * inside the component instead.
 *
 * @public
 */
export function OnboardingTarget({id, children}: OnboardingTargetProps): ReactNode {
  const element = isValidElement<{ref?: Ref<HTMLElement>}>(children) ? children : null
  const ours = useOnboardingTarget(id)
  const ref = useMergedRef(ours, element?.props.ref ?? null)

  if (!element) {
    console.warn(
      `[sanity-plugin-editor-onboarding] <OnboardingTarget id="${id}"> expects a single element ` +
        `as its child, and got something else (text, a fragment, or several children). Nothing ` +
        `was marked, so a step pointing at "${id}" will be skipped. Wrap the child in one ` +
        `element, or use the useOnboardingTarget() hook.`,
    )
    return children
  }

  return cloneElement(element, {ref})
}

/**
 * Drive our ref and whatever ref the child already had from one callback, since
 * `cloneElement` can only pass a single one.
 *
 * Recreated whenever the child's ref identity changes — which for an inline
 * `ref={(el) => ...}` is every render. React detaches and reattaches in the same
 * commit, so the target attribute is never observably absent.
 */
function useMergedRef(
  ours: RefCallback<HTMLElement>,
  theirs: Ref<HTMLElement> | null,
): RefCallback<HTMLElement> {
  return useCallback(
    (element: HTMLElement | null) => {
      const detach = [attach(ours, element), attach(theirs, element)]
      return () => {
        for (const detachOne of detach) detachOne()
      }
    },
    [ours, theirs],
  )
}

/** Point one ref at `element`, returning how to point it away again. */
function attach(ref: Ref<HTMLElement> | null, element: HTMLElement | null): () => void {
  if (typeof ref === 'function') {
    const cleanup = ref(element)
    // A React 19 ref may return its own cleanup; one written against the older
    // contract still expects the null call on unmount.
    return typeof cleanup === 'function' ? cleanup : () => ref(null)
  }

  if (ref) {
    ref.current = element
    return () => {
      ref.current = null
    }
  }

  return () => {}
}
