import {describe, expect, it} from 'vitest'

import {
  fromTourItems,
  toTourItems,
  tourItemPath,
  emptyProgress,
  mergeProgress,
  newerRecord,
  progressDiffers,
  progressDocumentId,
  type UserProgress,
} from './progressSync'

const at = (iso: string, status: 'skipped' | 'dismissed' | 'completed' = 'completed') => ({
  status,
  updatedAt: iso,
})

describe('newerRecord', () => {
  it('takes the later of two', () => {
    expect(newerRecord(at('2026-01-01T00:00:00Z'), at('2026-06-01T00:00:00Z'))?.updatedAt).toBe(
      '2026-06-01T00:00:00Z',
    )
  })

  it('takes whichever exists when only one does', () => {
    expect(newerRecord(undefined, at('2026-01-01T00:00:00Z'))?.updatedAt).toBe(
      '2026-01-01T00:00:00Z',
    )
    expect(newerRecord(at('2026-01-01T00:00:00Z'), undefined)?.updatedAt).toBe(
      '2026-01-01T00:00:00Z',
    )
  })

  it('is undefined when neither does', () => {
    expect(newerRecord(undefined, undefined)).toBeUndefined()
  })

  it('prefers a record with a usable timestamp over one without', () => {
    expect(newerRecord(at('nonsense'), at('2026-01-01T00:00:00Z'))?.updatedAt).toBe(
      '2026-01-01T00:00:00Z',
    )
    expect(newerRecord(at('2026-01-01T00:00:00Z'), at('nonsense'))?.updatedAt).toBe(
      '2026-01-01T00:00:00Z',
    )
  })

  it('keeps the first on a tie, so callers can express a preference by order', () => {
    const local = {...at('2026-01-01T00:00:00Z'), stepIndex: 3}
    const remote = {...at('2026-01-01T00:00:00Z'), stepIndex: 9}

    expect(newerRecord(local, remote)?.stepIndex).toBe(3)
  })
})

describe('mergeProgress', () => {
  it('keeps a guide finished on another machine finished here', () => {
    const local: UserProgress = {tours: {}}
    const remote: UserProgress = {tours: {essentials: at('2026-06-01T00:00:00Z')}}

    expect(mergeProgress(local, remote).tours.essentials.status).toBe('completed')
  })

  it('keeps guides from both sides rather than letting one document win', () => {
    const local: UserProgress = {tours: {essentials: at('2026-06-01T00:00:00Z')}}
    const remote: UserProgress = {tours: {publishing: at('2026-06-02T00:00:00Z')}}

    const merged = mergeProgress(local, remote)

    expect(Object.keys(merged.tours).sort()).toEqual(['essentials', 'publishing'])
  })

  // The failure that matters: a tour someone switched off coming back.
  it('never resurrects a dismissal with an older record', () => {
    const local: UserProgress = {tours: {essentials: at('2026-06-01T00:00:00Z', 'dismissed')}}
    const remote: UserProgress = {tours: {essentials: at('2026-01-01T00:00:00Z', 'skipped')}}

    expect(mergeProgress(local, remote).tours.essentials.status).toBe('dismissed')
  })

  it('lets a newer dismissal from elsewhere win over a local skip', () => {
    const local: UserProgress = {tours: {essentials: at('2026-01-01T00:00:00Z', 'skipped')}}
    const remote: UserProgress = {tours: {essentials: at('2026-06-01T00:00:00Z', 'dismissed')}}

    expect(mergeProgress(local, remote).tours.essentials.status).toBe('dismissed')
  })

  it('keeps the earliest record of the menu being opened', () => {
    const merged = mergeProgress(
      {tours: {}, menuOpenedAt: '2026-06-01T00:00:00Z'},
      {tours: {}, menuOpenedAt: '2026-01-01T00:00:00Z'},
    )

    expect(merged.menuOpenedAt).toBe('2026-01-01T00:00:00Z')
  })

  it('remembers the menu was opened when only one side saw it', () => {
    expect(mergeProgress({tours: {}}, {tours: {}, menuOpenedAt: '2026-01-01T00:00:00Z'})
      .menuOpenedAt).toBe('2026-01-01T00:00:00Z')
  })

  it('leaves menuOpenedAt off entirely when neither side has it', () => {
    expect('menuOpenedAt' in mergeProgress(emptyProgress(), emptyProgress())).toBe(false)
  })
})

