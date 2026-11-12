import {describe, expect, it} from 'vitest'

import {renderConventionGuides} from './renderGuides'

const convention = {
  field: 'prices.durationMin',
  title: 'Ange tider i hela kvartar',
  content: "Alla tider är multiplar av 15 minuter, t.ex. 135. It's consistent.",
  seenIn: 8,
  examples: [],
}

describe('renderConventionGuides', () => {
  it('writes entries a developer can paste straight into `fieldGuides`', () => {
    const code = renderConventionGuides('service', [convention])
    expect(code).toContain("field: 'prices.durationMin',")
    expect(code).toContain("documentType: 'service',")
    expect(code).toContain("title: 'Ange tider i hela kvartar',")
  })

  it('escapes quotes, so a guide with an apostrophe still compiles', () => {
    expect(renderConventionGuides('service', [convention])).toContain("It\\'s consistent.")
  })

  it('carries the evidence as a comment, so the reviewer can judge it without rerunning', () => {
    expect(renderConventionGuides('service', [convention])).toContain('Seen in 8 published')
  })

  it('writes nothing when nothing was chosen', () => {
    expect(renderConventionGuides('service', [])).toBe('')
  })
})
