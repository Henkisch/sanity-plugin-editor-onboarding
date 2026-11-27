/**
 * Selectors for a tour step to point at.
 *
 * Two tiers. {@link targetCustom} points at your own components, marked with
 * {@link useOnboardingTarget} — stable, because you own that markup. Everything
 * else here resolves against `data-testid` attributes present in Sanity Studio.
 * Sanity does not publish those as a stable public API, so they are verified
 * against a specific Studio version (see README).
 *
 * Either way a selector degrades gracefully: one that stops matching skips its
 * step and logs a warning rather than breaking the tour.
 *
 * @module
 */

/**
 * The attribute {@link useOnboardingTarget} stamps onto an element, and that
 * {@link targetCustom} looks it up by.
 *
 * Internal: the pair of functions is the supported way in and out.
 */
export const ONBOARDING_TARGET_ATTRIBUTE = 'data-onboarding-target'

/**
 * One of your own elements, marked with {@link useOnboardingTarget} or
 * {@link OnboardingTarget}.
 *
 * Prefer this over a CSS selector for anything you control. A selector written
 * against your own class names or DOM shape breaks the next time you touch that
 * component, silently and at a distance; an id you registered explicitly does
 * not.
 *
 * ```tsx
 * function SeoPanel() {
 *   const ref = useOnboardingTarget('seo-panel')
 *   return <div ref={ref}>...</div>
 * }
 *
 * // ...then, in a step:
 * {target: targetCustom('seo-panel'), title: 'SEO', content: '...'}
 * ```
 *
 * @param id - The same id you passed to {@link useOnboardingTarget}.
 * @public
 */
export const targetCustom = (id: string): string =>
  `[${ONBOARDING_TARGET_ATTRIBUTE}="${escapeAttributeValue(id)}"]`

/** The Studio's top navigation bar. @public */
export const targetNavbar = (): string => '[data-testid="studio-navbar"]'

/** The tool switcher in the navbar. @public */
export const targetToolMenu = (): string => '[data-testid="tool-collapse-menu"]'

/** The "create new document" button in the navbar. @public */
export const targetNewDocument = (): string => '[data-testid="new-document-button"]'

/**
 * This plugin's own Guides button in the navbar.
 *
 * Unlike every other helper here, this targets markup the plugin controls, so
 * it is stable across Studio versions.
 *
 * @public
 */
export const targetGuidesButton = (): string => '[data-testid="onboarding-guides-button"]'

/**
 * The Tasks button in the navbar.
 *
 * Absent on Studios with Tasks turned off, so a step pointing here drops out on
 * its own.
 *
 * @public
 */
export const targetTasks = (): string => '[data-testid="tasks-toolbar"]'

/**
 * The navbar's presence menu: everyone who has the Studio open right now.
 *
 * Matched by its element id. It has no test id, and its `aria-label` is
 * translated, so `Global presence` would only match an English Studio. Checked
 * against a live Studio 6 navbar. Narrow windows fold it away, and a step
 * pointing here then drops out on its own.
 *
 * @public
 */
export const targetPresence = (): string => '#global-presence-menu'

/** The global search button. @public */
export const targetSearch = (): string => '[data-testid="studio-search"]'

/**
 * The perspective (draft / published / release) switcher in the navbar.
 *
 * Rings the whole pill, label included. The test id sits on its dropdown
 * arrow alone, so pointing at that rang a 25px chevron next to the word the
 * step was talking about. The pill is the `ReleasesNav` component that holds
 * that button, matched by component name rather than by its translated label.
 *
 * @public
 */
export const targetPerspectiveMenu = (): string =>
  '[data-ui="ReleasesNav"]:has([data-testid="global-perspective-menu-button"])'

/** The link to the Content Releases tool. Absent on Studios without it. @public */
export const targetReleases = (): string => '[data-testid="releases-tool-link"]'

