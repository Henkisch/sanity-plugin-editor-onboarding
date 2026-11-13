import {Box, Card, Grid, Stack, Text} from '@sanity/ui'
import {useTranslation, type Tool} from 'sanity'

import {ONBOARDING_NAMESPACE} from '../i18n/index'
import {ConventionsPanel} from './ConventionsPanel'
import {FieldGuides, Guides, Section, Settings} from './overviewSections'
import {type ToolSettings} from './toolSettings'

/**
 * The Onboarding tool: a developer's view of this plugin, on one page.
 *
 * Field guides get the wide column: first the way to find more, since that
 * is what a developer comes here to do, then the ones that already exist —
 * a list that can run long, so it goes below rather than pushing the action
 * off screen. That is the only
 * action on the page that costs anything, so it holds the only primary
 * button. Registered guides and settings sit to the side as reference;
 * settings last, since they are changed in code and only ever looked up.
 *
 * On a narrow window the columns stack in the same order.
 *
 * @internal
 */
export function OnboardingTool({tool}: {tool: Tool<ToolSettings>}) {
  const {t} = useTranslation(ONBOARDING_NAMESPACE)
  const settings = tool.options
  if (!settings) return null

  return (
    <Box padding={[3, 4, 5]} style={{height: '100%', overflow: 'auto'}}>
      <Stack gap={5} style={{maxWidth: 1400, margin: '0 auto'}}>
        <Text as="h1" size={4} weight="semibold">
          {t('tool.heading')}
        </Text>

        {/* A grid rather than flex: stacked flex children with a grow factor
            stretch to fill the column's height on a narrow screen. */}
        <Grid gap={[5, 5, 5, 6]} gridTemplateColumns={[1, 1, 1, 5]}>
          <Box gridColumn={[1, 1, 1, 3]}>
            <Section
              heading={t('tool.fields.heading')}
              intro={t('tool.fields.intro')}
              size="primary"
            >
              <Stack gap={4}>
                {settings.finder && (
                  <Card border padding={[3, 3, 4]} radius={2}>
                    <Stack gap={4}>
                      <Text as="h3" size={2} weight="semibold">
                        {t('conventions.heading')}
                      </Text>
                      <ConventionsPanel language={settings.finder.language} />
                    </Stack>
                  </Card>
                )}
                <FieldGuides settings={settings} />
              </Stack>
            </Section>
          </Box>
          <Box gridColumn={[1, 1, 1, 2]}>
            <Stack gap={5}>
              <Section heading={t('tool.guides.heading')}>
                <Guides />
              </Section>
              <Section heading={t('tool.settings.heading')} intro={t('tool.settings.intro')}>
                <Settings settings={settings} />
              </Section>
            </Stack>
          </Box>
        </Grid>
      </Stack>
    </Box>
  )
}
