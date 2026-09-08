/**
 * Every Sanity docs page this plugin links to, in one table.
 *
 * Two reasons it lives here rather than inline in the tours:
 *
 * - Sanity moves docs paths without leaving redirects behind. All five URLs
 *   originally shipped with this plugin had rotted to 404 by the time anyone
 *   clicked one. `npm run check:links` walks this file, and CI runs it weekly.
 * - Rot is time-indexed, not version-indexed. When a page moves, the old URL
 *   dies for every Studio version at once — so there are deliberately no
 *   per-version variants here. A Studio too old for a feature drops the step
 *   instead, because that step's target never resolves.
 *
 * URLs are written out in full rather than composed from a base, so the link
 * checker can find them by reading the file.
 *
 * @module
 */

/**
 * Pages written for editors rather than developers, which is why the
 * `user-guides/` section is preferred wherever it covers the topic.
 */
export const docs = {
  /** Drafts, publishing, and the day-to-day of editing. */
  contentOperations: 'https://www.sanity.io/docs/user-guides/content-operations-cheatsheet',
  /** Document history and the side-by-side comparison view. */
  compareVersions: 'https://www.sanity.io/docs/studio/compare-document-versions',
  /** Comments, mentions, and resolving threads. */
  comments: 'https://www.sanity.io/docs/studio/comments',
  /** Bundling and scheduling changes across documents. */
  contentReleases: 'https://www.sanity.io/docs/user-guides/content-releases',
  /** Uploading, reusing, and replacing assets. */
  mediaLibrary: 'https://www.sanity.io/docs/user-guides/media-library-user-cheatsheet',
} as const

/** The docs page a given guide summarises. @internal */
export type DocsUrl = (typeof docs)[keyof typeof docs]
