import {Card, Stack, Text} from '@sanity/ui'
import {useTranslation, type ObjectInputProps} from 'sanity'
import {OnboardingTarget, useOnboardingTarget} from 'sanity-plugin-editor-onboarding'

import {STUDIO_NAMESPACE} from '../i18n/bundle'

/**
 * Groups the search fields under a heading and a line explaining what they are
 * for — the kind of small, ordinary customization a real Studio has.
 *
 * It exists here to exercise both targeting routes against a running Studio,
 * since neither is reachable by a `data-testid`:
 *
 * - the outer card marks itself with `useOnboardingTarget`, the route for a
 *   component you can edit;
 * - the hint is marked from the outside with `<OnboardingTarget>`, the route
 *   for one you can't or don't want to.
 *
 * It deliberately computes nothing. Length guidance lives in the schema's
 * validation rules, which Sanity already renders inline and translates — a
 * component that scored the title itself would be reimplementing a primitive,
 * and would be one more thing to keep correct.
 */
export function SeoPanel(props: ObjectInputProps) {
  const panelRef = useOnboardingTarget('seo-panel')
  const {t} = useTranslation(STUDIO_NAMESPACE)

  return (
    <Card ref={panelRef} border padding={3} radius={2}>
      <Stack gap={3}>
        <Stack gap={2}>
          <Text size={1} weight="semibold">
            {t('seo.panel.heading')}
          </Text>
          <OnboardingTarget id="seo-hint">
            <Text muted size={1}>
              {t('seo.panel.hint')}
            </Text>
          </OnboardingTarget>
        </Stack>
        {props.renderDefault(props)}
      </Stack>
    </Card>
  )
}
