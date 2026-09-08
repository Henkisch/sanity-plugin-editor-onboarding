import {act, cleanup, render, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {query, useTargetElement, type TargetResult} from './useTargetElement'

afterEach(cleanup)

/** Renders the hook and hands back whatever it last returned. */
function probe(selector: string | undefined) {
  const seen: TargetResult[] = []

  function Probe() {
    seen.push(useTargetElement(selector, {tourId: 'test', stepIndex: 0}))
    return null
  }

  render(<Probe />)
  return {
    get last() {
      return seen[seen.length - 1]
    },
  }
}

describe('query', () => {
  it('finds a matching element', () => {
    document.body.innerHTML = '<div id="here"></div>'

    expect(query('#here')).not.toBeNull()
  })

  it('reports null when nothing matches yet, since it may still mount', () => {
    expect(query('#missing')).toBeNull()
  })

  // Distinguished from "not there yet" on purpose: an invalid selector can never
  // match, so waiting for it is pointless and the developer needs telling now.
  it('reports undefined for a selector that can never match', () => {
    expect(query('[[[not valid')).toBeUndefined()
  })
})

describe('useTargetElement', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('reports "none" for a step with no target, which is centred instead', () => {
    expect(probe(undefined).last.state).toBe('none')
  })

  it('resolves an element already on screen without a further render pass', () => {
    document.body.innerHTML = '<div id="here"></div>'

    const result = probe('#here').last
    expect(result.state).toBe('resolved')
    expect(result.element?.id).toBe('here')
  })

  it('measures the resolved element so the spotlight has somewhere to sit', async () => {
    document.body.innerHTML = '<div id="here"></div>'

    const target = probe('#here')
    await waitFor(() => expect(target.last.rect).not.toBeNull())
  })

  it('waits for a target that mounts late, so panes can open after the step starts', async () => {
    const target = probe('#late')
    expect(target.last.state).toBe('pending')

    document.body.innerHTML = '<div id="late"></div>'

    await waitFor(() => expect(target.last.state).toBe('resolved'))
  })

  it('gives up on a target that never arrives, and says which step and selector', () => {
    vi.useFakeTimers()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const target = probe('#never')
    // The timeout sets state, so React has to be given a chance to commit it.
    act(() => void vi.advanceTimersByTime(2500))

    expect(target.last.state).toBe('missing')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('#never'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Skipping step 1 of tour "test"'))

    vi.useRealTimers()
  })

  it('rejects an invalid selector immediately rather than waiting out the budget', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const target = probe('[[[not valid')

    expect(target.last.state).toBe('missing')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not valid CSS'))
  })

  // A missing target is an expected outcome — a Studio without Content Releases
  // has no releases link — so it must never reach the editor as an error.
  it('never throws for a missing target', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => probe('#never')).not.toThrow()
  })
})
