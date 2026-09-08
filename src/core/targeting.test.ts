import {describe, expect, it} from 'vitest'

import {
  targetCustom,
  targetDocumentStatus,
  targetDocumentType,
  targetField,
  targetPublishButton,
} from './targeting'

/**
 * The markup a Studio renders around the publish button, in the language given.
 *
 * Copied from a running Studio rather than imagined: the button is inside the
 * document pane but *not* inside `pane-footer`, and it sits among Portable Text
 * toolbar buttons and overflow menus that share its `action-` prefix.
 */
function documentPane(publishLabel: string): void {
  document.body.innerHTML = `
    <div data-testid="document-pane">
      <button data-testid="action-button-strong" data-ui="Button">B</button>
      <button data-testid="action-menu-auto-collapse-menu" data-ui="Button"></button>
      <div data-testid="pane-footer"></div>
      <button data-testid="action-${publishLabel}" data-ui="Button">${publishLabel}</button>
      <button data-testid="action-menu-button" data-ui="MenuButton"></button>
    </div>
    <button data-testid="action-intent-button" data-ui="Button">New</button>`
}

function documentHeader(draftLabel: string, publishedLabel: string): void {
  document.body.innerHTML = `
    <div data-testid="document-perspective-list">
      <button data-testid="document-header-${publishedLabel}-chip">${publishedLabel}</button>
      <button data-testid="document-header-${draftLabel}-chip">${draftLabel}</button>
    </div>`
}

// Studio interpolates translated labels into some of its test ids, so a
// selector written against the English one skips its step in every other
// language — silently, and for exactly the editors most in need of a guide.
describe('selectors that must not depend on the Studio language', () => {
  it('finds the publish button in English', () => {
    documentPane('publish')

    expect(document.querySelector(targetPublishButton())?.textContent).toBe('publish')
  })

  it('finds the publish button in Swedish', () => {
    documentPane('publicera')

    expect(document.querySelector(targetPublishButton())?.textContent).toBe('publicera')
  })

  // Everything else in that pane whose id also starts with `action-`: the
  // Portable Text toolbar, the overflow menus, and the list pane's create
  // button. Matching any of them would ring the wrong control entirely.
  it('matches the publish button and nothing else in the pane', () => {
    documentPane('publicera')

    const matches = [...document.querySelectorAll(targetPublishButton())]

    expect(matches).toHaveLength(1)
    expect(matches[0].getAttribute('data-testid')).toBe('action-publicera')
  })

  it('finds a document status chip in English', () => {
    documentHeader('Draft', 'Published')

    expect(document.querySelector(targetDocumentStatus())).not.toBeNull()
  })

  it('finds a document status chip in Swedish', () => {
    documentHeader('Utkast', 'Publicerad')

    expect(document.querySelector(targetDocumentStatus())).not.toBeNull()
  })
})

describe('escaping', () => {
  it('survives a document type title containing quotes', () => {
    document.body.innerHTML = `<div data-testid='pane-item-The "best" posts'></div>`

    expect(() => document.querySelector(targetDocumentType('The "best" posts'))).not.toThrow()
    expect(document.querySelector(targetDocumentType('The "best" posts'))).not.toBeNull()
  })

  it('survives a field name containing a backslash', () => {
    expect(() => document.querySelector(targetField('back\\slash'))).not.toThrow()
  })

  it('survives a custom target id containing quotes', () => {
    expect(() => document.querySelector(targetCustom('say "hi"'))).not.toThrow()
  })
})
