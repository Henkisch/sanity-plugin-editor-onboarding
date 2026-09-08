import {describe, expect, it, vi} from 'vitest'

import {coreConcepts, type CoreConceptId} from './tours'
import {docs} from './docs'
import {stepTarget} from '../core/fieldHelp'

const ALL: CoreConceptId[] = ['essentials', 'publishing', 'collaboration', 'releases', 'media']

describe('coreConcepts', () => {
  it('ships every concept by default, so an unconfigured Studio gets the lot', () => {
    expect(coreConcepts().map((tour) => tour.id)).toEqual(ALL)
  })

  it('returns only what was asked for, in the order given', () => {
    const ids = coreConcepts({include: ['publishing', 'essentials']}).map((tour) => tour.id)

    expect(ids).toEqual(['publishing', 'essentials'])
  })

  it('warns and drops an unknown concept rather than throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Deliberately a value TypeScript would reject: the point is what happens
    // at runtime when a Studio passes a stale or misspelled id.
    // oxlint-disable-next-line no-unsafe-type-assertion
    const tours = coreConcepts({include: ['nope' as CoreConceptId, 'essentials']})

    expect(tours.map((tour) => tour.id)).toEqual(['essentials'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown concept "nope"'))
  })
})

describe('the slug step', () => {
  const publishing = () => coreConcepts({include: ['publishing']})[0]
  const slugStep = (slugField?: string) =>
    coreConcepts({include: ['publishing'], slugField})[0].steps.find((step) => step.field)

  it('targets a field named slug by default', () => {
    expect(stepTarget(slugStep()!)).toBe('[data-testid="field-slug"]')
  })

  it('follows a project that calls the field something else', () => {
    expect(stepTarget(slugStep('permalink')!)).toBe('[data-testid="field-permalink"]')
  })

  // Naming the field is what puts the book icon on it, so a step that lost its
  // `field` would silently take the field-level help with it.
  it('names its field, which is what gives the field its own help icon', () => {
    expect(slugStep()?.field).toBe('slug')
  })

  it('carries no learn-more link, since Sanity documents slugs only for developers', () => {
    expect(slugStep()?.learnMoreUrl).toBeUndefined()
  })

  it('comes after the autosave step and before publishing', () => {
    const fields = publishing().steps.map((step) => step.field)

    expect(fields.indexOf('slug')).toBe(1)
  })
})

describe('the media guide', () => {
  const media = () => coreConcepts({include: ['media']})[0]

  // It used to point at the navbar, which exists in every Studio — so the guide
  // always ran, and rang something with nothing to do with assets.
  it('points at the control that reuses an asset, not at the navbar', () => {
    expect(media().steps[0].target).toContain('image-object-input-browse-button')
  })

  it('says so rather than doing nothing when no image field is open', () => {
    expect(media().unavailableMessage).toBeDefined()
  })
})

describe('guide invariants', () => {
  it('gives every tour a stable id, since ids key persistence', () => {
    const ids = coreConcepts().map((tour) => tour.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every tour an icon, so the menu never mixes icons with blanks', () => {
    for (const tour of coreConcepts()) expect(tour.icon).toBeDefined()
  })

  it('cites a source on every tour', () => {
    const known = Object.values(docs)

    for (const tour of coreConcepts()) expect(known).toContain(tour.sourceUrl)
  })

  it('points every learn-more link at the checked docs table, never an inline URL', () => {
    const known: unknown[] = Object.values(docs)

    for (const tour of coreConcepts()) {
      for (const step of tour.steps) {
        if (step.learnMoreUrl) expect(known).toContain(step.learnMoreUrl)
      }
    }
  })

  it('gives every step something to say', () => {
    for (const tour of coreConcepts()) {
      for (const step of tour.steps) {
        expect(step.title).toBeTruthy()
        expect(step.content).toBeTruthy()
      }
    }
  })

  // Only `essentials` may open unanchored: a tour whose steps are all unanchored
  // could never report itself unavailable, and the others describe UI that is
  // often not on screen.
  it('leaves only the essentials tour with an unanchored step', () => {
    for (const tour of coreConcepts()) {
      const unanchored = tour.steps.filter((step) => !stepTarget(step))

      if (tour.id === 'essentials') expect(unanchored).toHaveLength(1)
      else expect(unanchored).toHaveLength(0)
    }
  })

  it('auto-starts exactly one tour', () => {
    const autoStarting = coreConcepts().filter((tour) => tour.autoStart === 'first-login')

    expect(autoStarting.map((tour) => tour.id)).toEqual(['essentials'])
  })

  it('gives every tour that points at document-only UI an unavailable message', () => {
    for (const tour of coreConcepts()) {
      if (tour.id === 'essentials') continue
      const documentScoped = tour.steps.some((step) => step.field)
      if (documentScoped) expect(tour.unavailableMessage).toBeDefined()
    }
  })
})
