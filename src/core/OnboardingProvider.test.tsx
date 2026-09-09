import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {getTourStatus, setTourStatus} from './completionStore'
import {OnboardingProvider, useOnboarding} from './OnboardingProvider'
import {targetNavbar} from './targeting'
import {type FieldGuide, type OnboardingTour} from './types'

const theme = buildTheme()

/**
 * `vi.mock` below is hoisted above these, so both are `let` bindings the tests
 * reassign in `beforeEach` rather than values captured once at import time.
 */
let currentUser: {id: string; roles: {name: string}[]} | null
let fakeClient: {getDocument: (id: string) => Promise<undefined>}

// The plugin's own strings come from Sanity's i18n, which needs a Studio. These
// tests are about structure and behaviour, so the raw keys are enough — except
// `t` is made to interpolate its values, so the step counter can be asserted on
// like any other piece of text instead of being skipped entirely.
vi.mock('sanity', () => ({
  SANITY_VERSION: '6.12.0',
  useClient: () => fakeClient,
  useCurrentUser: () => currentUser,
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
  }),
}))

afterEach(cleanup)
afterEach(() => localStorage.clear())

/**
 * Replaces the fixture markup without touching the rest of `document.body`.
 *
 * `@sanity/ui`'s `Popover` appends its portal root as a sibling of whatever
 * this suite renders and keeps a reference to it across mounts, expecting it
 * to persist for the life of the document — a real Studio never tears down
 * `document.body`. A test that reset fixtures with `document.body.innerHTML =`
 * detached that portal root: the next test's popover rendered into it
 * without error, but invisibly, since the node was no longer attached to the
 * document. Confined to one container, the reset can never touch it.
 */
function setFixture(html: string): void {
  let fixture = document.getElementById('test-fixture')
  if (!fixture) {
    fixture = document.createElement('div')
    fixture.id = 'test-fixture'
    document.body.appendChild(fixture)
  }
  fixture.innerHTML = html
}

beforeEach(() => {
  currentUser = {id: 'u1', roles: [{name: 'administrator'}]}
  fakeClient = {getDocument: () => Promise.resolve(undefined)}
  // `useTargetElement` warns on every skipped step, and the provider's own dev
  // health check warns on an interval. Without this the test output is
  // unreadable.
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  setFixture('<div data-testid="studio-navbar">navbar</div>')
})

// `children` is deliberately excluded: the real children below are always
// the literal JSX ones, which override anything spread onto the component,
// so giving this a `children` field only invites a spread-vs-required-prop
// type mismatch for a value nothing ever reads.
interface ProviderProps {
  tours: OnboardingTour[]
  fieldGuides: FieldGuide[]
  syncProgress: boolean
}

/** Exposes the context to the tests, the way a real consumer would read it. */
function Probe(props: {onReady: (value: ReturnType<typeof useOnboarding>) => void}): null {
  props.onReady(useOnboarding())
  return null
}

/**
 * Renders the provider with a probe inside it, so tests drive the context
 * through its public API rather than reaching into the component's internals.
 */
function renderProvider(props: Partial<ProviderProps> = {}) {
  const merged: ProviderProps = {tours: [], fieldGuides: [], syncProgress: false, ...props}
  const holder: {current: ReturnType<typeof useOnboarding> | null} = {current: null}

  render(
    <ThemeProvider theme={theme}>
      <OnboardingProvider {...merged}>
        <div>studio</div>
        <Probe onReady={(value) => (holder.current = value)} />
      </OnboardingProvider>
    </ThemeProvider>,
  )

  return {
    ...merged,
    get onboarding(): ReturnType<typeof useOnboarding> {
      if (!holder.current) throw new Error('onboarding context not ready')
      return holder.current
    },
  }
}

/** A two-step tour whose steps both target the navbar fixture, so both resolve. */
function makeTour(overrides: Partial<OnboardingTour> = {}): OnboardingTour {
  return {
    id: 'essentials',
    title: 'Essentials',
    steps: [
      {target: targetNavbar(), title: 'Step one', content: 'First content'},
      {target: targetNavbar(), title: 'Step two', content: 'Second content'},
    ],
    ...overrides,
  }
}

// Onboarding is an accessory to the Studio, never a dependency of it: whatever
// else happens here, the Studio underneath has to render.
it('renders the Studio it wraps', () => {
  renderProvider()

  expect(screen.getByText('studio')).toBeTruthy()
})

