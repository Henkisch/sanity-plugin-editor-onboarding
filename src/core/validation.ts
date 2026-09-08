import {type Path} from 'sanity'

/**
 * Reading Sanity's validation markers well enough to tell whether one field is
 * the reason an editor cannot publish.
 *
 * @internal
 */

/** The shape this needs from a marker, without depending on the whole type. */
interface Marker {
  level?: string
  path?: Path
}

/** Whether two paths name the same field, ignoring which array item. */
function isSamePath(a: Path, b: Path): boolean {
  const named = (path: Path) => path.filter((segment) => typeof segment === 'string').join('.')
  return named(a) === named(b)
}

/**
 * Whether an error — not a warning — sits on this field or inside it.
 *
 * Errors block publishing and warnings do not, so only errors earn the editor's
 * attention here. A marker deeper in an object counts: the field an editor sees
 * collapsed is the one they need to open.
 */
export function hasBlockingError(markers: readonly Marker[], path: Path): boolean {
  if (path.length === 0) return false

  return markers.some((marker) => {
    if (marker.level !== 'error' || !marker.path) return false
    if (marker.path.length < path.length) return false

    return isSamePath(marker.path.slice(0, path.length), path)
  })
}
