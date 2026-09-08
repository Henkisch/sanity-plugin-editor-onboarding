import {defineLocaleResourceBundle} from 'sanity'

/**
 * This Studio's own strings, in its own namespace.
 *
 * The onboarding plugin ships translated chrome — Next, Skip, the guides menu —
 * but the words in a tour you write yourself are yours, and nothing can
 * translate them for you. Registering them here is the documented way to have
 * your own guides follow the editor's language, and this Studio does it so the
 * pattern is demonstrated rather than only described.
 */
export const STUDIO_NAMESPACE = 'test-studio'

const enUS = {
  'seo.badge.empty': 'No title yet',
  'seo.badge.short': 'Too short',
  'seo.badge.good': 'Good length',
  'seo.badge.long': 'Too long',
  'seo.panel.heading': 'Search appearance',

  'tour.seo.title': 'The SEO panel',
  'tour.seo.description': "A tour of this Studio's own UI, not Sanity's.",
  'tour.seo.unavailable':
    'This guide points at the SEO panel. Open a blog post, then start it again.',
  'tour.seo.panel.title': 'How this post looks in search results',
  'tour.seo.panel.content':
    'A custom panel belonging to this Studio rather than to Sanity. The guide points at it through an id the component registers itself, so renaming a class or moving the markup cannot break it.',
  'tour.seo.score.title': 'Whether the title is a usable length',
  'tour.seo.score.content':
    'Search engines cut titles off at around sixty characters. This updates as you type, and the guide points at it without the component knowing anything about onboarding.',
}

/** Keys are declared by the English bundle; every other locale translates them. */
export type StudioResourceKey = keyof typeof enUS

const svSE: Record<StudioResourceKey, string> = {
  'seo.badge.empty': 'Ingen titel än',
  'seo.badge.short': 'För kort',
  'seo.badge.good': 'Bra längd',
  'seo.badge.long': 'För lång',
  'seo.panel.heading': 'Utseende i sökresultat',

  'tour.seo.title': 'SEO-panelen',
  'tour.seo.description': 'En guide till den här studions egna gränssnitt, inte Sanitys.',
  'tour.seo.unavailable':
    'Den här guiden pekar på SEO-panelen. Öppna ett blogginlägg och försök igen.',
  'tour.seo.panel.title': 'Så här ser inlägget ut i sökresultat',
  'tour.seo.panel.content':
    'En egen panel som hör till den här studion, inte till Sanity. Guiden pekar på den via ett id som komponenten registrerar själv, så den slutar inte fungera för att du byter klassnamn eller flyttar markupen.',
  'tour.seo.score.title': 'Om titeln har användbar längd',
  'tour.seo.score.content':
    'Sökmotorer klipper av titlar vid ungefär sextio tecken. Den här uppdateras medan du skriver, och guiden pekar på den utan att komponenten vet något om onboarding.',
}

export const studioLocaleBundles = [
  defineLocaleResourceBundle({locale: 'en-US', namespace: STUDIO_NAMESPACE, resources: enUS}),
  defineLocaleResourceBundle({locale: 'sv-SE', namespace: STUDIO_NAMESPACE, resources: svSE}),
]

/** Marks a string as a key in this Studio's namespace, for the plugin to resolve. */
export const studioText = (key: StudioResourceKey) => ({key, ns: STUDIO_NAMESPACE})
