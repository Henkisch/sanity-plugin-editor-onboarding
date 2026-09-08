import {BookIcon} from '@sanity/icons/Book'
import {useCallback, useMemo} from 'react'
import {defineDocumentFieldAction, useTranslation, type DocumentFieldAction} from 'sanity'

import {ONBOARDING_NAMESPACE} from '../i18n/index'
import {pathToFieldName} from '../core/fieldHelp'
import {useOnboardingOptional} from '../core/OnboardingProvider'

/**
 * One action per document type, kept so repeated resolver calls hand Sanity the
 * same object.
 *
 * The resolver runs per render, and a new action identity on each call is a
 * re-render loop that takes the structure tool down with it. Keyed by document
 * type because that is the only thing baked into the action, and there are as
 * many entries as a Studio has types.
 */
const actions = new Map<string, DocumentFieldAction>()

/**
 * A book icon on any field that has help, beside the comment button.
 *
 * This is the one affordance in the plugin that reaches an editor at the moment
 * they are actually confused, rather than asking them to remember a guide
 * exists and go looking for it.
 *
 * It uses Sanity's `unstable_fieldActions`, which is the only way into that row
 * — there is no stable alternative short of replacing the whole field
 * component. The risk is contained: the plugin registers this only when
 * something declares field help, and if the API changes the icons disappear
 * while every tour keeps working.
 *
 * The document type is closed over rather than read inside the hook. Sanity's
 * per-field `documentType` is, despite the name, the type of the field itself —
 * `'datetime'` for a `publishedAt` — and `useFormValue` throws here, since field
 * actions render outside the form's value provider. The resolver context is the
 * one place the real document type is available.
 *
 * @internal
 */
export function fieldGuideActionFor(documentType: string): DocumentFieldAction {
  const existing = actions.get(documentType)
  if (existing) return existing

  const action = defineDocumentFieldAction({
    name: 'sanity-plugin-editor-onboarding/field-guide',
    useAction({path}) {
      // Never `useOnboarding()`: this renders inside Sanity's own field
      // machinery, where a throw crashes the structure tool rather than just
      // this icon. No provider simply means no help to offer.
      const onboarding = useOnboardingOptional()
      const {t} = useTranslation(ONBOARDING_NAMESPACE)
      // Depended on as a string, so a translator function with an unstable
      // identity cannot destabilise the memo below.
      const title = t('field.help')

      const help = onboarding?.fieldHelpFor(pathToFieldName(path), documentType)

      const onAction = useCallback(() => {
        if (help) onboarding?.showFieldHelp(help)
      }, [help, onboarding])

      // Sanity re-renders the field when this object's identity changes, so
      // returning a fresh one each render is an infinite loop.
      return useMemo(
        () => ({
          type: 'action' as const,
          icon: BookIcon,
          // Beside the comment button rather than inside the overflow menu.
          // Help an editor has to go hunting for is help they will not find.
          renderAsButton: true,
          // Every other field renders nothing at all, so this costs the fields
          // with no guide one hidden node each.
          hidden: !help,
          onAction,
          title,
        }),
        [help, onAction, title],
      )
    },
  })

  actions.set(documentType, action)
  return action
}
