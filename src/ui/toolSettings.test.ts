import {describe, expect, it} from 'vitest'

import {canUseConventionFinder} from './access'

const user = (...names: string[]) => ({roles: names.map((name) => ({name, title: name}))})

describe('canUseConventionFinder', () => {
  it('shows the tool to administrators and developers by default', () => {
    expect(canUseConventionFinder(user('administrator'))).toBe(true)
    expect(canUseConventionFinder(user('developer'))).toBe(true)
  })

  it('keeps it out of an editor’s tool menu — it is a developer tool that spends credits', () => {
    expect(canUseConventionFinder(user('editor'))).toBe(false)
  })

  it('honours the roles a Studio configures, including custom ones', () => {
    expect(canUseConventionFinder(user('content-lead'), ['content-lead'])).toBe(true)
  })

  it('hides it while no user is known', () => {
    expect(canUseConventionFinder(null)).toBe(false)
  })
})
