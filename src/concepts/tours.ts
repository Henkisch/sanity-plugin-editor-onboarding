import {CalendarIcon} from '@sanity/icons/Calendar'
import {ImagesIcon} from '@sanity/icons/Images'
import {PublishIcon} from '@sanity/icons/Publish'
import {RocketIcon} from '@sanity/icons/Rocket'
import {UsersIcon} from '@sanity/icons/Users'

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
import {docs} from './docs'
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

function buildTours(options: CoreConceptsOptions): Record<CoreConceptId, OnboardingTour> {
  const slugField = options.slugField ?? 'slug'

  return {
  essentials: {
    id: 'essentials',
    title: k('tour.essentials.title'),
    sourceUrl: docs.contentOperations,
    description: k('tour.essentials.description'),
    autoStart: 'first-login',
    icon: RocketIcon,
    steps: [
      {
        // No target: this one is centred, and is the only step that explains
        // what is happening. It is the first thing a new editor ever sees of
        // the Studio, so it says how long this takes, that leaving is fine,
        // and where everything lives afterwards — before any ring appears on
        // a control they haven't met yet.
        //
        // Only `essentials` may open this way. A tour whose steps are all
        // unanchored can never report itself unavailable, and this one is safe
        // because its remaining targets are navbar chrome present on every view.
        title: k('tour.essentials.intro.title'),
        content: k('tour.essentials.intro.content'),
      },
      {
        target: targetPerspectiveMenu(),
        title: k('tour.essentials.drafts.title'),
        content: k('tour.essentials.drafts.content'),
        learnMoreUrl: docs.contentOperations,
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
    sourceUrl: docs.contentOperations,
    description: k('tour.publishing.description'),
    icon: PublishIcon,
    unavailableMessage: k('tour.publishing.unavailable'),
    steps: [
      {
        target: targetDocumentStatus(),
        title: k('tour.publishing.autosave.title'),
        content: k('tour.publishing.autosave.content'),
      },
      {
        // Deliberately has no `learnMoreUrl`: Sanity documents slugs only for
        // developers, and sending an editor to a page about form paths is
        // worse than sending them nowhere.
        field: slugField,
        title: k('tour.publishing.slug.title'),
        content: k('tour.publishing.slug.content'),
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
        learnMoreUrl: docs.compareVersions,
      },
    ],
  },

  collaboration: {
    id: 'collaboration',
    title: k('tour.collaboration.title'),
    sourceUrl: docs.comments,
    description: k('tour.collaboration.description'),
    icon: UsersIcon,
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
        learnMoreUrl: docs.comments,
      },
    ],
  },

  releases: {
    id: 'releases',
    title: k('tour.releases.title'),
    sourceUrl: docs.contentReleases,
    description: k('tour.releases.description'),
    icon: CalendarIcon,
    steps: [
      {
        target: targetReleases(),
        title: k('tour.releases.bundle.title'),
        content: k('tour.releases.bundle.content'),
        learnMoreUrl: docs.contentReleases,
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
    sourceUrl: docs.mediaLibrary,
    description: k('tour.media.description'),
    icon: ImagesIcon,
    steps: [
      {
        target: targetNavbar(),
        title: k('tour.media.assets.title'),
        content: k('tour.media.assets.content'),
        learnMoreUrl: docs.mediaLibrary,
      },
    ],
  },
  }
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
  /**
   * The schema name of your slug field, if it isn't `slug`.
   *
   * "Slug" is the term editors ask about most and understand least, so the
   * publishing guide explains it. That step targets the field by schema name;
   * if yours is called `path` or `permalink`, say so here. Get it wrong and the
   * step quietly drops out with a warning rather than breaking the guide.
   *
   * @defaultValue 'slug'
   */
  slugField?: string
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
  const tours = buildTours(options)

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
