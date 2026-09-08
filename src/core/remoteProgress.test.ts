import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type SanityClient} from 'sanity'

/**
 * The module warns at most once per session, so each test gets a fresh copy
 * rather than inheriting whether an earlier one had already complained.
 */
async function loadStore() {
  vi.resetModules()
  return import('./remoteProgress')
}

/**
 * Only the two methods the store calls. Typed loosely on purpose: standing up a
 * whole SanityClient to assert on two calls would test the mock, not the code.
 */
// oxlint-disable-next-line no-unsafe-type-assertion
const fakeClient = (overrides: Partial<SanityClient>): SanityClient => overrides as SanityClient

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('reading', () => {
  it('reads a stored document into progress', async () => {
    const {fetchProgress} = await loadStore()
    const client = fakeClient({
      getDocument: vi.fn().mockResolvedValue({
        _id: 'onboarding.progress.u1',
        tours: {essentials: {status: 'completed', updatedAt: '2026-06-01T00:00:00Z'}},
        menuOpenedAt: '2026-05-01T00:00:00Z',
      }),
    })

    const progress = await fetchProgress(client, 'u1')

    expect(progress.tours.essentials.status).toBe('completed')
    expect(progress.menuOpenedAt).toBe('2026-05-01T00:00:00Z')
  })

  it('asks for the id derived from the user, never a query', async () => {
    const {fetchProgress} = await loadStore()
    const getDocument = vi.fn().mockResolvedValue(undefined)

    await fetchProgress(fakeClient({getDocument}), 'u1')

    expect(getDocument).toHaveBeenCalledWith('onboarding.progress.u1')
  })

  it('reads a first-time user as empty rather than missing', async () => {
    const {fetchProgress} = await loadStore()

    const progress = await fetchProgress(
      fakeClient({getDocument: vi.fn().mockResolvedValue(undefined)}),
      'u1',
    )

    expect(progress.tours).toEqual({})
    expect(progress.menuOpenedAt).toBeUndefined()
  })

  // An editor on a viewer role, or with no network, has to look exactly like an
  // editor who has never run a guide. Never like an error.
  it('treats a refused read as no progress, and warns the developer once', async () => {
    const {fetchProgress} = await loadStore()
    const client = fakeClient({
      getDocument: vi.fn().mockRejectedValue(new Error('Insufficient permissions')),
    })

    const progress = await fetchProgress(client, 'u1')

    expect(progress.tours).toEqual({})
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it('does not warn again on a second failure', async () => {
    const {fetchProgress} = await loadStore()
    const client = fakeClient({getDocument: vi.fn().mockRejectedValue(new Error('nope'))})

    await fetchProgress(client, 'u1')
    await fetchProgress(client, 'u1')

    expect(console.warn).toHaveBeenCalledTimes(1)
  })
})

describe('writing', () => {
  it('writes one document per user, at a predictable id', async () => {
    const {saveProgress} = await loadStore()
    const createOrReplace = vi.fn().mockResolvedValue({})

    await saveProgress(fakeClient({createOrReplace}), 'u1', {
      tours: {essentials: {status: 'completed', updatedAt: '2026-06-01T00:00:00Z'}},
    })

    expect(createOrReplace).toHaveBeenCalledWith(
      expect.objectContaining({_id: 'onboarding.progress.u1', _type: 'onboarding.progress'}),
    )
  })

  it('leaves menuOpenedAt out rather than writing undefined', async () => {
    const {saveProgress} = await loadStore()
    const createOrReplace = vi.fn().mockResolvedValue({})

    await saveProgress(fakeClient({createOrReplace}), 'u1', {tours: {}})

    expect('menuOpenedAt' in createOrReplace.mock.calls[0][0]).toBe(false)
  })

  it('never throws when the editor cannot write to the dataset', async () => {
    const {saveProgress} = await loadStore()
    const client = fakeClient({
      createOrReplace: vi.fn().mockRejectedValue(new Error('Insufficient permissions')),
    })

    await expect(saveProgress(client, 'u1', {tours: {}})).resolves.toBeUndefined()
    expect(console.warn).toHaveBeenCalledTimes(1)
  })
})
