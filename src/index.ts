export {coreConcepts, type CoreConceptId, type CoreConceptsOptions} from './concepts/tours'
export {OnboardingTarget, type OnboardingTargetProps} from './core/OnboardingTarget'
export {
  targetCustom,
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
  FieldGuide,
  OnboardingConfig,
  OnboardingStep,
  OnboardingTour,
  TourStatus,
} from './core/types'
export {ONBOARDING_NAMESPACE} from './i18n/index'
export type {OnboardingResourceKey} from './i18n/locales/en-US'
export type {LocalizedText} from './i18n/useLocalizedText'
export {useOnboardingTarget} from './core/useOnboardingTarget'
export {useStartTour} from './core/useStartTour'
export {onboardingTool} from './plugin'
