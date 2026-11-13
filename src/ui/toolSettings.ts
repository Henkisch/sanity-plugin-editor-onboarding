import {type CurrentUser} from 'sanity'

import {type FieldGuide, type OnboardingConfig} from '../core/types'

/**
 * Who sees the Onboarding tool, and what it shows them.
 *
 * Resolved once from the plugin config, because a Studio decides its tool list
 * before anyone is signed in and before any dataset is read — the reason none
 * of these settings can live in the dataset instead.
 *
 * @internal
 */

/** Roles that see the tool unless the config says otherwise. @internal */
export const DEFAULT_TOOL_ROLES = ['administrator', 'developer']

/** What the tool needs to know, as passed through Sanity's tool `options`. @internal */
export interface ToolSettings {
  roles: string[]
  /** Present when the "Unwritten rules" tab is on. */
  finder?: {language?: string}
  /** Mirrored from the config so the overview can show what is running. */
  fieldGuides: FieldGuide[]
  syncProgress: boolean
  navbarButton: boolean
}

/**
 * The tool's settings, or `undefined` when the tool is off.
 *
 * `conventionFinder` implies `tool`: its tab has nowhere else to live, and a
 * developer who asked for it should not also have to remember a second flag.
 */
export function resolveToolSettings(
  config: OnboardingConfig | undefined,
): ToolSettings | undefined {
  const tool = config?.tool
  const finder = config?.conventionFinder
  if (!tool && !finder) return undefined

  return {
    roles: (typeof tool === 'object' && tool.roles) || DEFAULT_TOOL_ROLES,
    ...(finder ? {finder: typeof finder === 'object' ? {language: finder.language} : {}} : {}),
    fieldGuides: config?.fieldGuides ?? [],
    syncProgress: config?.syncProgress === true,
    navbarButton: config?.navbarButton !== false,
  }
}

/**
 * Whether this user sees the tool.
 *
 * Decided when the Studio builds its tool list rather than inside the tool, so
 * an editor never sees a menu entry that only explains they may not use it.
 * Hiding it is not the security boundary — the AI request runs on the user's
 * own session and Sanity enforces what that session may do — it only keeps a
 * developer tool out of an editor's way.
 */
export function canUseTool(user: Pick<CurrentUser, 'roles'> | null, roles: string[]): boolean {
  return !!user && user.roles.some((role) => roles.includes(role.name))
}
