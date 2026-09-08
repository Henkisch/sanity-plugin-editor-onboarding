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
        tours: [
          {_key: 'essentials', status: 'completed', updatedAt: '2026-06-01T00:00:00Z'},
        ],
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

/** Records what a transaction was asked to do, without a real client. */
function recordingClient(commit: () => Promise<unknown> = () => Promise.resolve({})) {
  const calls = {
    createIfNotExists: [] as unknown[],
    setIfMissing: [] as unknown[],
    unset: [] as string[][],
    insert: [] as unknown[][],
    patchedId: '',
  }

  const patch = {
    setIfMissing(value: unknown) {
      calls.setIfMissing.push(value)
      return patch
    },
    unset(paths: string[]) {
      calls.unset.push(paths)
      return patch
    },
    insert(_position: string, _at: string, items: unknown[]) {
      calls.insert.push(items)
      return patch
    },
  }

  const transaction = {
    createIfNotExists(document: unknown) {
      calls.createIfNotExists.push(document)
      return transaction
    },
    patch(id: string, build: (p: typeof patch) => typeof patch) {
      calls.patchedId = id
      build(patch)
      return transaction
    },
    commit,
  }

  // Only the fragment of the transaction builder the store actually chains.
  // oxlint-disable-next-line no-unsafe-type-assertion
  const build = (() => transaction) as SanityClient['transaction']
  return {client: fakeClient({transaction: build}), calls}
}

describe('writing', () => {
  it('writes one document per user, at a predictable id', async () => {
    const {saveProgress} = await loadStore()
    const {client, calls} = recordingClient()

    await saveProgress(client, 'u1', {
      tours: {essentials: {status: 'completed', updatedAt: '2026-06-01T00:00:00Z'}},
    })

    expect(calls.patchedId).toBe('onboarding.progress.u1')
    expect(calls.createIfNotExists[0]).toMatchObject({
      _id: 'onboarding.progress.u1',
      _type: 'onboarding.progress',
    })
  })

  // Two tabs belonging to the same editor must not erase each other's guides,
  // which a whole-document replace would do.
  it('touches only the guides it is writing', async () => {
    const {saveProgress} = await loadStore()
    const {client, calls} = recordingClient()

    await saveProgress(client, 'u1', {
      tours: {'seo-panel': {status: 'completed', updatedAt: '2026-06-01T00:00:00Z'}},
    })

    expect(calls.unset[0]).toEqual(['tours[_key=="seo-panel"]'])
    expect(calls.insert[0]).toHaveLength(1)
  })

  it('removes before inserting, so re-running cannot duplicate an entry', async () => {
    const {saveProgress} = await loadStore()
    const {client, calls} = recordingClient()

    await saveProgress(client, 'u1', {
      tours: {essentials: {status: 'completed', updatedAt: '2026-06-01T00:00:00Z'}},
    })

    expect(calls.unset).toHaveLength(1)
    expect(calls.insert).toHaveLength(1)
  })

  it('keeps the earliest record of the menu being opened', async () => {
    const {saveProgress} = await loadStore()
    const {client, calls} = recordingClient()

    await saveProgress(client, 'u1', {tours: {}, menuOpenedAt: '2026-01-01T00:00:00Z'})

    expect(calls.setIfMissing).toContainEqual({menuOpenedAt: '2026-01-01T00:00:00Z'})
  })

  it('writes nothing at all when there is nothing to record', async () => {
    const {saveProgress} = await loadStore()
    const {client, calls} = recordingClient()

    await saveProgress(client, 'u1', {tours: {}})

    expect(calls.patchedId).toBe('')
  })

  it('never throws when the editor cannot write to the dataset', async () => {
    const {saveProgress} = await loadStore()
    const {client} = recordingClient(() => Promise.reject(new Error('Insufficient permissions')))

    await expect(
      saveProgress(client, 'u1', {tours: {essentials: {status: 'completed', updatedAt: 'x'}}}),
    ).resolves.toBeUndefined()
    expect(console.warn).toHaveBeenCalledTimes(1)
  })
})
