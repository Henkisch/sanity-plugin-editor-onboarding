import {
  targetDocumentHistory,
  targetDocumentStatus,
  targetGuidesButton,
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
import {ONBOARDING_NAMESPACE} from '../i18n/index'
import {type OnboardingResourceKey} from '../i18n/locales/en-US'
import {type LocalizedText} from '../i18n/useLocalizedText'

/**
 * The concepts covered by {@link coreConcepts}.
 *
 * @public
 */
export type CoreConceptId = 'essentials' | 'publishing' | 'collaboration' | 'releases' | 'media'

const DOCS = 'https://www.sanity.io/docs'

/**
 * Marks a string as a key in this plugin's own locale namespace.
 *
 * The built-in tours are fully translated, so none of their text is written
 * inline here — it lives in `src/i18n/locales/` where it can be localized.
 */
const k = (key: OnboardingResourceKey): LocalizedText => ({key, ns: ONBOARDING_NAMESPACE})

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
    title: k('tour.essentials.title'),
    description: k('tour.essentials.description'),
    autoStart: 'first-login',
    steps: [
      {
        target: targetPerspectiveMenu(),
        title: k('tour.essentials.drafts.title'),
        content: k('tour.essentials.drafts.content'),
        learnMoreUrl: `${DOCS}/studio/drafts-and-published-documents`,
      },
      {
        target: targetNewDocument(),
        title: k('tour.essentials.new.title'),
        content: k('tour.essentials.new.content'),
      },
      {
        target: targetSearch(),
        title: k('tour.essentials.search.title'),
        content: k('tour.essentials.search.content'),
      },
      {
        // The handoff. Everything else in this library is opt-in from the menu,
        // so this is the one moment where we can reliably show people where it
        // lives — while their attention is already on the tour.
        target: targetGuidesButton(),
        title: k('tour.essentials.guides.title'),
        content: k('tour.essentials.guides.content'),
      },
    ],
  },

  publishing: {
    id: 'publishing',
    title: k('tour.publishing.title'),
    description: k('tour.publishing.description'),
    unavailableMessage: k('tour.publishing.unavailable'),
    steps: [
      {
        target: targetDocumentStatus(),
        title: k('tour.publishing.autosave.title'),
        content: k('tour.publishing.autosave.content'),
      },
      {
        target: targetPublishButton(),
        title: k('tour.publishing.publish.title'),
        content: k('tour.publishing.publish.content'),
        placement: 'top',
      },
      {
        target: targetDocumentHistory(),
        title: k('tour.publishing.history.title'),
        content: k('tour.publishing.history.content'),
        learnMoreUrl: `${DOCS}/studio/document-history`,
      },
    ],
  },

  collaboration: {
    id: 'collaboration',
    title: k('tour.collaboration.title'),
    description: k('tour.collaboration.description'),
    steps: [
      {
        target: targetNavbar(),
        title: k('tour.collaboration.presence.title'),
        content: k('tour.collaboration.presence.content'),
      },
      {
        target: targetToolMenu(),
        title: k('tour.collaboration.comments.title'),
        content: k('tour.collaboration.comments.content'),
        learnMoreUrl: `${DOCS}/studio/commenting`,
      },
    ],
  },

  releases: {
    id: 'releases',
    title: k('tour.releases.title'),
    description: k('tour.releases.description'),
    steps: [
      {
        target: targetReleases(),
        title: k('tour.releases.bundle.title'),
        content: k('tour.releases.bundle.content'),
        learnMoreUrl: `${DOCS}/content-lake/content-releases`,
      },
      {
        target: targetPerspectiveMenu(),
        title: k('tour.releases.preview.title'),
        content: k('tour.releases.preview.content'),
      },
    ],
  },

  media: {
    id: 'media',
    title: k('tour.media.title'),
    description: k('tour.media.description'),
    steps: [
      {
        target: targetNavbar(),
        title: k('tour.media.assets.title'),
        content: k('tour.media.assets.content'),
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
        `[sanity-plugin-editor-onboarding] coreConcepts(): unknown concept "${id}". ` +
          `Available: ${ALL_CONCEPTS.join(', ')}.`,
      )
      return []
    }
    return [tour]
  })
}
