import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {EyeClosedIcon} from '@sanity/icons/EyeClosed'
import {BookIcon} from '@sanity/icons/Book'
import {Box, Button, Text} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {useCallback} from 'react'
import {useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {ONBOARDING_NAMESPACE} from '../i18n/index'
import {useLocalizedText} from '../i18n/useLocalizedText'
import {useOnboarding} from '../core/OnboardingProvider'
import {type TourStatus} from '../core/types'

/**
 * A 4px dot in the button's top-right corner.
 *
 * Deliberately a copy of what Sanity's own `StatusButton` draws rather than a
 * use of it: that component is marked `@hidden @beta`, and a plugin whose whole
 * promise is "never break the Studio" should not hang its navbar button on an
 * unstable internal. The markup below is a handful of lines of stable
 * `@sanity/ui` and matches the native treatment.
 */
const DottedButton = styled(Button)<{$hint: boolean}>`
  position: relative;

  &::after {
    display: ${(props) => (props.$hint ? 'block' : 'none')};
    content: '';
    position: absolute;
    top: 6px;
    right: 6px;
    width: 4px;
    height: 4px;
    border-radius: 3px;
    background-color: var(--card-badge-primary-dot-color, currentColor);
    box-shadow: 0 0 0 1px var(--card-bg-color);
  }
`

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
  const {tours, startTour, statuses, showMenuHint, markMenuOpened} = useOnboarding()
  const {t} = useTranslation(ONBOARDING_NAMESPACE)
  const localize = useLocalizedText()

  const handleOpen = useCallback(() => {
    // Opening it once is the whole point of the dot, so retire it immediately.
    if (showMenuHint) markMenuOpened()
  }, [showMenuHint, markMenuOpened])

  if (tours.length === 0) return null

  return (
    <MenuButton
      button={
        <DottedButton
          aria-label={t('menu.button-label')}
          // Not HelpCircleIcon: Sanity's own Resources button in this same
          // navbar uses it, and two near-identical "?" circles side by side is
          // a coin flip for the user. A book reads as "guides" and has a
          // distinct silhouette against the row of circular icons.
          $hint={showMenuHint}
          data-testid="onboarding-guides-button"
          icon={BookIcon}
          mode="bleed"
          title={t('menu.button-label')}
          tone="default"
        />
      }
      id="onboarding-help-menu"
      menu={
        <Menu>
          <Box padding={3} paddingBottom={2}>
            <Text muted size={1} weight="medium">
              {t('menu.title')}
            </Text>
          </Box>
          <MenuDivider />
          {tours.map((tour) => (
            <MenuItem
              key={tour.id}
              iconRight={statusIcon(statuses[tour.id] ?? null)}
              onClick={() => startTour(tour.id)}
              text={localize(tour.title)}
            />
          ))}
        </Menu>
      }
      onOpen={handleOpen}
      popover={{placement: 'bottom-end', portal: true}}
    />
  )
}
