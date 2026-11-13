import {describe, expect, it} from 'vitest'

import {fieldStats} from './fieldStats'
import {type SerializedDocumentType} from './serializeSchema'

const block = (text: string) => ({_type: 'block', children: [{_type: 'span', text}]})

const faq: SerializedDocumentType = {
  name: 'faq',
  fields: [
    {path: 'question', type: 'string'},
    {path: 'answer', type: 'portableText'},
    {path: 'note', type: 'string'},
    {path: 'prices', type: 'array'},
    {path: 'prices.minutes', type: 'number'},
  ],
}

const docs = [
  {
    question: 'Ingår hårtvätt?',
    answer: [block('Ja.')],
    note: '',
    prices: [{minutes: 30}, {minutes: 45}],
  },
  {question: 'Har ni öppet på helger?', answer: [block('Nej, vardagar.')], prices: [{minutes: 90}]},
  {question: 'Var?', answer: [block('Storgatan 12A.')]},
]

function stat(path: string) {
  return fieldStats(faq, docs).find((entry) => entry.path === path)
}

describe('fieldStats', () => {
  it('measures string lengths, which a model reading samples tends to miss', () => {
    expect(stat('question')?.length).toEqual({min: 4, max: 23, median: 15})
  })

  it('measures portable text by its plain text, not its block structure', () => {
    expect(stat('answer')?.length).toEqual({min: 3, max: 14, median: 14})
  })

  it('does not count an empty string as filled in', () => {
    expect(stat('note')).toMatchObject({filled: 0, of: 3})
  })

  it('counts array items, so "always two to four" can be seen', () => {
    expect(stat('prices')?.items).toEqual({min: 1, max: 2})
  })

  it('reads values through arrays, matching how field paths drop array segments', () => {
    expect(stat('prices.minutes')).toMatchObject({filled: 2, range: {min: 30, max: 90}})
  })

  it('leaves out measurements that have nothing to measure', () => {
    expect(stat('note')).toEqual({path: 'note', filled: 0, of: 3})
  })
})
