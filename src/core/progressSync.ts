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
 * One view of a user's progress from two.
 *
 * Last write wins per tour, rather than per document: two browsers that each
 * finished a different guide should end up with both recorded, not with one
 * overwriting the other wholesale.
 *
 * `menuOpenedAt` keeps the earliest known value. It only decides whether to
 * show a one-time dot, and having opened the menu is not something that can
 * stop being true.
 */
export function mergeProgress(local: UserProgress, remote: UserProgress): UserProgress {
  const tourIds = new Set([...Object.keys(local.tours), ...Object.keys(remote.tours)])

  const tours: Record<string, TourRecord> = {}
  for (const id of tourIds) {
    const record = newerRecord(local.tours[id], remote.tours[id])
    if (record) tours[id] = record
  }

  const opened = [local.menuOpenedAt, remote.menuOpenedAt].filter(
    (value): value is string => typeof value === 'string',
  )

  return opened.length > 0 ? {tours, menuOpenedAt: opened.sort()[0]} : {tours}
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
