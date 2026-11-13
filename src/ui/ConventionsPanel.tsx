import {Badge, Box, Button, Card, Checkbox, Flex, Select, Spinner, Stack, Text} from '@sanity/ui'
import {useEffect, useMemo, useState} from 'react'
import {useClient, useCurrentLocale, useSchema, useTranslation} from 'sanity'

import {CONVENTION_SAMPLE_LIMIT, MIN_EVIDENCE, type Convention} from '../ai/conventions'
import {classifyError, findConventions, type ConventionError} from '../ai/findConventions'
import {renderConventionGuides} from '../ai/renderGuides'
import {countQuery, readCounts} from '../ai/sampleContent'
import {serializeSchema, type SerializedDocumentType} from '../ai/serializeSchema'
import {ONBOARDING_NAMESPACE} from '../i18n/index'
import {Collapsible} from './Collapsible'

/** What the panel is showing. */
type View =
  | {kind: 'idle'}
  | {kind: 'running'}
  | {kind: 'too-few'; count: number}
  | {kind: 'error'; reason: ConventionError}
  | {kind: 'done'; type: SerializedDocumentType; total: number; rules: Convention[]}

/**
 * At or above this share of documents, a rule is shown as well established.
 * Below it the rule may still be real, but the badge stays neutral so the
 * reviewer weighs it rather than trusting it.
 */
const STRONG_EVIDENCE = 0.75

/**
 * "Suggest field guides": one document type, one request, a list to pick from.
 *
 * Called conventions in the code and the config, where developers read it.
 * The screen names the result instead — field guides — because that is what
 * a developer is here to get, and what editors end up seeing.
 *
 * Developer-facing by design. Its output is code to review rather than a write
 * to the dataset, so the only path from a model's suggestion to an editor's
 * screen goes through a commit.
 *
 * Uses the logged-in user's own client: the request carries their session and
 * draws on the project's AI credits, with no token in the bundle.
 *
 * @internal
 */
