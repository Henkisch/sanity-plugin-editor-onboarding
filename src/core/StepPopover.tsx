import {Box, Button, Card, Flex, Portal, Stack, Text} from '@sanity/ui'
import {Popover} from '@sanity/ui/popover'
import {useCallback, useEffect, useId} from 'react'
import {useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {ONBOARDING_NAMESPACE} from '../i18n/index'
import {useLocalizedText} from '../i18n/useLocalizedText'
import {type LocalizedText} from '../i18n/useLocalizedText'
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
  /** The guide's source, from the tour. Rendered on its last step only. */
  sourceUrl?: LocalizedText
  /**
   * One step shown on its own, from a field's book icon.
   *
   * Drops the progress counter, the skip control and the permanent opt-out:
   * there is no sequence to be somewhere in, and someone who asked a question
   * about one field is not opting out of anything.
   */
  standalone?: boolean
  onNext: () => void
  onSkip: () => void
  onDismissForever: () => void
}

/**
 * `elevated` draws the surface an anchored step gets for free from `Popover`:
 * a border and a shadow. A centred step has no anchor and no arrow, so without
 * them it floats edgeless against a Studio of the same colour — which in a dark
 * theme means no visible edge at all.
 */
function StepBody(props: StepPopoverProps & {elevated: boolean}): React.JSX.Element {
  const {step, index, total, onNext, onSkip, onDismissForever, elevated, sourceUrl, standalone} =
    props
  const {t} = useTranslation(ONBOARDING_NAMESPACE)
  const localize = useLocalizedText()
  const titleId = useId()
  const contentId = useId()
  const isLast = index === total - 1

  const focusOnMount = useCallback((node: HTMLDivElement | null) => {
    // `preventScroll` because the target has already been scrolled into
    // view; letting focus scroll again fights that and jumps the page.
    node?.focus({preventScroll: true})
  }, [])

  const learnMoreUrl = localize(step.learnMoreUrl)
  const source = localize(sourceUrl)

  return (
    <Card
      // A dialog rather than a tooltip: it holds the focus and the controls for
      // getting out, and a screen reader needs to announce it as something that
      // has arrived rather than as decoration on whatever is behind it. Not
      // modal — the Studio underneath stays available on purpose.
      aria-describedby={contentId}
      aria-labelledby={titleId}
      aria-modal={false}
      border={elevated}
      padding={3}
      radius={3}
      // Focused on mount, so a keyboard user's next Tab lands on Next rather
      // than somewhere behind the popup, and a screen reader reads the step.
      ref={focusOnMount}
      // Not a native `<dialog>`: that element carries modal semantics and a
      // top-layer backdrop, which is the one thing this plugin promises never
      // to do. The role gives the announcement without the behaviour.
      // oxlint-disable-next-line prefer-tag-over-role
      role="dialog"
      shadow={elevated ? 3 : undefined}
      style={{width: POPOVER_WIDTH}}
      tabIndex={-1}
    >
      <Stack gap={3}>
        <Text id={titleId} size={1} weight="semibold">
          {localize(step.title)}
        </Text>

        <Text id={contentId} size={1} muted>
          {localize(step.content)}
        </Text>

        {learnMoreUrl && (
          <Text size={1}>
            <a href={learnMoreUrl} rel="noopener noreferrer" target="_blank">
              {t('action.learn-more')}
            </a>
          </Text>
        )}

        {/*
          Where the guide's content comes from. Shown once, at the end, rather
          than on every step: it is attribution and a way through to the full
          account, not a call to action. Suppressed when this step's own "learn
          more" already points at the same page — two links to one destination
          reads as a mistake.
        */}
        {isLast && source && source !== learnMoreUrl && (
          <Text muted size={0}>
            <a href={source} rel="noopener noreferrer" target="_blank">
              {t('action.source')}
            </a>
          </Text>
        )}

        <Flex align="center" gap={2} justify={standalone ? 'flex-end' : 'space-between'}>
          {!standalone && (
            <Text muted size={0}>
              {t('progress', {current: index + 1, total})}
            </Text>
          )}

          <Flex gap={2}>
            {!standalone && (
              <Button
                fontSize={1}
                mode="bleed"
                onClick={onSkip}
                padding={2}
                text={t('action.skip')}
                tone="default"
              />
            )}
            <Button
              fontSize={1}
              onClick={onNext}
              padding={2}
              text={standalone ? t('action.close') : isLast ? t('action.done') : t('action.next')}
              tone="primary"
            />
          </Flex>
        </Flex>

        {/*
          "Don't show again" is a different intent from "Skip" and must not be
          buried, but it also shouldn't compete with the primary action — so it
          appears once, on the first step only.
        */}
        {index === 0 && !standalone && (
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
  const {referenceElement, step, standalone, onNext, onSkip} = props

  // Escape leaves, the way it does everywhere else in a Studio. Bound to the
  // document rather than the popup so it still works when focus has moved on —
  // being unable to dismiss something is worse than dismissing it by accident.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      // A standalone step has nothing to skip: closing is the only exit.
      if (standalone) onNext()
      else onSkip()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [standalone, onNext, onSkip])

  if (!referenceElement) {
    return (
      <Portal>
        <CenteredRoot>
          <StepBody {...props} elevated />
        </CenteredRoot>
      </Portal>
    )
  }

  return (
    <Popover
      content={<StepBody {...props} elevated={false} />}
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
