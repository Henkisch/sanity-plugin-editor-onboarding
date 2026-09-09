import {type TourStatus} from './types'

/**
 * Reconciling onboarding progress between this browser and the project.
 *
 * Kept pure and separate from both storage layers, because this is the only
 * part where being wrong is visible to an editor: lose a `dismissed` and a tour
 * they switched off comes back, which is the one thing the three-status model
 * exists to prevent.
 *
 * @internal
 */

/** What is recorded about one tour, in either store. @internal */
export interface TourRecord {
  status: TourStatus
  /** ISO timestamp. The only thing that decides which of two records wins. */
  updatedAt: string
  stepIndex?: number
}

/** One user's progress, keyed by tour id. @internal */
export interface UserProgress {
  tours: Record<string, TourRecord>
  /** When this user first opened the guides menu, if they have. */
  menuOpenedAt?: string
  /**
   * When this user last chose "Start over", if they have.
   *
   * A reset has to be able to travel: clearing only this browser's records
   * leaves the project's copy — and any other browser's — to hand them
   * straight back on the next merge. A timestamp is what lets a merge tell
   * "never had a record" apart from "deliberately cleared it".
   */
  resetAt?: string
}

export const emptyProgress = (): UserProgress => ({tours: {}})

/**
 * The later of two records.
 *
 * An unparseable or missing timestamp loses to a valid one, and ties keep the
 * first argument — so a caller can express a preference by argument order.
 */
export function newerRecord(a?: TourRecord, b?: TourRecord): TourRecord | undefined {
  if (!a) return b
  if (!b) return a

  const timeA = Date.parse(a.updatedAt)
  const timeB = Date.parse(b.updatedAt)

  if (Number.isNaN(timeA)) return Number.isNaN(timeB) ? a : b
  if (Number.isNaN(timeB)) return a

  return timeB > timeA ? b : a
}

/**
 * Whether a record predates the reset that should have removed it.
 *
 * Strictly newer survives, so a record written in the same millisecond as the
 * reset — or with a timestamp that will not parse — is dropped rather than
 * resurrected. Losing one record is recoverable; a guide someone cleared
 * coming back is the bug this exists to prevent.
 */
function clearedByReset(record: TourRecord, resetAt: string | undefined): boolean {
  if (!resetAt) return false
  return !(Date.parse(record.updatedAt) > Date.parse(resetAt))
}

/**
 * One view of a user's progress from two.
 *
 * Last write wins per tour, rather than per document: two browsers that each
 * finished a different guide should end up with both recorded, not with one
 * overwriting the other wholesale.
 *
 * `menuOpenedAt` keeps the earliest known value. It only decides whether to
 * show a one-time dot, and having opened the menu is not something that can
 * stop being true.
 *
 * `resetAt` keeps the latest known value instead — the opposite rule — because
 * the most recent "Start over" is the one whose effect should stick, and any
 * record from before it is dropped rather than merged in.
 */
export function mergeProgress(local: UserProgress, remote: UserProgress): UserProgress {
  const resetAt = [local.resetAt, remote.resetAt]
    .filter((value): value is string => typeof value === 'string')
    .sort()
    .at(-1)

  const tourIds = new Set([...Object.keys(local.tours), ...Object.keys(remote.tours)])

  const tours: Record<string, TourRecord> = {}
  for (const id of tourIds) {
    const record = newerRecord(local.tours[id], remote.tours[id])
    if (record && !clearedByReset(record, resetAt)) tours[id] = record
  }

  const opened = [local.menuOpenedAt, remote.menuOpenedAt].filter(
    (value): value is string => typeof value === 'string',
  )

  return {
    tours,
    ...(opened.length > 0 ? {menuOpenedAt: opened.sort()[0]} : {}),
    ...(resetAt ? {resetAt} : {}),
  }
}

/**
 * Whether anything in `next` is not already represented in `previous`.
 *
 * Used to decide whether a merge is worth a network write. Onboarding state
 * changes a handful of times per user, ever; writing on every mount would be
 * noise in someone else's dataset.
 */
