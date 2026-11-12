import {describe, expect, it} from 'vitest'

import {MAX_STRING_LENGTH, summarizeDocument} from './sampleContent'

describe('summarizeDocument', () => {
  it('drops system fields, which say nothing about what a field means', () => {
    expect(summarizeDocument({_id: 'a', _rev: 'b', _type: 'faq', question: 'Q?'})).toEqual({
      question: 'Q?',
    })
  })

  it('cuts long text, because every character goes into a prompt', () => {
    const summary = summarizeDocument({text: 'x'.repeat(500)})
    expect(summary).toEqual({text: `${'x'.repeat(MAX_STRING_LENGTH)}…`})
  })

  it('names an image instead of sending its asset reference', () => {
    expect(summarizeDocument({cover: {_type: 'image', asset: {_ref: 'image-abc'}}})).toEqual({
      cover: '[image]',
    })
  })

  it('names a reference rather than leaking a document id', () => {
    expect(summarizeDocument({author: {_ref: 'person-1', _type: 'reference'}})).toEqual({
      author: '[reference]',
    })
  })

  it('reads a slug as its text, since its format is often the convention', () => {
    expect(summarizeDocument({slug: {_type: 'slug', current: 'klipp-och-farg'}})).toEqual({
      slug: 'klipp-och-farg',
    })
  })

  it('shrinks portable text to a paragraph count and its opening', () => {
    const body = [
      {_type: 'block', children: [{_type: 'span', text: 'First.'}]},
      {_type: 'block', children: [{_type: 'span', text: 'Second.'}]},
    ]
    expect(summarizeDocument({body})).toEqual({body: '[2 paragraph(s): First.]'})
  })

  it('shows the first few items of a long list and counts the rest', () => {
    expect(summarizeDocument({tags: ['a', 'b', 'c', 'd', 'e']})).toEqual({
      tags: ['a', 'b', 'c', '[+2 more]'],
    })
  })
})
