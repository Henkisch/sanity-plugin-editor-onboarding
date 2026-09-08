import {definePlugin, type LayoutProps, type NavbarProps} from 'sanity'

import {OnboardingProvider} from './core/OnboardingProvider'
import {onboardingLocaleBundles} from './i18n/bundles'
import {type OnboardingConfig} from './core/types'
import {HelpMenuButton} from './ui/HelpMenuButton'

/**
 * Add onboarding tours to a Studio.
 *
 * ```ts
 * import {defineConfig} from 'sanity'
 * import {onboardingTool, coreConcepts} from 'sanity-plugin-onboarding'
 *
 * export default defineConfig({
 *   // ...
 *   plugins: [onboardingTool({tours: coreConcepts()})],
 * })
 * ```
 *
 * @public
 */
export const onboardingTool = definePlugin<OnboardingConfig>((config) => {
  const tours = config?.tours ?? []
  const showNavbarButton = config?.navbarButton !== false

  const duplicateId = tours
    .map((tour) => tour.id)
    .find((id, index, ids) => ids.indexOf(id) !== index)

  if (duplicateId) {
    console.warn(
      `[sanity-plugin-onboarding] Two tours share the id "${duplicateId}". Ids are used as ` +
        `the persistence key, so their completion state will be shared. Give each tour a ` +
        `unique id.`,
    )
  }

  return {
    name: 'sanity-plugin-onboarding',

    // Registers this plugin's strings. A Studio can override any of them, or
    // add a language we don't ship, by passing a bundle with the same
    // namespace to `i18n.bundles` in sanity.config.ts.
    i18n: {bundles: onboardingLocaleBundles},

    studio: {
      components: {
        // The provider wraps the whole Studio but renders none of its layout —
        // `renderDefault` is always called, so other plugins' layout
        // customisations still apply.
        layout: (props: LayoutProps) => (
          <OnboardingProvider tours={tours}>{props.renderDefault(props)}</OnboardingProvider>
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
                    name: 'sanity-plugin-onboarding/guides',
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
