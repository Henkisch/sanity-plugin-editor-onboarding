import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {EyeClosedIcon} from '@sanity/icons/EyeClosed'

import {type TourStatus} from '../core/types'

/**
 * How a finished or hidden guide is marked, wherever guides are listed.
 *
 * One table for the editors' menu and the Onboarding tool, so a guide never
 * reads as done in one place and untouched in the other. A skipped guide, or
 * one never opened, has no entry: nothing is labelled as unfinished homework.
 *
 * @internal
 */
export const TOUR_STATUS_DISPLAY: Partial<
  Record<TourStatus, {icon: typeof CheckmarkIcon; labelKey: string; tone: 'positive' | 'default'}>
> = {
  completed: {icon: CheckmarkIcon, labelKey: 'menu.status.completed', tone: 'positive'},
  dismissed: {icon: EyeClosedIcon, labelKey: 'menu.status.dismissed', tone: 'default'},
}
