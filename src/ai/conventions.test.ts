import {describe, expect, it} from 'vitest'

import {MIN_EVIDENCE, validateConventions} from './conventions'
import {type SerializedDocumentType} from './serializeSchema'

const type: SerializedDocumentType = {
  name: 'faq',
  fields: [
    {path: 'question', type: 'string'},
    {path: 'answer', type: 'text'},
  ],
}

const convention = (overrides: Record<string, unknown> = {}) => ({
  field: 'answer',
  title: 'End with a next step',
  content: 'Most answers end by pointing to booking.',
  seenIn: 8,
  examples: ['Boka tid online.'],
  ...overrides,
})

describe('validateConventions', () => {
  it('keeps a convention with enough evidence on a real field', () => {
    const {kept} = validateConventions({conventions: [convention()]}, type, 12)
    expect(kept).toHaveLength(1)
  })

  it('drops a pattern seen too rarely — two documents are an anecdote, not a convention', () => {
    const {kept, dropped} = validateConventions(
      {conventions: [convention({seenIn: MIN_EVIDENCE - 1})]},
      type,
      12,
    )
    expect(kept).toEqual([])
    expect(dropped[0]?.reason).toMatch(/evidence/)
  })

  it('drops a count larger than the documents sent — the model miscounted, so trust nothing in it', () => {
    expect(validateConventions({conventions: [convention({seenIn: 20})]}, type, 12).kept).toEqual(
      [],
    )
  })

  it('drops a field that does not exist, since its guide could never be shown', () => {
    expect(
      validateConventions({conventions: [convention({field: 'nope'})]}, type, 12).kept,
    ).toEqual([])
  })

  it('treats an unexpected response as no conventions rather than throwing', () => {
    expect(validateConventions('nonsense', type, 12)).toEqual({kept: [], dropped: []})
    expect(validateConventions({conventions: [null]}, type, 12).kept).toEqual([])
  })
})
