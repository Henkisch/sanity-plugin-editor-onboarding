import {type SanityClient} from 'sanity'

import {
  emptyProgress,
  fromTourItems,
  progressDocumentId,
  toTourItems,
  tourItemPath,
  type UserProgress,
} from './progressSync'

/**
 * Onboarding progress kept in the project, so "seen it" follows an editor
 * between browsers and machines.
 *
 * Stored as one document per user, written with the ordinary document APIs.
 * Sanity does have a per-user key-value store, which is what this is for and
 * where the Studio keeps its own pane sizes — but it is marked `@internal`, and
 * this plugin does not put an editor's state behind an API with no stability
 * promise.
 *
 * The `_type` is deliberately not registered as a schema type. An unregistered
 * type is accepted by the Content Lake but never listed in the structure tool
 * or searched, so enabling this does not put a "Onboarding progress" entry in
 * anybody's Content pane.
 *
 * Every call here is best-effort. A viewer-role editor cannot write to the
 * dataset, the network can be down, and none of that is worth interrupting
 * someone's day over: the local store still works, and the guide still runs.
 *
 * @internal
 */

const DOCUMENT_TYPE = 'onboarding.progress'

/** Pinned so a Studio's own API version cannot change this behaviour. */
export const PROGRESS_API_VERSION = '2024-01-01'

interface ProgressDocument {
  _id: string
  _type: string
  /** A keyed array, not an object — see `tourItemPath`. */
  tours?: unknown
  menuOpenedAt?: string
}

/** Whether the plugin has already complained about being unable to sync. */
let warned = false

function warnOnce(reason: unknown): void {
  if (warned) return
  warned = true

  console.warn(
    `[sanity-plugin-editor-onboarding] Could not sync onboarding progress to the dataset, so it ` +
      `stays in this browser only. This is expected for editors without write access. ` +
      `Set \`syncProgress: false\` to stop trying.`,
    reason,
  )
}

/**
 * This user's stored progress, or empty progress if there is none to read.
 *
 * Never throws: a failure here has to look the same as a first-time user.
 */
export async function fetchProgress(
  client: SanityClient,
  userId: string,
): Promise<UserProgress> {
  try {
    const document = await client.getDocument<ProgressDocument>(progressDocumentId(userId))
    if (!document) return emptyProgress()

    return {
      tours: fromTourItems(document.tours),
      ...(document.menuOpenedAt ? {menuOpenedAt: document.menuOpenedAt} : {}),
    }
  } catch (error) {
    warnOnce(error)
    return emptyProgress()
  }
}

/**
 * Write this user's progress back, touching only the guides it names.
 *
 * Not `createOrReplace`: two tabs belonging to the same editor would then
 * overwrite each other wholesale, and whichever finished second would erase the
 * other's guide. Each entry is removed and re-inserted by key in one patch
 * instead, so a tab writing `essentials` leaves a tab writing `publishing`
 * alone. Two writes to the *same* guide still resolve last-write-wins, which is
 * what the merge rules assume anyway.
 *
 * `menuOpenedAt` is `setIfMissing`: having opened the menu cannot stop being
 * true, so the earliest record should survive.
 */
export async function saveProgress(
  client: SanityClient,
  userId: string,
  progress: UserProgress,
): Promise<void> {
  const items = toTourItems(progress)
  if (items.length === 0 && !progress.menuOpenedAt) return

  const id = progressDocumentId(userId)

  try {
    await client
      .transaction()
      .createIfNotExists({_id: id, _type: DOCUMENT_TYPE, tours: []})
      .patch(id, (patch) => {
        let next = patch.setIfMissing({tours: []})

        if (progress.menuOpenedAt) {
          next = next.setIfMissing({menuOpenedAt: progress.menuOpenedAt})
        }

        if (items.length > 0) {
          // Unset then insert is an atomic replace of just these keys; without
          // the unset, re-running would append duplicates.
          next = next
            .unset(items.map((item) => tourItemPath(item._key)))
            .insert('after', 'tours[-1]', items)
        }

        return next
      })
      // The editor is not waiting on this, and a slower commit is cheaper than
      // holding up the Studio's own writes.
      .commit({visibility: 'async'})
  } catch (error) {
    warnOnce(error)
  }
}
