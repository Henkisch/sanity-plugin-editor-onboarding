import {type ElementType} from 'react'

import {type LocalizedText} from '../i18n/useLocalizedText'

/**
 * Public types for sanity-plugin-editor-onboarding.
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
   * The schema name of a field this step explains, e.g. `'slug'`, or a dotted
   * path for a nested one, e.g. `'seo.title'`.
   *
   * Two things follow from setting it. The step targets that field without you
   * writing a selector, and the field itself gains a book icon in its action
   * row, so an editor stuck on it can read this step on its own without
   * remembering a guide exists.
   *
   * `target` still wins if you set both.
   */
  field?: string
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
  title: LocalizedText
  /** The explanation. One to three sentences — link out for anything longer. */
  content: LocalizedText
  /**
   * Optional "read more" link rendered under the content.
   *
   * Localized like every other string here, which is what makes it
   * overridable: a Studio can point this at its own internal handbook by
   * redefining the key in a bundle, without redeclaring the tour.
   */
  learnMoreUrl?: LocalizedText
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
  title: LocalizedText
  /** Optional one-liner shown under the title in the help menu. */
  description?: LocalizedText
  /**
   * Icon shown beside this tour's title in the guides menu.
   *
   * Defaults to a book. There is deliberately no "no icon" option: a menu where
   * some items have one and some don't reads as broken, and your tours sit in
   * the same list as the built-in ones.
   */
  icon?: ElementType
  /**
   * Where this guide's content comes from — shown once, on the last step.
   *
   * A tour is a summary written for editors; this is the authority it
   * summarises, so someone who wants the full account knows where to go and
   * can see the plugin is not inventing its own version of Sanity.
   */
  sourceUrl?: LocalizedText
  /** Defaults to `'manual'`. */
  autoStart?: AutoStart
  /**
   * Shown when the user starts this tour but none of its steps can find their
   * target — typically because the tour describes a part of the Studio that
   * isn't open yet.
   *
   * Without this, starting such a tour would appear to do nothing at all.
   */
  unavailableMessage?: LocalizedText
  steps: OnboardingStep[]
}

/**
 * Help attached to one schema field, reachable from the field itself.
 *
 * A field guide puts a book icon in that field's action row, beside the comment
 * button. Clicking it explains that field and nothing else — no tour, no step
 * counter — because someone who clicks it is stuck on this field right now.
 *
 * Use it for the fields your editors actually ask about. A tour step can do the
 * same job by naming a `field`; this is the shorter path when the help does not
 * belong to a guide.
 *
 * ```ts
 * fieldGuides: [
 *   {
 *     field: 'ingredients',
 *     documentType: 'recipe',
 *     title: 'One ingredient per line',
 *     content: 'The site renders each line as its own bullet.',
 *   },
 * ]
 * ```
 *
 * @public
 */
export interface FieldGuide {
  /** Schema name, or a dotted path for a nested field: `'seo.title'`. */
  field: string
  /**
   * Restrict this guide to one document type.
   *
   * Omit it and the guide applies to every type with a field of that name,
   * which is usually what you want for a field shared across types.
   */
  documentType?: string
  /** Short heading. One line. */
  title: LocalizedText
  /** The explanation. One to three sentences. */
  content: LocalizedText
  /** Optional "read more" link rendered under the content. */
  learnMoreUrl?: LocalizedText
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
   * Help attached to individual fields, shown from a book icon in the field's
   * own action row.
   *
   * Tour steps that name a `field` are picked up automatically and need no
   * entry here.
   */
  fieldGuides?: FieldGuide[]
  /**
   * Keep each editor's progress in the project, so "seen it" follows them
   * between browsers and machines.
   *
   * Off by default, and deliberately so: turning it on writes one small
   * document per editor into your dataset, and a plugin should not start
   * putting things in someone's content lake without being asked. The document
   * uses an unregistered type, so it never appears in the structure tool or in
   * search.
   *
   * Best-effort in every direction. An editor without write access, or without
   * a network, keeps working against this browser's own store — the plugin
   * warns the developer once and never the editor.
   *
   * Progress is per dataset. A Studio with several workspaces tracks each
   * separately.
   *
   * @defaultValue false
   */
  syncProgress?: boolean
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
