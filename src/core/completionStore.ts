import {type TourStatus} from './types'

const STORAGE_KEY = 'sanity-plugin-onboarding:v1'
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

const keyFor = (userId: string | null, tourId: string): string => `${userId ?? 'anonymous'}:${tourId}`

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
 * Forget a tour's stored status, so it behaves as if never seen.
 *
 * @internal
 */
export function resetTourStatus(userId: string | null, tourId: string): void {
  const state = read()
  delete state.tours[keyFor(userId, tourId)]
  write(state)
}
