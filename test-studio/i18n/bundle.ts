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
  'seo.panel.heading': 'How this post appears in search results',
  'seo.panel.hint':
    'Leave these empty and the page title is used instead. Fill them in when the headline you want in Google differs from the one on the page.',

  'field.publishedAt.title': 'A publish date, not a switch',
  'field.publishedAt.content':
    'This is the date the site prints on the article. Setting it in the future does not hold the post back — schedule a release for that.',
  'field.bio.title': 'Two or three sentences',
  'field.bio.content':
    'The bio appears under every article this author writes, so it reads better short than complete.',
  'field.seoTitle.title': 'Only fill this in when it differs',
  'field.seoTitle.content':
    'Left empty, search engines use the page title, which is usually what you want. Set it when the headline that works on the page is not the one that works in a list of results.',

  'tour.seo.title': 'The SEO panel',
  'tour.seo.description': "A tour of this Studio's own UI, not Sanity's.",
  'tour.seo.unavailable':
    'This guide points at the SEO panel. Open a blog post, then start it again.',
  'tour.seo.panel.title': 'How this post looks in search results',
  'tour.seo.panel.content':
    'A custom panel belonging to this Studio rather than to Sanity. The guide points at it through an id the component registers itself, so renaming a class or moving the markup cannot break it.',
  'tour.seo.hint.title': 'The Studio tells you when a title is too long',
  'tour.seo.hint.content':
    'Length limits come from the schema, so the warning appears under the field as you type and in your own language. Nothing here had to be built for it.',
}

/** Keys are declared by the English bundle; every other locale translates them. */
export type StudioResourceKey = keyof typeof enUS

const svSE: Record<StudioResourceKey, string> = {
  'seo.panel.heading': 'Så här syns inlägget i sökresultat',
  'seo.panel.hint':
    'Lämnar du dem tomma används sidans titel. Fyll i dem när rubriken du vill ha i Google skiljer sig från den på sidan.',

  'field.publishedAt.title': 'Ett publiceringsdatum, inte en strömbrytare',
  'field.publishedAt.content':
    'Det här är datumet som webbplatsen skriver ut på artikeln. Att sätta det i framtiden håller inte tillbaka inlägget — schemalägg en release för det.',
  'field.bio.title': 'Två eller tre meningar',
  'field.bio.content':
    'Presentationen visas under varje artikel som författaren skriver, så den fungerar bättre kort än fullständig.',
  'field.seoTitle.title': 'Fyll bara i när den skiljer sig',
  'field.seoTitle.content':
    'Lämnas den tom använder sökmotorer sidans titel, vilket oftast är det du vill. Sätt den när rubriken som fungerar på sidan inte är den som fungerar i en lista med sökträffar.',

  'tour.seo.title': 'SEO-panelen',
  'tour.seo.description': 'En guide till den här studions egna gränssnitt, inte Sanitys.',
  'tour.seo.unavailable':
    'Den här guiden pekar på SEO-panelen. Öppna ett blogginlägg och försök igen.',
  'tour.seo.panel.title': 'Så här ser inlägget ut i sökresultat',
  'tour.seo.panel.content':
    'En egen panel som hör till den här studion, inte till Sanity. Guiden pekar på den via ett id som komponenten registrerar själv, så den slutar inte fungera för att du byter klassnamn eller flyttar markupen.',
  'tour.seo.hint.title': 'Studion säger till när titeln blir för lång',
  'tour.seo.hint.content':
    'Längdgränserna kommer från schemat, så varningen visas under fältet medan du skriver och på ditt eget språk. Ingenting här behövde byggas för det.',
}

export const studioLocaleBundles = [
  defineLocaleResourceBundle({locale: 'en-US', namespace: STUDIO_NAMESPACE, resources: enUS}),
  defineLocaleResourceBundle({locale: 'sv-SE', namespace: STUDIO_NAMESPACE, resources: svSE}),
]

/** Marks a string as a key in this Studio's namespace, for the plugin to resolve. */
export const studioText = (key: StudioResourceKey) => ({key, ns: STUDIO_NAMESPACE})
