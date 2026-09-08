import {defineLocaleResourceBundle} from 'sanity'

import enUS from './locales/en-US'
import {ONBOARDING_NAMESPACE} from './index'

/**
 * The locale bundles this plugin registers.
 *
 * English is included eagerly: it is the fallback for every other locale, so it
 * has to be there the moment a tour renders. Everything else is a lazy import,
 * which is the pattern Sanity recommends — a Studio running in one language
 * never downloads the others.
 *
 * Studios can add or override any locale by passing their own bundle with the
 * `onboarding` namespace to `i18n.bundles` in `sanity.config.ts`.
 */
export const onboardingLocaleBundles = [
  defineLocaleResourceBundle({
    locale: 'en-US',
    namespace: ONBOARDING_NAMESPACE,
    resources: enUS,
  }),
  defineLocaleResourceBundle({
    locale: 'sv-SE',
    namespace: ONBOARDING_NAMESPACE,
    resources: () => import('./locales/sv-SE'),
  }),
]
