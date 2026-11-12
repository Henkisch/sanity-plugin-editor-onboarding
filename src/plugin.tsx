import {definePlugin, SANITY_VERSION, type LayoutProps, type NavbarProps} from 'sanity'

import {canUseConventionFinder} from './ai/access'
import {OnboardingProvider} from './core/OnboardingProvider'
import {type OnboardingConfig} from './core/types'
import {onboardingLocaleBundles} from './i18n/bundles'
import {ConventionsTool} from './ui/ConventionsTool'
import {fieldGuideActionFor} from './ui/FieldGuideAction'
import {HelpMenuButton} from './ui/HelpMenuButton'

/**
 * Add onboarding tours to a Studio.
 *
 * ```ts
 * import {defineConfig} from 'sanity'
 * import {onboardingTool, coreConcepts} from 'sanity-plugin-editor-onboarding'
 *
 * export default defineConfig({
 *   // ...
 *   plugins: [onboardingTool({tours: coreConcepts()})],
 * })
 * ```
 *
 * @public
 */
/**
 * The Studio major this plugin's `data-testid` selectors and docs links were
 * last walked against by hand. See the README.
 */
const VERIFIED_STUDIO_MAJOR = 6

/**
 * Tell the developer — never the editor — when the Studio is newer than
 * anything this plugin has been checked against.
 *
 * Nothing breaks when it is: a selector that stops matching skips its step and
 * warns. But the failure mode of a silently thinned-out tour is an editor being
 * shown less than you think, which is worth one line in a console.
 */
function warnOnUnverifiedStudio(): void {
  const major = Number.parseInt(SANITY_VERSION, 10)
  if (!Number.isFinite(major) || major <= VERIFIED_STUDIO_MAJOR) return

  console.warn(
    `[sanity-plugin-editor-onboarding] Verified against Sanity Studio ` +
      `${VERIFIED_STUDIO_MAJOR}.x; this Studio is ${SANITY_VERSION}. Steps whose targets have ` +
      `moved will skip themselves rather than break, so walk the built-in guides once to ` +
      `check they still point at the right things.`,
  )
}

export const onboardingTool = definePlugin<OnboardingConfig>((config) => {
  warnOnUnverifiedStudio()

  const tours = config?.tours ?? []
  const fieldGuides = config?.fieldGuides ?? []
  const showNavbarButton = config?.navbarButton !== false
  const syncProgress = config?.syncProgress === true
  const finder =
    config?.conventionFinder === true
      ? {}
      : config?.conventionFinder
        ? config.conventionFinder
        : undefined

  // Only touch Sanity's unstable field-action API when something would
  // actually appear there. A Studio that declares no field help never
  // registers against it at all.
  const hasFieldHelp =
    fieldGuides.length > 0 || tours.some((tour) => tour.steps.some((step) => step.field))

  const duplicateId = tours
    .map((tour) => tour.id)
    .find((id, index, ids) => ids.indexOf(id) !== index)

  if (duplicateId) {
    console.warn(
      `[sanity-plugin-editor-onboarding] Two tours share the id "${duplicateId}". Ids are used as ` +
        `the persistence key, so their completion state will be shared. Give each tour a ` +
        `unique id.`,
    )
  }

  return {
    name: 'sanity-plugin-editor-onboarding',

    // The convention finder is opt-in and role-gated: an editor's tool menu
    // is unchanged unless a developer asked for this and the user is one.
    // The title is a plain string because a tool's title is, in Sanity's
    // config API; only the people this is shown to ever read it.
    tools: finder
      ? (previous, context) =>
          canUseConventionFinder(context.currentUser, finder.roles)
            ? [
                ...previous,
                {
                  name: 'editor-onboarding-conventions',
                  title: 'Conventions',
                  component: ConventionsTool,
                  options: {language: finder.language},
                },
              ]
            : previous
      : undefined,

    // Registers this plugin's strings. A Studio can override any of them, or
    // add a language we don't ship, by passing a bundle with the same
    // namespace to `i18n.bundles` in sanity.config.ts.
    i18n: {bundles: onboardingLocaleBundles},

    document: hasFieldHelp
      ? {
          unstable_fieldActions: (previous, context) => [
            ...previous,
            fieldGuideActionFor(context.documentType),
          ],
        }
      : undefined,

    studio: {
      components: {
        // The provider wraps the whole Studio but renders none of its layout —
        // `renderDefault` is always called, so other plugins' layout
        // customisations still apply.
        layout: (props: LayoutProps) => (
          <OnboardingProvider fieldGuides={fieldGuides} syncProgress={syncProgress} tours={tours}>
            {props.renderDefault(props)}
          </OnboardingProvider>
        ),

        // Wrapping the navbar in our own layout squashes it (the default
        // navbar does not stretch to fill a flex parent), so the help button
        // goes through the navbar's own action slot instead. Existing actions
        // are preserved so this composes with other plugins.
        navbar: showNavbarButton
          ? (props: NavbarProps) =>
              props.renderDefault({
                ...props,
                __internal_actions: [
                  ...(props.__internal_actions ?? []),
                  {
                    name: 'sanity-plugin-editor-onboarding/guides',
                    location: 'topbar',
                    render: () => <HelpMenuButton />,
                  },
                ],
              })
          : undefined,
      },
    },
  }
})
