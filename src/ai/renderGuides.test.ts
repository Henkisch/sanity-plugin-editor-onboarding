import {describe, expect, it} from 'vitest'

import {renderConventionGuides} from './renderGuides'

const convention = {
  field: 'ingredients.amount',
  title: 'Ange mängder i gram',
  content: "Alla mängder anges i gram, t.ex. 250. It's consistent.",
  seenIn: 8,
  examples: [],
}

describe('renderConventionGuides', () => {
  it('writes entries a developer can paste straight into `fieldGuides`', () => {
    const code = renderConventionGuides('recipe', [convention])
    expect(code).toContain("field: 'ingredients.amount',")
    expect(code).toContain("documentType: 'recipe',")
    expect(code).toContain("title: 'Ange mängder i gram',")
  })

  it('escapes quotes, so a guide with an apostrophe still compiles', () => {
    expect(renderConventionGuides('recipe', [convention])).toContain("It\\'s consistent.")
  })

  it('carries the evidence as a comment, so the reviewer can judge it without rerunning', () => {
    expect(renderConventionGuides('recipe', [convention])).toContain('Seen in 8 published')
  })

  it('writes nothing when nothing was chosen', () => {
    expect(renderConventionGuides('recipe', [])).toBe('')
  })
})
