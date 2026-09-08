# sanity-plugin-editor-onboarding

Short, unobtrusive guided tours for Sanity Studio editors — with a library of
core Sanity concepts that works with **zero configuration**.

Install it and your editors get quiet, in-Studio answers to the questions they
always ask: what the draft/published distinction means, what publishing actually
does, where document history lives.

## Quickstart

```sh
npm install sanity-plugin-editor-onboarding
```

```ts
// sanity.config.ts
import {defineConfig} from 'sanity'
import {coreConcepts, onboardingTool} from 'sanity-plugin-editor-onboarding'

export default defineConfig({
  // ...
  plugins: [onboardingTool({tours: coreConcepts()})],
})
```

That's the whole setup. Start your Studio and you get:

- A short **Studio essentials** tour that starts once, on first login.
- An **Editorial guides** button in the navbar listing every guide, so a tour is never lost
  to someone who dismissed it. It carries a small dot until opened once, and the
  last step of the first tour points at it.
- Steps that point at features your project doesn't have (Content Releases, say)
  quietly drop out — no configuration needed.

## What's included

`coreConcepts()` ships five short tours. Only `essentials` starts on its own;
the rest wait in the help menu.

| Tour | Covers |
| --- | --- |
| `essentials` | Drafts vs. published, creating documents, search |
| `publishing` | Autosave, publishing, document history |
| `collaboration` | Presence, comments and tasks |
| `releases` | Bundling and scheduling content releases |
| `media` | How assets are stored and reused |

Pick a subset if you want:

```ts
coreConcepts({include: ['essentials', 'publishing']})
```

## Your own tours

```ts
import {onboardingTool, coreConcepts, targetDocumentType} from 'sanity-plugin-editor-onboarding'

onboardingTool({
  tours: [
    ...coreConcepts(),
    {
      id: 'editorial-workflow',
      title: 'How we work',
      autoStart: 'first-login', // or 'manual', or (ctx) => boolean
      steps: [
        {
          target: targetDocumentType('Blog post'),
          title: 'Your articles live here',
          content: 'Every published and draft post, in one place.',
        },
        {
          target: '.my-custom-widget', // any CSS selector works
          title: 'Team activity',
          content: 'What everyone has been working on this week.',
        },
      ],
    },
  ],
})
```

Each step takes a `title`, a `content` of one to three sentences, an optional
`learnMoreUrl`, and an optional `placement`. If a step needs more words than
that, link out instead — it has stopped being a tour step.

### Targeting

**Built-in helpers** cover Sanity's own UI, so you don't have to know its
internals:

| Helper | Points at |
| --- | --- |
| `targetNavbar()` | The top navigation bar |
| `targetToolMenu()` | The tool switcher |
| `targetSearch()` | Global search |
| `targetNewDocument()` | The "create new document" button |
| `targetPerspectiveMenu()` | The draft / published / release switcher |
| `targetReleases()` | The Content Releases link |
| `targetPublishButton()` | Publish, in an open document |
| `targetDocumentStatus()` | The Draft / Published chips |
| `targetDocumentHistory()` | The open document's context menu |
| `targetDocumentType(title)` | A type in the structure list — by **title**, not schema name |
| `targetField(name)` | A field in the open document, by schema name |

**Any CSS selector** works too, which is how you point at your own components:
`target: '.my-widget'` or `target: '[data-my-thing]'`.

A target that can't be found is not a crash and not a silent failure: the step
is skipped, the tour carries on, and you get a console warning naming the tour,
the step and the selector that missed.

### Starting a tour yourself

The navbar help button is there by default. If you'd rather use your own:

```tsx
import {useStartTour} from 'sanity-plugin-editor-onboarding'

function HelpButton() {
  const startTour = useStartTour('essentials')
  return <Button onClick={startTour} text="Show me around" />
}
```

Turn the built-in one off with `onboardingTool({tours, navbarButton: false})`.

## Languages

Every string the plugin shows — its own buttons and menu, and all of the
built-in guide content — is translatable. English is the base; Swedish ships
too. Studio UI language is followed automatically, so if your editors run
Sanity in Swedish, the guides are in Swedish with no extra setup.

