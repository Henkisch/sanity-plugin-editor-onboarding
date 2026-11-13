# Testing the convention finder locally

The unit tests mock the AI client, so they cannot tell you whether the tool
works in a Studio. Selectors, roles, the Agent Actions call and the field help
it produces are only checked by running a real Studio. This is the checklist.

Sections A–C cost nothing. Section D sends documents to Sanity's AI and is
billed to that project's AI credits — one request per run.

## Setup

```bash
git checkout feat/convention-finder
npm install
npm run build        # test-studio consumes dist/, not src/
npm run dev          # http://localhost:3333
```

`test-studio/.env` needs `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET`.
Log in as a user with the `administrator` or `developer` role.

## A. Automated checks

- [ ] `npm test` passes, twice in a row (catches tests leaking into each other)
- [ ] `npx tsc --noEmit -p tsconfig.json` is clean
- [ ] `npm run lint` is clean
- [ ] `npm run build` succeeds

## B. The tool in the test Studio (no credits)

The test Studio has too little content for a pattern, which is the point: it
exercises every path that must not spend credits.

- [ ] **Editor onboarding** appears in the top tool menu.
- [ ] Open it, pick **Blog post**, click **Find conventions**: a yellow notice
      says the type has 1 published document — singular — and that 3 are needed.
- [ ] DevTools → Network, filter `agent`: no request was sent.
- [ ] The cost line says up to 12 documents and names the AI credits.

## C. Who sees it (no credits)

- [ ] Set `conventionFinder: {roles: ['nobody']}` in `test-studio/sanity.config.ts`,
      rebuild, reload: the tool is gone from the menu. Revert.
- [ ] Remove `conventionFinder` entirely: the tool is gone, and the book icons
      from `fieldGuides` still work. Revert.
- [ ] If you can, log in as an `editor`: no Editor onboarding tool.

## D. A real Studio (costs one AI request per run)

You need a Studio whose types have at least 3 published documents, ideally a
dozen. Add it as a temporary second workspace in `test-studio/sanity.config.ts`
and **never commit it**:

```ts
import {schemaTypes as realSchemaTypes} from '../../<path-to-studio>/schemaTypes'

export default defineConfig([
  {name: 'default', basePath: '/test' /* …the existing workspace… */},
  {
    name: 'real',
    basePath: '/real',
    projectId: '<project id>',
    dataset: '<dataset>',
    plugins: [structureTool(), onboardingTool({tours: [], conventionFinder: true})],
    schema: {types: realSchemaTypes},
  },
])
```

The project must allow `http://localhost:3333` as a CORS origin with
credentials. Open `/real/editor-onboarding`.

- [ ] Pick the type editors use most and run it. Results arrive in about
      5–15 seconds.
- [ ] Every result shows its field path and "Seen in N of M", with N ≥ 3.
- [ ] Check one convention against the data in Vision. It must be true.
- [ ] No result says a field is "usually left empty". That is neglect, not a
      convention, and the prompt forbids it.
- [ ] Results that mention list options use the titles an editor sees, not the
      stored values.
- [ ] Nothing is reported that the field's description already says.
- [ ] **Copy as fieldGuides code** is disabled until something is ticked.
- [ ] Tick one and copy. The clipboard holds a `fieldGuides` entry with an
      evidence comment, a `documentType`, and quotes escaped.
- [ ] Paste it into the `real` workspace's `fieldGuides`, reload, and open a
      document of that type. The field has a book icon, and clicking it opens
      the guide.

## E. Field help on every kind of field (regression for #4)

Each of these must open its popup on click, not flash and close:

- [ ] A top-level field — `publishedAt` on a Blog post
- [ ] A field inside an object — `seo.title` on a Blog post
- [ ] A field inside an array item — paste a guide for one in section D and open
      the item

## Cleanup

- [ ] Remove the temporary workspace from `test-studio/sanity.config.ts`
- [ ] `git status` shows nothing you did not mean to commit
- [ ] Stop the dev server
