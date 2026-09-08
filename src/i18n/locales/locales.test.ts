import {describe, expect, it} from 'vitest'

import enUS from './en-US'
import svSE from './sv-SE'

// Widened to plain records so the parity checks can index by a runtime key
// without asserting it into the literal union of either bundle.
const en: Record<string, string> = enUS
const sv: Record<string, string> = svSE

const enKeys = Object.keys(en).sort()
const svKeys = Object.keys(sv).sort()

describe('locale bundles', () => {
  // en-US is the base every other locale falls back to, so a key that exists
  // only in a translation is dead weight, and one missing from a translation
  // silently ships English into a Swedish Studio.
  it('translates every English key into Swedish', () => {
    expect(enKeys.filter((key) => !svKeys.includes(key))).toEqual([])
  })

  it('has no Swedish key that English does not define', () => {
    expect(svKeys.filter((key) => !enKeys.includes(key))).toEqual([])
  })

  it('leaves no string empty in either locale', () => {
    for (const [key, value] of Object.entries({...en, ...sv})) {
      expect(value, key).toBeTruthy()
    }
  })

  it('keeps the interpolation placeholders identical between locales', () => {
    const placeholders = (value: string) => (value.match(/\{\{[^}]+\}\}/g) ?? []).sort()

    for (const key of enKeys) {
      expect(placeholders(sv[key]), key).toEqual(placeholders(en[key]))
    }
  })

  it('translates rather than copying, apart from strings that are the same word', () => {
    // A handful of strings legitimately match; a large overlap means someone
    // added English text to the Swedish bundle and moved on.
    const identical = enKeys.filter((key) => en[key] === sv[key])

    expect(identical.length).toBeLessThan(enKeys.length * 0.15)
  })
})
