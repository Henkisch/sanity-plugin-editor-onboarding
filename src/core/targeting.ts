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

/** The global search button. @public */
export const targetSearch = (): string => '[data-testid="studio-search"]'

/** The perspective (draft / published / release) switcher. @public */
export const targetPerspectiveMenu = (): string => '[data-testid="global-perspective-menu-button"]'

/** The link to the Content Releases tool. Absent on Studios without it. @public */
export const targetReleases = (): string => '[data-testid="releases-tool-link"]'

/** The primary action button in an open document's footer, e.g. Publish. @public */
export const targetPublishButton = (): string => '[data-testid="action-publish"]'

/**
 * The Draft / Published chips at the top of an open document.
 *
 * This is Studio's control for switching between the version you're editing and
 * the one that is live.
 *
 * @public
 */
export const targetDocumentStatus = (): string => '[data-testid="document-header-Draft-chip"]'

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
