import {Box, Button, Card, Flex, Portal, Stack, Text} from '@sanity/ui'
import {Popover} from '@sanity/ui/popover'
import {useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {ONBOARDING_NAMESPACE} from '../i18n/index'
import {useLocalizedText} from '../i18n/useLocalizedText'
import {type OnboardingStep} from './types'

/** Narrow enough to stay a tooltip rather than a panel. */
const POPOVER_WIDTH = 280

const CenteredRoot = styled.div`
  position: fixed;
  z-index: 200001;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`

export interface StepPopoverProps {
  step: OnboardingStep
  /** 0-based index of this step among the steps that actually resolved. */
  index: number
  total: number
  referenceElement: HTMLElement | null
  onNext: () => void
  onSkip: () => void
  onDismissForever: () => void
}

function StepBody(props: StepPopoverProps): React.JSX.Element {
  const {step, index, total, onNext, onSkip, onDismissForever} = props
  const {t} = useTranslation(ONBOARDING_NAMESPACE)
  const localize = useLocalizedText()
  const isLast = index === total - 1

  return (
    <Card padding={3} radius={3} style={{width: POPOVER_WIDTH}}>
      <Stack gap={3}>
        <Text size={1} weight="semibold">
          {localize(step.title)}
        </Text>

        <Text size={1} muted>
          {localize(step.content)}
        </Text>

        {step.learnMoreUrl && (
          <Text size={1}>
            <a href={step.learnMoreUrl} rel="noopener noreferrer" target="_blank">
              {t('action.learn-more')}
            </a>
          </Text>
        )}

        <Flex align="center" gap={2} justify="space-between">
          <Text muted size={0}>
            {t('progress', {current: index + 1, total})}
          </Text>

          <Flex gap={2}>
            <Button
              fontSize={1}
              mode="bleed"
              onClick={onSkip}
              padding={2}
              text={t('action.skip')}
              tone="default"
            />
            <Button
              fontSize={1}
              onClick={onNext}
              padding={2}
              text={isLast ? t('action.done') : t('action.next')}
              tone="primary"
            />
          </Flex>
        </Flex>

        {/*
          "Don't show again" is a different intent from "Skip" and must not be
          buried, but it also shouldn't compete with the primary action — so it
          appears once, on the first step only.
        */}
        {index === 0 && (
          <Box>
            <Button
              fontSize={0}
              mode="bleed"
              onClick={onDismissForever}
              padding={1}
              text={t('action.dont-show-again')}
              tone="default"
            />
          </Box>
        )}
      </Stack>
    </Card>
  )
}

/**
 * The step popup itself.
 *
 * When anchored, this is a Sanity UI `Popover`, so it inherits the Studio's
 * theme, elevation and positioning behaviour rather than approximating them.
 * When a step has no target, it is centred instead.
 */
export function StepPopover(props: StepPopoverProps): React.JSX.Element {
  const {referenceElement, step} = props

  if (!referenceElement) {
    return (
      <Portal>
        <CenteredRoot>
          <StepBody {...props} />
        </CenteredRoot>
      </Portal>
    )
  }

  return (
    <Popover
      content={<StepBody {...props} />}
      fallbackPlacements={['top', 'right', 'left', 'bottom']}
      open
      placement={step.placement ?? 'bottom'}
      portal
      preventOverflow
      referenceElement={referenceElement}
      // Above the Studio's own layers, so the popup is never clipped by a pane.
      zOffset={200001}
    />
  )
}