export function ConventionsPanel(props: {language?: string}) {
  const {t} = useTranslation(ONBOARDING_NAMESPACE)
  const schema = useSchema()
  const client = useClient({apiVersion: '2024-01-01'})
  const locale = useCurrentLocale()
  const types = useMemo(() => serializeSchema(schema), [schema])

  const [typeName, setTypeName] = useState(types[0]?.name ?? '')
  const [counts, setCounts] = useState<Record<string, number> | null>(null)

  // Published documents per type, so a type too thin to show a pattern is
  // visibly so before anyone spends a request on it. A plain query, no AI.
  useEffect(() => {
    const names = types.map((type) => type.name)
    let cancelled = false

    async function load() {
      if (names.length === 0) return
      try {
        const {query, params} = countQuery(names)
        const next = readCounts(names, await client.fetch<unknown>(query, params))
        if (cancelled) return
        setCounts(next)
        // Start on the first type that can actually produce something.
        setTypeName((current) =>
          (next[current] ?? 0) >= MIN_EVIDENCE
            ? current
            : (names.find((name) => (next[name] ?? 0) >= MIN_EVIDENCE) ?? current),
        )
      } catch {
        // Counts are a convenience; without them every type stays selectable.
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [client, types])
  const [view, setView] = useState<View>({kind: 'idle'})
  const [chosen, setChosen] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const selected = types.find((type) => type.name === typeName)
  const language = props.language ?? `${locale.title} (${locale.id})`

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
      setView({kind: 'done', type: selected, total: result.documentCount, rules: result.kept})
    } catch (error) {
      console.error('[sanity-plugin-editor-onboarding] Field guide suggestions failed:', error)
      setView({kind: 'error', reason: classifyError(error)})
    }
  }

  function choose(fields: string[], on: boolean) {
    setCopied(false)
    setChosen((previous) => {
      const next = new Set(previous)
      for (const field of fields) {
        if (on) next.add(field)
        else next.delete(field)
      }
      return next
    })
  }

  async function copy(type: SerializedDocumentType, rules: Convention[]) {
    const code = renderConventionGuides(
      type.name,
      rules.filter((rule) => chosen.has(rule.field)),
    )
    await navigator.clipboard.writeText(code)
    setCopied(true)
  }

  return (
    <Stack gap={4}>
      <Text muted size={1}>
        {t('conventions.intro')}
      </Text>

      <Flex align="flex-end" gap={3} wrap="wrap">
        <Stack flex={1} gap={2} style={{minWidth: 200}}>
          <Text as="label" htmlFor="conventions-type" size={1} weight="medium">
            {t('conventions.type-label')}
          </Text>
          <Select
            id="conventions-type"
            value={typeName}
            onChange={(event) => setTypeName(event.currentTarget.value)}
          >
            {types.map((type) => (
              <option
                disabled={counts !== null && (counts[type.name] ?? 0) < MIN_EVIDENCE}
                key={type.name}
                value={type.name}
              >
                {counts
                  ? `${type.title ?? type.name} (${counts[type.name] ?? 0})`
                  : (type.title ?? type.name)}
              </option>
            ))}
          </Select>
        </Stack>
        <Button
          disabled={!selected || view.kind === 'running'}
          onClick={run}
          text={t('conventions.run')}
          tone="primary"
        />
      </Flex>
      <Text muted size={0}>
        {t('conventions.cost', {limit: CONVENTION_SAMPLE_LIMIT})}
      </Text>

      {view.kind === 'idle' && <Explanation />}
      {view.kind === 'running' && (
        <Flex align="center" gap={3} padding={3}>
          <Spinner muted />
          <Text muted size={1}>
            {t('conventions.running')}
          </Text>
        </Flex>
      )}
      {view.kind === 'too-few' && (
        <Card padding={3} radius={2} tone="caution">
          <Text size={1}>{t('conventions.too-few', {count: view.count, min: MIN_EVIDENCE})}</Text>
        </Card>
      )}
      {view.kind === 'error' && (
        <Card padding={3} radius={2} tone="critical">
          <Text size={1}>{t(`conventions.error.${view.reason}`)}</Text>
        </Card>
      )}
      {view.kind === 'done' && view.rules.length === 0 && (
        <Card border padding={3} radius={2} tone="transparent">
          <Text size={1}>{t('conventions.none')}</Text>
        </Card>
      )}
      {view.kind === 'done' && view.rules.length > 0 && (
        <Rules
          chosen={chosen}
          copied={copied}
          onChoose={choose}
          onCopy={() => copy(view.type, view.rules)}
          rules={view.rules}
          total={view.total}
          type={view.type}
        />
      )}
    </Stack>
  )
}

/** Shown before the first run, so the idea is clear before anything is spent. */
function Explanation() {
  const {t} = useTranslation(ONBOARDING_NAMESPACE)
  return (
    // A tinted panel, not another bordered card: it already sits inside one.
    <Card padding={3} radius={2} tone="transparent">
      <Stack gap={3}>
        <Text size={1} weight="medium">
          {t('conventions.examples-heading')}
        </Text>
        {/* Bullets drawn rather than native list markers: Sanity UI's Text
            trims its own line height, so a marker lines up with the wrong box
            and sits above the text. A drawn dot is centred on the line. */}
        <Stack as="ul" gap={3} style={{margin: 0, padding: 0, listStyle: 'none'}}>
          {(['1', '2', '3'] as const).map((n) => (
            <Flex align="center" as="li" gap={3} key={n}>
              <Box
                aria-hidden
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: 'var(--card-muted-fg-color)',
                }}
              />
              <Text muted size={1}>
                {t(`conventions.example-${n}`)}
              </Text>
            </Flex>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}

function Rules(props: {
  type: SerializedDocumentType
  rules: Convention[]
  total: number
  chosen: Set<string>
  copied: boolean
  onChoose: (fields: string[], on: boolean) => void
  onCopy: () => void
}) {
  const {t} = useTranslation(ONBOARDING_NAMESPACE)
  const {type, rules, total, chosen, copied, onChoose, onCopy} = props
  const titles = useMemo(
    () => new Map(type.fields.map((field) => [field.path, field.title])),
    [type],
  )
  const allChosen = rules.every((rule) => chosen.has(rule.field))

  return (
    <Stack gap={3}>
      <Text muted size={1}>
        {t('conventions.select-hint')}
      </Text>

      {rules.map((rule) => (
        <Card
          border
          key={rule.field}
          padding={3}
          radius={2}
          tone={chosen.has(rule.field) ? 'primary' : 'default'}
        >
          <Flex gap={3}>
            <Box paddingTop={1}>
              <Checkbox
                aria-label={rule.title}
                checked={chosen.has(rule.field)}
                onChange={(event) => onChoose([rule.field], event.currentTarget.checked)}
              />
            </Box>
            <Stack flex={1} gap={3}>
              <Flex align="flex-start" gap={2} justify="space-between">
                <Text size={1} weight="semibold">
                  {rule.title}
                </Text>
                <Badge tone={rule.seenIn / total >= STRONG_EVIDENCE ? 'positive' : 'default'}>
                  {t('conventions.evidence', {count: rule.seenIn, total})}
                </Badge>
              </Flex>
              <Text size={1}>{rule.content}</Text>
              <Flex gap={3} wrap="wrap">
                {titles.get(rule.field) && (
                  <Text muted size={0} weight="medium">
                    {titles.get(rule.field)}
                  </Text>
                )}
                <Text muted size={0}>
                  <code>{rule.field}</code>
                </Text>
              </Flex>
              {rule.examples.length > 0 && (
                <Collapsible
                  fontSize={0}
                  label={t('conventions.show-examples', {count: rule.examples.length})}
                >
                  <Stack gap={2} paddingLeft={4} paddingTop={1}>
                    {rule.examples.map((example) => (
                      <Text key={example} muted size={0}>
                        {example}
                      </Text>
                    ))}
                  </Stack>
                </Collapsible>
              )}
            </Stack>
          </Flex>
        </Card>
      ))}

      <Card borderTop padding={3} style={{position: 'sticky', bottom: 0}}>
        <Flex align="center" gap={3} wrap="wrap">
          <Button
            mode="bleed"
            onClick={() =>
              onChoose(
                rules.map((rule) => rule.field),
                !allChosen,
              )
            }
            text={allChosen ? t('conventions.select-none') : t('conventions.select-all')}
          />
          <Text muted size={1}>
            {t('conventions.chosen', {count: chosen.size})}
          </Text>
          <Box flex={1} />
          {copied && <Text size={1}>{t('conventions.copied')}</Text>}
          <Button
            disabled={chosen.size === 0}
            onClick={onCopy}
            text={t('conventions.copy')}
            tone="primary"
          />
        </Flex>
      </Card>
    </Stack>
  )
}
