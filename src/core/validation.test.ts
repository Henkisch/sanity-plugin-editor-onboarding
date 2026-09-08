import {describe, expect, it} from 'vitest'

import {hasBlockingError} from './validation'

const error = (path: (string | number)[]) => ({level: 'error', path})
const warning = (path: (string | number)[]) => ({level: 'warning', path})

describe('hasBlockingError', () => {
  it('finds an error on the field itself', () => {
    expect(hasBlockingError([error(['title'])], ['title'])).toBe(true)
  })

  it('ignores an error on a different field', () => {
    expect(hasBlockingError([error(['slug'])], ['title'])).toBe(false)
  })

  // Warnings do not stop anyone publishing, so they have not earned attention.
  it('ignores warnings', () => {
    expect(hasBlockingError([warning(['title'])], ['title'])).toBe(false)
  })

  // The field an editor sees may be collapsed over the one that is wrong.
  it('finds an error nested inside the field', () => {
    expect(hasBlockingError([error(['seo', 'title'])], ['seo'])).toBe(true)
  })

  it('does not treat a parent’s error as this field’s', () => {
    expect(hasBlockingError([error(['seo'])], ['seo', 'title'])).toBe(false)
  })

  it('ignores which array item is at fault, since the field is the same', () => {
    expect(hasBlockingError([error(['authors', 0, 'name'])], ['authors', 1, 'name'])).toBe(true)
  })

  it('never reports the document root as blocking', () => {
    expect(hasBlockingError([error(['title'])], [])).toBe(false)
  })

  it('copes with markers carrying no path', () => {
    expect(hasBlockingError([{level: 'error'}], ['title'])).toBe(false)
  })

  it('is false when nothing is wrong', () => {
    expect(hasBlockingError([], ['title'])).toBe(false)
  })
})
