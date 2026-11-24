import {BookIcon} from '@sanity/icons/Book'
import {ResetIcon} from '@sanity/icons/Reset'
import {Badge, Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useSchema, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {useOnboardingOptional} from '../core/OnboardingProvider'
import {ONBOARDING_NAMESPACE} from '../i18n/index'
import {useLocalizedText} from '../i18n/useLocalizedText'
import {Collapsible} from './Collapsible'
import {autoStartKey, fieldGuideRows, groupFieldGuides} from './overview'
import {type ToolSettings} from './toolSettings'
import {TOUR_STATUS_DISPLAY} from './tourStatus'
import {useStartGuide} from './useStartGuide'

/**
 * The read-only parts of the Onboarding tool: what is registered and what is
 * switched on.
 *
 * Read-only on purpose. Every setting here is decided when the Studio starts,
 * before anyone signs in or any dataset is read, so the only honest thing a
 * tool can do with them is show them — with the config key to change each one.
 *
 * Kept compact: these are reference lists beside the one thing on the page a
 * developer acts on, so anything that is true of nearly every row is left out
 * and only the exceptions are shown.
 *
 * @internal
 */
/**
 * A heading, a one-line intro and its content.
 *
 * Every section uses the same sizes, so sections side by side start their
 * boxes on the same line; which one matters most is said by its width.
 */
export function Section(props: {heading: string; intro?: string; children: React.ReactNode}) {
  return (
    <Stack gap={3}>
      <Text as="h2" size={2} weight="semibold">
        {props.heading}
      </Text>
      {props.intro && (
        <Text muted size={1}>
          {props.intro}
        </Text>
      )}
      {props.children}
    </Stack>
  )
}

export function Guides() {
  const {t} = useTranslation(ONBOARDING_NAMESPACE)
  const localize = useLocalizedText()
  const onboarding = useOnboardingOptional()
  const {start, starting} = useStartGuide()
  const tours = onboarding?.tours ?? []

  if (tours.length === 0) return <Empty text={t('tool.guides.empty')} />

  return (
    <ListCard>
      {tours.map((tour) => {
        const Icon = tour.icon ?? BookIcon
        const status = onboarding?.statuses[tour.id]
        const display = status ? TOUR_STATUS_DISPLAY[status] : undefined
        // Starting from the menu is what nearly every guide does, so only
        // the exceptions are worth a line.
        const startsItself = tour.autoStart !== undefined && tour.autoStart !== 'manual'

        return (
          <ListRow key={tour.id}>
            <Flex align="center" gap={3}>
              <Text muted size={1}>
                <Icon />
              </Text>
              <Stack flex={1} gap={2}>
                <Text size={1} weight="medium">
                  {localize(tour.title)}
                </Text>
                <Flex gap={3} wrap="wrap">
                  <Text muted size={0}>
                    <code>{tour.id}</code>
                  </Text>
                  {startsItself && (
                    <Text muted size={0}>
                      {t(autoStartKey(tour.autoStart))}
                    </Text>
                  )}
                </Flex>
              </Stack>
              {display && (
                <Badge fontSize={0} tone={display.tone}>
                  {t(display.labelKey)}
                </Badge>
              )}
              {display && (
                // An icon, as in the editors' menu: the badge beside it already
                // says what would be reset.
                <Button
                  aria-label={t('tool.guides.reset')}
                  icon={ResetIcon}
                  mode="bleed"
                  onClick={() => onboarding?.resetTour(tour.id)}
                  padding={2}
                  title={t('tool.guides.reset-hint')}
                />
              )}
              <Button
                disabled={starting !== null}
                fontSize={1}
                loading={starting === tour.id}
                mode="ghost"
                onClick={() => start(tour)}
                padding={2}
                text={t('tool.guides.start')}
              />
            </Flex>
          </ListRow>
        )
      })}
    </ListCard>
  )
}

export function FieldGuides({settings}: {settings: ToolSettings}) {
  const {t} = useTranslation(ONBOARDING_NAMESPACE)
  const localize = useLocalizedText()
  const onboarding = useOnboardingOptional()
  const rows = useMemo(
    () => fieldGuideRows(onboarding?.tours ?? [], settings.fieldGuides),
    [onboarding?.tours, settings.fieldGuides],
  )

  const groups = useMemo(() => groupFieldGuides(rows), [rows])
  const schema = useSchema()

  if (rows.length === 0) return <Empty text={t('tool.fields.empty')} />

  // Closed by default: the list is reference, and a Studio with dozens of
  // guides would otherwise push everything else off the page.
  return (
    <Stack gap={3}>
      <Text as="h3" size={1} weight="semibold">
        {t('tool.fields.existing')}
      </Text>
      <ListCard>
        {groups.map((group) => {
          const typeTitle = group.documentType
            ? (schema.get(group.documentType)?.title ?? group.documentType)
            : t('tool.fields.all-types')

          return (
            <ListRowCard key={group.documentType ?? '*'}>
              <Collapsible label={`${typeTitle} (${group.rows.length})`} padding={3}>
                <Stack>
                  {group.rows.map((row) => (
                    <Card borderTop key={row.id} padding={3}>
                      <Stack gap={2}>
                        <Text size={1}>{localize(row.title)}</Text>
                        <Flex gap={3} wrap="wrap">
                          <Text muted size={0}>
                            <code>{row.field}</code>
                          </Text>
                          {row.tourTitle && (
                            <Text muted size={0}>
                              {t('tool.fields.from-tour', {tour: localize(row.tourTitle)})}
                            </Text>
                          )}
                        </Flex>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              </Collapsible>
            </ListRowCard>
          )
        })}
      </ListCard>
    </Stack>
  )
}

export function Settings({settings}: {settings: ToolSettings}) {
  const {t} = useTranslation(ONBOARDING_NAMESPACE)

  // A switch reads as a badge, so on and off are told apart at a glance; the
  // one setting that is a list stays text.
  const rows: Array<{label: string; configKey: string; value: boolean | string}> = [
    {label: t('tool.settings.sync'), configKey: 'syncProgress', value: settings.syncProgress},
    {label: t('tool.settings.navbar'), configKey: 'navbarButton', value: settings.navbarButton},
    {
      label: t('tool.settings.convention-finder'),
      configKey: 'conventionFinder',
      value: !!settings.conventionFinder,
    },
    {label: t('tool.settings.roles'), configKey: 'tool.roles', value: settings.roles.join(', ')},
  ]

  return (
    <ListCard>
      {rows.map((row) => (
        <ListRow key={row.configKey}>
          <Flex align="center" gap={3}>
            <Stack flex={1} gap={2}>
              <Text size={1}>{row.label}</Text>
              <Text muted size={0}>
                <code>{row.configKey}</code>
              </Text>
            </Stack>
            {typeof row.value === 'boolean' ? (
              <Badge fontSize={0} tone={row.value ? 'positive' : 'default'}>
                {row.value ? t('tool.settings.on') : t('tool.settings.off')}
              </Badge>
            ) : (
              <Text muted size={1}>
                {row.value}
              </Text>
            )}
          </Flex>
        </ListRow>
      ))}
    </ListCard>
  )
}

/**
 * A bordered list with a rule between rows, for the guides and the settings.
 *
 * The rule is drawn on every row but the first by CSS rather than by index, so
 * a row needs no idea of where it sits.
 */
function ListCard({children}: {children: React.ReactNode}) {
  return (
    <Card border radius={2} style={{overflow: 'hidden'}}>
      <Stack>{children}</Stack>
    </Card>
  )
}

/** One row; every list on the page shares this padding, so their left edges line up. */
function ListRow({children}: {children: React.ReactNode}) {
  return <ListRowCard padding={3}>{children}</ListRowCard>
}

const ListRowCard = styled(Card)`
  & + & {
    border-top: 1px solid var(--card-border-color);
  }
`

function Empty({text}: {text: string}) {
  return (
    <Card border padding={3} radius={2} tone="transparent">
      <Box>
        <Text muted size={1}>
          {text}
        </Text>
      </Box>
    </Card>
  )
}
