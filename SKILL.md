---
name: sanity-editor-onboarding
description: Write and configure editorial guides for a Sanity Studio using sanity-plugin-editor-onboarding — tours, field-level help, targeting, and localization. Use when adding onboarding to a Studio, writing guide copy for editors, explaining a confusing field, or wiring up fieldGuides and coreConcepts.
---

# Editorial guides for Sanity Studio

This plugin shows editors short, unobtrusive guides inside their Studio: a soft
ring on a control and a small popup beside it. It also puts a book icon on
individual fields, so someone stuck on one field gets an answer without
remembering a tour exists.

## Install and wire up

```ts
// sanity.config.ts
import {onboardingTool, coreConcepts} from 'sanity-plugin-editor-onboarding'

export default defineConfig({
  plugins: [onboardingTool({tours: coreConcepts()})],
})
```

That alone gives five tours covering drafts, publishing, collaboration,
releases and assets, in every language the plugin ships. Add nothing else until
there is a real gap.

## The two things you can add

**Field help** — a book icon in one field's action row. Reach for this first.
It is cheap, it is scoped, and it reaches an editor at the moment they are
confused rather than asking them to remember a guide exists.

```ts
onboardingTool({
  tours: coreConcepts(),
  fieldGuides: [
    {
      field: 'ingredients',       // schema name; 'seo.title' for a nested field
      documentType: 'recipe',     // optional — omit to match every type
      title: 'One ingredient per line',
      content: 'The site renders each line as its own bullet.',
    },
  ],
})
```

**A tour** — a sequence, for something that is genuinely a sequence. A step that
names a `field` gets the field icon too, so the same words serve both:

```ts
{
  id: 'editorial-workflow',
  title: 'How we work',
  autoStart: 'manual',           // or 'first-login', or (ctx) => boolean
  steps: [
    {field: 'slug', title: '...', content: '...'},
    {target: targetPublishButton(), title: '...', content: '...'},
  ],
}
```

## Writing the copy

This is the part that matters, and the part a generator cannot do. The rules
the built-in guides follow:

- **Write for an editor, not a developer.** No "schema", no "field type", no
  "reference document". Say what the thing does and why they should care.
- **Three sentences, maximum.** If it needs more, it needs a link
  (`learnMoreUrl`), not a longer step.
- **Explain the trap, not just the definition.** The slug guide earns its place
  by saying that renaming it breaks existing links — the part no UI tells them.
  A guide that only restates the label teaches editors to ignore the next one.
- **Never state the obvious.** Delete a guide rather than pad it.
- **Name the thing they can see.** If the label says "Slug", use the word
  "slug" and then define it. Do not invent a friendlier synonym they will not
  find in the interface.

## Targeting

| To point at | Use |
| --- | --- |
| A field | `{field: 'slug'}` — the selector is derived |
| Sanity's own UI | `targetNavbar()`, `targetPublishButton()`, `targetSearch()`, `targetDocumentType(title)`, `targetField(name)`, and others |
| Your own component | `useOnboardingTarget('id')` on the element, then `targetCustom('id')` in the step |
| A component you cannot edit | `<OnboardingTarget id="...">` around it |
| Anything else | Any CSS selector — the escape hatch, and the fragile one |

Prefer a registered id over a CSS selector for anything you own: a selector
written against your own class names breaks the next time you touch that
component, silently.

A target that cannot be found skips its step and logs a warning naming the tour,
the step and the selector. That is the designed behaviour for optional features,
not a bug.

## Generating a starting point

```bash
npx sanity-plugin-editor-onboarding init
```

Reads the Studio's schema and drafts one guide per field it can classify —
references, images, files, arrays, portable text. It cannot classify
`datetime`, `text` or `string`, which the schema extract reports identically,
and it skips slugs because `coreConcepts()` already covers them.

**Treat its output as a first draft only.** Better: read the actual schema
source yourself (`schemaTypes/*.ts`) — you get field titles, descriptions and
validation rules the extract throws away, and you can see which fields have
options an editor would find surprising. That is where the good guides come
from.

## Localization

Every string can be a plain string or a bundle key:

```ts
title: 'Plain English'
title: {key: 'guides.slug.title', ns: 'my-studio'}
```

`learnMoreUrl` and a tour's `sourceUrl` are localized too, which is how a Studio
points them at its own handbook without redeclaring the tour.

The plugin ships `en-US` and `sv-SE` under the `onboarding` namespace. Override
any string by registering a bundle with the same namespace.

## Things to get right

- **Only one tour should auto-start.** More than one competing for a new
  editor's attention is worse than none.
- **Do not add an unanchored step to a tour of anchored ones.** A tour whose
  steps are all unanchored can never report itself unavailable.
- **Scope field guides by `documentType`** when the same field name means
  different things on different types.
- **Never dim the Studio or open a modal.** A soft ring and a small popup is the
  ceiling. Never interrupt someone mid-sentence.