describe('running a tour', () => {
  it('a manual start shows the first step', () => {
    const tour = makeTour()
    const {onboarding} = renderProvider({tours: [tour]})

    act(() => onboarding.startTour(tour.id))

    expect(screen.getByText('Step one')).toBeTruthy()
  })

  it('clicking Next moves to the second step', () => {
    const tour = makeTour()
    const {onboarding} = renderProvider({tours: [tour]})

    act(() => onboarding.startTour(tour.id))
    fireEvent.click(screen.getByText('action.next'))

    expect(screen.getByText('Step two')).toBeTruthy()
  })

  it('finishing the last step records it as completed', () => {
    const tour = makeTour()
    const {onboarding} = renderProvider({tours: [tour]})

    act(() => onboarding.startTour(tour.id))
    fireEvent.click(screen.getByText('action.next'))
    fireEvent.click(screen.getByText('action.done'))

    expect(getTourStatus('u1', tour.id)).toBe('completed')
  })

  it('skip records the tour as skipped, not opted out', () => {
    const tour = makeTour()
    const {onboarding} = renderProvider({tours: [tour]})

    act(() => onboarding.startTour(tour.id))
    fireEvent.click(screen.getByText('action.skip'))

    expect(getTourStatus('u1', tour.id)).toBe('skipped')
  })

  it('"don\'t show again" records a permanent dismissal', () => {
    const tour = makeTour()
    const {onboarding} = renderProvider({tours: [tour]})

    act(() => onboarding.startTour(tour.id))
    fireEvent.click(screen.getByText('action.dont-show-again'))

    expect(getTourStatus('u1', tour.id)).toBe('dismissed')
  })

  // Silently doing nothing would read as a broken button, so a tour with
  // nothing to show says so instead of starting.
  it('a tour with no resolvable step shows the unavailable notice instead of starting', () => {
    const tour = makeTour({
      id: 'nothing-to-show',
      steps: [{target: '#does-not-exist', title: 'Ghost', content: 'Nothing here'}],
    })
    const {onboarding} = renderProvider({tours: [tour]})

    act(() => onboarding.startTour(tour.id))

    expect(screen.getByText('menu.unavailable')).toBeTruthy()
    expect(onboarding.activeTourId).toBeNull()
  })
})

describe('auto-start', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('a first-login tour starts on its own after the settle delay', () => {
    const tour = makeTour({autoStart: 'first-login'})
    renderProvider({tours: [tour]})

    act(() => void vi.advanceTimersByTime(2000))

    expect(screen.getByText('Step one')).toBeTruthy()
  })

  it('a manual tour never starts on its own', () => {
    const tour = makeTour({autoStart: 'manual'})
    renderProvider({tours: [tour]})

    act(() => void vi.advanceTimersByTime(2500))

    expect(screen.queryByText('Step one')).toBeNull()
  })

  it('a tour with no autoStart declared defaults to manual and never starts', () => {
    const tour = makeTour()
    renderProvider({tours: [tour]})

    act(() => void vi.advanceTimersByTime(2500))

    expect(screen.queryByText('Step one')).toBeNull()
  })

  // Lean and unobtrusive: appearing the instant the app paints would race a
  // user who is already clicking into a field, so nothing may show before the
  // settle delay elapses.
  it('does not start before the settle delay has elapsed', () => {
    const tour = makeTour({autoStart: 'first-login'})
    renderProvider({tours: [tour]})

    act(() => void vi.advanceTimersByTime(1000))

    expect(screen.queryByText('Step one')).toBeNull()
  })

  it('a dismissed tour does not offer itself again', () => {
    const tour = makeTour({autoStart: 'first-login'})
    setTourStatus('u1', tour.id, 'dismissed')
    renderProvider({tours: [tour]})

    act(() => void vi.advanceTimersByTime(2500))

    expect(screen.queryByText('Step one')).toBeNull()
  })

  // `skipped` means "I was busy," not "I opted out" — it must not be treated
  // like a dismissal.
  it('a skipped tour is offered again', () => {
    const tour = makeTour({autoStart: 'first-login'})
    setTourStatus('u1', tour.id, 'skipped')
    renderProvider({tours: [tour]})

    act(() => void vi.advanceTimersByTime(2500))

    expect(screen.getByText('Step one')).toBeTruthy()
  })

  it('a predicate autoStart receives the user id, roles and stored status', () => {
    const predicate = vi.fn().mockReturnValue(true)
    const tour = makeTour({autoStart: predicate})
    setTourStatus('u1', tour.id, 'skipped')
    renderProvider({tours: [tour]})

    act(() => void vi.advanceTimersByTime(2500))

    expect(predicate).toHaveBeenCalledWith({
      userId: 'u1',
      roles: ['administrator'],
      status: 'skipped',
    })
    expect(screen.getByText('Step one')).toBeTruthy()
  })

  // The clearest expression of "never interrupt active editing": a tour that
  // appears mid-sentence is worse than no tour at all.
  it('does not start while the user is typing', () => {
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()

    const tour = makeTour({autoStart: 'first-login'})
    renderProvider({tours: [tour]})

    act(() => void vi.advanceTimersByTime(2000))

    expect(screen.queryByText('Step one')).toBeNull()
  })
})

