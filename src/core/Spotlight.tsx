import {Portal, useTheme_v2} from '@sanity/ui'
import {styled} from 'styled-components'

/** Breathing room between the element's box and the ring. */
const PADDING = 4

const Ring = styled.div<{$color: string}>`
  position: fixed;
  z-index: 200000;
  pointer-events: none;
  border-radius: 4px;
  box-shadow:
    0 0 0 2px ${(props) => props.$color},
    0 0 0 6px color-mix(in srgb, ${(props) => props.$color} 18%, transparent);
  transition:
    top 160ms ease-out,
    left 160ms ease-out,
    width 160ms ease-out,
    height 160ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

/**
 * A soft outline around the current step's target.
 *
 * Deliberately just a ring: no page-dimming backdrop, no pulsing. The intent is
 * "a colleague pointing at something", not a product tour taking over the
 * screen. It never receives pointer events, so the Studio underneath stays
 * fully usable while a tour is open.
 *
 * The colour is read from the Studio's theme rather than a CSS custom property:
 * the ring renders in a portal at the document root, where Sanity UI's
 * card-scoped variables are not in scope, so a custom or light theme would
 * otherwise get a hardcoded blue.
 */
export function Spotlight(props: {rect: DOMRect}): React.JSX.Element {
  const {rect} = props
  const theme = useTheme_v2()

  return (
    <Portal>
      <Ring
        $color={theme.color.focusRing}
        aria-hidden="true"
        style={{
          top: rect.top - PADDING,
          left: rect.left - PADDING,
          width: rect.width + PADDING * 2,
          height: rect.height + PADDING * 2,
        }}
      />
    </Portal>
  )
}
