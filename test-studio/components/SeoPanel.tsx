import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'
import {type StringInputProps} from 'sanity'
import {OnboardingTarget, useOnboardingTarget} from 'sanity-plugin-editor-onboarding'

/**
 * A component this Studio owns, standing in for the kind of custom UI a real
 * project builds. It exists to exercise both Phase 2 targeting routes against a
 * running Studio:
 *
 * - the outer card marks itself with `useOnboardingTarget`, the route for a
 *   component you can edit;
 * - the badge is marked from the outside with `<OnboardingTarget>`, the route
 *   for one you can't or don't want to.
 *
 * Neither is reachable by a `data-testid`, which is the whole point.
 */
export function SeoPanel(props: StringInputProps) {
  const panelRef = useOnboardingTarget('seo-panel')

  return (
    <Card ref={panelRef} border padding={3} radius={2} tone="primary">
      <Stack gap={3}>
        <Flex align="center" gap={2}>
          <Text size={1} weight="semibold">
            Search appearance
          </Text>
          <OnboardingTarget id="seo-score">
            <Badge tone="positive">Good</Badge>
          </OnboardingTarget>
        </Flex>
        {props.renderDefault(props)}
      </Stack>
    </Card>
  )
}
