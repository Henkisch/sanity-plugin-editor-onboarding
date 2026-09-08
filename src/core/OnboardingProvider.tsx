import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {SANITY_VERSION, useClient, useCurrentUser} from 'sanity'

import {
  getTourStatus,
  getUserProgress,
  resetTourStatus,
  setUserProgress,
  hasOpenedMenu,
  mayAutoStart,
  setMenuOpened,
  setTourStatus,
} from './completionStore'
import {Spotlight} from './Spotlight'
import {StepPopover} from './StepPopover'
import {TourErrorBoundary} from './TourErrorBoundary'
import {checkTargets, formatReport, isDevelopment} from './healthCheck'
import {mergeProgress, progressDiffers} from './progressSync'
import {fetchProgress, saveProgress, PROGRESS_API_VERSION} from './remoteProgress'
import {type FieldGuide, type OnboardingTour, type TourStatus} from './types'
import {UnavailableNotice} from './UnavailableNotice'
import {collectFieldHelp, findFieldHelp, stepTarget, type FieldHelp} from './fieldHelp'
import {targetGuidesButton} from './targeting'
import {query, useTargetElement} from './useTargetElement'

interface OnboardingContextValue {
  tours: OnboardingTour[]
  activeTourId: string | null
  startTour: (tourId: string) => void
  stopTour: () => void
  /** Status per tour id, re-read whenever a tour ends. */
  statuses: Record<string, TourStatus | null>
  /** Whether the navbar button should still show its one-time "look here" dot. */
  showMenuHint: boolean
  /** Retires the dot permanently for this user. */
  markMenuOpened: () => void
  /** Forget every guide's status, so they behave as never seen. */
  resetAll: () => void
  /** The help for one field, if any is declared. Drives the field's book icon. */
  fieldHelpFor: (fieldName: string, documentType: string | undefined) => FieldHelp | undefined
  /** Show one field's help on its own, outside any tour. */
  showFieldHelp: (help: FieldHelp) => void
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
 * The runtime if it is there, and `null` if it isn't.
 *
 * Field actions are rendered by Sanity, not by us, and a hook that throws there
 * takes down the whole structure tool. Anything mounted outside this plugin's
 * own tree has to ask this way and degrade instead.
 *
 * @internal
 */
export function useOnboardingOptional(): OnboardingContextValue | null {
  return useContext(OnboardingContext)
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
  return tour.steps.some((step) => {
    const target = stepTarget(step)
    return !target || Boolean(query(target))
  })
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

  const {state, element, rect} = useTargetElement(step && stepTarget(step), {
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
        sourceUrl={tour.sourceUrl}
        step={step}
        total={total}
      />
    </>
  )
}

/**
 * Renders one field's help on its own.
 *
 * Simpler than `StepRunner` in the ways that matter: there is no next step, no
 * counter, and nothing to record. A target that cannot be found closes it
 * rather than skipping onwards, because there is nothing to skip to — and it
 * should not be reachable anyway, since the icon only appears on a field that
 * is on screen.
 */
function FieldHelpRunner(props: {help: FieldHelp; onClose: () => void}): React.JSX.Element | null {
  const {help, onClose} = props

  const {state, element, rect} = useTargetElement(stepTarget(help.step), {
    tourId: `field:${help.field}`,
    stepIndex: 0,
  })

  useEffect(() => {
    if (state === 'missing') onClose()
  }, [state, onClose])

  if (state === 'pending' || state === 'missing') return null

  return (
    <>
      {rect && <Spotlight rect={rect} />}
      <StepPopover
        index={0}
        onDismissForever={onClose}
        onNext={onClose}
        onSkip={onClose}
        referenceElement={state === 'resolved' ? element : null}
        standalone
        step={help.step}
        total={1}
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
  fieldGuides: FieldGuide[]
  syncProgress: boolean
  children: React.ReactNode
}): React.JSX.Element {
  const {tours, fieldGuides, syncProgress, children} = props
  const currentUser = useCurrentUser()
  const userId = currentUser?.id ?? null
  const client = useClient({apiVersion: PROGRESS_API_VERSION})

  const [activeTourId, setActiveTourId] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  /** Set when a tour was started but every one of its steps was unavailable. */
  const [unavailableTour, setUnavailableTour] = useState<OnboardingTour | null>(null)
  /**
   * A single field's help, opened from that field's own book icon.
   *
   * Kept apart from tour state on purpose: it has no progress, no next step
   * and nothing to record, and it must be able to open while a tour is
   * running without disturbing it.
   */
  const [activeFieldHelp, setActiveFieldHelp] = useState<FieldHelp | null>(null)
  /**
   * Where focus was before a guide took it, so it can be handed back.
   *
   * Kept separately for tours and field help, because a field's guide can open
   * while a tour is running and each has to return focus to its own caller. A
   * keyboard user who opens a guide and closes it should be back where they
   * were, not at the top of the document.
   */
  const focusBeforeTour = useRef<HTMLElement | null>(null)
  const focusBeforeFieldHelp = useRef<HTMLElement | null>(null)
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
  /**
   * Whether project-side progress has been read yet.
   *
   * Auto-start waits on this, because starting before it lands is exactly
   * the bug syncing exists to fix: an editor on a new machine being shown a
   * guide they switched off somewhere else. Starts settled when syncing is
   * off, so nothing waits on a request that will never be made.
   */
  const [remoteLoaded, setRemoteLoaded] = useState(!syncProgress)
  // Bumped when the menu is opened, to re-read the stored flag.
  const [menuVersion, setMenuVersion] = useState(0)

  // Derived rather than held in state: the flag is keyed by user id, which is
  // not known on the first render, and localStorage is not reactive.
  const menuOpened = useMemo(() => {
    void menuVersion
    return hasOpenedMenu(userId)
  }, [userId, menuVersion])

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

  /** The element to hand focus back to, if it is still on the page. */
  const rememberFocus = (into: {current: HTMLElement | null}) => {
    const active = document.activeElement
    into.current = active instanceof HTMLElement ? active : null
  }

  const restoreFocus = useCallback((from: {current: HTMLElement | null}) => {
    const element = from.current
    from.current = null

    // `isConnected` because the control that started a guide is often gone by
    // the time it closes: a tour started from the guides menu remembers the
    // menu item, and the menu unmounts on the way out.
    if (element?.isConnected) {
      element.focus({preventScroll: true})
      return
    }

    // Falling back on the guides button rather than giving up. Leaving focus on
    // `body` means a keyboard user's next Tab restarts at the top of the
    // Studio, which is a worse place than where they were.
    const fallback = document.querySelector(targetGuidesButton())
    if (fallback instanceof HTMLElement) fallback.focus({preventScroll: true})
  }, [])

  const beginTour = useCallback((tourId: string) => {
    rememberFocus(focusBeforeTour)
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
      if (activeTourId) {
        setTourStatus(userId, activeTourId, status, stepIndex)
        if (syncProgress && userId) void saveProgress(client, userId, getUserProgress(userId))
      }
      restoreFocus(focusBeforeTour)
      setActiveTourId(null)
      setStepIndex(0)
      setSkippedCount(0)
      setStatusVersion((version) => version + 1)
    },
    [activeTourId, userId, stepIndex, restoreFocus, syncProgress, client],
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

  // Once per session, in development, say which targets resolved. A step whose
  // selector Sanity has renamed skips itself in silence, which is right for an
  // editor and useless for the developer who needs to fix it.
  useEffect(() => {
    if (!isDevelopment() || tours.length === 0) return undefined

    // Late enough that the Studio has rendered something worth checking.
    const timeoutId = window.setTimeout(() => {
      // `warn` rather than `info`: Studio consoles are busy, and this is the
      // one message a developer needs to see when a guide has gone quiet.
      console.warn(formatReport(checkTargets(tours), SANITY_VERSION))
    }, AUTO_START_SETTLE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [tours])

  // Pull the project's copy of this user's progress in, once.
  useEffect(() => {
    if (!syncProgress || !userId) return undefined

    let cancelled = false

    void (async () => {
      const {progress: remote, needsRepair} = await fetchProgress(client, userId)
      if (cancelled) return

      const local = getUserProgress(userId)
      const merged = mergeProgress(local, remote)

      setUserProgress(userId, merged)
      // Re-read statuses: the menu may now need to show a guide as finished
      // that this browser had never seen finished.
      setStatusVersion((version) => version + 1)
      setMenuVersion((version) => version + 1)
      setRemoteLoaded(true)

      // Only write when this browser knew something the project did not, or
      // when the stored document needs its shape repaired. Onboarding state
      // changes a handful of times per user, ever, and this runs in someone
      // else's dataset.
      if (needsRepair || progressDiffers(remote, merged)) {
        void saveProgress(client, userId, merged, {repairShape: needsRepair})
      }
    })()

    return () => {
      cancelled = true
    }
  }, [syncProgress, userId, client])

  // Auto-start, once, and never over the top of someone's typing.
  useEffect(() => {
    if (activeTourId || !currentUser || !remoteLoaded) return undefined

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
  }, [tours, activeTourId, currentUser, userId, beginTour, remoteLoaded])

  /**
   * Every field that should carry a book icon, from tour steps and standalone
   * guides alike.
   */
  const fieldHelp = useMemo(() => collectFieldHelp(tours, fieldGuides), [tours, fieldGuides])

  const showFieldHelp = useCallback((help: FieldHelp) => {
    rememberFocus(focusBeforeFieldHelp)
    setActiveFieldHelp(help)
  }, [])

  const closeFieldHelp = useCallback(() => {
    setActiveFieldHelp(null)
    restoreFocus(focusBeforeFieldHelp)
  }, [restoreFocus])

  const fieldHelpFor = useCallback(
    (fieldName: string, documentType: string | undefined) =>
      findFieldHelp(fieldHelp, fieldName, documentType),
    [fieldHelp],
  )

  /**
   * Start over: forget every guide's status for this user.
   *
   * Local first so the menu updates immediately, then mirrored if syncing is on.
   * Deliberately not a confirmation dialog — nothing here is content, and the
   * worst outcome is being offered a guide again.
   */
  const resetAll = useCallback(() => {
    for (const tour of tours) resetTourStatus(userId, tour.id)

    offeredThisSession.current.clear()
    setStatusVersion((version) => version + 1)

    if (syncProgress && userId) void saveProgress(client, userId, getUserProgress(userId))
  }, [tours, userId, syncProgress, client])

  const markMenuOpened = useCallback(() => {
    setMenuOpened(userId)
    setMenuVersion((version) => version + 1)
    if (syncProgress && userId) void saveProgress(client, userId, getUserProgress(userId))
  }, [userId, syncProgress, client])

  const contextValue = useMemo<OnboardingContextValue>(
    () => ({
      tours,
      activeTourId,
      startTour,
      stopTour,
      statuses,
      // Only hint while there is something to find. Nothing registered means
      // nothing to point at.
      showMenuHint: !menuOpened && tours.length > 0,
      markMenuOpened,
      resetAll,
      fieldHelpFor,
      showFieldHelp,
    }),
    [
      tours,
      activeTourId,
      startTour,
      stopTour,
      statuses,
      menuOpened,
      markMenuOpened,
      resetAll,
      fieldHelpFor,
      showFieldHelp,
    ],
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
      {activeFieldHelp && (
        <TourErrorBoundary
          onError={closeFieldHelp}
          tourId={`field:${activeFieldHelp.field}`}
        >
          <FieldHelpRunner help={activeFieldHelp} onClose={closeFieldHelp} />
        </TourErrorBoundary>
      )}
      {unavailableTour && (
        <UnavailableNotice onClose={() => setUnavailableTour(null)} tour={unavailableTour} />
      )}
    </OnboardingContext.Provider>
  )
}
