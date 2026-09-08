import {describe, expect, it} from 'vitest'

import {collectFieldHelp, findFieldHelp, pathToFieldName, stepTarget} from './fieldHelp'
import {type FieldGuide, type OnboardingTour} from './types'

const tour = (id: string, steps: OnboardingTour['steps']): OnboardingTour => ({
  id,
  title: id,
  steps,
})

describe('pathToFieldName', () => {
  it('reads a top-level field', () => {
    expect(pathToFieldName(['slug'])).toBe('slug')
  })

  it('joins a nested path with dots', () => {
    expect(pathToFieldName(['seo', 'title'])).toBe('seo.title')
  })

  it('drops array indices, so help shows on every row rather than the first', () => {
    expect(pathToFieldName(['ingredients', 0, 'name'])).toBe('ingredients.name')
  })

  it('drops keyed segments for the same reason', () => {
    expect(pathToFieldName(['ingredients', {_key: 'abc123'}, 'name'])).toBe('ingredients.name')
  })

  it('reads the document root as an empty name, matching nothing', () => {
    expect(pathToFieldName([])).toBe('')
  })
})

describe('collectFieldHelp', () => {
  it('picks up steps that name a field', () => {
    const help = collectFieldHelp(
      [tour('publishing', [{field: 'slug', title: 'Slug', content: '...'}])],
      [],
    )

    expect(help).toHaveLength(1)
    expect(help[0].field).toBe('slug')
  })

  it('ignores steps that name no field', () => {
    const help = collectFieldHelp(
      [tour('essentials', [{target: '[data-testid="x"]', title: 'X', content: '...'}])],
      [],
    )

    expect(help).toHaveLength(0)
  })

  it('picks up standalone guides', () => {
    const guides: FieldGuide[] = [{field: 'bio', title: 'Bio', content: '...'}]

    expect(collectFieldHelp([], guides)).toHaveLength(1)
  })

  it('carries a guide’s document type through', () => {
    const guides: FieldGuide[] = [
      {field: 'bio', documentType: 'author', title: 'Bio', content: '...'},
    ]

    expect(collectFieldHelp([], guides)[0].documentType).toBe('author')
  })

  it('lets a guide’s own wording win over a standalone entry for the same field', () => {
    const help = collectFieldHelp(
      [tour('publishing', [{field: 'slug', title: 'From the tour', content: '...'}])],
      [{field: 'slug', title: 'Standalone', content: '...'}],
    )

    expect(findFieldHelp(help, 'slug', 'post')?.step.title).toBe('From the tour')
  })
})

describe('findFieldHelp', () => {
  const help = collectFieldHelp([], [
    {field: 'slug', title: 'Everywhere', content: '...'},
    {field: 'bio', documentType: 'author', title: 'Author only', content: '...'},
  ])

  it('matches a guide with no document type against any type', () => {
    expect(findFieldHelp(help, 'slug', 'post')?.step.title).toBe('Everywhere')
    expect(findFieldHelp(help, 'slug', 'author')?.step.title).toBe('Everywhere')
  })

  it('matches a scoped guide only on its own type', () => {
    expect(findFieldHelp(help, 'bio', 'author')?.step.title).toBe('Author only')
    expect(findFieldHelp(help, 'bio', 'post')).toBeUndefined()
  })

  // The bug this file exists for: Sanity's per-field `documentType` is the type
  // of the field, so a scoped guide was being asked to match 'datetime' rather
  // than 'post'. Showing help then would have been worse than showing none.
  it('shows nothing for a scoped guide when the document type is unknown', () => {
    expect(findFieldHelp(help, 'bio', undefined)).toBeUndefined()
  })

  it('still shows an unscoped guide when the document type is unknown', () => {
    expect(findFieldHelp(help, 'slug', undefined)?.step.title).toBe('Everywhere')
  })

  it('returns nothing for a field with no help', () => {
    expect(findFieldHelp(help, 'title', 'post')).toBeUndefined()
  })

  it('does not match the document root against a field named with an empty string', () => {
    expect(findFieldHelp(help, '', 'post')).toBeUndefined()
  })
})

describe('stepTarget', () => {
  it('derives a selector from a named field, so no one writes one by hand', () => {
    expect(stepTarget({field: 'slug', title: 'x', content: 'y'})).toBe(
      '[data-testid="field-slug"]',
    )
  })

  it('lets an explicit target win, so a step can explain a field but point elsewhere', () => {
    expect(stepTarget({field: 'slug', target: '.custom', title: 'x', content: 'y'})).toBe('.custom')
  })

  it('returns nothing for an unanchored step, which is centred instead', () => {
    expect(stepTarget({title: 'x', content: 'y'})).toBeUndefined()
  })
})
