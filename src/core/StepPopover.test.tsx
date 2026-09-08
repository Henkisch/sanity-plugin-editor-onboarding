import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {StepPopover, type StepPopoverProps} from './StepPopover'

const theme = buildTheme()

afterEach(cleanup)

// The plugin's own strings come from Sanity's i18n, which needs a Studio. These
// tests are about structure and behaviour, so the raw keys are enough.
vi.mock('sanity', () => ({useTranslation: () => ({t: (key: string) => key})}))

function renderPopover(props: Partial<StepPopoverProps> = {}) {
  const merged: StepPopoverProps = {
    step: {title: 'Drafts and published', content: 'Every document has a draft.'},
    index: 0,
    total: 3,
    referenceElement: null,
    onNext: vi.fn(),
    onSkip: vi.fn(),
    onDismissForever: vi.fn(),
    ...props,
  }

  render(
    <ThemeProvider theme={theme}>
      <StepPopover {...merged} />
    </ThemeProvider>,
  )

  return merged
}

describe('announcing itself', () => {
  // Without this a screen reader user gets no signal that anything appeared:
  // the popup is a div among divs, and focus stays wherever it was.
  it('is a dialog, so its arrival is announced', () => {
    renderPopover()

    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('is not modal — the Studio behind it stays available', () => {
    renderPopover()

    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('false')
  })

  it('names itself with its own title and content', () => {
    renderPopover()

    const dialog = screen.getByRole('dialog')
    const title = document.getElementById(dialog.getAttribute('aria-labelledby') ?? '')
    const content = document.getElementById(dialog.getAttribute('aria-describedby') ?? '')

    expect(title?.textContent).toBe('Drafts and published')
    expect(content?.textContent).toBe('Every document has a draft.')
  })
})

describe('keyboard', () => {
  it('takes focus, so the next Tab reaches its own buttons', () => {
    renderPopover()

    expect(document.activeElement).toBe(screen.getByRole('dialog'))
  })

  it('leaves on Escape, the way everything else in a Studio does', () => {
    const {onSkip} = renderPopover()

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(onSkip).toHaveBeenCalled()
  })

  // A standalone step has no sequence to skip, so Escape has to mean close.
  it('closes on Escape when shown on its own', () => {
    const {onNext, onSkip} = renderPopover({standalone: true, total: 1})

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(onNext).toHaveBeenCalled()
    expect(onSkip).not.toHaveBeenCalled()
  })

  it('ignores other keys, so typing elsewhere cannot dismiss it', () => {
    const {onSkip} = renderPopover()

    fireEvent.keyDown(document, {key: 'a'})
    fireEvent.keyDown(document, {key: 'Enter'})

    expect(onSkip).not.toHaveBeenCalled()
  })

  it('stops listening once it is gone', () => {
    const {onSkip} = renderPopover()
    cleanup()

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(onSkip).not.toHaveBeenCalled()
  })
})

describe('the standalone variant', () => {
  it('drops the progress counter, since there is no sequence', () => {
    renderPopover({standalone: true, total: 1})

    expect(screen.queryByText('progress')).toBeNull()
  })

  it('offers only a way out, not skip or a permanent opt-out', () => {
    renderPopover({standalone: true, total: 1})

    expect(screen.getByText('action.close')).toBeTruthy()
    expect(screen.queryByText('action.skip')).toBeNull()
    expect(screen.queryByText('action.dont-show-again')).toBeNull()
  })
})