describe('progressDiffers', () => {
  it('is false for two views of the same state, so no needless write happens', () => {
    const one: UserProgress = {tours: {essentials: at('2026-06-01T00:00:00Z')}}
    const two: UserProgress = {tours: {essentials: at('2026-06-01T00:00:00Z')}}

    expect(progressDiffers(one, two)).toBe(false)
  })

  it('is true when a guide was added', () => {
    expect(
      progressDiffers({tours: {}}, {tours: {essentials: at('2026-06-01T00:00:00Z')}}),
    ).toBe(true)
  })

  it('is true when a status changed', () => {
    expect(
      progressDiffers(
        {tours: {essentials: at('2026-06-01T00:00:00Z', 'skipped')}},
        {tours: {essentials: at('2026-06-01T00:00:00Z', 'dismissed')}},
      ),
    ).toBe(true)
  })

  it('is true when the menu was opened', () => {
    expect(progressDiffers({tours: {}}, {tours: {}, menuOpenedAt: '2026-01-01T00:00:00Z'})).toBe(
      true,
    )
  })
})

describe('progressDocumentId', () => {
  it('is deterministic, so reading it never needs a query', () => {
    expect(progressDocumentId('pAbc123')).toBe('onboarding.progress.pAbc123')
  })

  it('replaces characters a Sanity id cannot hold', () => {
    expect(progressDocumentId('user@example.com')).toBe('onboarding.progress.user-example.com')
  })
})

describe('the keyed-array storage shape', () => {
  // Sanity patch paths cannot address `tours.seo-panel`: the hyphen is a syntax
  // error, and `tours["seo-panel"]` is read as a literal. Keyed arrays are the
  // shape its patch system is actually built for, and this is verified against
  // a real dataset, not assumed.
  it('selects a tour by key, hyphens and all', () => {
    expect(tourItemPath('seo-panel')).toBe('tours[_key=="seo-panel"]')
  })

  it('escapes a quote in a tour id rather than emitting a broken filter', () => {
    expect(tourItemPath('say "hi"')).toBe('tours[_key=="say \\"hi\\""]')
  })

  it('round-trips progress through the stored shape', () => {
    const progress = {
      tours: {
        essentials: {status: 'completed' as const, updatedAt: '2026-06-01T00:00:00Z'},
        'seo-panel': {status: 'skipped' as const, updatedAt: '2026-06-02T00:00:00Z', stepIndex: 2},
      },
    }

    expect(fromTourItems(toTourItems(progress))).toEqual(progress.tours)
  })

  it('gives every item a key and a type, which Sanity requires of array members', () => {
    const items = toTourItems({tours: {essentials: at('2026-06-01T00:00:00Z')}})

    expect(items[0]._key).toBe('essentials')
    expect(items[0]._type).toBe('onboarding.tourProgress')
  })

  it('omits stepIndex rather than storing undefined', () => {
    expect('stepIndex' in toTourItems({tours: {essentials: at('2026-06-01T00:00:00Z')}})[0]).toBe(
      false,
    )
  })

  // The document is writable by the editor it belongs to, so a malformed one
  // must not take their guides down with it.
  it('ignores entries that are not usable rather than trusting the document', () => {
    expect(
      fromTourItems([
        null,
        'nonsense',
        {_key: 'no-status'},
        {status: 'completed'},
        {_key: '', status: 'completed'},
        {_key: 'bad-status', status: 'invented'},
        {_key: 'good', status: 'completed', updatedAt: '2026-06-01T00:00:00Z'},
      ]),
    ).toEqual({good: {status: 'completed', updatedAt: '2026-06-01T00:00:00Z'}})
  })

  it('treats a value that is neither array nor object as no progress', () => {
    expect(fromTourItems(undefined)).toEqual({})
    expect(fromTourItems('nonsense')).toEqual({})
    expect(fromTourItems(42)).toEqual({})
  })

  // An early version of this feature stored an object keyed by tour id. Reading
  // it is what keeps an upgrade from silently forgetting what someone has
  // already seen.
  it('still reads progress stored in the pre-release object shape', () => {
    expect(
      fromTourItems({essentials: {status: 'completed', updatedAt: '2026-06-01T00:00:00Z'}}),
    ).toEqual({essentials: {status: 'completed', updatedAt: '2026-06-01T00:00:00Z'}})
  })

  it('applies the same scrutiny to the old shape as to the new one', () => {
    expect(fromTourItems({good: {status: 'completed'}, bad: {status: 'invented'}})).toEqual({
      good: {status: 'completed', updatedAt: ''},
    })
  })
})
