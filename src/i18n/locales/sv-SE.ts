import {type OnboardingResourceKey} from './en-US'

/**
 * Swedish.
 *
 * Terminology follows Sanity's own `@sanity/locale-sv-se` bundle so the guides
 * use the same words the surrounding Studio does: "utkast" for draft,
 * "publicera"/"publicerad" for publish/published, and "release" left in English
 * exactly as Sanity leaves it.
 */
const svSE: Record<OnboardingResourceKey, string> = {
  // — Tour chrome —
  'action.next': 'Nästa',
  'action.done': 'Klar',
  'action.skip': 'Hoppa över',
  'action.close': 'Stäng',
  'action.dont-show-again': 'Visa inte det här igen',
  'action.learn-more': 'Läs mer',
  'progress': '{{current}} / {{total}}',

  // — Guides menu —
  'menu.title': 'Redaktionella guider',
  'menu.button-label': 'Redaktionella guider',
  'menu.status.completed': 'Genomförd',
  'menu.status.dismissed': 'Dold',
  'menu.unavailable':
    'Den här guiden pekar på delar av Studio som inte är öppna just nu. Öppna ett dokument och försök igen.',

  // — Core concepts: essentials —
  'tour.essentials.title': 'Kom igång med Studio',
  'tour.essentials.description': 'Utkast, publicerat innehåll och hur du hittar runt',
  'tour.essentials.drafts.title': 'Utkast och publicerat innehåll',
  'tour.essentials.drafts.content':
    'Varje dokument har ett utkast som du redigerar och en publicerad version som din webbplats läser. Här växlar du hela Studio mellan de två, så att du ser exakt vad som är live.',
  'tour.essentials.new.title': 'Skapa något nytt',
  'tour.essentials.new.content':
    'Skapa ett dokument av vilken typ som helst härifrån, var du än befinner dig i Studio.',
  'tour.essentials.search.title': 'Hitta vad som helst',
  'tour.essentials.search.content':
    'Sök i alla dokumenttyper samtidigt — användbart när du minns rubriken men inte var den ligger.',
  'tour.essentials.guides.title': 'Fler guider finns här',
  'tour.essentials.guides.content':
    'Korta guider om publicering, kommentarer och uppgifter, releaser och bilder finns i den här menyn. Öppna den när du vill — även för att köra den här guiden igen.',

  // — Core concepts: publishing —
  'tour.publishing.title': 'Redigera och publicera',
  'tour.publishing.description': 'Vad som händer med dina ändringar, och hur du ångrar dem',
  'tour.publishing.unavailable':
    'Den här guiden pekar på dokumentredigeraren. Öppna ett dokument och starta den igen.',
  'tour.publishing.autosave.title': 'Dina ändringar är redan sparade',
  'tour.publishing.autosave.content':
    'Ändringar sparas medan du skriver — det finns ingen spara-knapp. Här växlar du mellan utkastet du arbetar med och den version som är publicerad just nu.',
  'tour.publishing.publish.title': 'Publicering gör innehållet live',
  'tour.publishing.publish.content':
    'Dina ändringar stannar i utkastet tills du publicerar. När du publicerar ersätter utkastet den publicerade version som din webbplats läser.',
  'tour.publishing.history.title': 'Alla ändringar sparas',
  'tour.publishing.history.content':
    'Den här menyn innehåller dokumentets historik. Jämför en tidigare version sida vid sida med den nuvarande och återställ den om något blev fel.',

  // — Core concepts: collaboration —
  'tour.collaboration.title': 'Arbeta tillsammans',
  'tour.collaboration.description': 'Närvaro, kommentarer och uppgifter',
  'tour.collaboration.presence.title': 'Du redigerar inte ensam',
  'tour.collaboration.presence.content':
    'När en kollega öppnar samma dokument visas deras avatar här, och deras markör syns i fältet de arbetar i. Era ändringar slås ihop medan ni skriver.',
  'tour.collaboration.comments.title': 'Kommentarer och uppgifter hör till innehållet',
  'tour.collaboration.comments.content':
    'Lämna en kommentar på ett specifikt fält, nämn en kollega för att notifiera hen, eller tilldela en uppgift — allt kopplat till dokumentet i stället för begravt i en chattråd.',

  // — Core concepts: releases —
  'tour.releases.title': 'Schemalägg med releaser',
  'tour.releases.description': 'Publicera flera dokument tillsammans, vid en vald tidpunkt',
  'tour.releases.bundle.title': 'Samla ändringar i en release',
  'tour.releases.bundle.content':
    'En release grupperar dokument som ska gå live tillsammans — en kampanj, en produktlansering — så att de publiceras på en gång i stället för ett i taget.',
  'tour.releases.preview.title': 'Förhandsgranska en release innan den går live',
  'tour.releases.preview.content':
    'Växla Studio till en release för att se webbplatsen exakt som den kommer att se ut när releasen är publicerad.',

  // — Core concepts: media —
  'tour.media.title': 'Bilder och filer',
  'tour.media.description': 'Hur filer lagras och återanvänds',
  'tour.media.assets.title': 'Ladda upp en gång, använd överallt',
  'tour.media.assets.content':
    'Bilder och filer ligger i ett gemensamt bibliotek i stället för inuti dokumentet du laddade upp dem i, så att samma fil kan återanvändas på hela webbplatsen utan en extra kopia.',
}

export default svSE
