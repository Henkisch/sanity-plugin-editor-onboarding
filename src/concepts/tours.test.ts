import {describe, expect, it, vi} from 'vitest'

import {stepTarget} from '../core/fieldHelp'
import {docs} from './docs'
import {coreConcepts, type CoreConceptId} from './tours'

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

describe('the collaboration guide', () => {
  const collaboration = () => coreConcepts({include: ['collaboration']})[0]

  // Its second step used to point at the tool switcher, chosen because it
  // reliably exists rather than because it had anything to do with working
  // together.
  it('does not point at the tool switcher', () => {
    for (const step of collaboration().steps) {
      expect(step.target ?? '').not.toContain('tool-collapse-menu')
    }
  })

  // It used to ring the whole navbar, where Studio 6 shows no avatars at all,
  // under copy that said "their avatar appears here".
  it('centres the presence step rather than ringing a navbar with no avatars in it', () => {
    expect(collaboration().steps[0].target).toBeUndefined()
  })

  it('points at the presence menu by its id, since its label is translated', () => {
    expect(collaboration().steps[1].target).toBe('#global-presence-menu')
  })

  it('points at Tasks, which drops out on Studios that have it turned off', () => {
    expect(collaboration().steps[2].target).toBe('[data-testid="tasks-toolbar"]')
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

  // A tour whose steps are all unanchored could never report itself
  // unavailable, so every tour keeps at least one anchored step. Only
  // `essentials` (its welcome) and `collaboration` (presence, which has no
  // element to point at when an editor is alone) may centre one.
  it('centres a step only where there is nothing on screen to point at', () => {
    const mayCentre = new Set(['essentials', 'collaboration'])
    for (const tour of coreConcepts()) {
      const unanchored = tour.steps.filter((step) => !stepTarget(step))

      expect(unanchored.length, tour.id).toBe(mayCentre.has(tour.id) ? 1 : 0)
      expect(tour.steps.length - unanchored.length, tour.id).toBeGreaterThan(0)
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
