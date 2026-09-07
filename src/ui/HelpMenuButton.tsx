import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {EyeClosedIcon} from '@sanity/icons/EyeClosed'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {Box, Button, Text} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'

import {useOnboarding} from '../core/OnboardingProvider'
import {type TourStatus} from '../core/types'

/**
 * A quiet marker for tours the user has finished or hidden, so the menu shows
 * what is left to read without labelling anything as unfinished homework.
 */
function statusIcon(status: TourStatus | null): typeof CheckmarkIcon | undefined {
  if (status === 'completed') return CheckmarkIcon
  if (status === 'dismissed') return EyeClosedIcon
  return undefined
}

/**
 * The way back into a tour.
 *
 * A tour a user dismissed once and can never reach again is worse than no tour,
 * so this ships enabled by default and needs no setup from the developer. It
 * calls `renderDefault` in the navbar override, so it composes with other
 * plugins' navbar customisations.
 */
export function HelpMenuButton(): React.JSX.Element | null {
  const {tours, startTour, statuses} = useOnboarding()

  if (tours.length === 0) return null

  return (
    <MenuButton
      button={
        <Button
          aria-label="Guides"
          icon={HelpCircleIcon}
          mode="bleed"
          title="Guides"
          tone="default"
        />
      }
      id="onboarding-help-menu"
      menu={
        <Menu>
          <Box padding={3} paddingBottom={2}>
            <Text muted size={1} weight="medium">
              Guides
            </Text>
          </Box>
          <MenuDivider />
          {tours.map((tour) => (
            <MenuItem
              key={tour.id}
              iconRight={statusIcon(statuses[tour.id] ?? null)}
              onClick={() => startTour(tour.id)}
              text={tour.title}
            />
          ))}
        </Menu>
      }
      popover={{placement: 'bottom-end', portal: true}}
    />
  )
}
