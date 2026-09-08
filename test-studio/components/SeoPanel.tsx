import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'
import {useTranslation, type StringInputProps} from 'sanity'
import {OnboardingTarget, useOnboardingTarget} from 'sanity-plugin-editor-onboarding'

import {STUDIO_NAMESPACE, type StudioResourceKey} from '../i18n/bundle'

/**
 * Roughly where search engines truncate a title. Not a rule, and not worth
 * pretending to more precision than that — the point of the badge is to tell an
 * editor whether they are in the right neighbourhood.
 */
const SHORT_ENOUGH = 60
const LONG_ENOUGH = 30

function lengthVerdict(value: string | undefined): {
  key: StudioResourceKey
  tone: 'default' | 'caution' | 'positive'
} {
  const length = value?.trim().length ?? 0

  if (length === 0) return {key: 'seo.badge.empty', tone: 'default'}
  if (length < LONG_ENOUGH) return {key: 'seo.badge.short', tone: 'caution'}
  if (length > SHORT_ENOUGH) return {key: 'seo.badge.long', tone: 'caution'}
  return {key: 'seo.badge.good', tone: 'positive'}
}

/**
 * A component this Studio owns, standing in for the kind of custom UI a real
 * project builds. It exists to exercise both targeting routes against a running
 * Studio:
 *
 * - the outer card marks itself with `useOnboardingTarget`, the route for a
 *   component you can edit;
 * - the badge is marked from the outside with `<OnboardingTarget>`, the route
 *   for one you can't or don't want to.
 *
 * Neither is reachable by a `data-testid`, which is the whole point.
 *
 * The badge reports the field's actual length rather than a fixed word. A demo
 * that says "Good" over an empty field teaches an editor to ignore it, and
 * teaches anyone reading this code that a decorative badge is fine.
 */
export function SeoPanel(props: StringInputProps) {
  const panelRef = useOnboardingTarget('seo-panel')
  const {t} = useTranslation(STUDIO_NAMESPACE)
  const verdict = lengthVerdict(props.value)

  return (
    <Card ref={panelRef} border padding={3} radius={2} tone="primary">
      <Stack gap={3}>
        <Flex align="center" gap={2}>
          <Text size={1} weight="semibold">
            {t('seo.panel.heading')}
          </Text>
          <OnboardingTarget id="seo-score">
            <Badge tone={verdict.tone}>{t(verdict.key)}</Badge>
          </OnboardingTarget>
        </Flex>
        {props.renderDefault(props)}
      </Stack>
    </Card>
  )
}
