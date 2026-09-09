import {type UserProgress} from './progressSync'
import {type TourStatus} from './types'

const STORAGE_KEY = 'sanity-plugin-editor-onboarding:v1'
const SCHEMA_VERSION = 1

interface TourRecord {
  status: TourStatus
  /** ISO timestamp of when the status was last written. */
  updatedAt: string
  /** Index of the step the user was on. Useful for future resume support. */
  stepIndex?: number
}

interface StoredState {
  version: number
  /** Keyed by `${userId}:${tourId}`. */
  tours: Record<string, TourRecord>
  /**
   * Users who have opened the guides menu at least once, mapped to when.
   *
   * Optional so that state written by an earlier version still reads cleanly.
   */
  menuOpened?: Record<string, string>
  /**
   * Users who have chosen "Start over" at least once, mapped to when they last
   * did.
   *
   * Optional so that state written by an earlier version still reads cleanly.
   */
  resetAt?: Record<string, string>
}

const emptyState = (): StoredState => ({version: SCHEMA_VERSION, tours: {}})

/**
 * localStorage can throw outright in private-browsing modes and embedded
 * contexts, so every access is guarded. Onboarding state is never important
 * enough to break the Studio over.
 */
function isStoredState(value: unknown): value is StoredState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<Record<keyof StoredState, unknown>>
  // Anything written by a future version of the plugin is treated as absent
  // rather than misread, so an upgrade can never corrupt a downgrade.
  return (
    candidate.version === SCHEMA_VERSION &&
    typeof candidate.tours === 'object' &&
    candidate.tours !== null
  )
}

function read(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()

    const parsed: unknown = JSON.parse(raw)
    return isStoredState(parsed) ? parsed : emptyState()
  } catch {
    return emptyState()
  }
}

function write(state: StoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage unavailable or full. The tour still works for this session.
  }
}

const keyFor = (userId: string | null, tourId: string): string =>
  `${userId ?? 'anonymous'}:${tourId}`

/**
 * How the given user last left the given tour, or `null` if they never have.
 *
 * @internal
 */
export function getTourStatus(userId: string | null, tourId: string): TourStatus | null {
  return read().tours[keyFor(userId, tourId)]?.status ?? null
}

/**
 * Record how a user left a tour.
 *
 * @internal
 */
export function setTourStatus(
  userId: string | null,
  tourId: string,
  status: TourStatus,
  stepIndex?: number,
): void {
  const state = read()
  state.tours[keyFor(userId, tourId)] = {
    status,
    updatedAt: new Date().toISOString(),
    ...(typeof stepIndex === 'number' ? {stepIndex} : {}),
  }
  write(state)
}

/**
 * Whether a tour is allowed to start on its own.
 *
 * `skipped` deliberately returns `true`: the user was busy, not opted out.
 *
 * @internal
 */
export function mayAutoStart(userId: string | null, tourId: string): boolean {
  const status = getTourStatus(userId, tourId)
  return status !== 'dismissed' && status !== 'completed'
}

/**
 * Whether this user has ever opened the guides menu.
 *
 * Used to decide whether the navbar button still needs its "there is something
 * here" dot. Once true it stays true — the dot is a one-time pointer, not a
 * recurring notification.
 *
 * @internal
 */
export function hasOpenedMenu(userId: string | null): boolean {
  return Boolean(read().menuOpened?.[userId ?? 'anonymous'])
}

/**
 * Record that the user opened the guides menu, retiring the dot for good.
 *
 * @internal
 */
export function setMenuOpened(userId: string | null): void {
  const state = read()
  state.menuOpened = {
    ...state.menuOpened,
    [userId ?? 'anonymous']: new Date().toISOString(),
  }
  write(state)
}

/**
 * Record that the user chose "Start over" now, and return that timestamp so
 * the caller can mirror the same value elsewhere rather than reading it back.
 *
 * @internal
 */
export function setResetAt(userId: string | null): string {
  const state = read()
  const resetAt = new Date().toISOString()
  state.resetAt = {
    ...state.resetAt,
    [userId ?? 'anonymous']: resetAt,
  }
  write(state)
  return resetAt
}

/**
 * This user's progress, in the shape the project-side store uses.
 *
 * The local store keys every user's tours in one map; a synced document holds
 * one user. This is the seam between the two.
 *
 * @internal
 */
export function getUserProgress(userId: string | null): UserProgress {
  const state = read()
  const prefix = `${userId ?? 'anonymous'}:`

  const tours: UserProgress['tours'] = {}
  for (const [key, record] of Object.entries(state.tours)) {
    if (key.startsWith(prefix)) tours[key.slice(prefix.length)] = record
  }

  const menuOpenedAt = state.menuOpened?.[userId ?? 'anonymous']
  const resetAt = state.resetAt?.[userId ?? 'anonymous']

  return {
    tours,
    ...(menuOpenedAt ? {menuOpenedAt} : {}),
    ...(resetAt ? {resetAt} : {}),
  }
}

/**
 * Write a merged view of this user's progress back to the browser.
 *
 * Other users' records in the same browser are left untouched: a shared machine
 * must not have one person's sync wipe another's state.
 *
 * This expects the complete merged picture for this user, not a partial one:
 * any of this user's records missing from `progress.tours` are deleted, not
 * left alone. That is what lets a reset propagate — a merge that dropped a
 * record because of a reset must not find it still here on the next read —
 * so a caller with only a subset of this user's tours must not call this.
 *
 * @internal
 */
export function setUserProgress(userId: string | null, progress: UserProgress): void {
  const state = read()
  const owner = userId ?? 'anonymous'
  const prefix = `${owner}:`

  for (const [tourId, record] of Object.entries(progress.tours)) {
    state.tours[keyFor(userId, tourId)] = record
  }

  // Anything this user has locally that the merged picture no longer carries
  // was dropped deliberately — most often by a reset elsewhere — and must not
  // survive here, or a second device could hand it straight back.
  for (const key of Object.keys(state.tours)) {
    if (!key.startsWith(prefix)) continue
    if (!(key.slice(prefix.length) in progress.tours)) delete state.tours[key]
  }

  if (progress.menuOpenedAt) {
    state.menuOpened = {...state.menuOpened, [owner]: progress.menuOpenedAt}
  }

  if (progress.resetAt) {
    state.resetAt = {...state.resetAt, [owner]: progress.resetAt}
  }

  write(state)
}

/**
 * Forget a tour's stored status, so it behaves as if never seen.
 *
 * @internal
 */
export function resetTourStatus(userId: string | null, tourId: string): void {
  const state = read()
  delete state.tours[keyFor(userId, tourId)]
  write(state)
}
