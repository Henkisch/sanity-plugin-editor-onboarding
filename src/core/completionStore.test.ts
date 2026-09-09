import {afterEach, describe, expect, it, vi} from 'vitest'

import {
  getTourStatus,
  getUserProgress,
  hasOpenedMenu,
  mayAutoStart,
  resetTourStatus,
  setMenuOpened,
  setResetAt,
  setTourStatus,
  setUserProgress,
} from './completionStore'

const STORAGE_KEY = 'sanity-plugin-editor-onboarding:v1'

afterEach(() => localStorage.clear())

describe('the three-status model', () => {
  // The distinction these tests protect is the whole reason there are three
  // statuses rather than a boolean: "not now" and "never again" are different
  // intents, and conflating them either nags a user forever or silences a tour
  // they never opted out of.
  it('offers a skipped tour again — the user was busy, not opted out', () => {
    setTourStatus('user-1', 'essentials', 'skipped')

    expect(getTourStatus('user-1', 'essentials')).toBe('skipped')
    expect(mayAutoStart('user-1', 'essentials')).toBe(true)
  })

  it('never auto-starts a dismissed tour again', () => {
    setTourStatus('user-1', 'essentials', 'dismissed')

    expect(mayAutoStart('user-1', 'essentials')).toBe(false)
  })

  it('never auto-starts a completed tour again', () => {
    setTourStatus('user-1', 'essentials', 'completed')

    expect(mayAutoStart('user-1', 'essentials')).toBe(false)
  })

  it('auto-starts a tour the user has never seen', () => {
    expect(getTourStatus('user-1', 'essentials')).toBeNull()
    expect(mayAutoStart('user-1', 'essentials')).toBe(true)
  })
})

describe('scoping', () => {
  it('keeps one user’s progress out of another’s', () => {
    setTourStatus('user-1', 'essentials', 'completed')

    expect(getTourStatus('user-2', 'essentials')).toBeNull()
    expect(mayAutoStart('user-2', 'essentials')).toBe(true)
  })

  it('keeps tours apart for the same user', () => {
    setTourStatus('user-1', 'essentials', 'completed')

    expect(getTourStatus('user-1', 'publishing')).toBeNull()
  })

  it('stores anonymous users under their own key rather than sharing one', () => {
    setTourStatus(null, 'essentials', 'completed')

    expect(getTourStatus(null, 'essentials')).toBe('completed')
    expect(getTourStatus('user-1', 'essentials')).toBeNull()
  })
})

describe('the menu dot', () => {
  it('is shown until the menu is opened, then never again', () => {
    expect(hasOpenedMenu('user-1')).toBe(false)

    setMenuOpened('user-1')

    expect(hasOpenedMenu('user-1')).toBe(true)
  })

  it('is tracked per user', () => {
    setMenuOpened('user-1')

    expect(hasOpenedMenu('user-2')).toBe(false)
  })

  it('survives a tour status being written afterwards', () => {
    setMenuOpened('user-1')
    setTourStatus('user-1', 'essentials', 'completed')

    expect(hasOpenedMenu('user-1')).toBe(true)
  })
})

describe('resetting', () => {
  it('makes a tour behave as if never seen', () => {
    setTourStatus('user-1', 'essentials', 'dismissed')
    resetTourStatus('user-1', 'essentials')

    expect(getTourStatus('user-1', 'essentials')).toBeNull()
    expect(mayAutoStart('user-1', 'essentials')).toBe(true)
  })

  it('leaves other tours alone', () => {
    setTourStatus('user-1', 'essentials', 'dismissed')
    setTourStatus('user-1', 'publishing', 'dismissed')

    resetTourStatus('user-1', 'essentials')

    expect(getTourStatus('user-1', 'publishing')).toBe('dismissed')
  })
})

describe('resetAt', () => {
  it('is readable back through getUserProgress', () => {
    const resetAt = setResetAt('user-1')

    expect(getUserProgress('user-1').resetAt).toBe(resetAt)
  })
})

describe('setUserProgress', () => {
  it("removes this user's records that are absent from the progress it is given", () => {
    setTourStatus('user-1', 'essentials', 'completed')

    setUserProgress('user-1', {tours: {}})

    expect(getTourStatus('user-1', 'essentials')).toBeNull()
  })

  // The regression that matters most here: a shared machine must not have one
  // person's reset wipe another's state.
  it("leaves a different user's records alone while pruning this one's", () => {
    setTourStatus('user-1', 'essentials', 'completed')
    setTourStatus('user-2', 'essentials', 'completed')

    setUserProgress('user-1', {tours: {}})

    expect(getTourStatus('user-2', 'essentials')).toBe('completed')
  })
})

describe('surviving bad storage', () => {
  // Onboarding state is never important enough to break a Studio over, so every
  // one of these has to degrade to "never seen" rather than throw.
  it('treats unparseable JSON as no state', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')

    expect(() => getTourStatus('user-1', 'essentials')).not.toThrow()
    expect(getTourStatus('user-1', 'essentials')).toBeNull()
  })

  it('ignores state written by a future schema version', () => {
    // A downgrade must not misread a newer shape as its own.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({version: 99, tours: {'user-1:essentials': {status: 'completed'}}}),
    )

    expect(getTourStatus('user-1', 'essentials')).toBeNull()
  })

  it('ignores a payload that is valid JSON but the wrong shape', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['not', 'an', 'object']))

    expect(getTourStatus('user-1', 'essentials')).toBeNull()
  })

  it('does not throw when reading throws, as in private browsing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(() => getTourStatus('user-1', 'essentials')).not.toThrow()
    expect(mayAutoStart('user-1', 'essentials')).toBe(true)
  })

  it('does not throw when writing throws, as when the quota is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => setTourStatus('user-1', 'essentials', 'completed')).not.toThrow()
  })
})

describe('what is recorded', () => {
  it('keeps the step the user reached, for future resume support', () => {
    setTourStatus('user-1', 'essentials', 'skipped', 2)

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.tours['user-1:essentials'].stepIndex).toBe(2)
  })

  it('omits the step index rather than storing undefined when there is none', () => {
    setTourStatus('user-1', 'essentials', 'skipped')

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect('stepIndex' in stored.tours['user-1:essentials']).toBe(false)
  })
})
