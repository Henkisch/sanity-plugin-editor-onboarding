import {Button, Card, Flex, Portal, Stack, Text} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {ONBOARDING_NAMESPACE} from '../i18n/index'
import {useLocalizedText} from '../i18n/useLocalizedText'
import {type OnboardingTour} from './types'

const Root = styled.div`
  position: fixed;
  z-index: 200001;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
`

/**
 * Shown when a tour was started but every step's target was absent.
 *
 * Silently doing nothing would read as a broken button, so this explains why —
 * quietly, at the bottom of the screen, in the same register as a Studio toast.
 */
export function UnavailableNotice(props: {
  tour: OnboardingTour
  onClose: () => void
}): React.JSX.Element {
  const {tour, onClose} = props
  const {t} = useTranslation(ONBOARDING_NAMESPACE)
  const localize = useLocalizedText()

  return (
    <Portal>
      <Root>
        <Card padding={3} radius={3} shadow={2}>
          <Stack gap={3}>
            <Text size={1} weight="semibold">
              {localize(tour.title)}
            </Text>
            <Text muted size={1}>
              {tour.unavailableMessage
                ? localize(tour.unavailableMessage)
                : t('menu.unavailable')}
            </Text>
            <Flex justify="flex-end">
              <Button fontSize={1} mode="bleed" onClick={onClose} padding={2} text={t('action.close')} />
            </Flex>
          </Stack>
        </Card>
      </Root>
    </Portal>
  )
}
