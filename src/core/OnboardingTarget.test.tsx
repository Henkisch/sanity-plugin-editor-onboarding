import {cleanup, render} from '@testing-library/react'
import {useRef, type ReactNode, type Ref} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {OnboardingTarget} from './OnboardingTarget'
import {targetCustom} from './targeting'
import {useOnboardingTarget} from './useOnboardingTarget'

afterEach(cleanup)

/**
 * A component that forwards its ref, the way Sanity UI's components do.
 *
 * Reading `ref` off props in render is exactly the React 19 ref-as-prop pattern
 * the wrapper depends on, not the stale-`current` mistake the rule guards.
 */
function Forwarding(props: {ref?: Ref<HTMLSpanElement>; children?: ReactNode}) {
  // oxlint-disable-next-line refs
  return <span ref={props.ref}>{props.children}</span>
}

/** One that does not, which is the case the wrapper cannot serve. */
function Swallowing() {
  return <span>no ref here</span>
}

describe('useOnboardingTarget', () => {
  function Hooked({id}: {id: string}) {
    return <div ref={useOnboardingTarget(id)}>hooked</div>
  }

  it('makes the element findable by the selector a step would use', () => {
    render(<Hooked id="seo-panel" />)

    expect(document.querySelector(targetCustom('seo-panel'))).not.toBeNull()
  })

  it('stops matching once the element unmounts', () => {
    const {unmount} = render(<Hooked id="seo-panel" />)
    unmount()

    expect(document.querySelector(targetCustom('seo-panel'))).toBeNull()
  })

  it('follows a changed id rather than leaving the old one behind', () => {
    const {rerender} = render(<Hooked id="before" />)
    rerender(<Hooked id="after" />)

    expect(document.querySelector(targetCustom('before'))).toBeNull()
    expect(document.querySelector(targetCustom('after'))).not.toBeNull()
  })

  it('resolves an id containing quotes, which would otherwise break the selector', () => {
    render(<Hooked id={'say "hi"'} />)

    expect(document.querySelector(targetCustom('say "hi"'))).not.toBeNull()
  })

  it('resolves an id containing a backslash', () => {
    render(<Hooked id={'back\\slash'} />)

    expect(document.querySelector(targetCustom('back\\slash'))).not.toBeNull()
  })

  it('warns when two elements answer to one id, since a step finds only the first', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(
      <div>
        <Hooked id="dupe" />
        <Hooked id="dupe" />
      </div>,
    )

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('registered as onboarding target'))
  })

  it('does not warn for a single registration', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(<Hooked id="unique" />)

    expect(warn).not.toHaveBeenCalled()
  })
})

describe('OnboardingTarget', () => {
  it('marks a host element child', () => {
    render(
      <OnboardingTarget id="hero">
        <div>hero</div>
      </OnboardingTarget>,
    )

    expect(document.querySelector(targetCustom('hero'))).not.toBeNull()
  })

  it('marks a component that forwards its ref', () => {
    render(
      <OnboardingTarget id="badge">
        <Forwarding>badge</Forwarding>
      </OnboardingTarget>,
    )

    expect(document.querySelector(targetCustom('badge'))?.tagName).toBe('SPAN')
  })

  // The reason this wraps by cloning rather than rendering an element of its
  // own: an extra div would become the flex item in a flex parent, and the
  // child's layout would change just because it gained help.
  it('adds no element of its own', () => {
    const {container} = render(
      <OnboardingTarget id="hero">
        <div id="only-child">hero</div>
      </OnboardingTarget>,
    )

    expect(container.firstElementChild?.id).toBe('only-child')
    expect(container.children).toHaveLength(1)
  })

  it('leaves the child’s own callback ref working', () => {
    const seen: (HTMLSpanElement | null)[] = []

    render(
      <OnboardingTarget id="badge">
        <Forwarding ref={(element) => void seen.push(element)} />
      </OnboardingTarget>,
    )

    expect(seen.filter(Boolean)).toHaveLength(1)
    expect(seen.find(Boolean)?.tagName).toBe('SPAN')
  })

  it('leaves the child’s own object ref working', () => {
    function WithObjectRef() {
      const ref = useRef<HTMLSpanElement>(null)
      return (
        <OnboardingTarget id="badge">
          <Forwarding ref={ref} />
        </OnboardingTarget>
      )
    }

    render(<WithObjectRef />)

    expect(document.querySelector(targetCustom('badge'))).not.toBeNull()
  })

  it('clears the attribute on unmount', () => {
    const {unmount} = render(
      <OnboardingTarget id="hero">
        <div>hero</div>
      </OnboardingTarget>,
    )
    unmount()

    expect(document.querySelector(targetCustom('hero'))).toBeNull()
  })

  it('warns and renders the child when given something that cannot hold a ref', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const {container} = render(<OnboardingTarget id="hero">just text</OnboardingTarget>)

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('expects a single element'))
    expect(container.textContent).toBe('just text')
  })

  it('does not break the Studio when the child swallows its ref — it just finds nothing', () => {
    expect(() =>
      render(
        <OnboardingTarget id="hero">
          <Swallowing />
        </OnboardingTarget>,
      ),
    ).not.toThrow()

    expect(document.querySelector(targetCustom('hero'))).toBeNull()
  })
})