/**
 * The primary action button in an open document's footer, e.g. Publish.
 *
 * Studio builds that button's test id out of its **translated** label —
 * `action-publish` in English, `action-publicera` in Swedish — so matching the
 * English one skipped this step in every language but one, silently.
 *
 * Matched by shape instead, and verified against a running Studio: it is the
 * document pane's only `@sanity/ui` button whose id starts with `action-` once
 * the Portable Text toolbar (`action-button-*`), the overflow menus
 * (`action-menu*`) and the list pane's create button are excluded. Note that it
 * is **not** inside `pane-footer`, despite appearing at the foot of the pane.
 *
 * The same slot holds **Unpublish** while the Published chip is selected, so it
 * is also required to carry the publish icon. Without that, a guide about
 * publishing rang the Unpublish button. A Studio that replaces Publish with a
 * custom action drops the step instead.
 *
 * @public
 */
export const targetPublishButton = (): string =>
  '[data-testid="document-pane"] [data-testid^="action-"][data-ui="Button"]' +
  ':not([data-testid^="action-button-"])' +
  ':not([data-testid^="action-menu"])' +
  ':not([data-testid="action-intent-button"])' +
  ':has([data-sanity-icon="publish"])'

/**
 * The Draft / Published chips at the top of an open document.
 *
 * This is Studio's control for switching between the version you're editing and
 * the one that is live.
 *
 * Matched by shape rather than by name: Studio interpolates the chip's
 * **translated** label into its test id, so `document-header-Draft-chip` exists
 * only in an English Studio and is `document-header-Utkast-chip` in a Swedish
 * one. This resolves to whichever chip comes first, which is all the step needs
 * — it is describing the pair.
 *
 * @public
 */
export const targetDocumentStatus = (): string =>
  '[data-testid^="document-header-"][data-testid$="-chip"]'

/**
 * The red status button in an open document's header that opens the list of
 * validation errors. Clicking an entry in that list jumps to the field.
 *
 * Studio gives this button no test id, and its `aria-label` is translated, so
 * it is matched by shape: the document pane's `StatusButton` whose status dot
 * is coloured `critical`. Studio renders the button only while the document
 * has problems, and colours the dot `caution` for warnings alone — which do
 * not block publishing — so this resolves exactly when publishing is blocked,
 * and a step pointing here drops out on a valid document.
 *
 * @public
 */
export const targetValidationErrors = (): string =>
  '[data-testid="document-pane"] [data-ui="StatusButton"]:has([style*="critical"])'

/**
 * The first field in the open document that has an error, as a whole.
 *
 * Rings the field rather than its red error icon: the icon is not a button —
 * it only shows a tooltip on hover — so a ring on it alone reads as something
 * to click that then does nothing. The field is what the editor has to fix.
 *
 * The icon's test id names its severity rather than a label, so this is the
 * same in every language. The `:not(:has(...))` picks the innermost field, so
 * an error inside an object rings the nested field rather than the whole
 * object around it. Absent while the document has no errors.
 *
 * @public
 */
export const targetFieldValidationError = (): string =>
  `[data-testid="document-pane"] ${FIELD}:has(${ERROR_ICON}):not(:has(${FIELD} ${ERROR_ICON}))`

/**
 * A field-group tab, other than the open one, that holds a field with an error.
 *
 * A required field on a tab nobody has opened is invisible: Publish stays grey
 * and nothing on screen says why. Studio marks the tab instead. The open tab
 * and "All fields" are excluded, since the error on those is already in view.
 * Matched by the tab's schema name prefix and the error icon's name, so it is
 * the same in every language. On a narrow pane Studio swaps the tabs for a
 * dropdown, and a step pointing here drops out.
 *
 * @public
 */
export const targetFieldGroupWithError = (): string =>
  '[data-testid="document-pane"] [data-testid^="group-tab-"][aria-selected="false"]' +
  ':not([data-testid="group-tab-all-fields"])' +
  ':has([data-sanity-icon="error-outline"])'

/**
 * A form field, but not the field-group tab row: that is `field-group-tabs`,
 * shares the `field-` prefix, and carries error icons for its tabs, so without
 * this exclusion it is the first "field with an error" in the document.
 */
const FIELD = '[data-testid^="field-"]:not([data-testid^="field-group"])'
const ERROR_ICON = '[data-testid="input-validation-icon-error"]'

/**
 * The Draft chip at the top of an open document — the one to click when the
 * Studio is showing the published version and every field is read-only.
 *
 * Each chip's test id carries its **translated** label (`Draft-chip`,
 * `Utkast-chip`), so this matches by position instead: Studio always renders
 * Published first and Draft second, then any releases. Ringing the whole row
 * was tried and rejected — it stretches across the full header, mostly empty.
 * A workspace with the draft model turned off has no Draft chip, and the
 * second position is then a release; such Studios have nothing to switch back
 * to, so the editing guide does not apply to them anyway.
 *
 * @public
 */
