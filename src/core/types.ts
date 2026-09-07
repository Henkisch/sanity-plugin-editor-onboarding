/**
 * Public types for sanity-plugin-onboarding.
 *
 * @module
 */

/**
 * How a user last left a tour.
 *
 * These are deliberately three distinct values rather than a single boolean:
 * "I'm busy right now" and "never show me this again" are different intents and
 * must persist differently. `completed` is stored separately from `dismissed`
 * so that engagement can be told apart from opt-out later on.
 *
 * @public
 */
export type TourStatus =
  /** Dismissed for this session only. Will be offered again next session. */
  | 'skipped'
  /** Explicit, permanent opt-out. Only reachable again via the help menu. */
  | 'dismissed'
  /** Reached the last step. Never auto-starts again. */
  | 'completed'

/**
 * Context handed to a custom `autoStart` predicate.
 *
 * @public
 */
export interface AutoStartContext {
  /** The Sanity user id of the currently authenticated user, if known. */
  userId: string | null
  /** Roles assigned to the current user in this project. */
  roles: string[]
  /** How the user last left this tour, or `null` if they never have. */
  status: TourStatus | null
}

/**
 * When a tour should start on its own.
 *
 * - `'first-login'` — start once, the first time this user sees the Studio.
 * - `'manual'` — never starts on its own; use the help menu or {@link useStartTour}.
 * - A predicate — full control, e.g. gating on a role.
 *
 * @public
 */
export type AutoStart = 'first-login' | 'manual' | ((context: AutoStartContext) => boolean)

/**
 * A single popup in a tour.
 *
 * @public
 */
export interface OnboardingStep {
  /**
   * A CSS selector for the element to point at.
   *
   * If it never resolves the step is skipped rather than blocking the tour, and
   * a warning naming the tour, the step and this selector is logged for you.
   *
   * Omit it entirely for a step that isn't anchored to anything — it is then
   * centred in the viewport.
   */
  target?: string
  /** Short heading. One line. */
  title: string
  /** The explanation. One to three sentences — link out for anything longer. */
  content: string
  /** Optional "read more" link rendered under the content. */
  learnMoreUrl?: string
  /** Where to put the popup relative to the target. Defaults to `'bottom'`. */
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

/**
 * A named sequence of steps.
 *
 * @public
 */
export interface OnboardingTour {
  /** Stable id. Used as the persistence key — changing it resets progress. */
  id: string
  /** Shown in the help menu. */
  title: string
  /** Optional one-liner shown under the title in the help menu. */
  description?: string
  /** Defaults to `'manual'`. */
  autoStart?: AutoStart
  /**
   * Shown when the user starts this tour but none of its steps can find their
   * target — typically because the tour describes a part of the Studio that
   * isn't open yet.
   *
   * Without this, starting such a tour would appear to do nothing at all.
   */
  unavailableMessage?: string
  steps: OnboardingStep[]
}

/**
 * Options for {@link onboardingTool}.
 *
 * @public
 */
export interface OnboardingConfig {
  /** The tours to register. */
  tours: OnboardingTour[]
  /**
   * Show the built-in help button in the Studio navbar.
   *
   * This is how a user gets back to a tour they dismissed, so it is on by
   * default. Turn it off only if you are providing your own entry point with
   * {@link useStartTour}.
   *
   * @defaultValue true
   */
  navbarButton?: boolean
}
