import {afterEach, describe, expect, it} from 'vitest'

import {checkTargets, formatReport} from './healthCheck'
import {type OnboardingTour} from './types'

const tour = (id: string, steps: OnboardingTour['steps']): OnboardingTour => ({
  id,
  title: id,
  steps,
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('checkTargets', () => {
  it('counts a step whose target is on screen as resolved', () => {
    document.body.innerHTML = '<div id="here"></div>'

    const report = checkTargets([tour('t', [{target: '#here', title: 'a', content: 'b'}])])

    expect(report).toMatchObject({anchored: 1, resolved: 1, missing: []})
  })

  it('reports a step whose target is absent', () => {
    const report = checkTargets([tour('t', [{target: '#gone', title: 'a', content: 'b'}])])

    expect(report.resolved).toBe(0)
    expect(report.missing[0]).toMatchObject({tourId: 't', step: 1, selector: '#gone'})
  })

  // A selector that cannot parse will never match on any view, which is a
  // different problem from one that is simply not on screen yet.
  it('distinguishes an unparseable selector from an absent one', () => {
    const report = checkTargets([
      tour('t', [
        {target: '[[[nope', title: 'a', content: 'b'},
        {target: '#gone', title: 'a', content: 'b'},
      ]),
    ])

    expect(report.missing.find((entry) => entry.selector === '[[[nope')?.invalid).toBe(true)
    expect(report.missing.find((entry) => entry.selector === '#gone')?.invalid).toBe(false)
  })

  it('ignores unanchored steps, which have nothing to find', () => {
    const report = checkTargets([tour('t', [{title: 'a', content: 'b'}])])

    expect(report).toMatchObject({anchored: 0, resolved: 0, missing: []})
  })

  it('resolves a step that names a field rather than a selector', () => {
    document.body.innerHTML = '<div data-testid="field-slug"></div>'

    expect(checkTargets([tour('t', [{field: 'slug', title: 'a', content: 'b'}])]).resolved).toBe(1)
  })

  it('numbers steps the way the counter reads to an editor', () => {
    const report = checkTargets([
      tour('t', [
        {target: '#gone', title: 'a', content: 'b'},
        {target: '#alsogone', title: 'a', content: 'b'},
      ]),
    ])

    expect(report.missing.map((entry) => entry.step)).toEqual([1, 2])
  })
})

describe('formatReport', () => {
  it('says only the count when everything resolved', () => {
    document.body.innerHTML = '<div id="here"></div>'
    const message = formatReport(
      checkTargets([tour('t', [{target: '#here', title: 'a', content: 'b'}])]),
      '6.12.0',
    )

    expect(message).toContain('1 of 1')
    expect(message).toContain('6.12.0')
    expect(message).not.toContain('never match')
  })

  // Most misses on any given view are expected, so saying so is what keeps the
  // message from being trained away as noise.
  it('separates what can never match from what is merely off-screen', () => {
    const message = formatReport(
      checkTargets([
        tour('t', [
          {target: '[[[nope', title: 'a', content: 'b'},
          {target: '#gone', title: 'a', content: 'b'},
        ]),
      ]),
      '6.12.0',
    )

    expect(message).toContain('never match')
    expect(message).toContain('Not on screen right now')
  })

  it('says it is never shown to editors', () => {
    const message = formatReport(
      checkTargets([tour('t', [{target: '#gone', title: 'a', content: 'b'}])]),
      '6.12.0',
    )

    expect(message).toContain('never shown to editors')
  })
})
