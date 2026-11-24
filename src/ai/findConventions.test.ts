import {type SanityClient} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {classifyError, findConventions} from './findConventions'
import {type SerializedDocumentType} from './serializeSchema'

const faq: SerializedDocumentType = {
  name: 'faq',
  fields: [{path: 'answer', type: 'text'}],
}

/**
 * A stand-in client. Never the real one: a test that reached Agent Actions
 * would spend a project's AI credits on every CI run.
 */
function mockClient(documents: unknown[], response: unknown = {conventions: []}) {
  const prompt = vi.fn().mockResolvedValue(response)
  const fetch = vi.fn().mockResolvedValue(documents)
  const client = {
    withConfig: () => ({fetch, agent: {action: {prompt}}}),
  }
  // The real client is far wider than the two calls made here, and building
  // one would need a project id and a network.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return {client: client as unknown as SanityClient, prompt, fetch}
}

const answers = (count: number) => Array.from({length: count}, (_, i) => ({answer: `A${i}`}))

describe('findConventions', () => {
  it('does not ask the model when there are too few documents to show a pattern — that would spend credits on a guess', async () => {
    const {client, prompt} = mockClient(answers(2))
    expect(await findConventions(client, faq, 'sv-SE')).toEqual({
      status: 'too-few',
      documentCount: 2,
    })
    expect(prompt).not.toHaveBeenCalled()
  })

  it('asks for JSON in the Studio language, with counted stats alongside the samples', async () => {
    const {client, prompt} = mockClient(answers(5))
    await findConventions(client, faq, 'Svenska (sv-SE)')

    const request = prompt.mock.calls[0]?.[0]
    expect(request.format).toBe('json')
    expect(request.instructionParams.language.value).toBe('Svenska (sv-SE)')
    expect(JSON.parse(request.instructionParams.stats.value)[0]).toMatchObject({filled: 5, of: 5})
  })

  it('returns only conventions that pass validation', async () => {
    const {client} = mockClient(answers(5), {
      conventions: [
        {field: 'answer', title: 'T', content: 'C', seenIn: 5},
        {field: 'ghost', title: 'T', content: 'C', seenIn: 5},
      ],
    })
    const result = await findConventions(client, faq, 'en-US')
    expect(result.status === 'done' && result.kept.map((c) => c.field)).toEqual(['answer'])
  })
})

describe('classifyError', () => {
  it('reads the status code, because the message text varies by layer', () => {
    expect(classifyError({statusCode: 403, message: 'anything'})).toBe('ai-disabled')
    expect(classifyError({statusCode: 429})).toBe('quota')
    expect(classifyError({statusCode: 401})).toBe('session')
    expect(classifyError(new Error('network'))).toBe('unknown')
  })
})
