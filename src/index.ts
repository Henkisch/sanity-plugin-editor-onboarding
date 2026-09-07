export {coreConcepts, type CoreConceptId, type CoreConceptsOptions} from './concepts/tours'
export {
  targetDocumentHistory,
  targetDocumentStatus,
  targetDocumentType,
  targetField,
  targetNavbar,
  targetNewDocument,
  targetPerspectiveMenu,
  targetPublishButton,
  targetReleases,
  targetSearch,
  targetToolMenu,
} from './core/targeting'
export type {
  AutoStart,
  AutoStartContext,
  OnboardingConfig,
  OnboardingStep,
  OnboardingTour,
  TourStatus,
} from './core/types'
export {useStartTour} from './core/useStartTour'
export {onboardingTool} from './plugin'
