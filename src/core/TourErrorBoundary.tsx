import {Component, type ErrorInfo, type ReactNode} from 'react'

interface Props {
  tourId: string
  /** Called so the tour can be torn down rather than left half-rendered. */
  onError: () => void
  children: ReactNode
}

interface State {
  failed: boolean
}

/**
 * Contains a failure inside a tour step.
 *
 * Onboarding is an accessory to the Studio, never a dependency of it: a broken
 * step must cost the user their tour, not their editor.
 */
export class TourErrorBoundary extends Component<Props, State> {
  state: State = {failed: false}

  static getDerivedStateFromError(): State {
    return {failed: true}
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(
      `[sanity-plugin-onboarding] Tour "${this.props.tourId}" crashed and has been closed. ` +
        `The Studio is unaffected.`,
      error,
      info.componentStack,
    )
    this.props.onError()
  }

  render(): ReactNode {
    if (this.state.failed) return null
    return this.props.children
  }
}
