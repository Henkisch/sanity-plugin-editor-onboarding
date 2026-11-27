/**
 * The base locale. Every other locale is a translation of these keys, and any
 * key missing from a translation falls back to the string here.
 *
 * Content strings are written for editors, not developers: plain language, no
 * Sanity jargon left unexplained, and never more than three sentences. If a
 * concept needs more room than that, it needs a link, not a longer step.
 */
const enUS = {
  // — Tour chrome —
  'action.next': 'Next',
  'action.done': 'Done',
  'action.skip': 'Skip',
  'action.close': 'Close',
  'action.dont-show-again': "Don't show this again",
  'action.learn-more': 'Learn more',
  'action.source': 'Source: Sanity docs',
  'progress': '{{current}} / {{total}}',

  // — Field-level help —
  'field.help': 'What is this field?',

  // — Guides menu —
  'menu.title': 'Guides',
  'menu.button-label': 'Guides',
  'menu.reset-one': 'Show this guide as new again',
  'menu.show-all-again': 'Show all guides again',
  'menu.status.completed': 'Completed',
  'menu.status.dismissed': 'Hidden',
  'menu.unavailable':
    'This guide points at parts of the Studio that aren’t open right now. Open a document and try again.',

  // — Core concepts: essentials —
  'tour.essentials.title': 'Sanity Studio essentials',
  'tour.essentials.description': 'Drafts, published content, and finding your way around',
  'tour.essentials.intro.title': 'Getting around Sanity Studio',
  'tour.essentials.intro.content':
    'Four quick steps, and you can leave whenever you like. Everything here stays available ' +
    'under the book icon in the top bar.',
  'tour.essentials.drafts.title': 'Drafts and published content',
  'tour.essentials.drafts.content':
    'Every document has a draft you edit and a published version your site reads. This switches the whole Studio between the two, so you can see exactly what is live.',
  'tour.essentials.new.title': 'Start something new',
  'tour.essentials.new.content':
    'Create a document of any type from here, wherever you are in the Studio.',
  'tour.essentials.search.title': 'Find anything',
  'tour.essentials.search.content':
    'Search across every document type at once — useful when you know the headline but not where it lives.',
  'tour.essentials.guides.title': 'More guides live here',
  'tour.essentials.guides.content':
    'Short guides on publishing, fixing what blocks it, comments and tasks, releases, and images are all in this menu. Open it any time — including to run this one again.',

  // — Core concepts: publishing —
  'tour.publishing.title': 'Editing and publishing',
  'tour.publishing.description': 'What happens to your changes, and how to undo them',
  'tour.publishing.unavailable':
    'This guide points at the document editor. Open any document, then start it again.',
  'tour.publishing.autosave.title': 'Your changes are already saved',
  'tour.publishing.autosave.content':
    'Edits save as you type — there is no save button. These chips switch between the draft you are working on and the version that is currently live.',
  'tour.publishing.slug.title': 'The slug is this page’s address',
  'tour.publishing.slug.content':
    'A slug is the last part of a web address — everything after your domain name. It is ' +
    'usually built from the title, so you rarely need to write one yourself. Changing it ' +
    'later changes the link, and anything already pointing at the old address stops working.',
  'tour.publishing.publish.title': 'Publishing makes it live',
  'tour.publishing.publish.content':
    'Your edits stay in the draft until you publish. Publishing copies the draft over the published version your site reads.',
  'tour.publishing.history.title': 'Every change is kept',
  'tour.publishing.history.content':
    'This menu holds the document’s history. Compare an earlier version side by side with the current one, and restore it if something went wrong.',

  // — Core concepts: validation —
  'tour.validation.title': 'Why can’t I publish?',
  'tour.validation.description': 'Finding and fixing what stops a document from publishing',
  'tour.validation.unavailable':
    'This guide points at the document editor. Open the document you can’t publish, then start it again.',
  'tour.validation.publish.title': 'Something needs fixing first',
  'tour.validation.publish.content':
    'If Publish is greyed out, the document has errors — usually a required field that is empty or a value that breaks a rule. Hover the button to see why.',
  'tour.validation.list.title': 'Every error, in one list',
  'tour.validation.list.content':
    'This red button lists everything that is wrong. Click an error and the Studio jumps straight to the field. Yellow warnings are advice; they do not stop you publishing.',
  'tour.validation.field.title': 'This field needs fixing',
  'tour.validation.field.content':
    'Fields with an error have a red icon beside their title. Hover the icon to see what is wrong. Fix it, and Publish turns on again.',
  'tour.validation.tab.title': 'Errors can hide on another tab',
  'tour.validation.tab.content':
    'This document is split into tabs, and a tab with a red icon has a field that needs fixing. Open it to find the field.',

  // — Core concepts: editing —
  'tour.editing.title': 'Why can’t I edit?',
  'tour.editing.description': 'When fields ignore your typing',
  'tour.editing.unavailable':
    'This guide points at the document editor. Open the document you can’t edit, then start it again.',
  'tour.editing.versions.title': 'You may be looking at the live version',
  'tour.editing.versions.content':
    'Published shows what is live on the site, and it can only be read. If it is selected, the fields ignore your typing. Click Draft to edit again.',
  'tour.editing.perspective.title': 'This applies to the whole Studio',
  'tour.editing.perspective.content':
    'If this says Published, every document is read-only, not just this one. Switch it back to Drafts to keep working.',

  // — Core concepts: collaboration —
  'tour.collaboration.title': 'Working with your team',
  'tour.collaboration.description': 'Presence, comments, and tasks',
  'tour.collaboration.presence.title': 'You are not editing alone',
  'tour.collaboration.presence.content':
    'When a colleague opens the same document, their avatar appears at the top of it and their cursor shows in the field they are working on. Edits from both of you merge as you type.',
  'tour.collaboration.online.title': 'See who else is here',
  'tour.collaboration.online.content':
    'This shows everyone who has the Studio open right now, and which document each of them is in.',
  'tour.collaboration.tasks.title': 'Work that needs doing lives here',
  'tour.collaboration.tasks.content':
    'Tasks shows what has been assigned to you and what is still outstanding. Comments work the same way — leave one on any field and mention a colleague, and it stays attached to the content rather than buried in a chat thread.',

  // — Core concepts: releases —
  'tour.releases.title': 'Scheduling with releases',
  'tour.releases.description': 'Publish a set of documents together, at a chosen time',
  'tour.releases.bundle.title': 'Bundle changes into a release',
  'tour.releases.bundle.content':
    'A release groups documents that should go live together — a campaign, a product launch — so they publish in one go instead of one at a time.',
  'tour.releases.preview.title': 'Preview a release before it ships',
  'tour.releases.preview.content':
    'Switch the Studio to a release to see the site exactly as it will read once that release is published.',

  // — Core concepts: media —
  'tour.media.title': 'Images and files',
  'tour.media.description': 'How assets are stored and reused',
  'tour.media.unavailable':
    'This guide points at an image field. Open a document that has one, then start it again.',
  'tour.media.assets.title': 'Upload once, use anywhere',
  'tour.media.assets.content':
    'Images and files live in a shared library rather than inside the document you uploaded them to, so the same asset can be reused across the site without a second copy.',

  // — Field guide suggestions (developer-only, in the Onboarding tool) —
  'conventions.heading': 'Suggest more',
  'conventions.intro':
    'Reads your published content and suggests field guides based on how editors already fill in each field. You choose which ones editors see.',
  'conventions.examples-heading': 'It might suggest',
  'conventions.example-1': 'Give cooking times in whole minutes',
  'conventions.example-2': 'End SEO titles with the company name',
  'conventions.example-3': 'List ingredients in the order they are used',
  'conventions.type-label': 'Document type',
  'conventions.run': 'Find suggestions',
  'conventions.running': 'Reading documents and looking for patterns. This takes 5 to 15 seconds.',
  'conventions.cost':
    'Sends up to {{limit}} published documents, shortened, to Sanity’s AI. One request, billed to this project’s AI credits.',
  // i18next picks the form from `count`.
  'conventions.too-few_one':
    'This type has {{count}} published document. At least {{min}} are needed before anything counts as a pattern.',
  'conventions.too-few_other':
    'This type has {{count}} published documents. At least {{min}} are needed before anything counts as a pattern.',
  'conventions.none':
    'No suggestions this time. The content follows no pattern that the field descriptions don’t already state.',
  'conventions.evidence': '{{count}} of {{total}} documents',
  'conventions.show-examples': 'Show examples ({{count}})',
  'conventions.select-hint': 'Pick the suggestions that should become field guides.',
  'conventions.select-all': 'Select all',
  'conventions.select-none': 'Clear selection',
  'conventions.chosen_one': '{{count}} selected',
  'conventions.chosen_other': '{{count}} selected',
  'conventions.copy': 'Copy as fieldGuides code',
  'conventions.copied': 'Copied. Paste it into the fieldGuides array in sanity.config.ts.',
  'conventions.error.ai-disabled':
    'AI features are turned off for this organization. An owner can turn them on at sanity.io/manage.',
  'conventions.error.quota': 'This project has used up its AI credits or reached its AI budget.',
  'conventions.error.session': 'Your session has expired. Reload the Studio and sign in again.',
  'conventions.error.unknown': 'The request failed. Details are in the browser console.',

  // — Onboarding tool —
  'tool.heading': 'Onboarding',
  'tool.guides.heading': 'Guides',
  'tool.guides.intro': 'Tours editors start from the Guides menu in the top bar.',
  'tool.guides.empty': 'No guides are registered.',
  'tool.guides.start': 'Start',
  'tool.guides.reset': 'Reset',
  'tool.guides.reset-hint':
    'Forget your progress, so this guide behaves as if you had never seen it.',
  'tool.autostart.first-login': 'Starts on first login',
  'tool.autostart.manual': 'Starts from the guides menu',
  'tool.autostart.custom': 'Starts by a custom rule',
  'tool.fields.heading': 'Field guides',
  'tool.fields.intro': 'Fields that show a book icon, and where their text is set.',
  'tool.fields.existing': 'Existing field guides',
  'tool.fields.empty': 'No field has a guide yet.',
  'tool.fields.all-types': 'All document types',
  'tool.fields.from-tour': 'Step in “{{tour}}”',
  'tool.settings.heading': 'Settings',
  'tool.settings.intro': 'Changed in sanity.config.ts.',
  'tool.settings.on': 'On',
  'tool.settings.off': 'Off',
  'tool.settings.sync': 'Progress follows editors between devices',
  'tool.settings.navbar': 'Guides button in the top bar',
  'tool.settings.convention-finder': 'Field guide suggestions (uses AI credits)',
  'tool.settings.roles': 'This tool is shown to',
}

export default enUS

/** Every key this plugin translates. Used to type-check other locales. */
export type OnboardingResourceKey = keyof typeof enUS