describe('steps that cannot find their target', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** Step 1 targets a selector nothing on the page ever matches. */
  function makeThreeStepTour(): OnboardingTour {
    return makeTour({
      id: 'three-step',
      steps: [
        {target: targetNavbar(), title: 'Step one', content: 'a'},
        {target: '#nothing-here', title: 'Ghost step', content: 'b'},
        {target: targetNavbar(), title: 'Step three', content: 'c'},
      ],
    })
  }

  it('drops a step whose target never appears and continues the tour', () => {
    const tour = makeThreeStepTour()
    const {onboarding} = renderProvider({tours: [tour]})

    act(() => onboarding.startTour(tour.id))
    fireEvent.click(screen.getByText('action.next'))
    act(() => void vi.advanceTimersByTime(2500))

    expect(screen.getByText('Step three')).toBeTruthy()
  })

  it('shrinks the progress counter along with the dropped step', () => {
    const tour = makeThreeStepTour()
    const {onboarding} = renderProvider({tours: [tour]})

    act(() => onboarding.startTour(tour.id))
    fireEvent.click(screen.getByText('action.next'))
    act(() => void vi.advanceTimersByTime(2500))

    // Both the position and the total shrank by the one dropped step: this is
    // the last of 2 remaining steps, not the third of 3 declared ones.
    expect(screen.getByText('progress:{"current":2,"total":2}')).toBeTruthy()
    expect(screen.getByText('action.done')).toBeTruthy()
  })

  // A tour that never actually shows its last step must not be recorded as if
  // the user went through it.
  it('does not record a completion when the last step is missing throughout', () => {
    const tour = makeTour({
      id: 'ghost-tour',
      steps: [
        {target: targetNavbar(), title: 'Step one', content: 'a'},
        {target: '#nothing-here', title: 'Ghost step', content: 'b'},
      ],
    })
    const {onboarding} = renderProvider({tours: [tour]})

    act(() => onboarding.startTour(tour.id))
    fireEvent.click(screen.getByText('action.next'))
    act(() => void vi.advanceTimersByTime(2500))

    expect(onboarding.activeTourId).toBeNull()
    expect(getTourStatus('u1', tour.id)).toBeNull()
  })
})

describe('field help', () => {
  it('matches a guide with no documentType against any type', () => {
    const guide: FieldGuide = {field: 'slug', title: 'Slugs', content: 'One line, no spaces.'}
    const {onboarding} = renderProvider({fieldGuides: [guide]})

    expect(onboarding.fieldHelpFor('slug', 'post')).toBeTruthy()
    expect(onboarding.fieldHelpFor('slug', undefined)).toBeTruthy()
  })

  it('requires a match when a guide names a documentType', () => {
    const guide: FieldGuide = {
      field: 'ingredients',
      documentType: 'recipe',
      title: 'One per line',
      content: 'The site renders each line as its own bullet.',
    }
    const {onboarding} = renderProvider({fieldGuides: [guide]})

    expect(onboarding.fieldHelpFor('ingredients', 'recipe')).toBeTruthy()
    expect(onboarding.fieldHelpFor('ingredients', 'post')).toBeUndefined()
  })

  it('returns undefined for a field with no declared help', () => {
    const {onboarding} = renderProvider({fieldGuides: []})

    expect(onboarding.fieldHelpFor('nope', undefined)).toBeUndefined()
  })

  // Kept apart from tour state on purpose: field help has no progress and
  // nothing to record, and it must be able to open while a tour is running
  // without disturbing it.
  it('opens over a running tour without ending it', () => {
    setFixture(`
      <div data-testid="studio-navbar">navbar</div>
      <div data-testid="field-slug">field</div>
    `)
    const tour = makeTour()
    const guide: FieldGuide = {field: 'slug', title: 'Slug help', content: 'Explains slugs'}
    // Kept as `session`, not destructured: `onboarding` is a getter that
    // re-reads the latest context value, and destructuring it would freeze
    // the snapshot from this render — before either `act` below runs.
    const session = renderProvider({tours: [tour], fieldGuides: [guide]})

    act(() => session.onboarding.startTour(tour.id))
    const help = session.onboarding.fieldHelpFor('slug', undefined)
    if (!help) throw new Error('expected field help to be registered for "slug"')
    act(() => session.onboarding.showFieldHelp(help))

    expect(screen.getByText('Step one')).toBeTruthy()
    expect(screen.getByText('Slug help')).toBeTruthy()
    expect(session.onboarding.activeTourId).toBe(tour.id)
  })
})

describe('start over', () => {
  it("clears every registered tour's stored status", () => {
    const tourA = makeTour({id: 'a'})
    const tourB = makeTour({id: 'b'})
    setTourStatus('u1', 'a', 'completed')
    setTourStatus('u1', 'b', 'dismissed')

    const {onboarding} = renderProvider({tours: [tourA, tourB]})
    act(() => onboarding.resetAll())

    expect(getTourStatus('u1', 'a')).toBeNull()
    expect(getTourStatus('u1', 'b')).toBeNull()
  })

  it('lets a first-login tour auto-start again in the same session', () => {
    vi.useFakeTimers()
    try {
      const tour = makeTour({autoStart: 'first-login'})
      const {onboarding} = renderProvider({tours: [tour]})

      act(() => void vi.advanceTimersByTime(2000))
      expect(screen.getByText('Step one')).toBeTruthy()

      // Ending the tour and resetting together: the session guard that would
      // otherwise block a second offer is cleared before the tour's own end
      // commits.
      act(() => {
        onboarding.stopTour()
        onboarding.resetAll()
      })
      expect(screen.queryByText('Step one')).toBeNull()

      act(() => void vi.advanceTimersByTime(2000))
      expect(screen.getByText('Step one')).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })
})
