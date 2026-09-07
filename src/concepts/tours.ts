import {
  targetDocumentHistory,
  targetDocumentStatus,
  targetNavbar,
  targetNewDocument,
  targetPerspectiveMenu,
  targetPublishButton,
  targetReleases,
  targetSearch,
  targetToolMenu,
} from '../core/targeting'

/**
 * Steps only resolve against UI that is actually on screen, so each tour is
 * scoped to one context. `essentials` is the only tour that auto-starts, and it
 * points exclusively at navbar chrome that is present on every view — pointing
 * an auto-starting tour at document-only UI would silently drop most of it.
 */
import {type OnboardingTour} from '../core/types'

/**
 * The concepts covered by {@link coreConcepts}.
 *
 * @public
 */
export type CoreConceptId = 'essentials' | 'publishing' | 'collaboration' | 'releases' | 'media'

const DOCS = 'https://www.sanity.io/docs'

/**
 * Content is written for editors, not developers: what the thing does and why
 * they'd care, in at most three sentences, with a link out for the rest.
 */
/** Declared explicitly so the default order is intentional, not key order. */
const ALL_CONCEPTS: CoreConceptId[] = [
  'essentials',
  'publishing',
  'collaboration',
  'releases',
  'media',
]

const tours: Record<CoreConceptId, OnboardingTour> = {
  essentials: {
    id: 'essentials',
    title: 'Studio essentials',
    description: 'Drafts, published content, and finding your way around',
    autoStart: 'first-login',
    steps: [
      {
        target: targetPerspectiveMenu(),
        title: 'Drafts and published content',
        content:
          'Every document has a draft you edit and a published version your site reads. This switches the whole Studio between the two, so you can see exactly what is live.',
        learnMoreUrl: `${DOCS}/studio/drafts-and-published-documents`,
      },
      {
        target: targetNewDocument(),
        title: 'Start something new',
        content: 'Create a document of any type from here, wherever you are in the Studio.',
      },
      {
        target: targetSearch(),
        title: 'Find anything',
        content:
          'Search across every document type at once — useful when you know the headline but not where it lives.',
      },
    ],
  },

  publishing: {
    id: 'publishing',
    title: 'Editing and publishing',
    description: 'What happens to your changes, and how to undo them',
    unavailableMessage:
      'This guide points at the document editor. Open any document, then start it again.',
    steps: [
      {
        target: targetDocumentStatus(),
        title: 'Your changes are already saved',
        content:
          'Edits save as you type — there is no save button. These chips switch between the draft you are working on and the version that is currently live.',
      },
      {
        target: targetPublishButton(),
        title: 'Publishing makes it live',
        content:
          'Your edits stay in the draft until you publish. Publishing copies the draft over the published version your site reads.',
        placement: 'top',
      },
      {
        target: targetDocumentHistory(),
        title: 'Every change is kept',
        content:
          'This menu holds the document’s history. Compare an earlier version side by side with the current one, and restore it if something went wrong.',
        learnMoreUrl: `${DOCS}/studio/document-history`,
      },
    ],
  },

  collaboration: {
    id: 'collaboration',
    title: 'Working with your team',
    description: 'Presence, comments, and tasks',
    steps: [
      {
        target: targetNavbar(),
        title: 'You are not editing alone',
        content:
          'When a colleague opens the same document their avatar appears here, and their cursor shows in the field they are working on. Edits from both of you merge as you type.',
      },
      {
        target: targetToolMenu(),
        title: 'Comments and tasks live with the content',
        content:
          'Leave a comment on a specific field, mention a colleague to notify them, or assign a task — all attached to the document rather than buried in a chat thread.',
        learnMoreUrl: `${DOCS}/studio/commenting`,
      },
    ],
  },

  releases: {
    id: 'releases',
    title: 'Scheduling with releases',
    description: 'Publish a set of documents together, at a chosen time',
    steps: [
      {
        target: targetReleases(),
        title: 'Bundle changes into a release',
        content:
          'A release groups documents that should go live together — a campaign, a product launch — so they publish in one go instead of one at a time.',
        learnMoreUrl: `${DOCS}/content-lake/content-releases`,
      },
      {
        target: targetPerspectiveMenu(),
        title: 'Preview a release before it ships',
        content:
          'Switch the Studio to a release to see the site exactly as it will read once that release is published.',
      },
    ],
  },

  media: {
    id: 'media',
    title: 'Images and files',
    description: 'How assets are stored and reused',
    steps: [
      {
        target: targetNavbar(),
        title: 'Upload once, use anywhere',
        content:
          'Images and files live in a shared library rather than inside the document you uploaded them to, so the same asset can be reused across the site without a second copy.',
        learnMoreUrl: `${DOCS}/studio/assets`,
      },
    ],
  },
}

/**
 * Options for {@link coreConcepts}.
 *
 * @public
 */
export interface CoreConceptsOptions {
  /**
   * Which concept tours to include. Omit for all of them.
   *
   * Steps pointing at features your project doesn't have — Content Releases,
   * for instance — drop out on their own, so there is usually no need to
   * exclude a tour just because a feature is unavailable.
   */
  include?: CoreConceptId[]
}

/**
 * Ready-made tours covering the Sanity concepts every editor eventually asks
 * about. No project-specific configuration required.
 *
 * ```ts
 * onboardingTool({tours: coreConcepts()})
 * ```
 *
 * @public
 */
export function coreConcepts(options: CoreConceptsOptions = {}): OnboardingTour[] {
  const ids = options.include ?? ALL_CONCEPTS

  return ids.flatMap((id) => {
    const tour = tours[id]
    if (!tour) {
      console.warn(
        `[sanity-plugin-onboarding] coreConcepts(): unknown concept "${id}". ` +
          `Available: ${ALL_CONCEPTS.join(', ')}.`,
      )
      return []
    }
    return [tour]
  })
}
