import {describe, expect, it} from 'vitest'

import {
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
