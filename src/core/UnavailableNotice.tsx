import {Button, Card, Flex, Portal, Stack, Text} from '@sanity/ui'
import {styled} from 'styled-components'

import {type OnboardingTour} from './types'

const Root = styled.div`
  position: fixed;
  z-index: 200001;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
`

const DEFAULT_MESSAGE =
  'This guide points at parts of the Studio that aren’t open right now. Open a document and try again.'

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

  return (
    <Portal>
      <Root>
        <Card padding={3} radius={3} shadow={2}>
          <Stack gap={3}>
            <Text size={1} weight="semibold">
              {tour.title}
            </Text>
            <Text muted size={1}>
              {tour.unavailableMessage ?? DEFAULT_MESSAGE}
            </Text>
            <Flex justify="flex-end">
              <Button fontSize={1} mode="bleed" onClick={onClose} padding={2} text="Close" />
            </Flex>
          </Stack>
        </Card>
      </Root>
    </Portal>
  )
}