export function progressDiffers(previous: UserProgress, next: UserProgress): boolean {
  if (previous.menuOpenedAt !== next.menuOpenedAt) return true
  if (previous.resetAt !== next.resetAt) return true

  const ids = new Set([...Object.keys(previous.tours), ...Object.keys(next.tours)])
  for (const id of ids) {
    const before = previous.tours[id]
    const after = next.tours[id]
    if (before?.status !== after?.status || before?.updatedAt !== after?.updatedAt) return true
  }

  return false
}

/**
 * The document id holding one user's progress.
 *
 * Deterministic, so reading it never needs a query, and there is exactly one
 * per user rather than a growing pile. Sanity ids allow only a restricted set
 * of characters, so anything else in a user id is replaced rather than trusted.
 */
export function progressDocumentId(userId: string): string {
  return `onboarding.progress.${userId.replace(/[^a-zA-Z0-9._-]/g, '-')}`
}

/**
 * Sanity patch paths cannot address an object key containing a hyphen —
 * `tours.seo-panel` is a syntax error, and the bracket form is read as a
 * literal — so progress is stored as a keyed array instead. That is the shape
 * Sanity's patch system is built for, and `_key` filters take any string.
 *
 * @internal
 */
export interface TourProgressItem extends TourRecord {
  _key: string
  _type: string
}

export const TOUR_ITEM_TYPE = 'onboarding.tourProgress'

/** Escaped for use inside a `_key == "..."` filter. */
function quoteKey(tourId: string): string {
  return tourId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/** The patch path selecting one tour's entry. @internal */
export function tourItemPath(tourId: string): string {
  return `tours[_key=="${quoteKey(tourId)}"]`
}

/** Progress as the array Sanity stores. @internal */
export function toTourItems(progress: UserProgress): TourProgressItem[] {
  const items: TourProgressItem[] = []
  for (const [tourId, record] of Object.entries(progress.tours)) {
    items.push({
      _key: tourId,
      _type: TOUR_ITEM_TYPE,
      status: record.status,
      updatedAt: record.updatedAt,
      ...(typeof record.stepIndex === 'number' ? {stepIndex: record.stepIndex} : {}),
    })
  }
  return items
}

/** Narrows an unknown to something whose properties can be read. */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** One record, if the value describes one. */
function toRecord(value: unknown, key: unknown): [string, TourRecord] | undefined {
  if (!isPlainRecord(value)) return undefined

  const status = value.status
  const updatedAt = value.updatedAt
  const stepIndex = value.stepIndex

  if (typeof key !== 'string' || key.length === 0) return undefined
  if (status !== 'skipped' && status !== 'dismissed' && status !== 'completed') return undefined

  return [
    key,
    {
      status,
      updatedAt: typeof updatedAt === 'string' ? updatedAt : '',
      ...(typeof stepIndex === 'number' ? {stepIndex} : {}),
    },
  ]
}

/**
 * Whether a stored `tours` value predates the keyed-array shape.
 *
 * An early version of this feature stored an object keyed by tour id. Patching
 * an array path into an object does not fail — it silently does nothing — so a
 * document left in that shape would accept writes forever and record none of
 * them. Detecting it is what lets the next write repair it.
 *
 * @internal
 */
export function isLegacyTourShape(tours: unknown): tours is Record<string, unknown> {
  return isPlainRecord(tours) && !Array.isArray(tours)
}

/**
 * The stored value back as a lookup, in either shape it may be in.
 *
 * Entries without a usable key or status are dropped rather than trusted: this
 * document is writable by the editor it belongs to, and a malformed one must
 * not take the guides down.
 */
export function fromTourItems(items: unknown): UserProgress['tours'] {
  if (isLegacyTourShape(items)) {
    const tours: UserProgress['tours'] = {}
    for (const [key, value] of Object.entries(items)) {
      const entry = toRecord(value, key)
      if (entry) tours[entry[0]] = entry[1]
    }
    return tours
  }

  if (!Array.isArray(items)) return {}

  const tours: UserProgress['tours'] = {}
  for (const item of items) {
    if (!isPlainRecord(item)) continue

    const entry = toRecord(item, item._key)
    if (entry) tours[entry[0]] = entry[1]
  }

  return tours
}
