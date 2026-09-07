import {useCallback} from 'react'

import {useOnboarding} from './OnboardingProvider'

/**
 * Get a callback that opens a tour on demand.
 *
 * Use this to wire a tour to your own button. The plugin's navbar help menu
 * already provides a way back into every tour, so you only need this if you
 * want an additional or alternative entry point.
 *
 * ```tsx
 * function HelpButton() {
 *   const startTour = useStartTour('essentials')
 *   return <Button onClick={startTour} text="Show me around" />
 * }
 * ```
 *
 * @public
 */
export function useStartTour(tourId: string): () => void {
  const {startTour, tours} = useOnboarding()

  return useCallback(() => {
    if (!tours.some((tour) => tour.id === tourId)) {
      console.warn(
        `[sanity-plugin-onboarding] useStartTour("${tourId}") — no tour with that id is ` +
          `registered. Registered tours: ${tours.map((tour) => tour.id).join(', ') || '(none)'}.`,
      )
      return
    }
    startTour(tourId)
  }, [startTour, tours, tourId])
}
