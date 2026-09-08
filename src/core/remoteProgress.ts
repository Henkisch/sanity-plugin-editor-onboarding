import {type SanityClient} from 'sanity'

import {emptyProgress, progressDocumentId, type UserProgress} from './progressSync'

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
  tours?: UserProgress['tours']
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
      tours: document.tours ?? {},
      ...(document.menuOpenedAt ? {menuOpenedAt: document.menuOpenedAt} : {}),
    }
  } catch (error) {
    warnOnce(error)
    return emptyProgress()
  }
}

/**
 * Write this user's progress back.
 *
 * `createOrReplace` rather than a patch: the merge that produced this value
 * already accounts for what was there, and a replace cannot leave a partially
 * applied document behind.
 */
export async function saveProgress(
  client: SanityClient,
  userId: string,
  progress: UserProgress,
): Promise<void> {
  try {
    await client.createOrReplace({
      _id: progressDocumentId(userId),
      _type: DOCUMENT_TYPE,
      tours: progress.tours,
      ...(progress.menuOpenedAt ? {menuOpenedAt: progress.menuOpenedAt} : {}),
    })
  } catch (error) {
    warnOnce(error)
  }
}
