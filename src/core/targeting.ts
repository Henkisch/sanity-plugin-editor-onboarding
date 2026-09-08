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

/** The global search button. @public */
export const targetSearch = (): string => '[data-testid="studio-search"]'

/** The perspective (draft / published / release) switcher. @public */
export const targetPerspectiveMenu = (): string => '[data-testid="global-perspective-menu-button"]'

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
 * @public
 */
export const targetPublishButton = (): string =>
  '[data-testid="document-pane"] [data-testid^="action-"][data-ui="Button"]' +
  ':not([data-testid^="action-button-"])' +
  ':not([data-testid^="action-menu"])' +
  ':not([data-testid="action-intent-button"])'

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
 * Matched by prefix because Studio suffixes the id with the asset source, which
 * changes when Media Library is installed. Present only while a document with
 * an image field is open, which is exactly when reuse can be demonstrated.
 *
 * @public
 */
export const targetAssetBrowse = (): string =>
  '[data-testid^="image-object-input-browse-button"]'

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