export const targetDraftChip = (): string =>
  '[data-testid="document-perspective-list"] > :nth-child(2) ' +
  '[data-testid^="document-header-"][data-testid$="-chip"]'

/**
 * The Published chip at the top of an open document. Selecting it is the
 * only way to reach Unpublish: on the Draft chip that action is not offered.
 *
 * Matched by position for the same reason as {@link targetDraftChip}: its test
 * id carries the translated label. Studio always renders Published first.
 *
 * @public
 */
export const targetPublishedChip = (): string =>
  '[data-testid="document-perspective-list"] > :nth-child(1) ' +
  '[data-testid^="document-header-"][data-testid$="-chip"]'

/**
 * Unpublish, in an open document's footer. Present only while the Published
 * chip is selected, where it takes Publish's place.
 *
 * Its test id is the translated label (`action-avpublicera` in Swedish), so it
 * is found by its icon, the way {@link targetPublishButton} tells the two apart.
 *
 * @public
 */
export const targetUnpublishButton = (): string =>
  '[data-testid="document-pane"] [data-testid^="action-"][data-ui="Button"]' +
  ':has([data-sanity-icon="unpublish"])'

/**
 * The "…" menu beside Publish in an open document's footer, which holds
 * Delete, Duplicate and Discard changes.
 *
 * Not the same as {@link targetDocumentHistory}, the "…" in the document's
 * header, which holds history and inspectors.
 *
 * @public
 */
export const targetDocumentActionsMenu = (): string =>
  '[data-testid="document-pane"] [data-testid="action-menu-button"]'

/**
 * The open document's context menu, which holds version history and
 * "compare versions".
 *
 * Scoped to the document pane on purpose: the list pane alongside it uses the
 * same test id, and an unscoped selector would match that one first.
 *
 * @public
 */
export const targetDocumentHistory = (): string =>
  '[data-testid="document-pane"] [data-testid="pane-context-menu-button"]'

/**
 * The "Select" button on an image field — the control that reuses an asset
 * already in the project rather than uploading a second copy.
 *
 * Studio renders this button two different ways, and both have to be matched:
 *
 * - one asset source: `image-object-input-browse-button-<source>`, where the
 *   suffix is the source's name (`sanity-default` on a stock Studio);
 * - more than one, which is what installing Media Library or any custom asset
 *   source causes: `image-object-input-multi-browse-button`, with `multi-`
 *   inserted *before* `browse-button`, so a prefix match on the first form
 *   silently misses it.
 *
 * With no asset sources at all Studio renders no button, and the step drops out
 * on its own. Present only while a document with an image field is open, which
 * is exactly when reuse can be demonstrated.
 *
 * @public
 */
export const targetAssetBrowse = (): string =>
  '[data-testid^="image-object-input-browse-button-"],' +
  '[data-testid="image-object-input-multi-browse-button"]'

/**
 * The crop button on an image field that already holds an image — where an
 * editor sets the hotspot and crop.
 *
 * Present only when the field has an image and its schema enables
 * `options.hotspot`, so on an empty field this step drops out and
 * {@link targetAssetBrowse} has something to show instead. Studio names it by
 * purpose rather than label, so it is the same in every language.
 *
 * @public
 */
export const targetImageCrop = (): string => '[data-testid="options-menu-edit-details"]'

/**
 * A document type's entry in the structure tool's list.
 *
 * Note that Studio keys these by the type's **title**, not its schema name — so
 * pass what an editor sees ("Blog post"), not the schema name (`blogPost`).
 *
 * @public
 */
export const targetDocumentType = (title: string): string =>
  `[data-testid="pane-item-${escapeAttributeValue(title)}"]`

/**
 * A field in the currently open document form.
 *
 * @param name - The field's name as declared in your schema.
 * @public
 */
export const targetField = (name: string): string =>
  `[data-testid="field-${escapeAttributeValue(name)}"]`

/**
 * Escape a value for use inside a `[attr="..."]` selector, so that titles
 * containing quotes or backslashes can't produce an invalid selector.
 */
export function escapeAttributeValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
