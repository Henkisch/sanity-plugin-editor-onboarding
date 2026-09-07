import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {useCurrentUser} from 'sanity'

import {getTourStatus, mayAutoStart, setTourStatus} from './completionStore'
import {Spotlight} from './Spotlight'
import {StepPopover} from './StepPopover'
import {TourErrorBoundary} from './TourErrorBoundary'
import {type OnboardingTour, type TourStatus} from './types'
import {UnavailableNotice} from './UnavailableNotice'
import {query, useTargetElement} from './useTargetElement'

interface OnboardingContextValue {
  tours: OnboardingTour[]
  activeTourId: string | null
  startTour: (tourId: string) => void
  stopTour: () => void
  /** Status per tour id, re-read whenever a tour ends. */
  statuses: Record<string, TourStatus | null>
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

/**
 * Access the onboarding runtime.
 *
 * @internal
 */
export function useOnboarding(): OnboardingContextValue {
  const value = useContext(OnboardingContext)
  if (!value) {
    throw new Error('useOnboarding must be used inside the onboarding plugin’s Studio layout')
  }
  return value
}

/**
 * Whether the user is currently typing into something.
 *
 * A tour that appears mid-sentence is worse than no tour, so auto-start waits
 * for a natural pause instead.
 */
function isUserBusyEditing(): boolean {
  const active = document.activeElement
  if (!(active instanceof HTMLElement)) return false
  if (active.isContentEditable) return true
  return active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT'
}

/**
 * How long to let the Studio settle before considering auto-start.
 *
 * Appearing the instant the app paints is jarring, and it also races the user:
 * someone who reloads with a document open may be clicking into a field right
 * as the tour decides whether they are busy.
 */
const AUTO_START_SETTLE_MS = 1500

/** How long auto-start waits for a quiet moment before giving up entirely. */
const AUTO_START_GIVE_UP_MS = 30_000

/**
 * Whether any of a tour's steps could show right now.
 *
 * Each step waits a couple of seconds for a target that may still be mounting,
 * which is right for auto-start on a booting Studio but wrong for a menu click:
 * a tour whose targets are all absent would sit silent for the sum of those
 * budgets before explaining itself. On a manual start the Studio has settled,
 * so a single synchronous check is enough.
 */
function hasAnyVisibleStep(tour: OnboardingTour): boolean {
  return tour.steps.some((step) => !step.target || Boolean(query(step.target)))
}

/** Renders one step, and skips itself if its target never shows up. */
function StepRunner(props: {
  tour: OnboardingTour
  stepIndex: number
  skippedCount: number
  onAdvance: () => void
  onSkipStep: (stepIndex: number) => void
  onSkip: () => void
  onDismissForever: () => void
}): React.JSX.Element | null {
  const {tour, stepIndex, skippedCount, onAdvance, onSkipStep, onSkip, onDismissForever} = props
  const step = tour.steps[stepIndex]

  const {state, element, rect} = useTargetElement(step?.target, {
    tourId: tour.id,
    stepIndex,
  })

  // A target that never arrived: drop this step and move on.
  useEffect(() => {
    if (state === 'missing') onSkipStep(stepIndex)
  }, [state, onSkipStep, stepIndex])

  // Bring the target into view before pointing at it.
  useEffect(() => {
    if (state !== 'resolved' || !element) return
    element.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
  }, [state, element])

  if (!step) return null
  if (state === 'pending' || state === 'missing') return null

  // Both the position and the total shrink together as optional steps drop out,
  // so the counter stays coherent.
  const total = tour.steps.length - skippedCount
  const index = stepIndex - skippedCount

  return (
    <>
      {rect && <Spotlight rect={rect} />}
      <StepPopover
        index={index}
        onDismissForever={onDismissForever}
        onNext={onAdvance}
        onSkip={onSkip}
        referenceElement={state === 'resolved' ? element : null}
        step={step}
        total={total}
      />
    </>
  )
}

/**
 * Holds tour state and renders the active tour.
 *
 * Mounted through `studio.components.layout`, so it sits above the whole Studio
 * without owning any of its layout.
 */
export function OnboardingProvider(props: {
  tours: OnboardingTour[]
  children: React.ReactNode
}): React.JSX.Element {
  const {tours, children} = props
  const currentUser = useCurrentUser()
  const userId = currentUser?.id ?? null

  const [activeTourId, setActiveTourId] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  /** Set when a tour was started but every one of its steps was unavailable. */
  const [unavailableTour, setUnavailableTour] = useState<OnboardingTour | null>(null)
  /**
   * Tours already auto-offered in this browser session.
   *
   * `skipped` means "not now, ask me next time" — next *session*, not five
   * hundred milliseconds later. Without this, dismissing a tour would re-arm
   * auto-start the instant it closed and the popup would reappear on its own.
   */
  const offeredThisSession = useRef<Set<string>>(new Set())
  /** Guards against a step being skipped more than once. See `skipStep`. */
  const handledSkip = useRef<string | null>(null)
  // Bumped whenever a tour ends, to re-read statuses for the help menu.
  const [statusVersion, setStatusVersion] = useState(0)

  const activeTour = useMemo(
    () => tours.find((tour) => tour.id === activeTourId) ?? null,
    [tours, activeTourId],
  )

  const statuses = useMemo(() => {
    // `statusVersion` is the dependency that matters here; localStorage is not
    // reactive on its own.
    void statusVersion
    return Object.fromEntries(tours.map((tour) => [tour.id, getTourStatus(userId, tour.id)]))
  }, [tours, userId, statusVersion])

  const beginTour = useCallback((tourId: string) => {
    offeredThisSession.current.add(tourId)
    handledSkip.current = null
    setUnavailableTour(null)
    setActiveTourId(tourId)
    setStepIndex(0)
    setSkippedCount(0)
  }, [])

  /**
   * Public entry point, used by the help menu and `useStartTour`. Unlike
   * auto-start, this happens on a settled Studio, so a tour with nothing to
   * show says so straight away instead of waiting out every step's budget.
   */
  const startTour = useCallback(
    (tourId: string) => {
      const tour = tours.find((candidate) => candidate.id === tourId)

      if (tour && !hasAnyVisibleStep(tour)) {
        setUnavailableTour(tour)
        return
      }

      beginTour(tourId)
    },
    [tours, beginTour],
  )

  const endTour = useCallback(
    (status: TourStatus) => {
      if (activeTourId) setTourStatus(userId, activeTourId, status, stepIndex)
      setActiveTourId(null)
      setStepIndex(0)
      setSkippedCount(0)
      setStatusVersion((version) => version + 1)
    },
    [activeTourId, userId, stepIndex],
  )

  const stopTour = useCallback(() => endTour('skipped'), [endTour])

  const advance = useCallback(() => {
    if (!activeTour) return
    if (stepIndex >= activeTour.steps.length - 1) {
      endTour('completed')
      return
    }
    setStepIndex((index) => index + 1)
  }, [activeTour, stepIndex, endTour])

  // A step whose target never appeared. Same movement as `advance`, but it also
  // shrinks the visible step count so the counter doesn't jump.
  const skipStep = useCallback(
    (index: number) => {
      if (!activeTour) return

      // Skipping is driven from an effect, which React may invoke more than
      // once for the same step (Strict Mode does exactly this in development).
      // Without this guard each extra call would advance the index again and
      // the tour would run off the end of its own step list and vanish.
      const key = `${activeTour.id}:${index}`
      if (handledSkip.current === key) return
      handledSkip.current = key

      setSkippedCount((count) => count + 1)

      if (index >= activeTour.steps.length - 1) {
        // Every remaining step was missing, so don't record this as a completion.
        setActiveTourId(null)
        setStepIndex(0)
        setSkippedCount(0)
        // If nothing at all was shown, say so. A tour that silently does
        // nothing reads as a broken button.
        if (skippedCount + 1 === activeTour.steps.length) setUnavailableTour(activeTour)
        return
      }

      setStepIndex(index + 1)
    },
    [activeTour, skippedCount],
  )

  // Auto-start, once, and never over the top of someone's typing.
  useEffect(() => {
    if (activeTourId || !currentUser) return undefined

    const candidate = tours.find((tour) => {
      const autoStart = tour.autoStart ?? 'manual'
      if (autoStart === 'manual') return false
      if (offeredThisSession.current.has(tour.id)) return false
      if (!mayAutoStart(userId, tour.id)) return false
      if (autoStart === 'first-login') return true
      return autoStart({
        userId,
        roles: currentUser.roles.map((role) => role.name),
        status: getTourStatus(userId, tour.id),
      })
    })

    if (!candidate) return undefined

    // Wait for a quiet moment rather than firing immediately on mount — and
    // for the Studio to have actually rendered something worth pointing at.
    // Auto-start deliberately skips the synchronous availability check that
    // `startTour` does, because on a booting Studio "not there yet" and "not
    // there at all" look identical.
    const startedAt = Date.now()
    let intervalId = 0

    const settleId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        if (Date.now() - startedAt > AUTO_START_GIVE_UP_MS) {
          window.clearInterval(intervalId)
          return
        }
        if (isUserBusyEditing() || !hasAnyVisibleStep(candidate)) return
        window.clearInterval(intervalId)
        beginTour(candidate.id)
      }, 500)
    }, AUTO_START_SETTLE_MS)

    return () => {
      window.clearTimeout(settleId)
      window.clearInterval(intervalId)
    }
  }, [tours, activeTourId, currentUser, userId, beginTour])

  const contextValue = useMemo<OnboardingContextValue>(
    () => ({tours, activeTourId, startTour, stopTour, statuses}),
    [tours, activeTourId, startTour, stopTour, statuses],
  )

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
      {activeTour && (
        <TourErrorBoundary onError={stopTour} tourId={activeTour.id}>
          <StepRunner
            key={`${activeTour.id}:${stepIndex}`}
            onAdvance={advance}
            onDismissForever={() => endTour('dismissed')}
            onSkip={stopTour}
            onSkipStep={skipStep}
            skippedCount={skippedCount}
            stepIndex={stepIndex}
            tour={activeTour}
          />
        </TourErrorBoundary>
      )}
      {unavailableTour && (
        <UnavailableNotice onClose={() => setUnavailableTour(null)} tour={unavailableTour} />
      )}
    </OnboardingContext.Provider>
  )
}
