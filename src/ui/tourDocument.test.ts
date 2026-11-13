import {afterEach, describe, expect, it} from 'vitest'

import {type SerializedDocumentType} from '../ai/serializeSchema'
import {targetAssetBrowse, targetNavbar, targetPublishButton} from '../core/targeting'
import {type OnboardingTour} from '../core/types'
import {documentTypesFor, waitForElement} from './tourDocument'

const types: SerializedDocumentType[] = [
  {
    name: 'post',
    fields: [
      {path: 'slug', type: 'slug'},
      {path: 'cover', type: 'image', asset: 'image'},
    ],
  },
  {name: 'author', fields: [{path: 'slug', type: 'slug'}]},
  {name: 'settings', fields: [{path: 'title', type: 'string'}]},
]

const tour = (steps: OnboardingTour['steps'], extra: Partial<OnboardingTour> = {}) => ({
  id: 't',
  title: 'T',
  steps,
  ...extra,
})

describe('documentTypesFor', () => {
  it('uses an explicit documentType — the only way to point at a custom component', () => {
    expect(
      documentTypesFor(tour([{title: 'a', content: 'b'}], {documentType: 'post'}), types),
    ).toEqual(['post'])
  })

  it('matches types that have every field the steps name', () => {
    expect(documentTypesFor(tour([{field: 'slug', title: 'a', content: 'b'}]), types)).toEqual([
      'post',
      'author',
    ])
  })

  it('matches types with an image field for a guide about the image picker', () => {
    expect(
      documentTypesFor(tour([{target: targetAssetBrowse(), title: 'a', content: 'b'}]), types),
    ).toEqual(['post'])
  })

  it('accepts any document for a guide about publishing', () => {
    expect(
      documentTypesFor(tour([{target: targetPublishButton(), title: 'a', content: 'b'}]), types),
    ).toEqual(['post', 'author', 'settings'])
  })

  it('opens nothing for a guide about the Studio itself', () => {
    expect(
      documentTypesFor(tour([{target: targetNavbar(), title: 'a', content: 'b'}]), types),
    ).toEqual([])
  })
})

describe('waitForElement', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  // jsdom lays nothing out, so every rect is zero; visibility is stubbed.
  const isVisible = () => true

  const add = (id: string) => {
    const element = document.createElement('div')
    element.id = id
    document.body.append(element)
    return element
  }

  it('resolves once the element has held still', async () => {
    const waiting = waitForElement('#late', {
      timeoutMs: 2000,
      stableMs: 50,
      intervalMs: 10,
      isVisible,
    })
    add('late')
    await expect(waiting).resolves.toBeUndefined()
  })

  // The live bug: the header re-rendered while loading, and a guide started
  // on the first match pointed at an element that had been replaced.
  it('waits again when the element is replaced, rather than settling on the first one', async () => {
    const first = add('swap')
    let replaced = false
    const waiting = waitForElement('#swap', {
      timeoutMs: 2000,
      stableMs: 80,
      intervalMs: 10,
      isVisible,
    }).then(() => replaced)
    await new Promise((r) => setTimeout(r, 30))
    first.remove()
    add('swap')
    replaced = true
    await expect(waiting).resolves.toBe(true)
  })

  it('resolves on timeout rather than failing, so the guide can explain itself', async () => {
    await expect(
      waitForElement('#never', {timeoutMs: 30, intervalMs: 10, isVisible}),
    ).resolves.toBeUndefined()
  })
})
