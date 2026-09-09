# CLAUDE.md

## What this is

A Sanity Studio plugin that shows editors short guided tours and field-level
help — a soft ring, a small popup, nothing more. Published to npm as
`sanity-plugin-editor-onboarding`.

## Commands

| Command | What it does |
|---|---|
| `npm test` | `vitest run` — jsdom, ~2s, exits on its own |
| `npm run lint` | `oxlint src` — `src` only; `bin/` and `scripts/` are not linted |
| `npm run build` | `plugin-kit verify-package` then `pkg-utils build`, writes `dist/` |
| `npm run format` | `oxfmt` |
| `npm run dev` | `sanity dev` in the `test-studio` workspace, on :3333 |
| `npm run check:links` | walks `src/` for Sanity docs URLs and fetches each |
| `npx tsc --noEmit -p tsconfig.json` | typechecks `src/`, including tests |

## The rule that matters most

**A selector cannot be verified by reading source.** This plugin targets
`data-testid` attributes in Sanity Studio that Sanity does not publish as an
API, and some documented in Studio's own source do not exist at runtime. The
only way to check one is `npm run dev` against a live Studio.

Every bug this plugin has shipped was found that way, not by review: a render
loop that took the structure tool down, a `documentType` that turned out to be
the field's type rather than the document's, two guides silently skipping in
every non-English Studio, a publish selector broken while fixing that, and the
Media Library asset-source case.

Two selectors in `src/core/targeting.ts`, `targetPublishButton()` and
`targetDocumentStatus()`, match by DOM shape instead of a literal test id,
because Studio interpolates the **translated** button/chip label into the id.
"Simplifying" either back to a literal name is a known regression, not a
cleanup.

## Layout

- `src/core/` — the runtime. `OnboardingProvider.tsx` holds all state;
  `targeting.ts` holds every selector; `useTargetElement.ts` resolves them;
  `completionStore.ts` / `remoteProgress.ts` / `progressSync.ts` are the two
  progress stores and the merge between them.
- `src/concepts/` — the built-in tours (`tours.ts`) and the single table of
  outbound docs URLs (`docs.ts`).
- `src/ui/` — the navbar button and the field action.
- `src/init/` — pure logic for reading an extracted schema. `bin/` imports it
  from `dist/`, so `bin/` cannot be tested without a build.
- `src/i18n/locales/` — `en-US.ts` and `sv-SE.ts`.
- `test-studio/` — a real Studio workspace consuming the built `dist/`.

## Non-negotiables

Two design principles outrank features:

1. **Lean and unobtrusive.** A soft ring plus a small popup is the ceiling —
   no dimmed backdrop, no modal, no animation flourish, never interrupt
   someone mid-sentence.
2. **DX must be excellent.** A plugin nobody configures is worthless.

Onboarding is an accessory to the Studio, never a dependency of it:

- A missing selector skips its step and warns, rather than breaking the tour.
- An unwritable dataset falls back to `localStorage`.
- A crash is caught by `TourErrorBoundary`.
- Warnings go to the developer's console, never to the editor.
- No network request the plugin was not asked to make — `syncProgress` is
  opt-in for exactly that reason.
- `unstable_fieldActions` is the only unstable Sanity API used, and it is
  registered only when a Studio declares field help (`src/plugin.tsx:61-91`).

## Conventions

- Comments explain **why**, not what, and name the consequence of getting it
  wrong — read `src/core/remoteProgress.ts` or `src/core/targeting.ts` to
  calibrate the register before writing more.
- Test descriptions are sentences about why the behaviour matters, e.g.
  `it('offers a skipped tour again — the user was busy, not opted out', ...)`.
- No user-facing string is written inline. Every tour string is `{key, ns}`;
  every key needs an entry in both `src/i18n/locales/en-US.ts` and `sv-SE.ts`,
  enforced by `src/i18n/locales/locales.test.ts`.
- Docs URLs live only in `src/concepts/docs.ts`, written out in full, so
  `scripts/check-docs-links.mjs` can find them by reading the file.
- Formatting is `oxfmt`: no semicolons, single quotes, 2-space indent, 100
  columns. Vitest globals are off — import `describe`, `it`, `expect`, `vi`
  from `'vitest'`.
- Commits are Conventional Commits, lowercase, intent first, e.g.
  `fix: find the asset browse button when a second asset source exists`,
  `docs: say why this exists before saying what it does`.

## Running the test Studio

`npm run build` first — `test-studio/` consumes `dist/`, not `src/` — then
`npm run dev`. It reads `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET`
from `test-studio/.env`, which is gitignored and has no committed example.
Ask the maintainer for values rather than inventing any.

## Do not

- Run `npm publish` or `npm version` — publishing needs a real terminal for
  npm's 2FA and is the maintainer's call, never an agent's.
- Add a runtime dependency. The plugin ships only `@sanity/icons` and
  `@sanity/ui`, both already present in every Studio.
- Add a dimmed backdrop, a modal, or an animation flourish.
