import {useCallback} from 'react'
import {useTranslation} from 'sanity'

import {ONBOARDING_NAMESPACE} from './index'

/**
 * A piece of user-facing text in a tour.
 *
 * Pass a plain string for the common case. Pass `{key, ns}` to pull the string
 * from a locale bundle instead, so the same tour reads in whatever language the
 * editor has their Studio set to.
 *
 * ```ts
 * title: 'Your articles live here'
 * // or
 * title: {key: 'tour.posts.title', ns: 'my-studio'}
 * ```
 *
 * @public
 */
export type LocalizedText = string | {key: string; ns?: string}

/**
 * Returns a function that turns {@link LocalizedText} into a displayable string.
 *
 * Plain strings pass through untouched, so a developer who never wants to think
 * about locales never has to.
 *
 * @internal
 */
export function useLocalizedText(): (text: LocalizedText | undefined) => string {
  const {t} = useTranslation(ONBOARDING_NAMESPACE)

  return useCallback(
    (text: LocalizedText | undefined): string => {
      if (text === undefined) return ''
      if (typeof text === 'string') return text
      // `ns` defaults to this plugin's namespace, which is what the built-in
      // core-concept tours use. Developers localizing their own tours point it
      // at a namespace of their own.
      return t(text.key, {ns: text.ns ?? ONBOARDING_NAMESPACE})
    },
    [t],
  )
}
