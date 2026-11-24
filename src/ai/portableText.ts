import {isRecord} from '../core/isRecord'

/**
 * Reading Portable Text as plain text, for counting it and for quoting it.
 *
 * @internal
 */

/** Whether every item is a text block — rich text, rather than a list of objects. */
export function isPortableText(value: unknown[]): boolean {
  return value.length > 0 && value.every((item) => isRecord(item) && item._type === 'block')
}

/** One block's text, with marks and annotations dropped. */
export function blockText(block: unknown): string {
  if (!isRecord(block) || !Array.isArray(block.children)) return ''
  return block.children
    .map((child: unknown) => (isRecord(child) && typeof child.text === 'string' ? child.text : ''))
    .join('')
}
