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
  'menu.title': 'Editorial guides',
  'menu.button-label': 'Editorial guides',
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
    'Four quick steps, and you can leave whenever you like. Everything here stays available '
    + 'under the book icon in the top bar.',
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
    'Short guides on publishing, comments and tasks, releases, and images are all in this menu. Open it any time — including to run this one again.',

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
    'A slug is the last part of a web address — everything after your domain name. It is '
    + 'usually built from the title, so you rarely need to write one yourself. Changing it '
    + 'later changes the link, and anything already pointing at the old address stops working.',
  'tour.publishing.publish.title': 'Publishing makes it live',
  'tour.publishing.publish.content':
    'Your edits stay in the draft until you publish. Publishing copies the draft over the published version your site reads.',
  'tour.publishing.history.title': 'Every change is kept',
  'tour.publishing.history.content':
    'This menu holds the document’s history. Compare an earlier version side by side with the current one, and restore it if something went wrong.',

  // — Core concepts: collaboration —
  'tour.collaboration.title': 'Working with your team',
  'tour.collaboration.description': 'Presence, comments, and tasks',
  'tour.collaboration.presence.title': 'You are not editing alone',
  'tour.collaboration.presence.content':
    'When a colleague opens the same document their avatar appears here, and their cursor shows in the field they are working on. Edits from both of you merge as you type.',
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
}

export default enUS

/** Every key this plugin translates. Used to type-check other locales. */
export type OnboardingResourceKey = keyof typeof enUS
