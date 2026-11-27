import {BookIcon} from '@sanity/icons/Book'
import {ResetIcon} from '@sanity/icons/Reset'
import {RestoreIcon} from '@sanity/icons/Restore'
import {Box, Button, Flex, Text} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {useCallback} from 'react'
import {useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {useOnboarding} from '../core/OnboardingProvider'
import {type TourStatus} from '../core/types'
import {ONBOARDING_NAMESPACE} from '../i18n/index'
import {useLocalizedText} from '../i18n/useLocalizedText'
import {TOUR_STATUS_DISPLAY} from './tourStatus'
import {useStartGuide} from './useStartGuide'

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
 * The way back into a tour.
 *
 * A tour a user dismissed once and can never reach again is worse than no tour,
 * so this ships enabled by default and needs no setup from the developer. It
 * calls `renderDefault` in the navbar override, so it composes with other
 * plugins' navbar customisations.
 */
export function HelpMenuButton(): React.JSX.Element | null {
  const {tours, statuses, showMenuHint, markMenuOpened, resetAll, resetTour} = useOnboarding()
  const {start, starting} = useStartGuide()
  const {t} = useTranslation(ONBOARDING_NAMESPACE)
  const localize = useLocalizedText()

  const handleOpen = useCallback(() => {
    // Opening it once is the whole point of the dot, so retire it immediately.
    if (showMenuHint) markMenuOpened()
  }, [showMenuHint, markMenuOpened])

  const hasProgress = tours.some((tour) => statuses[tour.id])

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
          // The menu closes on click, so the button is the only place left to show
          // that a guide is opening a document.
          loading={starting !== null}
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
            <TourMenuItem
              icon={tour.icon ?? BookIcon}
              key={tour.id}
              onReset={() => resetTour(tour.id)}
              onStart={() => start(tour)}
              resetLabel={t('menu.reset-one')}
              status={statusIconFor(statuses[tour.id])}
              title={localize(tour.title)}
            />
          ))}
          {/*
            Only offered once there is something to undo. A menu that opens with
            "Start over" above a list nobody has read yet is offering to undo
            nothing.
          */}
          {hasProgress && (
            <>
              <MenuDivider />
              <MenuItem
                icon={RestoreIcon}
                onClick={resetAll}
                text={t('menu.show-all-again')}
                tone="default"
              />
            </>
          )}
        </Menu>
      }
      onOpen={handleOpen}
      popover={{placement: 'bottom-end', portal: true}}
    />
  )
}

/**
 * One guide in the menu, with a way to forget it beside the status marker.
 *
 * The reset is a separate button next to the menu item rather than inside it:
 * a button within a button is invalid, and a click on it would also start the
 * guide. Only shown once there is something to reset.
 */
function TourMenuItem(props: {
  icon: React.ElementType
  title: string
  status: React.ElementType | undefined
  resetLabel: string
  onStart: () => void
  onReset: () => void
}) {
  return (
    <Flex align="center" gap={1}>
      <Box flex={1}>
        <MenuItem
          icon={props.icon}
          iconRight={props.status}
          onClick={props.onStart}
          text={props.title}
        />
      </Box>
      {props.status && (
        <Button
          aria-label={props.resetLabel}
          icon={ResetIcon}
          mode="bleed"
          onClick={props.onReset}
          padding={2}
          title={props.resetLabel}
        />
      )}
    </Flex>
  )
}

/** A quiet marker for a finished or hidden guide, so the menu shows what is left to read. */
function statusIconFor(status: TourStatus | null | undefined): React.ElementType | undefined {
  return status ? TOUR_STATUS_DISPLAY[status]?.icon : undefined
}
