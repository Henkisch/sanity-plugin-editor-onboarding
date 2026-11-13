import {describe, expect, it} from 'vitest'

import {autoStartKey, fieldGuideRows, groupFieldGuides} from './overview'

describe('fieldGuideRows', () => {
  it('lists standalone guides and tour steps that name a field', () => {
    const rows = fieldGuideRows(
      [
        {
          id: 'publishing',
          title: 'Publishing',
          steps: [
            {field: 'slug', title: 'Slug', content: '…'},
            {title: 'No field', content: '…'},
          ],
        },
      ],
      [{field: 'bio', documentType: 'author', title: 'Bio', content: '…'}],
    )
    expect(rows).toEqual([
      {id: 'guide:author:bio', field: 'bio', documentType: 'author', title: 'Bio'},
      {id: 'tour:publishing:slug', field: 'slug', title: 'Slug', tourTitle: 'Publishing'},
    ])
  })

  it('keeps which tour a step came from, since that is where its text is changed', () => {
    const [row] = fieldGuideRows(
      [{id: 't', title: 'Tour', steps: [{field: 'a', title: 'A', content: '…'}]}],
      [],
    )
    expect(row?.tourTitle).toBe('Tour')
  })
})

describe('autoStartKey', () => {
  it('names each way a tour can start', () => {
    expect(autoStartKey('first-login')).toBe('tool.autostart.first-login')
    expect(autoStartKey(undefined)).toBe('tool.autostart.manual')
    expect(autoStartKey(() => true)).toBe('tool.autostart.custom')
  })
})

describe('groupFieldGuides', () => {
  const row = (id: string, documentType?: string) => ({
    id,
    field: id,
    title: id,
    ...(documentType ? {documentType} : {}),
  })

  it('groups by document type in first-seen order, with all-type guides last', () => {
    const groups = groupFieldGuides([
      row('a', 'post'),
      row('b'),
      row('c', 'author'),
      row('d', 'post'),
    ])
    expect(groups.map((group) => [group.documentType, group.rows.map((r) => r.id)])).toEqual([
      ['post', ['a', 'd']],
      ['author', ['c']],
      [undefined, ['b']],
    ])
  })
})
