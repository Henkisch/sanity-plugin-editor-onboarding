import {describe, expect, it} from 'vitest'

import {canUseTool, DEFAULT_TOOL_ROLES, resolveToolSettings} from './toolSettings'

const user = (...names: string[]) => ({roles: names.map((name) => ({name, title: name}))})

describe('resolveToolSettings', () => {
  it('is off unless asked for, so upgrading never adds an entry to the tool menu', () => {
    expect(resolveToolSettings({tours: []})).toBeUndefined()
  })

  it('turns on with `tool`, without the AI tab', () => {
    expect(resolveToolSettings({tours: [], tool: true})).toMatchObject({
      roles: DEFAULT_TOOL_ROLES,
    })
    expect(resolveToolSettings({tours: [], tool: true})?.finder).toBeUndefined()
  })

  it('turns on with `conventionFinder` alone — the tab has nowhere else to live', () => {
    expect(resolveToolSettings({tours: [], conventionFinder: true})?.finder).toEqual({})
  })

  it('passes the finder language and tool roles through', () => {
    const settings = resolveToolSettings({
      tours: [],
      tool: {roles: ['lead']},
      conventionFinder: {language: 'Svenska (sv-SE)'},
    })
    expect(settings?.roles).toEqual(['lead'])
    expect(settings?.finder).toEqual({language: 'Svenska (sv-SE)'})
  })

  it('mirrors the settings the overview reports, with the same defaults the plugin uses', () => {
    expect(resolveToolSettings({tours: [], tool: true})).toMatchObject({
      fieldGuides: [],
      syncProgress: false,
      navbarButton: true,
    })
  })
})

describe('canUseTool', () => {
  it('shows the tool to administrators and developers by default', () => {
    expect(canUseTool(user('administrator'), DEFAULT_TOOL_ROLES)).toBe(true)
    expect(canUseTool(user('developer'), DEFAULT_TOOL_ROLES)).toBe(true)
  })

  it('keeps it out of an editor’s tool menu', () => {
    expect(canUseTool(user('editor'), DEFAULT_TOOL_ROLES)).toBe(false)
  })

  it('honours custom roles', () => {
    expect(canUseTool(user('content-lead'), ['content-lead'])).toBe(true)
  })

  it('hides it while no user is known', () => {
    expect(canUseTool(null, DEFAULT_TOOL_ROLES)).toBe(false)
  })
})
