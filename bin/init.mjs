#!/usr/bin/env node
/**
 * Drafts field guides from a Studio's schema.
 *
 * Run inside a Studio project:
 *
 *   npx sanity-plugin-editor-onboarding init
 *
 * It reads a schema extracted by `sanity schema extract`, drafts a guide for
 * every field whose type it can identify, and writes them somewhere a human can
 * edit. It never touches sanity.config.ts — wiring the result in is one line,
 * and doing it automatically would mean rewriting a file we do not understand.
 */
import {readFile, writeFile, access, rm} from 'node:fs/promises'
import {spawn} from 'node:child_process'
import {resolve} from 'node:path'

import {draftGuides, renderFieldGuides, slugFields} from '../dist/init.js'

const DEFAULT_OUT = 'onboarding-field-guides.ts'

function arg(name) {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}

const exists = async (path) => access(path).then(() => true, () => false)

/**
 * Sanity writes the extract relative to the working directory even when handed
 * an absolute path, so this asks for a relative one and resolves it afterwards.
 */
function extractSchema(target) {
  return new Promise((done) => {
    const child = spawn('npx', ['sanity', 'schema', 'extract', '--path', target, '--force'], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    child.on('error', () => done(false))
    child.on('close', (code) => done(code === 0))
  })
}

async function main() {
  const out = arg('out') ?? DEFAULT_OUT
  let schemaPath = arg('schema')
  // Only tidy up a file this command created; one the user pointed us at is
  // theirs.
  let extractedHere = false

  if (!schemaPath) {
    schemaPath = 'onboarding-schema.json'
    extractedHere = true
    console.log('Extracting your schema…\n')
    if (!(await extractSchema(schemaPath))) {
      console.error(
        '\nCould not run `sanity schema extract`.\n' +
          'Run this from a Studio project, or pass a schema you extracted yourself:\n' +
          '  npx sanity-plugin-editor-onboarding init --schema path/to/schema.json\n',
      )
      process.exit(1)
    }
  }

  if (!(await exists(schemaPath))) {
    console.error(`No schema at ${schemaPath}.`)
    process.exit(1)
  }

  let schema
  try {
    schema = JSON.parse(await readFile(schemaPath, 'utf8'))
    if (!Array.isArray(schema)) throw new Error('not an array')
  } catch {
    console.error(
      `Could not read ${schemaPath} as an extracted schema.\n` +
        'Sanity marks `schema extract` experimental, so its output may have changed.\n' +
        'Nothing in your Studio is affected — write your field guides by hand instead:\n' +
        'https://github.com/Henkisch/sanity-plugin-editor-onboarding#help-on-a-single-field',
    )
    process.exit(1)
  }

  if (extractedHere) await rm(schemaPath, {force: true})

  const guides = draftGuides(schema)

  if (guides.length === 0) {
    console.log('Found no fields to draft guides for. Nothing written.')
    return
  }

  if ((await exists(out)) && !process.argv.includes('--force')) {
    console.error(`${out} already exists. Pass --force to overwrite it.`)
    process.exit(1)
  }

  await writeFile(resolve(out), renderFieldGuides(guides), 'utf8')

  const slugs = slugFields(schema)
  const byKind = guides.reduce((counts, guide) => {
    counts[guide.kind] = (counts[guide.kind] ?? 0) + 1
    return counts
  }, {})

  console.log(`\nDrafted ${guides.length} field guides into ${out}`)
  for (const [kind, count] of Object.entries(byKind)) console.log(`  ${count} × ${kind}`)
  if (slugs.length > 0) {
    console.log(`\nLeft ${slugs.length} slug field(s) alone — coreConcepts() already explains those.`)
  }
  console.log(
    '\nFields whose type could not be identified were skipped rather than guessed at:\n' +
      '`sanity schema extract` reports datetime, text and string identically.\n' +
      '\nNow do the part no generator can:\n' +
      '  1. Read every guide and rewrite it in your own words.\n' +
      '  2. Delete the ones that state the obvious.\n' +
      '  3. Add guides for the fields your editors actually ask you about.\n' +
      `\nThen wire it up:\n  onboardingTool({tours: coreConcepts(), fieldGuides})\n`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
