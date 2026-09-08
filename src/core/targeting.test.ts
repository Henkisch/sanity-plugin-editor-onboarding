import {describe, expect, it} from 'vitest'

import {
  targetCustom,
  targetDocumentStatus,
  targetDocumentType,
  targetField,
  targetPublishButton,
} from './targeting'

/** Builds the markup a Studio renders, in the language given. */
function documentFooter(publishLabel: string): void {
  document.body.innerHTML = `
    <div data-testid="pane-footer">
      <button data-ui="Button">-</button>
      <button data-testid="action-${publishLabel}">${publishLabel}</button>
      <button data-testid="action-menu-button"></button>
    </div>`
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
    documentFooter('publish')

    expect(document.querySelector(targetPublishButton())?.textContent).toBe('publish')
  })

  it('finds the publish button in Swedish', () => {
    documentFooter('publicera')

    expect(document.querySelector(targetPublishButton())?.textContent).toBe('publicera')
  })

  it('never mistakes the overflow menu for the publish button', () => {
    documentFooter('publicera')

    expect(document.querySelector(targetPublishButton())?.getAttribute('data-testid')).not.toBe(
      'action-menu-button',
    )
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