### Adding a language

Translations are plain locale bundles in the `onboarding` namespace. Nothing
needs to be forked:

```ts
// sanity.config.ts
import {defineConfig, defineLocaleResourceBundle} from 'sanity'
import {deDELocale} from '@sanity/locale-de-de'

const onboardingDeDE = defineLocaleResourceBundle({
  locale: 'de-DE',
  namespace: 'onboarding',
  resources: {
    'action.next': 'Weiter',
    'tour.essentials.title': 'Studio-Grundlagen',
    // ...
  },
})

export default defineConfig({
  // ...
  plugins: [deDELocale(), onboardingTool({tours: coreConcepts()})],
  i18n: {bundles: [onboardingDeDE]},
})
```

Any key you leave out falls back to English, so a partial translation is
perfectly usable. The full key list lives in `src/i18n/locales/en-US.ts`, and
the exported `OnboardingResourceKey` type will tell you if you miss one.

The same mechanism overrides individual strings — handy if "Editorial guides"
should read as something else in your Studio:

```ts
defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: 'onboarding',
  resources: {'menu.title': 'Guides', 'menu.button-label': 'Guides'},
})
```

Translations for more languages are very welcome as pull requests.

### Localizing your own tours

Step text takes either a plain string or an i18n key, so you only opt in where
you need it:

```ts
{
  // plain string — nothing to configure
  title: 'Your articles live here',

  // or a key from any namespace you've registered
  title: {key: 'tour.posts.title', ns: 'my-studio'},
  content: {key: 'tour.posts.body', ns: 'my-studio'},
}
```

## Skip, dismiss, complete

These are three different intentions and the plugin stores them separately:

- **Skip** — "not now". The tour is offered again next session.
- **Don't show this again** — a real opt-out. It never auto-starts again, and is
  only reachable from the help menu.
- **Done** — reached the last step. Also never auto-starts again, but recorded
  distinctly from an opt-out.

## Design notes

**It stays out of the way.** A soft ring around the target and a small popup is
the whole visual treatment: no dimmed backdrop, no modal, no animation
flourishes. The Studio underneath stays fully usable while a tour is open, and
auto-start waits for a natural pause rather than interrupting you mid-sentence
in a field.

**Why not React Joyride / Reactour / Shepherd?** All three were considered. The
tour UI here is built directly on `@sanity/ui`'s `Popover` instead, because:

- Joyride's spotlight is coupled to a dimming full-screen overlay — disabling
  the overlay disables the highlight with it. That dim is exactly the "product
  tour took over my screen" feeling this plugin is trying to avoid.
- Building on `@sanity/ui` means the popup inherits the Studio's theme, spacing
  and elevation automatically, including custom and light themes, rather than
  being restyled to approximate them.
- `@sanity/ui` is already in every Studio, so this adds no runtime dependency.

Positioning, portalling and collision handling come from `@sanity/ui` (and
Floating UI underneath it), so the parts that are genuinely hard aren't
hand-rolled.

## Known limitations

- **Completion state is per browser.** It lives in `localStorage`, keyed by
  Sanity user id, so a user who switches browser or machine is offered the
  auto-starting tour again. Server-synced state is planned; see below.
- **Sanity's `data-testid` attributes are not a public API.** The built-in
  helpers target the attributes Sanity's own end-to-end tests use. They are
  verified against the Studio version noted below, but a major Studio release
  could move them. When that happens the affected step is skipped with a warning
  rather than breaking anything — and helper fixes ship as patch releases.
- **`targetDocumentType()` keys off the title** shown in the structure list, not
  the schema name, because that is what Studio puts in the DOM.

Verified against `sanity@6.12.0`.

## What's next

- Server-synced completion state, so "seen it" follows a user across devices.
- Tour engagement data (where people drop off).
- Ref-based `<OnboardingTarget>` wrappers, for targeting your own components
  without depending on class names.

## License

MIT © Henrik Larsson
