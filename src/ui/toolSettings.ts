import {type CurrentUser} from 'sanity'

/** Roles that see the convention finder unless the config says otherwise. @internal */
export const DEFAULT_FINDER_ROLES = ['administrator', 'developer']

/**
 * Whether this user should see the convention finder.
 *
 * Decided when the Studio builds its tool list rather than inside the tool, so
 * an editor never sees a menu entry that only explains they may not use it.
 * Hiding it is not the security boundary — the AI request runs on the user's
 * own session and Sanity enforces what that session may do — it only keeps a
 * developer tool out of an editor's way.
 *
 * @internal
 */
export function canUseConventionFinder(
  user: Pick<CurrentUser, 'roles'> | null,
  roles: string[] = DEFAULT_FINDER_ROLES,
): boolean {
  return !!user && user.roles.some((role) => roles.includes(role.name))
}
