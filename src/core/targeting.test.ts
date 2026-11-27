import {describe, expect, it} from 'vitest'

import {
  targetAssetBrowse,
  targetCustom,
  targetDocumentStatus,
  targetDocumentType,
  targetField,
  targetFieldGroupWithError,
  targetFieldValidationError,
  targetPublishButton,
  targetValidationErrors,
} from './targeting'

/**
 * The markup a Studio renders around the publish button, in the language given.
 *
 * Copied from a running Studio rather than imagined: the button is inside the
 * document pane but *not* inside `pane-footer`, and it sits among Portable Text
 * toolbar buttons and overflow menus that share its `action-` prefix.
 */
function documentPane(publishLabel: string, icon = 'publish'): void {
  document.body.innerHTML = `
    <div data-testid="document-pane">
      <button data-testid="action-button-strong" data-ui="Button">B</button>
      <button data-testid="action-menu-auto-collapse-menu" data-ui="Button"></button>
      <div data-testid="pane-footer"></div>
      <button data-testid="action-${publishLabel}" data-ui="Button"><svg data-sanity-icon="${icon}"></svg>${publishLabel}</button>
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

  // The same slot holds Unpublish while the Published chip is selected. A guide
  // explaining why publishing is blocked rang it, in a live Swedish Studio.
  it('does not mistake Unpublish, in the same slot, for Publish', () => {
    documentPane('avpublicera', 'unpublish')

    expect(document.querySelector(targetPublishButton())).toBeNull()
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

// Studio names this button after the asset sources available, and adding one —
// which is what installing Media Library does — changes the shape of the id
// rather than just its suffix.
describe('the asset browse button, however many asset sources exist', () => {
  it('finds it on a stock Studio, with one source', () => {
    document.body.innerHTML =
      '<button data-testid="image-object-input-browse-button-sanity-default">Select</button>'

    expect(document.querySelector(targetAssetBrowse())).not.toBeNull()
  })

  it('finds it with a custom asset source installed', () => {
    document.body.innerHTML =
      '<button data-testid="image-object-input-browse-button-my-dam">Select</button>'

    expect(document.querySelector(targetAssetBrowse())).not.toBeNull()
  })

  // The one that was broken: `multi-` lands before `browse-button`, so a prefix
  // match on the single-source form never sees it.
  it('finds it once a second source makes Studio render the multi variant', () => {
    document.body.innerHTML =
      '<button data-testid="image-object-input-multi-browse-button">Select</button>'

    expect(document.querySelector(targetAssetBrowse())).not.toBeNull()
  })

  it('matches nothing when Studio renders no browse button at all', () => {
    document.body.innerHTML = '<button data-testid="file-input-upload-button">Upload</button>'

    expect(document.querySelector(targetAssetBrowse())).toBeNull()
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

/**
 * An open document with errors, copied from a running Studio 6.16: the tab
 * row is `field-group-tabs` and carries the same error icon as a field, and
 * the validation button differs from Comments only by its icon and dot.
 */
function documentWithErrors(): void {
  document.body.innerHTML = `
    <div data-testid="document-pane">
      <button data-ui="StatusButton" aria-label="Validering">
        <svg data-sanity-icon="error-outline"></svg><span style="background: var(--card-badge-critical-dot-color)"></span>
      </button>
      <button data-ui="StatusButton" aria-label="Kommentarer"><svg data-sanity-icon="comment"></svg></button>
      <div data-testid="field-group-tabs">
        <button data-testid="group-tab-all-fields" aria-selected="false">
          <svg data-testid="input-validation-icon-error" data-sanity-icon="error-outline"></svg>
        </button>
        <button data-testid="group-tab-content" aria-selected="true">
          <svg data-testid="input-validation-icon-error" data-sanity-icon="error-outline"></svg>
        </button>
        <button data-testid="group-tab-details" aria-selected="false">
          <svg data-testid="input-validation-icon-error" data-sanity-icon="error-outline"></svg>
        </button>
        <button data-testid="group-tab-media" aria-selected="false"></button>
      </div>
      <div data-testid="field-seo">
        <div data-testid="field-seo.title">
          <svg data-testid="input-validation-icon-error"></svg>
        </div>
      </div>
    </div>`
}

describe('selectors for a document that cannot be published', () => {
  it('finds the validation button by its critical dot, not its translated label', () => {
    documentWithErrors()

    expect(document.querySelector(targetValidationErrors())?.getAttribute('aria-label')).toBe(
      'Validering',
    )
  })

  // Found in a live Studio: the tab row shares the `field-` prefix and has
  // error icons of its own, so it was the first "field with an error".
  it('rings the field to fix, not the tab row and not the object around it', () => {
    documentWithErrors()

    const matches = [...document.querySelectorAll(targetFieldValidationError())]

    expect(matches.map((m) => m.getAttribute('data-testid'))).toEqual(['field-seo.title'])
  })

  it('points at a closed tab with an error, never the open one or "All fields"', () => {
    documentWithErrors()

    const matches = [...document.querySelectorAll(targetFieldGroupWithError())]

    expect(matches.map((m) => m.getAttribute('data-testid'))).toEqual(['group-tab-details'])
  })
})
