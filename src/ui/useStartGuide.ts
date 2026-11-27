import {useCallback, useMemo, useState} from 'react'
import {getPublishedId, useClient, useSchema} from 'sanity'
import {useRouter} from 'sanity/router'

import {serializeSchema} from '../ai/serializeSchema'
import {QUERY_API_VERSION} from '../core/apiVersion'
import {useOnboardingOptional} from '../core/OnboardingProvider'
import {type OnboardingTour} from '../core/types'
import {query} from '../core/useTargetElement'
import {documentTypesFor, LATEST_DOCUMENT_QUERY, targetsOf, waitForElement} from './tourDocument'

/**
 * Start a guide where it can run, opening a document first if it needs one.
 *
 * Used by the guides menu and the Onboarding tool alike. Before this, starting
 * the publishing guide from a document list said "open a document, then start
 * it again" — accurate, and one more thing to do for someone who asked for help.
 *
 * Opens nothing when the guide can already run here: an editor inside a blog
 * post who starts the SEO guide stays in that post, not the latest one. "Can run
 * here" means any step pointing at something on screen, not only the first: a
 * guide whose first step is conditional, such as the image picker that
 * disappears once an image is set, otherwise opened a different document and
 * waited 10 seconds for a button that never appears.
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
      const targets = targetsOf(tour)
      const candidates = documentTypesFor(tour, types)

      if (candidates.length === 0 || targets.length === 0 || targets.some((t) => query(t))) {
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
          await waitForElement(targets.join(', '))
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
