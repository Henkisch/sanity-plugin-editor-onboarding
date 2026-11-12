import {Box, Button, Card, Checkbox, Flex, Select, Stack, Text} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {useClient, useCurrentLocale, useSchema, useTranslation, type Tool} from 'sanity'

import {CONVENTION_SAMPLE_LIMIT, MIN_EVIDENCE, type Convention} from '../ai/conventions'
import {classifyError, findConventions, type ConventionError} from '../ai/findConventions'
import {renderConventionGuides} from '../ai/renderGuides'
import {serializeSchema} from '../ai/serializeSchema'
import {ONBOARDING_NAMESPACE} from '../i18n/index'

/** What the tool is showing. */
type View =
  | {kind: 'idle'}
  | {kind: 'running'}
  | {kind: 'too-few'; count: number}
  | {kind: 'error'; reason: ConventionError}
  | {kind: 'done'; total: number; conventions: Convention[]}

/** @internal */
export interface ConventionsToolOptions {
  language?: string
}

/**
 * The convention finder: one document type, one request, a list to pick from.
 *
 * Developer-facing by design. It is registered only for the roles the config
 * names, and its output is code to review rather than a write to the dataset,
 * so the only path from a model's suggestion to an editor's screen goes through
 * a commit.
 *
 * Uses the logged-in user's own client: the request carries their session and
 * draws on the project's AI credits, with no token in the bundle.
 *
 * @internal
 */
export function ConventionsTool({tool}: {tool: Tool<ConventionsToolOptions>}) {
  const {t} = useTranslation(ONBOARDING_NAMESPACE)
  const schema = useSchema()
  const client = useClient({apiVersion: '2024-01-01'})
  const locale = useCurrentLocale()
  const types = useMemo(() => serializeSchema(schema), [schema])

  const [typeName, setTypeName] = useState(types[0]?.name ?? '')
  const [view, setView] = useState<View>({kind: 'idle'})
  const [chosen, setChosen] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const selected = types.find((type) => type.name === typeName)
  const language = tool.options?.language ?? `${locale.title} (${locale.id})`

  async function run() {
    if (!selected) return
    setView({kind: 'running'})
    setChosen(new Set())
    setCopied(false)

    try {
      const result = await findConventions(client, selected, language)
      if (result.status === 'too-few') {
        setView({kind: 'too-few', count: result.documentCount})
        return
      }
      setView({kind: 'done', total: result.documentCount, conventions: result.kept})
    } catch (error) {
      console.error('[sanity-plugin-editor-onboarding] Convention finder failed:', error)
      setView({kind: 'error', reason: classifyError(error)})
    }
  }

  function toggle(field: string) {
    setCopied(false)
    setChosen((previous) => {
      const next = new Set(previous)
      if (next.has(field)) next.delete(field)
      else next.add(field)
      return next
    })
  }

  async function copy(conventions: Convention[]) {
    const code = renderConventionGuides(
      typeName,
      conventions.filter((convention) => chosen.has(convention.field)),
    )
    await navigator.clipboard.writeText(code)
    setCopied(true)
  }

  return (
    <Box padding={4} style={{height: '100%', overflow: 'auto'}}>
      <Stack gap={4} style={{maxWidth: 720}}>
        <Text as="h1" size={3} weight="semibold">
          {t('conventions.heading')}
        </Text>
        <Text muted size={1}>
          {t('conventions.intro')}
        </Text>

        <Flex align="flex-end" gap={3}>
          <Stack flex={1} gap={2}>
            <Text as="label" htmlFor="conventions-type" size={1} weight="medium">
              {t('conventions.type-label')}
            </Text>
            <Select
              id="conventions-type"
              value={typeName}
              onChange={(event) => setTypeName(event.currentTarget.value)}
            >
              {types.map((type) => (
                <option key={type.name} value={type.name}>
                  {type.title ?? type.name}
                </option>
              ))}
            </Select>
          </Stack>
          <Button
            disabled={!selected || view.kind === 'running'}
            loading={view.kind === 'running'}
            onClick={run}
            text={t('conventions.run')}
            tone="primary"
          />
        </Flex>
        <Text muted size={1}>
          {t('conventions.cost', {limit: CONVENTION_SAMPLE_LIMIT})}
        </Text>

        <Results chosen={chosen} copied={copied} onCopy={copy} onToggle={toggle} view={view} />
      </Stack>
    </Box>
  )
}

function Results(props: {
  view: View
  chosen: Set<string>
  copied: boolean
  onToggle: (field: string) => void
  onCopy: (conventions: Convention[]) => void
}) {
  const {t} = useTranslation(ONBOARDING_NAMESPACE)
  const {view, chosen, copied, onToggle, onCopy} = props

  if (view.kind === 'idle') return null
  if (view.kind === 'running') return <Text size={1}>{t('conventions.running')}</Text>
  if (view.kind === 'too-few') {
    return (
      <Card padding={3} radius={2} tone="caution">
        <Text size={1}>{t('conventions.too-few', {count: view.count, min: MIN_EVIDENCE})}</Text>
      </Card>
    )
  }
  if (view.kind === 'error') {
    return (
      <Card padding={3} radius={2} tone="critical">
        <Text size={1}>{t(`conventions.error.${view.reason}`)}</Text>
      </Card>
    )
  }
  if (view.conventions.length === 0) {
    return (
      <Card padding={3} radius={2} tone="transparent" border>
        <Text size={1}>{t('conventions.none')}</Text>
      </Card>
    )
  }

  return (
    <Stack gap={3}>
      <Text muted size={1}>
        {t('conventions.select-hint')}
      </Text>
      {view.conventions.map((convention) => (
        <Card border key={convention.field} padding={3} radius={2}>
          <Flex gap={3}>
            <Checkbox
              aria-label={convention.title}
              checked={chosen.has(convention.field)}
              onChange={() => onToggle(convention.field)}
            />
            <Stack flex={1} gap={2}>
              <Text size={1} weight="semibold">
                {convention.title}
              </Text>
              <Text size={1}>{convention.content}</Text>
              <Text muted size={0}>
                <code>{convention.field}</code>
              </Text>
              <Text muted size={0}>
                {t('conventions.evidence', {count: convention.seenIn, total: view.total})}
              </Text>
            </Stack>
          </Flex>
        </Card>
      ))}
      <Flex align="center" gap={3}>
        <Button
          disabled={chosen.size === 0}
          mode="ghost"
          onClick={() => onCopy(view.conventions)}
          text={t('conventions.copy')}
        />
        {copied && <Text size={1}>{t('conventions.copied')}</Text>}
      </Flex>
    </Stack>
  )
}
