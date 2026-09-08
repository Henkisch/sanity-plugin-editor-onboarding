export {coreConcepts, type CoreConceptId, type CoreConceptsOptions} from './concepts/tours'
export {
  targetDocumentHistory,
  targetDocumentStatus,
  targetDocumentType,
  targetField,
  targetGuidesButton,
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
export {ONBOARDING_NAMESPACE} from './i18n/index'
export type {OnboardingResourceKey} from './i18n/locales/en-US'
export type {LocalizedText} from './i18n/useLocalizedText'
export {useStartTour} from './core/useStartTour'
export {onboardingTool} from './plugin'
