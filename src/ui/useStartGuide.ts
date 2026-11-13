import {useCallback, useMemo, useState} from 'react'
import {getPublishedId, useClient, useSchema} from 'sanity'
import {useRouter} from 'sanity/router'

import {serializeSchema} from '../ai/serializeSchema'
import {stepTarget} from '../core/fieldHelp'
import {useOnboardingOptional} from '../core/OnboardingProvider'
import {type OnboardingTour} from '../core/types'
import {query} from '../core/useTargetElement'
import {documentTypesFor, LATEST_DOCUMENT_QUERY, waitForElement} from './tourDocument'

/** Pinned like every other read this plugin makes. */
const QUERY_API_VERSION = '2024-01-01'

/**
 * Start a guide where it can run, opening a document first if it needs one.
 *
 * Used by the guides menu and the Onboarding tool alike. Before this, starting
 * the publishing guide from a document list said "open a document, then start
 * it again" — accurate, and one more thing to do for someone who asked for help.
 *
 * Opens nothing when the guide can already run here: an editor inside a blog
 * post who starts the SEO guide stays in that post, not the latest one.
 * Falls back to starting in place whenever no fitting document is found, so
 * the guide's own "unavailable" notice still explains what is missing.
 *
 * @internal
 */
export function useStartGuide(): {start: (tour: OnboardingTour) => void; starting: string | null} {
  const onboarding = useOnboardingOptional()
  const schema = useSchema()
  const client = useClient({apiVersion: QUERY_API_VERSION})
  const router = useRouter()
  const types = useMemo(() => serializeSchema(schema), [schema])
  const [starting, setStarting] = useState<string | null>(null)

  const start = useCallback(
    async (tour: OnboardingTour) => {
      const first = tour.steps.map(stepTarget).find((target) => target !== undefined)
      const candidates = documentTypesFor(tour, types)

      if (candidates.length === 0 || !first || query(first)) {
        onboarding?.startTour(tour.id)
        return
      }

      setStarting(tour.id)
      try {
        const found = await client.fetch<{_id: string; _type: string} | null>(
          LATEST_DOCUMENT_QUERY,
          {types: candidates},
        )
        if (found) {
          router.navigateIntent('edit', {id: getPublishedId(found._id), type: found._type})
          await waitForElement(first)
        }
      } catch (error) {
        console.warn(
          '[sanity-plugin-editor-onboarding] Could not open a document for',
          tour.id,
          error,
        )
      } finally {
        setStarting(null)
        onboarding?.startTour(tour.id)
      }
    },
    [client, onboarding, router, types],
  )

  return {
    start: (tour) => {
      void start(tour)
    },
    starting,
  }
}
